"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Product } from "@/data/products";
import type { HomeContent } from "@/lib/cms-store";

const MASK_REVEAL_DURATION = 0.42;
const HORIZONTAL_SCROLL_DURATION = 2.8;

type ProductSystemProps = {
  products: Product[];
  content: HomeContent["system"];
};

export function ProductSystem({ products, content }: ProductSystemProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const stage = stageRef.current;
    const track = trackRef.current;
    const progress = progressRef.current;

    if (!section || !stage || !track || !progress) return;

    const media = gsap.matchMedia();

    media.add(
      "(min-width: 901px) and (prefers-reduced-motion: no-preference)",
      () => {
        const getHorizontalDistance = () =>
          Math.max(0, track.scrollWidth - window.innerWidth);

        gsap.set(stage, {
          clipPath: "circle(0 at 50% 100%)",
        });
        gsap.set(progress, {
          scaleX: 0,
          transformOrigin: "left center",
        });

        const timeline = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.35,
            invalidateOnRefresh: true,
          },
        });

        timeline
          .to(stage, {
            clipPath: "circle(150vmax at 50% 100%)",
            duration: MASK_REVEAL_DURATION,
          })
          .to(
            track,
            {
              x: () => -getHorizontalDistance(),
              duration: HORIZONTAL_SCROLL_DURATION,
            },
            MASK_REVEAL_DURATION,
          )
          .to(
            progress,
            {
              scaleX: 1,
              duration: HORIZONTAL_SCROLL_DURATION,
            },
            MASK_REVEAL_DURATION,
          );

        ScrollTrigger.refresh();
      },
    );

    return () => media.revert();
  }, [products.length]);

  return (
    <section
      className="product-system-redesign product-system-horizontal"
      id="product-system"
      ref={sectionRef}
      aria-labelledby="product-system-title"
    >
      <div className="product-system-horizontal__stage" ref={stageRef}>
        <header className="product-system-redesign__header product-system-horizontal__header">
          <div>
            <p>{content.kicker}</p>
            <h2 id="product-system-title">
              {content.title} <span>{content.accent}</span>
            </h2>
          </div>
          <p className="product-system-redesign__intro">{content.description}</p>
        </header>

        <div className="product-system-horizontal__track" ref={trackRef}>
          {products.map((product, index) => (
            <div className="product-system-horizontal__panel" key={product.slug}>
              <article className="product-system-redesign__item">
                <div className="product-system-redesign__visual">
                  <div
                    className="product-system-redesign__visual-meta"
                    dir="ltr"
                  >
                    <span>{product.step} / 03</span>
                    <span>4 KG · FITKLINE</span>
                  </div>
                  <Image
                    src={product.image}
                    alt={product.imageAlt}
                    width={1024}
                    height={1536}
                    sizes="(max-width: 900px) calc(100vw - 64px), 46vw"
                    loading={index === 0 ? "eager" : "lazy"}
                  />
                </div>

                <div className="product-system-redesign__copy">
                  <p className="product-system-redesign__name" dir="ltr">
                    {product.name}
                  </p>
                  <h3>{product.action}</h3>
                  <p className="product-system-redesign__description">
                    {product.description}
                  </p>
                  <ul>
                    {product.benefits.slice(0, 2).map((benefit) => (
                      <li key={benefit}>{benefit}</li>
                    ))}
                  </ul>
                  <div className="product-system-redesign__actions">
                    <Link
                      className="fit-button-primary"
                      href={`/products/${product.slug}`}
                    >
                      تفاصيل المنتج
                    </Link>
                    <Link className="fit-button-secondary" href="/contact">
                      اطلب عرض سعر
                    </Link>
                  </div>
                </div>
              </article>
            </div>
          ))}
        </div>

        <div className="product-system-horizontal__rail" aria-hidden="true">
          <div className="product-system-horizontal__rail-names" dir="ltr">
            {products.map((product) => (
              <span key={product.slug}>{product.name}</span>
            ))}
          </div>
          <span className="product-system-horizontal__rail-line">
            <span ref={progressRef} />
          </span>
        </div>
      </div>
    </section>
  );
}
