"use client";

import { useRef, useState } from "react";
import { PlayIcon } from "lucide-react";

type VideoEl = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
};

type ScreenOrientationLockable = ScreenOrientation & {
  lock?: (orientation: "landscape" | "portrait") => Promise<void>;
};

export function DemoVideo({
  src,
  poster,
  ariaLabel,
}: {
  src: string;
  poster?: string;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);

  async function handlePlay() {
    setStarted(true);
    const video = ref.current as VideoEl | null;
    if (!video) return;

    video.play();

    // On mobile (touch + narrow viewport), kick into fullscreen so the video
    // shows landscape instead of cramped inside a 16:9 container on a portrait phone.
    const isMobile =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 768px)").matches &&
      window.matchMedia("(pointer: coarse)").matches;

    if (!isMobile) return;

    try {
      if (typeof video.webkitEnterFullscreen === "function") {
        // iOS Safari — native fullscreen auto-rotates landscape.
        video.webkitEnterFullscreen();
      } else if (typeof video.requestFullscreen === "function") {
        await video.requestFullscreen();
        const orientation = screen.orientation as ScreenOrientationLockable | undefined;
        if (orientation?.lock) {
          await orientation.lock("landscape").catch(() => {});
        }
      }
    } catch {
      // Fullscreen blocked — fall back to inline playback.
    }
  }

  return (
    <div className="relative isolate">
      <video
        ref={ref}
        src={src}
        poster={poster}
        controls={started}
        playsInline
        preload="metadata"
        className="w-full rounded-xl border bg-muted/30 aspect-video"
      />
      {!started && (
        <button
          type="button"
          onClick={handlePlay}
          aria-label={ariaLabel}
          className="absolute inset-0 flex items-center justify-center group cursor-pointer rounded-xl"
        >
          <span className="size-16 sm:size-20 rounded-full bg-white/95 group-hover:bg-white shadow-xl flex items-center justify-center transition-all group-hover:scale-105">
            <PlayIcon className="size-7 sm:size-8 fill-foreground text-foreground translate-x-0.5" />
          </span>
        </button>
      )}
    </div>
  );
}
