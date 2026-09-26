"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { pigCodeFromScan } from "@/lib/qr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Detector = { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> };

export function ScanClient() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [camera, setCamera] = useState(false);

  useEffect(() => {
    if (!camera) return;
    const DetectorCtor = (window as Window & { BarcodeDetector?: new (options: { formats: string[] }) => Detector }).BarcodeDetector;
    if (!DetectorCtor || !videoRef.current) {
      setError("This browser cannot scan QR codes. Enter the pig ID instead.");
      return;
    }
    let stream: MediaStream | null = null;
    let stopped = false;
    const video = videoRef.current;
    const detector = new DetectorCtor({ formats: ["qr_code"] });
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then((media) => {
      stream = media;
      video.srcObject = media;
      return video.play();
    }).then(async () => {
      while (!stopped) {
        const codes = await detector.detect(video).catch(() => []);
        const match = codes.map((code) => pigCodeFromScan(code.rawValue)).find(Boolean);
        if (match) {
          stopped = true;
          router.push(`/pigs/${match}`);
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    }).catch(() => setError("Camera permission is required to scan. You can still type the pig ID."));
    return () => {
      stopped = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [camera, router]);

  function openManual(event: React.FormEvent) {
    event.preventDefault();
    const code = pigCodeFromScan(manual);
    if (!code) {
      setError("Enter a pig ID such as PIG-0041. The QR code only contains that ID.");
      return;
    }
    router.push(`/pigs/${code}`);
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      {error ? <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-950">{error}</p> : null}
      {camera ? <video ref={videoRef} className="aspect-square w-full rounded-2xl bg-stone-900 object-cover" muted playsInline /> : null}
      <Button type="button" onClick={() => setCamera(true)}>Use camera</Button>
      <form onSubmit={openManual} className="space-y-3">
        <Input value={manual} onChange={(event) => setManual(event.target.value)} placeholder="PIG-0041" aria-label="Pig ID" />
        <Button type="submit" variant="outline" className="w-full">Open pig</Button>
      </form>
      <p className="text-sm text-stone-500">A pig QR code contains only the pig ID. Health and financial details stay in the signed-in app.</p>
    </div>
  );
}
