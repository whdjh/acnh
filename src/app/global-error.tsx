"use client"

import * as Sentry from "@sentry/nextjs"
import NextError from "next/error"
import { useEffect } from "react"

interface GlobalErrorProps {
  error: Error & { digest?: string }
}

/**
 * 전역 에러 페이지 컴포넌트
 * 
 * Next.js App Router의 전역 에러를 처리합니다.
 * 에러 발생 시 Sentry에 자동으로 보고하고,
 * Next.js 기본 에러 페이지를 렌더링합니다.
 * 
 * @param error - 발생한 에러 객체 (digest 속성 포함 가능)
 */
export default function GlobalError({ error }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        {/* `NextError` is the default Next.js error page component. Its type
        definition requires a `statusCode` prop. However, since the App Router
        does not expose status codes for errors, we simply pass 0 to render a
        generic error message. */}
        <NextError statusCode={0} />
      </body>
    </html>
  )
}