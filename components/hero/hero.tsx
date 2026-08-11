"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { HomeContent } from "@/lib/cms-store";

export function Hero({ scenes }: { scenes: HomeContent["heroScenes"] }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeScene, setActiveScene] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    const syncPlaybackPreference = () => {
      if (motionPreference.matches) {
        video.pause();
        video.currentTime = 0;
        setActiveScene(0);
        setVideoProgress(1);
        return;
      }

      void video.play().catch(() => {
        // Muted autoplay is widely supported. The poster remains visible if a
        // browser or device policy still prevents playback.
      });
    };

    syncPlaybackPreference();
    motionPreference.addEventListener("change", syncPlaybackPreference);

    return () =>
      motionPreference.removeEventListener("change", syncPlaybackPreference);
  }, []);

  function handleTimeUpdate() {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) {
      return;
    }

    const progress = Math.min(1, video.currentTime / video.duration);
    const nextScene = Math.min(
      scenes.length - 1,
      Math.floor(progress * scenes.length),
    );

    setVideoProgress(progress);
    setActiveScene(nextScene);
  }

  return (
    <section className="hero-scroll" aria-labelledby="hero-title">
      <div className="hero-scroll__stage">
        <video
          className="hero-scroll__video"
          ref={videoRef}
          poster="/images/fitkline-hero.png"
          preload="auto"
          autoPlay
          loop
          muted
          playsInline
          onTimeUpdate={handleTimeUpdate}
          aria-hidden="true"
          tabIndex={-1}
        >
          <source
            media="(max-width: 760px)"
            src="/videos/fitkline-scroll-hero-mobile.mp4"
            type="video/mp4"
          />
          <source
            src="/videos/fitkline-scroll-hero-smooth.mp4"
            type="video/mp4"
          />
        </video>

        <div className="hero-scroll__shade" aria-hidden="true" />
        <div className="hero-scroll__vignette" aria-hidden="true" />

        <div className="hero-scroll__copy">
          {scenes.map((scene, index) => (
            <article
              className={`hero-scroll__scene${index === activeScene ? " is-active" : ""}`}
              key={scene.label}
              aria-hidden={index !== activeScene}
            >
              <p className="hero-scroll__label">{scene.label}</p>
              {index === 0 ? (
                <h1 className="hero-scroll__title" id="hero-title">
                  {scene.title}
                  <span>{scene.accent}</span>
                </h1>
              ) : (
                <h2 className="hero-scroll__title">
                  {scene.title}
                  <span>{scene.accent}</span>
                </h2>
              )}
              <p className="hero-scroll__description">{scene.description}</p>
              <div className="hero-scroll__actions">
                <Link className="fit-button-primary" href="/products">
                  اكتشف المنتجات
                </Link>
                <Link className="fit-button-secondary" href="/contact">
                  اطلب عرض سعر
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="hero-scroll__hud" aria-hidden="true">
          <span className="hero-scroll__counter">
            {String(activeScene + 1).padStart(2, "0")} — {String(scenes.length).padStart(2, "0")}
          </span>
          <span className="hero-scroll__line">
            <span style={{ transform: `scaleX(${videoProgress})` }} />
          </span>
        </div>
      </div>
    </section>
  );
}
