"use client";

/* eslint-disable @next/next/no-img-element */

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { flushMetaEventQueue } from "@/components/analytics/meta-events";
import { META_PIXEL_ID } from "@/components/analytics/meta-config";

export { META_PIXEL_ID } from "@/components/analytics/meta-config";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    fitklineMetaUserData?: Record<string, string>;
  }
}

export function MetaPixel() {
  const pathname = usePathname();
  const lastTrackedPath = useRef(pathname);
  const isAdmin = pathname?.startsWith("/admin");

  useEffect(() => {
    if (!pathname || isAdmin || lastTrackedPath.current === pathname) return;
    window.fbq?.("track", "PageView");
    lastTrackedPath.current = pathname;
  }, [isAdmin, pathname]);

  if (isAdmin) return null;

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        onReady={flushMetaEventQueue}
      >
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          // Customer identifiers are populated only after a shopper submits
          // the checkout form. The pixel hashes these values with SHA-256.
          fbq('init', '${META_PIXEL_ID}', window.fitklineMetaUserData || {});
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        <img
          alt=""
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
