"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  performanceBenefits,
  type PerformanceBenefitIcon,
} from "@/data/performance-benefits";
import type { HomeContent } from "@/lib/cms-store";

function BenefitIcon({ name }: { name: PerformanceBenefitIcon }) {
  const paths = {
    safety: (
      <>
        <path d="M12 3 5.5 5.7v5.7c0 4.2 2.7 7.8 6.5 9.6 3.8-1.8 6.5-5.4 6.5-9.6V5.7L12 3Z" />
        <path d="m9 12 2 2 4-5" />
      </>
    ),
    finish: (
      <>
        <path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z" />
        <path d="m18.5 14 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />
        <path d="M3 19h10" />
      </>
    ),
    facility: (
      <>
        <path d="M4 21V8l8-4 8 4v13" />
        <path d="M8 21v-5h8v5M8 10h.01M12 10h.01M16 10h.01M8 13h.01M12 13h.01M16 13h.01" />
        <path d="M2 21h20" />
      </>
    ),
    experience: (
      <>
        <path d="M4 21V5h10v16M14 9h6v12" />
        <path d="M8 12h2M8 16h2M17 13h.01M17 17h.01M2 21h20" />
        <path d="m9 8 2-1-2-1" />
      </>
    ),
  } as const;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export function PerformanceBenefits({
  content,
}: {
  content: HomeContent["benefits"];
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const journeyRef = useRef<HTMLDivElement>(null);
  const journeyLineRef = useRef<SVGSVGElement>(null);
  const journeyTrackRef = useRef<SVGPathElement>(null);
  const journeyProgressRef = useRef<SVGPathElement>(null);
  const journeyProgressClipRef = useRef<SVGRectElement>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const journey = journeyRef.current;
    const journeyLine = journeyLineRef.current;
    const journeyTrack = journeyTrackRef.current;
    const journeyProgress = journeyProgressRef.current;
    const journeyProgressClip = journeyProgressClipRef.current;

    if (
      !section ||
      !journey ||
      !journeyLine ||
      !journeyTrack ||
      !journeyProgress ||
      !journeyProgressClip
    ) {
      return;
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const context = gsap.context(() => {
      const steps = gsap.utils.toArray<HTMLElement>("[data-journey-step]");
      const nodes = steps
        .map((step) => step.querySelector<HTMLElement>("[data-journey-node]"))
        .filter((node): node is HTMLElement => Boolean(node));
      const nodeThresholds: number[] = [];

      const syncNodes = (progress: number) => {
        nodes.forEach((node, index) => {
          node.classList.toggle(
            "is-reached",
            progress >= (nodeThresholds[index] ?? 1),
          );
        });
      };

      const updateJourneyGeometry = () => {
        const lineRect = journeyLine.getBoundingClientRect();

        if (!lineRect.height) return;

        const nodeYPositions = nodes.map((node) => {
          const nodeRect = node.parentElement?.getBoundingClientRect();
          const nodeCenter = nodeRect
            ? nodeRect.top + nodeRect.height / 2
            : lineRect.top;

          return Math.min(
            1000,
            Math.max(0, ((nodeCenter - lineRect.top) / lineRect.height) * 1000),
          );
        });
        const pathPoints = [0, ...nodeYPositions, 1000];
        let pathData = "M20 0";

        for (let index = 1; index < pathPoints.length; index += 1) {
          const startY = pathPoints[index - 1];
          const endY = pathPoints[index];
          const distance = endY - startY;
          const bend = index % 2 === 0 ? -10 : 10;

          pathData += ` C${20 + bend} ${startY + distance * 0.34} ${
            20 + bend
          } ${startY + distance * 0.66} 20 ${endY}`;
        }

        journeyTrack.setAttribute("d", pathData);
        journeyProgress.setAttribute("d", pathData);

        nodeThresholds.splice(
          0,
          nodeThresholds.length,
          ...nodeYPositions.map((position) => position / 1000),
        );
      };

      updateJourneyGeometry();

      gsap.set(journeyProgressClip, {
        attr: { height: reduceMotion ? 1000 : 0 },
      });

      if (reduceMotion) {
        nodes.forEach((node) => node.classList.add("is-reached"));
      } else {
        const lineState = { progress: 0 };

        syncNodes(0);

        gsap.to(lineState, {
          progress: 1,
          ease: "none",
          onUpdate: () => {
            gsap.set(journeyProgressClip, {
              attr: { height: lineState.progress * 1000 },
            });
            syncNodes(lineState.progress);
          },
          scrollTrigger: {
            trigger: journey,
            start: "top 72%",
            end: "bottom 64%",
            scrub: 0.28,
          },
        });
      }

      steps.forEach((step) => {
        const revealParts = step.querySelectorAll("[data-journey-reveal]");

        gsap.fromTo(
          revealParts,
          { autoAlpha: 0.68, y: 18 },
          {
            autoAlpha: 1,
            duration: 0.52,
            ease: "power3.out",
            stagger: 0.07,
            y: 0,
            scrollTrigger: {
              trigger: step,
              start: "top 78%",
              toggleActions: "play none none reverse",
            },
          },
        );
      });

      ScrollTrigger.addEventListener("refreshInit", updateJourneyGeometry);
      ScrollTrigger.refresh();

      return () => {
        ScrollTrigger.removeEventListener("refreshInit", updateJourneyGeometry);
      };
    }, section);

    return () => context.revert();
  }, []);

  return (
    <section
      className="performance-benefits"
      id="performance-benefits"
      ref={sectionRef}
      aria-labelledby="performance-benefits-title"
    >
      <div className="performance-benefits__layout">
        <header className="performance-benefits__header">
          <p className="performance-benefits__signal">
            <span aria-hidden="true" />
            {content.kicker}
          </p>
          <h2 id="performance-benefits-title">
            {content.title}
            <span>{content.accent}</span>
          </h2>
          <p className="performance-benefits__intro">
            {content.description}
          </p>
        </header>

        <div className="performance-benefits__panel">
          <div className="performance-benefits__journey" ref={journeyRef}>
            <svg
              className="performance-benefits__journey-line"
              ref={journeyLineRef}
              viewBox="0 0 40 1000"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <clipPath
                  id="performance-benefits-journey-progress-clip"
                  clipPathUnits="userSpaceOnUse"
                >
                  <rect
                    ref={journeyProgressClipRef}
                    x="0"
                    y="0"
                    width="40"
                    height="0"
                  />
                </clipPath>
              </defs>
              <path
                className="performance-benefits__journey-track"
                ref={journeyTrackRef}
                d="M20 0 C20 85 8 165 20 250 C32 335 32 415 20 500 C8 585 8 665 20 750 C32 835 20 920 20 1000"
                vectorEffect="non-scaling-stroke"
                pathLength="1"
              />
              <path
                className="performance-benefits__journey-progress"
                ref={journeyProgressRef}
                clipPath="url(#performance-benefits-journey-progress-clip)"
                d="M20 0 C20 85 8 165 20 250 C32 335 32 415 20 500 C8 585 8 665 20 750 C32 835 20 920 20 1000"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            <ol>
              {performanceBenefits.map((benefit, index) => (
                <li key={benefit.number} data-journey-step>
                  <span
                    className="performance-benefits__journey-node"
                    dir="ltr"
                    aria-hidden="true"
                  >
                    <span data-journey-node>{benefit.number}</span>
                  </span>

                  <article className="performance-benefits__journey-step">
                    <figure data-journey-reveal>
                      <Image
                        src={benefit.image}
                        alt={benefit.imageAlt}
                        fill
                        sizes="(max-width: 820px) calc(100vw - 104px), min(42vw, 620px)"
                        loading={index === 0 ? "eager" : "lazy"}
                      />
                    </figure>

                    <div
                      className="performance-benefits__journey-copy"
                      data-journey-reveal
                    >
                      <div className="performance-benefits__journey-heading">
                        <span className="performance-benefits__journey-icon">
                          <BenefitIcon name={benefit.icon} />
                        </span>
                        <h3>{benefit.title}</h3>
                      </div>

                      <p>{benefit.description}</p>
                    </div>
                  </article>
                </li>
              ))}
            </ol>
          </div>

          <Link className="performance-benefits__cta" href="/products">
            <span>اعرف المنتج المناسب لمكانك</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
