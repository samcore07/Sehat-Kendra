# ============================================================
# SEHAT KENDRA — AI PRESCRIPTION SUMMARIZATION (Grok / xAI)
# ============================================================
# Turns a (mock-scanned or voice-drafted) prescription record into:
#   1. A short, plain-language summary a low-literacy patient can
#      understand.
#   2. A small set of Q&A "flashcards" (diagnosis + each medicine +
#      care notes) for the flashcard review UI.
#
# Uses xAI's Grok API (OpenAI-compatible Chat Completions endpoint).
# If GROK_API_KEY isn't configured, or the request fails for any
# reason, this falls back to a plain rule-based summary instead of
# raising — the prescription flow must never break because the AI
# layer is unavailable.
# ============================================================

import os
import json
import logging
from typing import Any, Dict, List, Optional

import requests
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("sehat_kendra.ai_service")

GROK_API_KEY = os.getenv("GROK_API_KEY")
GROK_MODEL = os.getenv("GROK_MODEL", "grok-4.6")
GROK_API_URL = "https://api.x.ai/v1/chat/completions"
GROK_TIMEOUT_SECONDS = 20

LANGUAGE_NAMES = {
    "en": "English", "en-IN": "English",
    "hi": "Hindi", "hi-IN": "Hindi",
    "bn": "Bengali", "bn-IN": "Bengali",
    "ta": "Tamil", "ta-IN": "Tamil",
    "mr": "Marathi", "mr-IN": "Marathi",
    "or": "Odia", "or-IN": "Odia",
}


# ============================================================
# FALLBACK (no API key / API failure)
# ============================================================

def _fallback_summary(
    diagnosis: Optional[str],
    symptoms: Optional[str],
    medicines: Optional[List[Dict[str, Any]]],
    notes: Optional[str],
) -> Dict[str, Any]:

    medicines = medicines or []

    parts = []
    if diagnosis:
        parts.append(f"Diagnosis: {diagnosis}.")
    if symptoms:
        parts.append(f"Reported symptoms: {symptoms}.")
    if medicines:
        med_bits = [
            f"{m.get('name', 'Medicine')} ({m.get('dosage', 'dosage not specified')}, "
            f"{m.get('frequency', 'as advised')})"
            for m in medicines
        ]
        parts.append("Medicines: " + "; ".join(med_bits) + ".")
    if notes:
        parts.append(notes)

    summary = " ".join(parts) if parts else (
        "No details were recorded yet. Please complete the prescription "
        "and have a doctor review it."
    )
    summary += " A licensed doctor must confirm this before any medicine is taken."

    flashcards = [{
        "question": "What is the diagnosis?",
        "answer": diagnosis or "Not specified yet — please confirm with your doctor.",
    }]

    for m in medicines:
        flashcards.append({
            "question": f"How should I take {m.get('name', 'this medicine')}?",
            "answer": (
                f"{m.get('dosage', 'Dosage not specified')}, "
                f"{m.get('frequency', 'as advised')}, "
                f"for {m.get('duration', 'the advised duration')}."
            ),
        })

    if notes:
        flashcards.append({
            "question": "Any other care instructions?",
            "answer": notes,
        })

    return {
        "summary": summary,
        "flashcards": flashcards,
        "ai_generated": False,
    }


# ============================================================
# MAIN ENTRY POINT
# ============================================================

def _fallback_translation(
    diagnosis: Optional[str],
    symptoms: Optional[str],
    medicines: Optional[List[Dict[str, Any]]],
    notes: Optional[str],
) -> Dict[str, Any]:

    medicines = medicines or []

    return {
        "diagnosis": diagnosis or "",
        "symptoms": symptoms or "",
        "notes": notes or "",
        "medicines": [
            {
                "name": m.get("name", ""),
                "dosage": m.get("dosage", ""),
                "frequency": m.get("frequency", ""),
                "duration": m.get("duration", ""),
            }
            for m in medicines
        ],
        "translated": False,
    }


# ============================================================
# TRANSLATE A SPOKEN TRANSCRIPT INTO ENGLISH
# ============================================================
# The voice-draft flow's rule-based diagnosis matching (and the AI
# summary prompt) both key off English words, so whatever language
# the patient spoke in, we first turn the raw transcript into
# English before it's used for prescription drafting. Falls back to
# returning the original text untouched if Grok isn't configured or
# the call fails, rather than blocking the flow.
# ============================================================

def translate_text_to_english(text: str) -> Dict[str, Any]:

    text = (text or "").strip()

    if not text:
        return {"text": "", "translated": False}

    if not GROK_API_KEY:
        logger.info("GROK_API_KEY not set — using transcript as-is.")
        return {"text": text, "translated": False}

    prompt = (
        "Translate the following patient-spoken text into plain English. "
        "If it is already in English, return it unchanged. Preserve the "
        "meaning exactly — do not add, remove, or invent any symptoms, "
        "medicines, or details that are not present. Respond with ONLY "
        "the translated text, no quotes, no commentary.\n\n"
        f"Text: {text}"
    )

    try:
        response = requests.post(
            GROK_API_URL,
            headers={
                "Authorization": f"Bearer {GROK_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": GROK_MODEL,
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are a precise medical translator. Respond "
                            "with only the translated text and nothing else."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.2,
            },
            timeout=GROK_TIMEOUT_SECONDS,
        )
        response.raise_for_status()

        translated = (
            response.json()["choices"][0]["message"]["content"] or ""
        ).strip()

        if not translated:
            raise ValueError("Grok returned an empty translation.")

        return {"text": translated, "translated": True}

    except Exception as exc:
        logger.warning(
            "Transcript-to-English translation failed, using original "
            "text: %s", exc
        )
        return {"text": text, "translated": False, "translation_error": str(exc)}


# ============================================================
# TRANSLATE A PRESCRIPTION'S OWN FIELDS FOR DISPLAY
# ============================================================
# Used by the prescription view page's language switcher so the
# diagnosis, reported symptoms, doctor's notes and medicine details
# are shown in the selected language too -- not just the AI summary.
# Falls back to the original (English) text if Grok isn't configured
# or the call fails.
# ============================================================

def translate_prescription_fields(
    diagnosis: Optional[str],
    symptoms: Optional[str],
    medicines: Optional[List[Dict[str, Any]]],
    notes: Optional[str],
    language: str = "en-IN",
) -> Dict[str, Any]:

    medicines = medicines or []

    if language in ("en", "en-IN") or not GROK_API_KEY:
        return _fallback_translation(diagnosis, symptoms, medicines, notes)

    language_name = LANGUAGE_NAMES.get(language, "English")

    payload_in = {
        "diagnosis": diagnosis or "",
        "symptoms": symptoms or "",
        "notes": notes or "",
        "medicines": [
            {
                "name": m.get("name", ""),
                "dosage": m.get("dosage", ""),
                "frequency": m.get("frequency", ""),
                "duration": m.get("duration", ""),
            }
            for m in medicines
        ],
    }

    prompt = f"""Translate every text value in this JSON object into {language_name}.
Keep the exact same JSON shape and keys. Leave empty strings empty. Do not
add, remove, or reorder medicines. You may transliterate medicine names
instead of translating them if that reads more naturally to a patient.
Respond ONLY with the translated JSON object, no commentary.

{json.dumps(payload_in, ensure_ascii=False)}"""

    try:
        response = requests.post(
            GROK_API_URL,
            headers={
                "Authorization": f"Bearer {GROK_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": GROK_MODEL,
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are a precise medical translator. Always "
                            "respond with a single valid JSON object and "
                            "nothing else."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.2,
                "response_format": {"type": "json_object"},
            },
            timeout=GROK_TIMEOUT_SECONDS,
        )
        response.raise_for_status()

        content = response.json()["choices"][0]["message"]["content"]
        parsed = json.loads(content)

        translated_medicines = parsed.get("medicines")
        if not isinstance(translated_medicines, list):
            translated_medicines = payload_in["medicines"]

        clean_medicines = [
            {
                "name": str(m.get("name", "")),
                "dosage": str(m.get("dosage", "")),
                "frequency": str(m.get("frequency", "")),
                "duration": str(m.get("duration", "")),
            }
            for m in translated_medicines
            if isinstance(m, dict)
        ] or payload_in["medicines"]

        return {
            "diagnosis": str(parsed.get("diagnosis") or diagnosis or ""),
            "symptoms": str(parsed.get("symptoms") or symptoms or ""),
            "notes": str(parsed.get("notes") or notes or ""),
            "medicines": clean_medicines,
            "translated": True,
        }

    except Exception as exc:
        logger.warning(
            "Prescription field translation failed, showing original "
            "text: %s", exc
        )
        result = _fallback_translation(diagnosis, symptoms, medicines, notes)
        result["translation_error"] = str(exc)
        return result


def generate_prescription_summary(
    diagnosis: Optional[str],
    symptoms: Optional[str],
    medicines: Optional[List[Dict[str, Any]]],
    notes: Optional[str],
    language: str = "en-IN",
) -> Dict[str, Any]:
    """
    Calls Grok to turn a prescription record into a patient-friendly
    summary + flashcards. Always returns a dict with "summary",
    "flashcards", and "ai_generated" — never raises.
    """

    if not GROK_API_KEY:
        logger.info("GROK_API_KEY not set — returning fallback summary.")
        return _fallback_summary(diagnosis, symptoms, medicines, notes)

    language_name = LANGUAGE_NAMES.get(language, "English")
    medicines = medicines or []

    medicines_text = "\n".join(
        f"- {m.get('name', 'Medicine')}: {m.get('dosage', 'n/a')}, "
        f"{m.get('frequency', 'n/a')}, for {m.get('duration', 'n/a')}"
        for m in medicines
    ) or "None recorded"

    prompt = f"""You are a patient health educator helping a citizen understand
their digital prescription on a public health portal in India. Explain things
simply, in {language_name}, for someone who may have low health literacy.
Do not invent any medicine, dosage, or diagnosis that is not given below.
Always make clear a licensed doctor must confirm the prescription before any
medicine is taken.

Diagnosis: {diagnosis or "Not specified"}
Reported symptoms: {symptoms or "Not specified"}
Medicines:
{medicines_text}
Doctor's / drafting notes: {notes or "None"}

Respond ONLY with a JSON object of this exact shape, no extra commentary:
{{
  "summary": "2-4 short sentences in plain {language_name}, explaining the diagnosis and what the medicines are for.",
  "flashcards": [
    {{"question": "...", "answer": "..."}}
  ]
}}
Include 3 to 6 flashcards covering the diagnosis, each medicine's purpose and
timing, and any care instructions from the notes."""

    try:
        response = requests.post(
            GROK_API_URL,
            headers={
                "Authorization": f"Bearer {GROK_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": GROK_MODEL,
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are a careful, concise patient health educator. "
                            "Always respond with a single valid JSON object and "
                            "nothing else."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.4,
                "response_format": {"type": "json_object"},
            },
            timeout=GROK_TIMEOUT_SECONDS,
        )
        response.raise_for_status()

        payload = response.json()
        content = payload["choices"][0]["message"]["content"]
        parsed = json.loads(content)

        summary = (parsed.get("summary") or "").strip()
        flashcards = parsed.get("flashcards")

        if not summary or not isinstance(flashcards, list) or not flashcards:
            raise ValueError("Grok returned an incomplete summary.")

        # Keep only well-formed flashcards.
        clean_flashcards = [
            {"question": str(f.get("question", "")).strip(),
             "answer": str(f.get("answer", "")).strip()}
            for f in flashcards
            if isinstance(f, dict) and f.get("question") and f.get("answer")
        ]

        if not clean_flashcards:
            raise ValueError("Grok returned no usable flashcards.")

        return {
            "summary": summary,
            "flashcards": clean_flashcards,
            "ai_generated": True,
        }

    except Exception as exc:
        logger.warning("Grok summarization failed, using fallback: %s", exc)
        result = _fallback_summary(diagnosis, symptoms, medicines, notes)
        result["ai_error"] = str(exc)
        return result
