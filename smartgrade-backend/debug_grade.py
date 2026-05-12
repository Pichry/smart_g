"""Debug helper: see what the grading pipeline detects on a paper image.

Usage (from smartgrade-backend, with venv activated):

    python debug_grade.py path/to/your/paper.jpg

Outputs:
    - debug_preprocessed.jpg  — the cleaned, deskewed image
    - debug_threshold.jpg     — the binarized image used for detection
    - debug_detected.jpg      — the original with detected bubbles drawn on it
                                  (green = filled / chosen, red = unfilled,
                                   blue = couldn't decide)

Open the three files in any image viewer. If `debug_detected.jpg` shows green
boxes around your filled bubbles, detection is working. If it shows nothing
or boxes in the wrong places, paste this script's printed output here and
we'll tune the parameters together.
"""

from __future__ import annotations

import sys
from pathlib import Path

import cv2  # type: ignore
import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from app.services import bubble_detection, preprocessing  # noqa: E402


def main(image_path: str) -> None:
    src = Path(image_path)
    if not src.exists():
        print(f"❌ File not found: {src}")
        sys.exit(1)

    print(f"\nAnalysing: {src}")
    print("=" * 60)

    # ── Stage 1: preprocessing
    warped, thresh = preprocessing.preprocess(src)
    cv2.imwrite("debug_preprocessed.jpg", warped)
    cv2.imwrite("debug_threshold.jpg", thresh)
    print(f"Preprocessed image: {warped.shape[1]}x{warped.shape[0]} px")
    print(f"Saved: debug_preprocessed.jpg")
    print(f"Saved: debug_threshold.jpg")

    # ── Stage 2: bubble detection (try both strategies and report)
    H, W = thresh.shape[:2]
    hough = bubble_detection._hough_bubbles(thresh, W, H)
    contours = bubble_detection._contour_bubbles(thresh, W, H)
    print(f"\nHough circles found:    {len(hough)}")
    print(f"Contour bubbles found:  {len(contours)}")

    bubbles = hough if len(hough) >= len(contours) else contours
    strategy = "Hough" if bubbles is hough else "Contour"
    print(f"Using strategy:         {strategy}")

    if not bubbles:
        print("\n❌ No bubbles detected. Possible reasons:")
        print("   - Photo is too blurry, dark, or low-contrast")
        print("   - Bubbles are too small/large for the size range")
        print("   - Bubbles aren't drawn as circles")
        print("   - Image has too much noise")
        return

    # ── Stage 3: group into rows + decide answers
    bubbles_sorted = sorted(bubbles, key=lambda b: b[1])
    avg_h = max(15, int(np.median([b[3] for b in bubbles_sorted])))
    row_tol = max(20, int(avg_h * 0.7))
    rows: list[list[tuple]] = []
    for b in bubbles_sorted:
        if rows and abs(b[1] - rows[-1][0][1]) < row_tol:
            rows[-1].append(b)
        else:
            rows.append([b])
    rows = [r for r in rows if len(r) >= 2]
    print(f"\nRows of bubbles found:  {len(rows)}")

    # ── Stage 4: draw debug image
    debug = warped.copy()
    for row_idx, row in enumerate(rows):
        row.sort(key=lambda b: b[0])
        fills = [bubble_detection._fill_ratio(thresh, b) for b in row]
        max_idx = int(np.argmax(fills))
        max_fill = fills[max_idx]
        sorted_f = sorted(fills, reverse=True)
        second = sorted_f[1] if len(sorted_f) > 1 else 0
        is_clear_winner = max_fill >= 0.18 and (second == 0 or max_fill / second >= 1.25)

        chosen_letter = bubble_detection._LETTERS[max_idx] if is_clear_winner and max_idx < len(bubble_detection._LETTERS) else "?"
        print(f"  Row {row_idx + 1}: {len(row)} bubbles · fills={[f'{f:.2f}' for f in fills]} · winner={chosen_letter}")

        for i, b in enumerate(row):
            x, y, w, h, _ = b
            if not is_clear_winner:
                color = (255, 100, 0)   # blue: ambiguous
            elif i == max_idx:
                color = (0, 200, 0)     # green: chosen
            else:
                color = (0, 0, 200)     # red: not chosen
            cv2.rectangle(debug, (x, y), (x + w, y + h), color, 2)

    cv2.imwrite("debug_detected.jpg", debug)
    print(f"\nSaved: debug_detected.jpg")
    print("\n" + "=" * 60)
    print("Open debug_detected.jpg to see what was detected:")
    print("  GREEN = the bubble that scored as the answer")
    print("  RED   = other bubbles in the same row")
    print("  BLUE  = row was ambiguous, no winner picked")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python debug_grade.py path/to/paper.jpg")
        sys.exit(1)
    main(sys.argv[1])
