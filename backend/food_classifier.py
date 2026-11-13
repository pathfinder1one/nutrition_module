"""
Pre-trained food vision classifier using CLIP (ViT-B-32 via open_clip).

Zero-shot image → text matching against the Indian food catalog.
No fine-tuning — CLIP's joint image–text embedding space generalises to
food items described in plain English.

Architecture position (design doc, Image 2):
  "Computer Vision — pre-trained vision model for food recognition"

Pipeline position (design doc, Image 1):
  Step 02  preprocess_image()   (OpenCV)    ← already done
  Step 03  THIS MODULE          (CLIP)      ← pre-trained food detection
  Step 04  catalog mapping      (RAG)       ← already done
"""
import io
import logging
from functools import lru_cache

log = logging.getLogger("food_classifier")

# ---- model configuration -----------------------------------------------
CLIP_MODEL_NAME = "ViT-B-32"
CLIP_PRETRAINED = "laion2b_s34b_b79k"
CONFIDENCE_THRESHOLD = 0.06       # min softmax probability to include a detection
TOP_K_DEFAULT = 8                 # max items per image


# ---- availability check -------------------------------------------------
def is_available() -> bool:
    """True when torch + open_clip are installed."""
    try:
        import open_clip   # noqa: F401
        import torch       # noqa: F401
        return True
    except ImportError:
        return False


# ---- model loading (cached) --------------------------------------------
@lru_cache(maxsize=1)
def _load_model():
    """Load and cache the CLIP model, image transform, and tokenizer."""
    import open_clip

    log.info("Loading CLIP %s (%s)…", CLIP_MODEL_NAME, CLIP_PRETRAINED)
    model, _, preprocess = open_clip.create_model_and_transforms(
        CLIP_MODEL_NAME, pretrained=CLIP_PRETRAINED,
    )
    model.eval()
    tokenizer = open_clip.get_tokenizer(CLIP_MODEL_NAME)
    log.info("CLIP model ready.")
    return model, preprocess, tokenizer


# ---- text embeddings (cached per catalog snapshot) ----------------------
@lru_cache(maxsize=4)
def _text_features(food_names: tuple[str, ...]):
    """Pre-compute and cache CLIP text embeddings for all catalog food names."""
    import torch

    model, _, tokenizer = _load_model()
    prompts = [f"a photo of {n}, an Indian food dish" for n in food_names]
    tokens = tokenizer(prompts)
    with torch.no_grad():
        feats = model.encode_text(tokens)
        feats /= feats.norm(dim=-1, keepdim=True)
    return feats


# ---- public API ---------------------------------------------------------
def classify_food_image(
    image_bytes: bytes,
    food_names: list[str],
    *,
    top_k: int = TOP_K_DEFAULT,
    threshold: float = CONFIDENCE_THRESHOLD,
) -> list[dict]:
    """
    Zero-shot food classification with CLIP.

    Parameters
    ----------
    image_bytes : preprocessed JPEG bytes (from vision_preprocessor.preprocess_image)
    food_names  : canonical names from the nutrition catalog
    top_k       : max items to return
    threshold   : min softmax probability to keep a detection

    Returns
    -------
    [{"item": str, "confidence": float}, …]  sorted by confidence desc.
    Empty list when nothing exceeds the threshold.
    """
    import torch
    from PIL import Image

    model, preprocess, _ = _load_model()
    text_feats = _text_features(tuple(food_names))

    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img_tensor = preprocess(img).unsqueeze(0)

    with torch.no_grad():
        img_feats = model.encode_image(img_tensor)
        img_feats /= img_feats.norm(dim=-1, keepdim=True)

        # cosine similarity scaled by CLIP's learned temperature → softmax
        logits = (100.0 * img_feats @ text_feats.T).squeeze(0)
        probs = logits.softmax(dim=-1)

    k = min(top_k, len(food_names))
    vals, idxs = probs.topk(k)

    return [
        {"item": food_names[i], "confidence": round(float(v), 4)}
        for v, i in zip(vals.tolist(), idxs.tolist())
        if v >= threshold
    ]

