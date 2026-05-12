"""Image preprocessing with OpenCV.

Pipeline stage 1: take a raw photo of an exam paper and return a clean,
deskewed, top-down image suitable for OCR or bubble detection.

Steps:
  1. Load and resize for speed.
  2. Find the paper's outline (largest 4-point contour).
  3. Warp it to a top-down rectangle (perspective correction).
  4. Convert to grayscale, denoise, adaptive-threshold for OCR contrast.

If we can't find a clean paper outline (close-up shots, no clear edges), we
skip the warp and just return the denoised grayscale image — better than
crashing.
"""

from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np


def preprocess(image_path: Path) -> tuple[np.ndarray, np.ndarray]:
    """Load an image and return (warped_color, threshold_gray).

    `warped_color` is the perspective-corrected RGB image — use this for OCR.
    `threshold_gray` is the binarized version — use this for bubble detection.
    """
    img = cv2.imread(str(image_path))
    if img is None:
        raise ValueError(f"Cannot read image at {image_path}")

    # Downscale very large phone photos — OCR/contours don't need 12MP.
    h, w = img.shape[:2]
    max_dim = 2000
    if max(h, w) > max_dim:
        scale = max_dim / max(h, w)
        img = cv2.resize(img, (int(w * scale), int(h * scale)))

    warped = _try_perspective_correction(img)

    gray = cv2.cvtColor(warped, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (3, 3), 0)
    thresh = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 25, 10
    )

    return warped, thresh


def _try_perspective_correction(img: np.ndarray) -> np.ndarray:
    """Find the largest 4-corner contour and warp it to a top-down view.

    Falls back to the original image if no clear paper outline is found, OR
    if the resulting warp looks distorted (very narrow / very wide, or much
    smaller than the source).
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blur, 50, 150)

    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return img

    img_area = img.shape[0] * img.shape[1]
    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:5]

    for c in contours:
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)
        # Need a quadrilateral that covers a meaningful chunk of the frame
        if len(approx) == 4 and cv2.contourArea(c) > 0.3 * img_area:
            warped = _warp_to_rect(img, approx.reshape(4, 2))
            # Sanity-check the warp: should keep a reasonable aspect ratio
            # and not collapse the image.
            wh, ww = warped.shape[:2]
            if wh < 100 or ww < 100:
                continue
            warp_aspect = ww / float(wh)
            src_aspect = img.shape[1] / float(img.shape[0])
            # Reject warps that flip portrait/landscape or look extreme.
            if warp_aspect < 0.4 or warp_aspect > 2.5:
                continue
            if abs(warp_aspect - src_aspect) > 0.8:
                continue
            return warped

    return img  # No clean rectangle — return original


def _warp_to_rect(img: np.ndarray, pts: np.ndarray) -> np.ndarray:
    """Order 4 corner points (TL, TR, BR, BL) and warp the image flat."""
    rect = _order_points(pts.astype("float32"))
    (tl, tr, br, bl) = rect

    width = max(np.linalg.norm(br - bl), np.linalg.norm(tr - tl))
    height = max(np.linalg.norm(tr - br), np.linalg.norm(tl - bl))
    width, height = int(width), int(height)

    dst = np.array(
        [[0, 0], [width - 1, 0], [width - 1, height - 1], [0, height - 1]],
        dtype="float32",
    )
    M = cv2.getPerspectiveTransform(rect, dst)
    return cv2.warpPerspective(img, M, (width, height))


def _order_points(pts: np.ndarray) -> np.ndarray:
    """Return corner points in TL, TR, BR, BL order."""
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]  # top-left has smallest sum
    rect[2] = pts[np.argmax(s)]  # bottom-right has largest sum
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]  # top-right has smallest diff
    rect[3] = pts[np.argmax(diff)]  # bottom-left has largest diff
    return rect
