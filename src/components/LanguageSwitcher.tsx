"use client"

import { useLocale } from "next-intl"
import { useRouter, usePathname } from "@/i18n/navigation"
import { routing, type Locale } from "@/i18n/routing"

const LOCALE_LABELS: Record<Locale, string> = {
  ko: "한국어",
  en: "EN",
  ja: "日本語",
}

export default function LanguageSwitcher() {
  const locale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className="shrink-0 flex gap-1">
      {routing.locales
        .filter((l) => l !== locale)
        .map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => router.replace(pathname, { locale: l })}
            className="rounded-lg border border-white/20 bg-white/10 backdrop-blur px-2.5 py-1 text-xs font-medium hover:bg-white/20 transition"
          >
            {LOCALE_LABELS[l]}
          </button>
        ))}
    </div>
  )
}
