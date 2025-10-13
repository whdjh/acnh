import type { Metadata } from "next";

const BASE = "https://acnh-gules.vercel.app";

export const metadata: Metadata = {
  title: "탐슬도감(TamslDogam) — 모동숲 도감 웹앱",
  description:
    "탐슬도감은 이름·월·시간·반구 필터와 잡은/남은 항목 관리를 지원하는 모동숲 도감 웹앱입니다.",
  alternates: { canonical: `${BASE}/brand/tamsldogam` },
  openGraph: {
    title: "탐슬도감(TamslDogam) — 모동숲 도감 웹앱",
    description:
      "이름·월·시간·반구 한 번에 필터, 잡은/남은 항목 관리, 모바일 최적화.",
    url: `${BASE}/brand/tamsldogam`,
    images: [{ url: `${BASE}/og-image.png`, width: 1200, height: 630, alt: "탐슬도감" }],
    siteName: "탐슬도감(TamslDogam)",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "탐슬도감(TamslDogam)",
    description:
      "이름·월·시간·반구 한 번에 필터되는 모동숲 도감 웹앱. 모바일 최적화, 잡은 항목 정리 지원.",
    images: [`${BASE}/og-image.png`],
  },
};

export default function Page() {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "탐슬도감 (TamslDogam)",
    url: BASE,
    logo: `${BASE}/og-image.png`,
    sameAs: [
      "https://github.com/whdjh/acnh",
    ],
  };

  const siteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: BASE,
    name: "탐슬도감(TamslDogam)",
    potentialAction: {
      "@type": "SearchAction",
      target: `${BASE}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "‘탐슬도감’은 무엇인가요?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "탐슬도감은 모동숲 도감 웹앱으로, 이름·월·시간·반구 필터와 잡은/남은 항목 관리 기능을 제공합니다.",
        },
      },
      {
        "@type": "Question",
        name: "타임슬립/반구 전환은 지원하나요?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "네. 사용자 지정 시간(타임슬립)과 북/남반구 토글을 지원합니다.",
        },
      },
      {
        "@type": "Question",
        name: "앱 설치나 회원가입이 꼭 필요한가요?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "브라우저에서 바로 사용할 수 있으며, 로그인 없이도 핵심 기능을 이용할 수 있습니다.",
        },
      },
    ],
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold">
        탐슬도감 <span className="text-neutral-400 text-xl">(TamslDogam)</span>
      </h1>
      <p className="mt-4 text-lg">
        모동숲 도감 웹앱 — 이름·월·시간·반구 한 번에 필터, 잡은/남은 항목 정리, 모바일 최적화.
      </p>

      <section className="mt-8 space-y-2">
        <h2 className="text-xl font-semibold">핵심 기능</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>이름 검색(한글 부분일치), 월·시간대 지정(타임슬립), 북/남반구 토글</li>
          <li>잡은 항목 자동 정리, 탭별 남은 개수 표시</li>
          <li>모바일 최적화, 광고 최소화(인증 화면 한정)</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">스크린샷</h2>
        <p className="text-sm text-neutral-500">
          /og-image.png 또는 실제 화면 캡처를 1–2장 추가하세요.
        </p>
      </section>

      {/* JSON-LD 3종 삽입 */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    </main>
  );
}
