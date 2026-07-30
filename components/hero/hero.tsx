"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { HomeContent } from "@/lib/cms-store";

const COPY_SCRUB_SECONDS = 1.05;
const VIDEO_DAMPING = 10;
const VIDEO_END_PADDING = 0.08;
const DESKTOP_SEQUENCE_VIEWPORTS = 3.2;
const MOBILE_SEQUENCE_VIEWPORTS = 2.6;
const MOBILE_MEDIA_QUERY = "(max-width: 760px)";

const getHeroAnimationEnd = () => {
  const sequenceViewports = window.matchMedia(MOBILE_MEDIA_QUERY).matches
    ? MOBILE_SEQUENCE_VIEWPORTS
    : DESKTOP_SEQUENCE_VIEWPORTS;

  return `+=${Math.round(window.innerHeight * sequenceViewports)}`;
};

export function Hero({ scenes }: { scenes: HomeContent["heroScenes"] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const video = videoRef.current;
    const copy = copyRef.current;
    const progress = progressRef.current;
    let removeMetadataListener: (() => void) | undefined;
    let videoScrollTrigger: ScrollTrigger | undefined;
    let videoTicker: gsap.TickerCallback | undefined;

    if (!section || !video || !copy || !progress) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      video.currentTime = 0;
      return;
    }

    const context = gsap.context(() => {
      const scenes = gsap.utils.toArray<HTMLElement>("[data-hero-scene]");

      gsap.set(scenes, { autoAlpha: 0, force3D: true, xPercent: 96 });
      gsap.set(scenes[0], { autoAlpha: 1, force3D: true, xPercent: 0 });
      gsap.set(progress, { scaleX: 0, transformOrigin: "right center" });

      const copyTimeline = gsap.timeline({
        defaults: { ease: "power3.inOut" },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: getHeroAnimationEnd,
          scrub: COPY_SCRUB_SECONDS,
          invalidateOnRefresh: true,
        },
      });

      copyTimeline
        .to(
          scenes[0],
          { autoAlpha: 0, force3D: true, xPercent: -96, duration: 0.9 },
          0.82,
        )
        .fromTo(
          scenes[1],
          { autoAlpha: 0, force3D: true, xPercent: 96 },
          { autoAlpha: 1, force3D: true, xPercent: 0, duration: 1.15 },
          0.82,
        )
        .to(
          scenes[1],
          { autoAlpha: 0, force3D: true, xPercent: -96, duration: 0.9 },
          2.62,
        )
        .fromTo(
          scenes[2],
          { autoAlpha: 0, force3D: true, xPercent: 96 },
          { autoAlpha: 1, force3D: true, xPercent: 0, duration: 1.15 },
          2.62,
        )
        .to({}, { duration: 0.8 });

      gsap.to(progress, {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: getHeroAnimationEnd,
          scrub: 0.45,
          invalidateOnRefresh: true,
        },
      });

      const createVideoController = () => {
        const duration = Number.isFinite(video.duration) ? video.duration : 8;
        const playableDuration = Math.max(0, duration - VIDEO_END_PADDING);
        let targetTime = 0;
        let renderedTime = 0;

        video.pause();
        video.currentTime = 0;

        videoScrollTrigger = ScrollTrigger.create({
          trigger: section,
          start: "top top",
          end: getHeroAnimationEnd,
          invalidateOnRefresh: true,
          onUpdate: ({ progress: scrollProgress }) => {
            targetTime = playableDuration * scrollProgress;
          },
        });

        videoTicker = (_time, deltaTime) => {
          const frameSeconds = Math.min(deltaTime / 1000, 0.05);
          const blend = 1 - Math.exp(-VIDEO_DAMPING * frameSeconds);

          renderedTime += (targetTime - renderedTime) * blend;

          if (
            video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
            Math.abs(video.currentTime - renderedTime) > 0.004
          ) {
            video.currentTime = renderedTime;
          }
        };

        gsap.ticker.add(videoTicker);

        ScrollTrigger.refresh();
      };

      if (video.readyState >= 1) {
        createVideoController();
      } else {
        video.addEventListener("loadedmetadata", createVideoController, {
          once: true,
        });
        removeMetadataListener = () =>
          video.removeEventListener("loadedmetadata", createVideoController);
      }
    }, section);

    return () => {
      removeMetadataListener?.();
      videoScrollTrigger?.kill();
      if (videoTicker) gsap.ticker.remove(videoTicker);
      context.revert();
    };
  }, []);

  return (
    <section
      className="hero-scroll"
      ref={sectionRef}
      aria-labelledby="hero-title"
    >
      <div className="hero-scroll__stage">
        <video
          className="hero-scroll__video"
          ref={videoRef}
          poster="/images/fitkline-hero.png"
          preload="metadata"
          muted
          playsInline
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

        <div className="hero-scroll__copy" ref={copyRef}>
          {scenes.map((scene, index) => (
            <article
              className="hero-scroll__scene"
              data-hero-scene
              key={scene.label}
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
          <span className="hero-scroll__counter">01 — 03</span>
          <span className="hero-scroll__line">
            <span ref={progressRef} />
          </span>
          <span className="hero-scroll__hint">اسحب لتكمل المشهد</span>
        </div>
      </div>
    </section>
  );
}
