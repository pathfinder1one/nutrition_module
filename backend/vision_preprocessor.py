"""
Indian food scanner front-end:
  * real OpenCV preprocessing (resize -> Gaussian denoise -> CLAHE in LAB space)
  * multimodal vision inference (detect items + portion estimates in catalog servings)
  * natural-language (Hinglish) meal parser for chat logging
"""
import base64
import logging
from typing import Optional

import cv2
import numpy as np

from llm_client import structured_call

MAX_SIDE = 1024            # standardised working resolution (longest side)
MAX_UPLOAD_BYTES = 12 * 1024 * 1024

FOOD_SCHEMA = {
    "type": "object",
    "properties": {
        "items": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "item": {"type": "string", "description": "Canonical food name from the catalog when possible"},
                    "quantity": {"type": "number", "description": "Number of catalog servings (e.g. 3 for 3 rotis, 1.5 for 1.5 katori)"},
                    "confidence": {"type": "number", "description": "0-1 confidence"},
                },
                "required": ["item", "quantity"],
            },
        },
        "notes": {"type": "string", "description": "One short line about anything uncertain"},
    },
    "required": ["items"],
}


class ImageError(ValueError):
    pass


def preprocess_image(raw: bytes) -> bytes:
    """
    1. cv2.resize         - standardise resolution (longest side = MAX_SIDE, aspect preserved)
    2. GaussianBlur       - suppress sensor noise before contrast boost
    3. CLAHE on L channel - local contrast enhancement in LAB without shifting colour
    Returns JPEG bytes.
    """
    if len(raw) > MAX_UPLOAD_BYTES:
        raise ImageError("Image too large (max 12 MB)")
    arr = np.frombuffer(raw, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ImageError("Could not decode image")

    h, w = img.shape[:2]
    scale = MAX_SIDE / max(h, w)
    interp = cv2.INTER_AREA if scale < 1 else cv2.INTER_CUBIC
    img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=interp)

    img = cv2.GaussianBlur(img, (3, 3), sigmaX=0)

    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    img = cv2.cvtColor(cv2.merge((l, a, b)), cv2.COLOR_LAB2BGR)

    ok, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 90])
    if not ok:
        raise ImageError("Failed to encode processed image")
    return buf.tobytes()


_VISION_SYSTEM = """You are an expert at identifying Indian food from photos.
Identify every distinct food item on the plate/bowl. Map each to the closest name in the CATALOG below
(use the catalog name exactly). If an item is truly not in the catalog, use its common English/Hindi name.
Estimate quantity as a NUMBER OF CATALOG SERVINGS using the serving definition shown (e.g. roti: 1 piece, dal: 1 katori).
Use visual cues (plate size, bowl fill level, count of pieces). Never invent items you cannot see.

CATALOG:
{catalog}"""


def detect_food_from_image(processed_jpeg: bytes, catalog: str) -> dict:
    b64 = base64.standard_b64encode(processed_jpeg).decode()
    return structured_call(
        system=_VISION_SYSTEM.format(catalog=catalog),
        user_content=[
            {"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": b64}},
            {"type": "text", "text": "List the food items in this meal with portion estimates."},
        ],
        tool_name="report_meal_items",
        tool_description="Report detected food items and portion estimates",
        input_schema=FOOD_SCHEMA,
    )


_TEXT_SYSTEM = """You parse meal descriptions written in English, Hindi or Hinglish into structured items.
Examples: "Maine 2 aloo paratha aur dahi khaya" -> Aloo Paratha x2, Dahi x1.
"teen roti aur ek katori dal" -> Roti x3, Dal Tadka x1.
Map each item to the closest name in the CATALOG (exact catalog name). Quantity = number of catalog servings
(use the serving definition; "half" = 0.5, "ek/one" = 1, "do/two" = 2, "teen/three" = 3 ...). If no amount is
given, assume 1 serving. Also infer the meal type if the text mentions or implies it (naashta/breakfast,
lunch/dopahar, snack/chai time, dinner/raat), else leave empty.

CATALOG:
{catalog}"""

TEXT_SCHEMA = {
    "type": "object",
    "properties": {
        **FOOD_SCHEMA["properties"],
        "meal_type": {"type": "string", "enum": ["breakfast", "lunch", "snack", "dinner", ""]},
    },
    "required": ["items"],
}


def parse_text_meal(text: str, catalog: str) -> dict:
    return structured_call(
        system=_TEXT_SYSTEM.format(catalog=catalog),
        user_content=text.strip()[:1000],
        tool_name="report_meal_items",
        tool_description="Report items and quantities parsed from the user's meal description",
        input_schema=TEXT_SCHEMA,
    )


def guess_meal_type(hour: float) -> str:
    """Fallback meal type from local hour of day."""
    if hour < 11:
        return "breakfast"
    if hour < 16:
        return "lunch"
    if hour < 19:
        return "snack"
    return "dinner"


# --------------------------------------------------------------------------- hybrid detection
log = logging.getLogger("vision")

_PORTION_SYSTEM = """You are an expert at estimating food quantities from photos.
A computer-vision model has already identified which Indian foods are on the plate.
Your job is to estimate the QUANTITY of each item as a number of catalog servings.

Use visual cues: plate size, bowl fill level, count of visible pieces.
- If an item was detected but you cannot see it in the photo, set quantity to 0.
- If you see additional food items not in the detected list, add them using catalog names.
- quantity = number of the catalog serving (e.g. 3 for 3 rotis, 1.5 for 1.5 katori).

CATALOG:
{catalog}"""


def _estimate_portions_llm(
    processed_jpeg: bytes, clip_detections: list[dict], catalog: str,
) -> dict:
    """Use the LLM to estimate portions for foods detected by CLIP."""
    b64 = base64.standard_b64encode(processed_jpeg).decode()

    detected_list = ", ".join(
        f"{d['item']} ({d['confidence']:.0%})" for d in clip_detections
    )
    return structured_call(
        system=_PORTION_SYSTEM.format(catalog=catalog),
        user_content=[
            {
                "type": "image",
                "source": {"type": "base64", "media_type": "image/jpeg", "data": b64},
            },
            {
                "type": "text",
                "text": (
                    f"Vision model detected: {detected_list}. "
                    "Verify these items, estimate servings for each, and add any "
                    "missed items you can see."
                ),
            },
        ],
        tool_name="report_meal_items",
        tool_description="Report food items with verified quantity estimates",
        input_schema=FOOD_SCHEMA,
    )


def detect_food_hybrid(
    processed_jpeg: bytes, food_names: list[str], catalog_prompt: str,
) -> dict:
    """
    Hybrid food detection pipeline (design doc Step 03 + 04):
      1. CLIP pre-trained model → identify food items (zero-shot classification)
      2. LLM multimodal call → estimate portion sizes for detected items
      3. Falls back to pure LLM detection if CLIP is unavailable or returns nothing

    This matches the architecture: "pre-trained ML for perception and feature
    extraction" combined with "generative AI for clear, natural language explanations".
    """
    try:
        import food_classifier
    except ImportError:
        return detect_food_from_image(processed_jpeg, catalog_prompt)

    if not food_classifier.is_available():
        log.info("CLIP not available — using LLM-only food detection")
        return detect_food_from_image(processed_jpeg, catalog_prompt)

    try:
        clip_results = food_classifier.classify_food_image(
            processed_jpeg, food_names, top_k=8, threshold=0.06,
        )
    except Exception:
        log.exception("CLIP classification failed — falling back to LLM")
        return detect_food_from_image(processed_jpeg, catalog_prompt)

    if not clip_results:
        log.info("CLIP found no items above threshold — falling back to LLM")
        return detect_food_from_image(processed_jpeg, catalog_prompt)

    log.info(
        "CLIP detected %d item(s): %s",
        len(clip_results),
        ", ".join(f"{d['item']} ({d['confidence']:.0%})" for d in clip_results),
    )

    # CLIP identified items → LLM estimates portions
    return _estimate_portions_llm(processed_jpeg, clip_results, catalog_prompt)
