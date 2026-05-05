"use client";

export function HeroLoopVideo({ alt }: { alt: string }) {
  return (
    <div
      role="img"
      aria-label={alt}
      className="relative mx-auto mt-12 sm:mt-14 w-full max-w-5xl rounded-xl border bg-card shadow-[0_20px_60px_-20px_rgba(0,0,0,0.18)] overflow-hidden"
    >
      <video
        src="/demo/hero-loop.mp4"
        poster="/demo/hero-loop-poster.jpg"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
        className="block w-full aspect-video object-cover"
      />
    </div>
  );
}
