import type { Metadata } from "next"
import Script from "next/script"
import { Suspense } from "react"
import "../styles/globals.css"
import GtmRouteListener from "./_gtm-route-listener"

const GTM_ID = "GTM-KPHJDQX5"
const GTM_SCRIPT = `
  (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f)
  })(window,document,'script','dataLayer','${GTM_ID}')
`

export const metadata: Metadata = {
  title: "탐슬도감",
  description:
    "모여봐요 동물의 숲 도감 웹앱 — 이름·월·시간·반구 한 번에 필터, 잡은 항목 정리, 모바일 최적화.",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "탐슬도감",
    description:
      "모동숲 도감 웹앱 — 이름 검색, 월·시간대 지정(타임슬립), 북/남반구 토글, 잡은/남은 항목 관리.",
    url: "https://acnh-gules.vercel.app",
    siteName: "탐슬도감",
    images: [
      {
        url: "https://acnh-gules.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "탐슬도감 — 모동숲 도감 웹앱",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "탐슬도감",
    description:
      "이름·월·시간·반구 한 번에 필터되는 모동숲 도감 웹앱. 모바일 최적화, 잡은 항목 정리 지원.",
    images: ["https://acnh-gules.vercel.app/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1 },
  },
  alternates: { canonical: "https://acnh-gules.vercel.app" },
  metadataBase: new URL("https://acnh-gules.vercel.app"),
  verification: {
    google: "7W8K5jynjR_b8gTwxRgXVv2AtuGKcecspbj75-ftjgc",
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        {/* 폰트 preload - Critical request chain 최적화 */}
        <link
          rel="preload"
          href="/fonts/87MMILSANG-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* Google Tag Manager - head 상단 */}
        <Script id="gtm-head" strategy="beforeInteractive">
          {GTM_SCRIPT}
        </Script>
      </head>

      <body
        className="min-h-screen bg-cover bg-center bg-fixed relative"
        style={{ backgroundImage: "url('/background.jpg')" }}
      >
        {/* Google Tag Manager (noscript) - body 바로 아래 */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        {/* SPA 라우트 전환 시 가상 페이지뷰 이벤트 푸시 */}
        <Suspense fallback={null}>
          <GtmRouteListener />
        </Suspense>

        <div className="absolute inset-0" />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  )
}
