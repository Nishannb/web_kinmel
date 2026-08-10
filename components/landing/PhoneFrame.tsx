"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type PhoneFrameProps = {
  className?: string;
  /** Optional poster / first-frame still while video buffers */
  posterSrc?: string;
  videoSrc?: string;
  alt?: string;
  priority?: boolean;
  floatClassName?: string;
  /** Hero: auto. Below-fold: none until visible. */
  preload?: "auto" | "metadata" | "none";
  /** Hero plays immediately; lazy waits until near viewport. */
  loadMode?: "eager" | "lazy";
};

export function PhoneFrame({
  className = "",
  posterSrc,
  videoSrc,
  alt = "Kinmel app preview",
  priority = false,
  floatClassName = "",
  preload = "metadata",
  loadMode = "eager",
}: PhoneFrameProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(loadMode === "eager");
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (loadMode !== "lazy" || shouldLoad) return;
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === "undefined") {
      setShouldLoad(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px", threshold: 0.05 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [loadMode, shouldLoad]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !videoSrc || !shouldLoad) return;

    const tryPlay = () => {
      void el.play().then(() => setIsPlaying(true)).catch(() => {});
    };

    const onPlaying = () => setIsPlaying(true);
    const onCanPlay = () => tryPlay();

    el.addEventListener("playing", onPlaying);
    el.addEventListener("canplay", onCanPlay);
    tryPlay();

    return () => {
      el.removeEventListener("playing", onPlaying);
      el.removeEventListener("canplay", onCanPlay);
    };
  }, [videoSrc, shouldLoad]);

  return (
    <div ref={rootRef} className={`relative ${floatClassName} ${className}`}>
      <div className="relative aspect-[9/19] w-full overflow-hidden rounded-[2rem] border-[3px] border-black/80 bg-black shadow-[0_30px_60px_rgba(0,0,0,0.45)]">
        <div className="pointer-events-none absolute left-1/2 top-2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-black/90" />

        {posterSrc ? (
          <Image
            src={posterSrc}
            alt={alt}
            fill
            sizes="(max-width: 768px) 55vw, 280px"
            className={`object-cover object-top transition-opacity duration-500 ${
              isPlaying ? "opacity-0" : "opacity-100"
            }`}
            priority={priority}
          />
        ) : null}

        {videoSrc && shouldLoad ? (
          <video
            ref={videoRef}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
              isPlaying ? "opacity-100" : "opacity-0"
            }`}
            autoPlay
            muted
            loop
            playsInline
            preload={preload}
            poster={posterSrc}
            aria-label={alt}
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
        ) : null}
      </div>
    </div>
  );
}
