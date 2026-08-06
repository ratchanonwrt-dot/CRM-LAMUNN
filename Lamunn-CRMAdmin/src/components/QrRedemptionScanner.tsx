"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { ScanLine, AlertCircle } from "lucide-react";

// Matches the redemption confirm URL encoded in the QR shown to customers after
// redeeming a reward (see Lamunn-CRM .../rewards/redeemed/[id]/page.tsx), regardless
// of which domain it was generated against (localhost in dev vs the real domain).
const REDEMPTION_ID_PATTERN = /\/admin\/redemptions\/([a-zA-Z0-9]+)/;

export default function QrRedemptionScanner() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const foundRef = useRef(false);

  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"starting" | "scanning" | "found">("starting");

  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("เบราว์เซอร์นี้ไม่รองรับการเปิดกล้อง");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus("scanning");
        tick();
      } catch {
        setError("เปิดกล้องไม่สำเร็จ กรุณาอนุญาตให้เข้าถึงกล้องแล้วลองใหม่");
      }
    }

    function tick() {
      if (foundRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            const match = code.data.match(REDEMPTION_ID_PATTERN);
            if (match) {
              foundRef.current = true;
              setStatus("found");
              streamRef.current?.getTracks().forEach((t) => t.stop());
              router.push(`/admin/redemptions/${match[1]}`);
              return;
            }
            setError("QR นี้ไม่ใช่ QR ยืนยันแลกรางวัล ลองสแกนใหม่");
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    start();

    return () => {
      cancelled = true;
      foundRef.current = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [router]);

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-gray-800">สแกน QR ยืนยันแลกรางวัล</h1>
      <p className="mb-6 text-sm text-gray-500">ให้ลูกค้าเปิด QR ที่หน้าจอ แล้วส่องกล้องสาขานี้ไปที่ QR เพื่อยืนยันการแลกรางวัล</p>

      <div className="relative mx-auto aspect-square max-w-sm overflow-hidden rounded-2xl border border-gray-200 bg-black">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        <canvas ref={canvasRef} className="hidden" />

        {status === "scanning" && (
          <div className="pointer-events-none absolute inset-8 rounded-2xl border-4 border-brand-400/70" />
        )}

        {status === "found" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <p className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-brand-700">
              <ScanLine size={16} />
              เจอ QR แล้ว กำลังเปิดหน้ายืนยัน...
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="mx-auto mt-4 flex max-w-sm items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
