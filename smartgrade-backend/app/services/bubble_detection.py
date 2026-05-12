"""MCQ bubble detection.

Given a binarized (threshold) image of a filled answer sheet, return the
detected answer (A/B/C/D/E) for each question, in order.

Two-stage approach:
  1. Hough Circle Transform on the original grayscale — robust at finding
     round shapes regardless of whether they're filled or hollow.
  2. Contour-based detection as fallback when Hough finds too few circles.

For each detected circle we measure the dark-pixel ratio inside it; the
darkest one in each row is the chosen answer.

Sizes are RELATIVE to image dimensions so bubbles work whether the input is
800px or 4000px wide.
"""

from __future__ import annotations

import numpy as np

# Letters indexed by bubble position within a row.
_LETTERS = ["A", "B", "C", "D", "E", "F"]


def detect_mcq_answers(thresh: np.ndarray, expected_questions: int) -> list[str | None]:
    """Detect MCQ answers from a binarized image.

    `thresh` is the inverted-binary image from preprocessing — ink is white.
    Returns a list of length `expected_questions`. Each element is a letter
    (A-E) or None if that question's row couldn't be confidently read.
    """
    import cv2

    H, W = thresh.shape[:2]

    # ─── Try Hough first (works on the GRAY equivalent of the threshold)
    bubbles = _hough_bubbles(thresh, W, H)

    # ─── Fall back to contour detection if Hough didn't find enough
    if len(bubbles) < expected_questions:
        bubbles = _contour_bubbles(thresh, W, H)

    if not bubbles:
        return [None] * expected_questions

    # ─── Group bubbles into rows by y-coordinate
    bubbles.sort(key=lambda b: b[1])
    avg_h = max(15, int(np.median([b[3] for b in bubbles])))
    row_tolerance = max(20, int(avg_h * 0.7))

    rows: list[list[tuple]] = []
    for b in bubbles:
        if rows and abs(b[1] - rows[-1][0][1]) < row_tolerance:
            rows[-1].append(b)
        else:
            rows.append([b])

    # ─── Filter out rows with too few bubbles (likely noise)
    rows = [r for r in rows if len(r) >= 2]

    # ─── For each row, sort left-to-right and pick the most-filled bubble
    answers: list[str | None] = []
    for row in rows:
        row.sort(key=lambda b: b[0])
        # Cap at the number of supported letters.
        row = row[: len(_LETTERS)]

        fill_ratios = [_fill_ratio(thresh, b) for b in row]
        if not fill_ratios:
            answers.append(None)
            continue

        max_idx = int(np.argmax(fill_ratios))
        max_fill = fill_ratios[max_idx]

        # Permissive: a clear winner is anything noticeably darker than the rest.
        sorted_ratios = sorted(fill_ratios, reverse=True)
        second = sorted_ratios[1] if len(sorted_ratios) > 1 else 0

        if max_fill < 0.18 or (second > 0 and max_fill / second < 1.25):
            answers.append(None)
        else:
            answers.append(_LETTERS[max_idx])

    # Pad / trim to expected length.
    if len(answers) < expected_questions:
        answers.extend([None] * (expected_questions - len(answers)))
    return answers[:expected_questions]


# ─────────────────────────── detection strategies ────────────────────────────

def _hough_bubbles(thresh: np.ndarray, W: int, H: int) -> list[tuple]:
    """Use HoughCircles on the threshold image to find round bubbles."""
    import cv2

    # Bubble radius range: 0.6% to 4% of image height.
    min_r = max(6, int(H * 0.006))
    max_r = max(40, int(H * 0.04))

    # Hough wants a single-channel uint8 image. Slight blur reduces false circles.
    blurred = cv2.GaussianBlur(thresh, (5, 5), 0)

    circles = cv2.HoughCircles(
        blurred,
        cv2.HOUGH_GRADIENT,
        dp=1.2,
        minDist=int(min_r * 1.8),
        param1=80,
        param2=15,
        minRadius=min_r,
        maxRadius=max_r,
    )
    if circles is None:
        return []

    bubbles = []
    for x, y, r in np.round(circles[0]).astype(int):
        bw = bh = int(r * 2)
        bx = int(x - r)
        by = int(y - r)
        # Discard circles falling off the page.
        if bx < 0 or by < 0 or bx + bw > W or by + bh > H:
            continue
        bubbles.append((bx, by, bw, bh, None))
    return bubbles


def _contour_bubbles(thresh: np.ndarray, W: int, H: int) -> list[tuple]:
    """Fallback: find bubble-sized blobs via contour detection."""
    import cv2

    # Size range relative to image height (works for any resolution).
    min_size = max(10, int(H * 0.008))
    max_size = max(80, int(H * 0.06))

    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    bubbles = []
    for c in contours:
        x, y, w, h = cv2.boundingRect(c)
        ar = w / float(h) if h else 0
        if not (min_size <= w <= max_size and min_size <= h <= max_size):
            continue
        if not (0.6 <= ar <= 1.4):
            continue

        # Reject shapes that don't look round-ish (e.g. text lines, noise).
        bbox_area = w * h
        cnt_area = cv2.contourArea(c)
        if bbox_area > 0:
            area_ratio = cnt_area / bbox_area
            # Circles ~0.785; allow 0.35-1.0 to catch hollow rings too.
            if not (0.30 <= area_ratio <= 1.0):
                continue

        bubbles.append((x, y, w, h, c))
    return bubbles


def _fill_ratio(thresh, bubble) -> float:
    """Fraction of the bubble's bounding box that is 'inked' (white in threshold).

    For a filled bubble: high (~0.7+).
    For an empty outline: low (~0.2-0.3, just the ring).
    For a clean piece of paper: near 0.
    """
    x, y, w, h, _ = bubble
    # Slight inset to avoid catching text adjacent to the bubble.
    inset = max(1, int(min(w, h) * 0.1))
    x0 = x + inset
    y0 = y + inset
    x1 = x + w - inset
    y1 = y + h - inset
    if x1 <= x0 or y1 <= y0:
        return 0.0
    roi = thresh[y0:y1, x0:x1]
    if roi.size == 0:
        return 0.0
    return float((roi > 0).sum()) / roi.size
