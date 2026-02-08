"use client"

import { useLocale } from "next-intl"
import { useRouter, usePathname } from "@/i18n/navigation"

const LOCALE_LABELS: Record<string, string> = {
  ko: "한국어",
  en: "EN",
}

export default function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const switchTo = locale === "ko" ? "en" : "ko"

  return (
    <button
      type="button"
      onClick={() => router.replace(pathname, { locale: switchTo })}
      className="shrink-0 rounded-lg border border-white/20 bg-white/10 backdrop-blur px-3 py-1 text-xs font-medium hover:bg-white/20 transition"
    >
      {LOCALE_LABELS[switchTo]}
    </button>
  )
}
