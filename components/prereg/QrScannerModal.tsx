"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type QrScannerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  mode: "scan" | "capture";
  onScanSuccess: (address: string) => void;
  onCaptureSuccess: (file: File) => void;
};

function extractCardanoAddress(raw: string): string | null {
  // Handle web+cardano: URI format
  let text = raw.trim();
  if (text.toLowerCase().startsWith("web+cardano:")) {
    text = text.slice("web+cardano:".length);
  }
  // Match addr1 followed by valid bech32 characters
  const match = text.match(/(addr1[a-z0-9]{50,})/i);
  return match ? match[1] : null;
}

export default function QrScannerModal({
  isOpen,
  onClose,
  mode,
  onScanSuccess,
  onCaptureSuccess,
}: QrScannerModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html5QrCodeRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        const state = html5QrCodeRef.current.getState();
        // State 2 = SCANNING
        if (state === 2) {
          await html5QrCodeRef.current.stop();
        }
      } catch {
        // ignore cleanup errors
      }
      html5QrCodeRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t: MediaStreamTrack) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const startScanner = async () => {
      try {
        if (mode === "scan") {
          const { Html5Qrcode } = await import("html5-qrcode");
          if (cancelled) return;

          const scannerId = "qr-scanner-region";
          const scanner = new Html5Qrcode(scannerId);
          html5QrCodeRef.current = scanner;

          setScanning(true);
          await scanner.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            (decodedText) => {
              const address = extractCardanoAddress(decodedText);
              if (address) {
                onScanSuccess(address);
              } else {
                // If it doesn't match Cardano format, still pass the raw value
                onScanSuccess(decodedText);
              }
            },
            () => {
              // QR scan failure (no code found) — ignore
            }
          );
        } else {
          // Capture mode — open camera stream directly
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
          });
          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
          setScanning(true);
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof DOMException && err.name === "NotAllowedError") {
          setError(
            "Camera access denied. Please allow camera permissions in your browser settings and try again."
          );
        } else if (
          err instanceof DOMException &&
          err.name === "NotFoundError"
        ) {
          setError("No camera found on this device.");
        } else {
          setError("Failed to start camera. Please try again.");
        }
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(startScanner, 100);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      cleanup();
    };
  }, [isOpen, mode, onScanSuccess, cleanup]);

  const handleCapture = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], "qr-capture.jpg", {
            type: "image/jpeg",
          });
          onCaptureSuccess(file);
        }
      },
      "image/jpeg",
      0.9
    );
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">
            {mode === "scan" ? "Scan QR Code" : "Capture QR Code Photo"}
          </h3>
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white p-1"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {error ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <p className="text-red-700 font-medium mb-4">{error}</p>
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {mode === "scan" ? (
                <>
                  <div
                    id="qr-scanner-region"
                    ref={scannerRef}
                    className="w-full rounded-xl overflow-hidden"
                  />
                  {!scanning && (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                      <span className="ml-3 text-gray-600">
                        Starting camera...
                      </span>
                    </div>
                  )}
                  <p className="text-center text-sm text-gray-500 mt-4">
                    Point your camera at a Cardano wallet QR code
                  </p>
                </>
              ) : (
                <>
                  <div className="w-full rounded-xl overflow-hidden bg-black aspect-[4/3] relative">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {!scanning && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                        <span className="ml-3 text-white">
                          Starting camera...
                        </span>
                      </div>
                    )}
                  </div>
                  {scanning && (
                    <button
                      onClick={handleCapture}
                      className="w-full mt-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 shadow-lg flex items-center justify-center gap-2"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      Capture Photo
                    </button>
                  )}
                  <p className="text-center text-sm text-gray-500 mt-3">
                    Position the QR code in the frame and tap capture
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
