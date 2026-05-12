"""OCR for written answers using Google Vision.

When `GOOGLE_APPLICATION_CREDENTIALS` is unset, runs in MOCK mode and returns
deterministic placeholder text — useful for local dev and demos where you
don't want to pay per call.

For the real product:
  1. Create a Google Cloud project, enable the Vision API.
  2. Create a service account, download the JSON credentials.
  3. Set GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json in the backend .env.
  4. pip install google-cloud-vision (already in requirements.txt).
"""

from __future__ import annotations

import hashlib
from pathlib import Path

from app.core.config import settings


def is_real_ocr_enabled() -> bool:
    return bool(settings.GOOGLE_APPLICATION_CREDENTIALS)


def extract_text_blocks(image_path: Path) -> list[str]:
    """Extract text blocks from the (preprocessed) image.

    Returns a flat list of text strings, roughly one per detected paragraph
    or answer region. The grader matches these to question numbers in order.
    """
    if not is_real_ocr_enabled():
        return _mock_extract(image_path)

    try:
        from google.cloud import vision
    except ImportError:
        # Library not installed — degrade to mock instead of crashing.
        return _mock_extract(image_path)

    client = vision.ImageAnnotatorClient()
    with open(image_path, "rb") as f:
        content = f.read()
    image = vision.Image(content=content)

    response = client.document_text_detection(image=image)
    if response.error.message:
        raise RuntimeError(f"Google Vision error: {response.error.message}")

    blocks: list[str] = []
    if response.full_text_annotation and response.full_text_annotation.pages:
        for page in response.full_text_annotation.pages:
            for block in page.blocks:
                text_parts = []
                for paragraph in block.paragraphs:
                    words = []
                    for word in paragraph.words:
                        word_text = "".join(s.text for s in word.symbols)
                        words.append(word_text)
                    text_parts.append(" ".join(words))
                full = "\n".join(text_parts).strip()
                if full:
                    blocks.append(full)
    return blocks


def _mock_extract(image_path: Path) -> list[str]:
    """Stable but realistic placeholder OCR output. Hashes the image so the
    same image always returns the same text — lets you exercise the full
    grading pipeline reliably for demos without paying for Vision.
    """
    h = hashlib.sha1(Path(image_path).read_bytes()).hexdigest()
    seed = int(h[:8], 16)
    pool = [
        "Photosynthesis is the process where plants make food using sunlight, water, and carbon dioxide. They produce glucose and release oxygen.",
        "The cell is the basic unit of life. It has a membrane, cytoplasm, and a nucleus. Different organelles have different functions.",
        "The mitochondrion is responsible for producing energy in the cell. It has an outer membrane and an inner membrane folded into cristae.",
        "Newton's first law states that an object will stay at rest or in motion unless acted on by a force.",
        "Water moves from areas of high concentration to low concentration through a process called osmosis.",
    ]
    # Deterministic selection so the same image gives the same answers.
    return [pool[(seed + i) % len(pool)] for i in range(3)]
