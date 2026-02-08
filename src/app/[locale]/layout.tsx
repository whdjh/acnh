import type { Metadata } from "next"
import Script from "next/script"
import { Suspense } from "react"
import { NextIntlClientProvider } from "next-intl"
import { getMessages, getTranslations } from "next-intl/server"
import { routing, type Locale } from "@/i18n/routing"
import { notFound } from "next/navigation"
import "../../styles/globals.css"
import GtmRouteListener from "../_gtm-route-listener"

const GTM_ID = "GTM-KPHJDQX5"
const GTM_SCRIPT = `
  (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f)
  })(window,document,'script','dataLayer','${GTM_ID}')
`

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "metadata" })

  return {
    title: t("title"),
    description: t("description"),
    icons: { icon: "/favicon.ico" },
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      url: "https://acnh-gules.vercel.app",
      siteName: t("title"),
      images: [
        {
          url: "https://acnh-gules.vercel.app/og-image.png",
          width: 1200,
          height: 630,
          alt: t("ogAlt"),
        },
      ],
      locale: locale === "ko" ? "ko_KR" : locale === "ja" ? "ja_JP" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("twitterDescription"),
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
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as Locale)) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://bzaoskrynsvcyyvalhvw.supabase.co" />
        <link rel="dns-prefetch" href="https://bzaoskrynsvcyyvalhvw.supabase.co" />
        <link
          rel="preload"
          href="/fonts/87MMILSANG-Regular.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <Script id="gtm-head" strategy="beforeInteractive">
          {GTM_SCRIPT}
        </Script>
      </head>

      <body
        className="min-h-screen bg-cover bg-center bg-fixed relative"
        style={{ backgroundImage: "url('/background.jpg')" }}
      >
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        <Suspense fallback={null}>
          <GtmRouteListener />
        </Suspense>

        <div className="absolute inset-0" />
        <div className="relative z-10">
          <NextIntlClientProvider messages={messages}>
            {children}
          </NextIntlClientProvider>
        </div>
      </body>
    </html>
  )
}
