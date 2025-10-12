import type { Metadata } from "next";
import Script from "next/script";
import "../styles/globals.css";

const siteUrl =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : new URL("http://localhost:3000");

const title = "모동숲 도감";
const description = "모동숲(Animal Crossing: New Horizons) 물고기·곤충·해양생물·화석 도감 — 월·시간대 필터, 반구별 출현 정보, 잡은 항목 관리까지.";
const ogImage = "/og-image.png";
const keywords = [
  "모동숲",
  "동물의숲",
  "모여봐요 동물의숲",
  "Animal Crossing",
  "New Horizons",
  "ACNH",
  "도감",
  "물고기",
  "곤충",
  "해양생물",
  "화석",
  "월별",
  "시간대",
  "반구",
];

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: title,
    template: `%s | ${title}`,
  },
  description,
  applicationName: title,
  generator: "Next.js",
  keywords,
  category: "gaming",
  authors: [{ name: "모동숲 도감" }],
  creator: "모동숲 도감",
  publisher: "모동숲 도감",
  alternates: {
    canonical: "/",
    languages: {
      "ko-KR": "/",
      "en-US": "/en",
    },
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    url: siteUrl.toString(),
    title,
    siteName: title,
    description,
    locale: "ko_KR",
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: title,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImage],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: ["/favicon.ico"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: title,
    url: siteUrl.toString(),
    inLanguage: "ko-KR",
    description,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl.toString()}search?q={query}`,
      "query-input": "required name=query",
    },
    publisher: {
      "@type": "Organization",
      name: title,
      url: siteUrl.toString(),
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl.toString()}icon-192.png`,
      },
    },
  };

  return (
    <html lang="ko">
      <body
        className="min-h-screen bg-cover bg-center bg-fixed relative"
        style={{ backgroundImage: "url('/background.jpg')" }}
      >
        {/* 어두운 오버레이(필요 시 투명도 조절) */}
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10">{children}</div>

        {/* JSON-LD 구조화 데이터 */}
        <Script
          id="ld-json-website"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
