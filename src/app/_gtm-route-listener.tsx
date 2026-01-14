"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

interface GtmPageViewEvent {
  event: "pageview";
  page_location: string;
  page_path: string;
  page_title: string;
  page_referrer?: string;
}

declare global {
  interface Window {
    dataLayer: GtmPageViewEvent[];
    gtag?: (...args: unknown[]) => void;
  }
}

export default function GtmRouteListener() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const search = searchParams?.toString();
    const page_path = search ? `${pathname}?${search}` : pathname;

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "pageview",
      page_location: window.location.origin + page_path,
      page_path,
      page_title: document.title,
      page_referrer: document.referrer || undefined,
    });
  }, [pathname, searchParams]);

  return null;
}
