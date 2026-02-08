import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"

const BASE = "https://acnh-gules.vercel.app"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "brand" })

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: `${BASE}/brand/tamsldogam` },
    openGraph: {
      title: t("metaTitle"),
      description: t("description"),
      url: `${BASE}/brand/tamsldogam`,
      images: [{ url: `${BASE}/og-image.png`, width: 1200, height: 630, alt: t("title") }],
      siteName: t("metaTitle"),
      locale: locale === "ko" ? "ko_KR" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("metaTitle"),
      description: t("description"),
      images: [`${BASE}/og-image.png`],
    },
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "brand" })

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: `${t("title")} ${t("subtitle")}`,
    url: BASE,
    logo: `${BASE}/og-image.png`,
    sameAs: ["https://github.com/whdjh/acnh"],
  }

  const siteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: BASE,
    name: t("metaTitle"),
    potentialAction: {
      "@type": "SearchAction",
      target: `${BASE}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  }

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: t("faqQ1"),
        acceptedAnswer: { "@type": "Answer", text: t("faqA1") },
      },
      {
        "@type": "Question",
        name: t("faqQ2"),
        acceptedAnswer: { "@type": "Answer", text: t("faqA2") },
      },
      {
        "@type": "Question",
        name: t("faqQ3"),
        acceptedAnswer: { "@type": "Answer", text: t("faqA3") },
      },
    ],
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold">
        {t("title")} <span className="text-neutral-400 text-xl">{t("subtitle")}</span>
      </h1>
      <p className="mt-4 text-lg">{t("description")}</p>

      <section className="mt-8 space-y-2">
        <h2 className="text-xl font-semibold">{t("keyFeatures")}</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>{t("feature1")}</li>
          <li>{t("feature2")}</li>
          <li>{t("feature3")}</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">{t("screenshots")}</h2>
        <p className="text-sm text-neutral-500">{t("screenshotHint")}</p>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    </main>
  )
}
