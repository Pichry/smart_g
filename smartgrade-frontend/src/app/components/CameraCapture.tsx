import { useEffect, useRef, useState } from "react";
import { Camera, Upload, X, Plus, Video, Check, Loader2 } from "lucide-react";
import { Button } from "./Button";

interface PageEntry { url: string; file: File }

interface CameraCaptureProps {
  onChange: (files: File[]) => void;
  disabled?: boolean;
  maxPages?: number;
}

/**
 * Multi-page paper capture. Two ways to add a page:
 *   - Camera: uses MediaDevices API (getUserMedia) to show a live viewfinder
 *             and capture a photo. Works on both desktop and mobile.
 *   - Upload: standard file picker.
 *
 * Pages appear as thumbnails; users can remove individual pages or clear all.
 * Parent receives the up-to-date File[] via onChange.
 */
export function CameraCapture({
  onChange, disabled = false, maxPages = 5,
}: CameraCaptureProps) {
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const [pages, setPages] = useState<PageEntry[]>([]);

  // ─── Camera modal state ─────────────────────────────────────────────────────
  const [showCamera, setShowCamera] = useState(false);
  const videoRef     = useRef<HTMLVideoElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);

  // Free object URLs on unmount.
  useEffect(() => {
    return () => { pages.forEach((p) => URL.revokeObjectURL(p.url)); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateAndNotify = (next: PageEntry[]) => {
    setPages(next);
    onChange(next.map((p) => p.file));
  };

  const addFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list) return;
    const incoming: PageEntry[] = [];
    for (const f of Array.from(list)) {
      if (pages.length + incoming.length >= maxPages) break;
      incoming.push({ url: URL.createObjectURL(f), file: f });
    }
    updateAndNotify([...pages, ...incoming]);
    e.target.value = "";
  };

  const removeAt = (idx: number) => {
    URL.revokeObjectURL(pages[idx].url);
    updateAndNotify(pages.filter((_, i) => i !== idx));
  };

  const canAddMore = pages.length < maxPages && !disabled;

  // ─── Camera logic ───────────────────────────────────────────────────────────

  const startCamera = async () => {
    setCameraError(null);
    setCameraLoading(true);
    setShowCamera(true);
    try {
      // Request the rear-facing camera if available; fall back to any camera.
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 } },
        audio: false,
      });
      setStream(mediaStream);
      // Attach to video element once rendered.
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch (err: any) {
      const msg =
        err.name === "NotAllowedError"
          ? "Camera access denied. Please allow camera permissions in your browser settings."
          : err.name === "NotFoundError"
          ? "No camera found on this device."
          : `Camera error: ${err.message || "Unknown error"}`;
      setCameraError(msg);
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setShowCamera(false);
    setCameraError(null);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !stream) return;

    // Match canvas size to the actual video dimensions.
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Flip horizontally if using front camera (facingMode: user)
    // With environment camera, no flip needed.
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to a File.
    canvas.toBlob((blob) => {
      if (!blob) return;
      const timestamp = Date.now();
      const file = new File([blob], `capture-${timestamp}.jpg`, { type: "image/jpeg" });
      const url = URL.createObjectURL(file);

      const incoming: PageEntry[] = [];
      if (pages.length + 1 <= maxPages) {
        incoming.push({ url, file });
      }
      updateAndNotify([...pages, ...incoming]);

      // Keep camera open so user can take another photo.
      // They close the camera modal explicitly.
    }, "image/jpeg", 0.85);
  };

  const canUseCamera = !!(navigator.mediaDevices?.getUserMedia);

  return (
    <>
      {pages.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            border: "2px dashed var(--color-border)",
            background: "var(--color-section-bg)",
          }}
        >
          <Camera className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--color-primary)" }} />
          <p className="font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
            Take a photo or upload pages
          </p>
          <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
            You can add up to {maxPages} pages per paper.
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            <Button onClick={startCamera} disabled={disabled} variant="primary">
              <Camera className="w-4 h-4" /> Use camera
            </Button>
            <Button onClick={() => fileInputRef.current?.click()} disabled={disabled} variant="outline">
              <Upload className="w-4 h-4" /> Upload file
            </Button>
          </div>
          {!canUseCamera && (
            <p className="text-xs mt-2" style={{ color: "var(--color-text-tertiary)" }}>
              Camera not available on this device. Use the upload option instead.
            </p>
          )}

          <input ref={fileInputRef} type="file" accept="image/*" multiple
                 onChange={addFile} className="hidden" />
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
              {pages.length} {pages.length === 1 ? "page" : "pages"}
              <span className="ml-2" style={{ color: "var(--color-text-tertiary)" }}>
                (max {maxPages})
              </span>
            </div>
            <Button
              onClick={() => updateAndNotify([])}
              variant="ghost"
              size="sm"
              disabled={disabled}
            >
              Clear all
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
            {pages.map((p, idx) => (
              <div
                key={p.url}
                className="relative rounded-xl overflow-hidden"
                style={{
                  background: "var(--color-section-bg)",
                  border: "1px solid var(--color-border)",
                }}
              >
                <img src={p.url} alt={`Page ${idx + 1}`} className="w-full h-32 object-cover" />
                <div
                  className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}
                >
                  Page {idx + 1}
                </div>
                <button
                  onClick={() => removeAt(idx)}
                  disabled={disabled}
                  className="absolute top-1.5 right-1.5 p-1 rounded-full transition-transform hover:scale-110 disabled:opacity-50"
                  style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}
                  aria-label={`Remove page ${idx + 1}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {canAddMore && (
              <button
                onClick={startCamera}
                className="rounded-xl flex flex-col items-center justify-center gap-1 h-32 transition-colors hover:bg-opacity-50"
                style={{
                  background: "var(--color-section-bg)",
                  border: "2px dashed var(--color-border)",
                  color: "var(--color-text-secondary)",
                }}
              >
                <Plus className="w-5 h-5" />
                <span className="text-xs font-medium">Add page</span>
              </button>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={startCamera} disabled={!canAddMore} variant="outline" size="sm">
              <Camera className="w-4 h-4" /> Add via camera
            </Button>
            <Button onClick={() => fileInputRef.current?.click()} disabled={!canAddMore} variant="outline" size="sm">
              <Upload className="w-4 h-4" /> Add file
            </Button>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" multiple
                 onChange={addFile} className="hidden" />
        </div>
      )}

      {/* ─── Camera modal (in-page viewfinder) ─────────────────────────────── */}
      {showCamera && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={(e) => { if (e.target === e.currentTarget) stopCamera(); }}
        >
          <div
            className="relative rounded-2xl overflow-hidden max-w-2xl w-full"
            style={{
              background: "#000",
              boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-medium text-white">Capture page</span>
              <button
                onClick={stopCamera}
                className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Loading spinner */}
            {cameraLoading && (
              <div className="flex items-center justify-center py-32">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              </div>
            )}

            {/* Error state */}
            {cameraError && !cameraLoading && (
              <div className="p-8 text-center">
                <div className="text-red-400 text-sm mb-4">{cameraError}</div>
                <Button onClick={stopCamera} variant="outline" size="sm">
                  Close
                </Button>
              </div>
            )}

            {/* Video feed */}
            {!cameraLoading && !cameraError && (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full"
                  style={{ maxHeight: "60vh", objectFit: "contain" }}
                />

                {/* Capture controls */}
                <div className="flex items-center justify-center gap-4 px-4 py-4">
                  <button
                    onClick={capturePhoto}
                    className="w-16 h-16 rounded-full transition-transform hover:scale-105 active:scale-95 flex items-center justify-center"
                    style={{
                      background: "white",
                      boxShadow: "0 0 0 4px rgba(255,255,255,0.3), 0 4px 12px rgba(0,0,0,0.3)",
                    }}
                  >
                    <div className="w-12 h-12 rounded-full" style={{ background: "white", border: "3px solid #333" }} />
                  </button>
                </div>
                <p className="text-center text-xs pb-3" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Press the button to capture a photo
                </p>
              </>
            )}
          </div>

          {/* Hidden canvas for capturing frames */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </>
  );
}