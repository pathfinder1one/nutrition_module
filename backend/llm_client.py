"""
LLM wrapper for the nutrition module. Provider is chosen with LLM_PROVIDER:

    gemini     (default)  Google Gemini via the `google-genai` SDK  -> GEMINI_API_KEY, GEMINI_MODEL
    anthropic             Claude via the `anthropic` SDK            -> ANTHROPIC_API_KEY, ANTHROPIC_MODEL

Two primitives, identical for both providers:
  * structured_call(): returns a dict that conforms to a JSON schema
  * short_text_call(): plain text reply with a hard system prompt

`user_content` is either a string or a list of blocks:
    {"type": "text", "text": "..."}
    {"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": "<b64>"}}
"""
import base64
import json
import os
import re
from functools import lru_cache
from typing import Any, Optional

PROVIDER = os.getenv("LLM_PROVIDER", "gemini").strip().lower()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-5-5")


# ============================================================ Gemini
@lru_cache(maxsize=1)
def _gemini_client():
    from google import genai

    key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not key:
        raise RuntimeError("GEMINI_API_KEY is not set")
    return genai.Client(api_key=key)


def _to_gemini_contents(user_content: Any) -> list:
    """Convert neutral content blocks into google-genai Parts."""
    from google.genai import types

    if isinstance(user_content, str):
        return [user_content]
    parts: list = []
    for block in user_content:
        if block["type"] == "text":
            parts.append(block["text"])
        elif block["type"] == "image":
            src = block["source"]
            parts.append(types.Part.from_bytes(data=base64.b64decode(src["data"]), mime_type=src["media_type"]))
        else:
            raise ValueError(f"Unsupported content block: {block['type']}")
    return parts


def _gemini_config(model: str, **kwargs):
    from google.genai import types

    # thinking_budget=0 causes 400 INVALID_ARGUMENT on flash-lite / 3.x models, omit it
    return types.GenerateContentConfig(**kwargs)


def _parse_json(text: str) -> dict:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text)
    return json.loads(text)


def _gemini_structured(system: str, user_content: Any, schema: dict, max_tokens: int, model: Optional[str]) -> dict:
    model = model or GEMINI_MODEL
    resp = _gemini_client().models.generate_content(
        model=model,
        contents=_to_gemini_contents(user_content),
        config=_gemini_config(
            model,
            system_instruction=system,
            response_mime_type="application/json",
            response_json_schema=schema,
            max_output_tokens=max_tokens,
            temperature=0.2,
        ),
    )
    if not resp.text:
        raise RuntimeError("Gemini returned no content (possibly blocked by safety filters)")
    try:
        return _parse_json(resp.text)
    except json.JSONDecodeError as e:
        raise RuntimeError(f"Gemini returned invalid JSON: {e}")


def _gemini_text(system: str, user: str, max_tokens: int, model: Optional[str]) -> str:
    model = model or GEMINI_MODEL
    resp = _gemini_client().models.generate_content(
        model=model,
        contents=user,
        config=_gemini_config(model, system_instruction=system, max_output_tokens=max(max_tokens, 200), temperature=0.4),
    )
    return (resp.text or "").strip()


# ============================================================ Anthropic
@lru_cache(maxsize=1)
def _anthropic_client():
    import anthropic

    key = os.getenv("ANTHROPIC_API_KEY")
    if not key:
        raise RuntimeError("ANTHROPIC_API_KEY is not set")
    return anthropic.Anthropic(api_key=key)


def _anthropic_structured(system, user_content, tool_name, tool_description, schema, max_tokens, model) -> dict:
    resp = _anthropic_client().messages.create(
        model=model or ANTHROPIC_MODEL,
        max_tokens=max_tokens,
        system=system,
        tools=[{"name": tool_name, "description": tool_description, "input_schema": schema}],
        tool_choice={"type": "tool", "name": tool_name},
        messages=[{"role": "user", "content": user_content}],
    )
    for block in resp.content:
        if block.type == "tool_use" and block.name == tool_name:
            return block.input
    raise RuntimeError("Model did not return the expected structured output")


def _anthropic_text(system: str, user: str, max_tokens: int, model: Optional[str]) -> str:
    resp = _anthropic_client().messages.create(
        model=model or ANTHROPIC_MODEL, max_tokens=max_tokens, system=system,
        messages=[{"role": "user", "content": user}],
    )
    return "".join(b.text for b in resp.content if b.type == "text").strip()


# ============================================================ public API
def structured_call(
    *,
    system: str,
    user_content: Any,
    tool_name: str,
    tool_description: str,
    input_schema: dict,
    max_tokens: int = 1500,
    model: Optional[str] = None,
) -> dict:
    if PROVIDER == "gemini":
        return _gemini_structured(system, user_content, input_schema, max_tokens, model)
    if PROVIDER == "anthropic":
        return _anthropic_structured(system, user_content, tool_name, tool_description, input_schema, max_tokens, model)
    raise RuntimeError(f"Unknown LLM_PROVIDER '{PROVIDER}' (use 'gemini' or 'anthropic')")


def short_text_call(*, system: str, user: str, max_tokens: int = 120, model: Optional[str] = None) -> str:
    if PROVIDER == "gemini":
        return _gemini_text(system, user, max_tokens, model)
    if PROVIDER == "anthropic":
        return _anthropic_text(system, user, max_tokens, model)
    raise RuntimeError(f"Unknown LLM_PROVIDER '{PROVIDER}' (use 'gemini' or 'anthropic')")
