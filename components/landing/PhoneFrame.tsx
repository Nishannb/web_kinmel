"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

type PhoneFrameProps = {
  className?: string;
  /** Optional poster / screenshot behind or instead while video loads */
  posterSrc?: string;
  videoSrc?: string;
  alt?: string;
  priority?: boolean;
  floatClassName?: string;
};

export function PhoneFrame({
  className = "",
  posterSrc,
  videoSrc,
  alt = "Kinmel app preview",
  priority = false,
  floatClassName = "",
}: PhoneFrameProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const play = () => {
      void el.play().catch(() => {});
    };
    play();
  }, [videoSrc]);

  return (
    <div className={`relative ${floatClassName} ${className}`}>
      <div className="relative aspect-[9/19] w-full overflow-hidden rounded-[2rem] border-[3px] border-black/80 bg-black shadow-[0_30px_60px_rgba(0,0,0,0.45)]">
        <div className="pointer-events-none absolute left-1/2 top-2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-black/90" />
        {videoSrc ? (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={posterSrc}
            aria-label={alt}
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        ) : posterSrc ? (
          <Image
            src={posterSrc}
            alt={alt}
            fill
            sizes="(max-width: 768px) 55vw, 280px"
            className="object-cover object-top"
            priority={priority}
          />
        ) : null}
      </div>
    </div>
  );
}
