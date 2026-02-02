import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="rounded-2xl border border-white/10 backdrop-blur p-8 shadow-sm space-y-6">
          {/* 404 텍스트 */}
          <div className="space-y-2">
            <h1 className="text-6xl font-bold text-primary">404</h1>
            <h2 className="text-2xl font-medium">페이지를 찾을 수 없습니다</h2>
            <p className="text-sm text-muted-foreground">
              요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
            </p>
          </div>

          {/* 홈으로 돌아가기 버튼 */}
          <div className="pt-4">
            <Button asChild className="w-full">
              <Link href="/">홈으로 돌아가기</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

