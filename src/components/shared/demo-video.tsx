"use client";

import { useRef, useState } from "react";
import { PlayIcon } from "lucide-react";

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

  function handlePlay() {
    setStarted(true);
    ref.current?.play();
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
