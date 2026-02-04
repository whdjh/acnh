import { Suspense } from "react"
import ListPageContent from "@/components/list/ListPageContent"
import ItemsGridSkeleton from "@/components/list/ItemsGridSkeleton"
import ListHeaderSkeleton from "@/components/list/ListHeaderSkeleton"

// 동적 렌더링 (프리렌더 에러 회피)
export const dynamic = "force-dynamic"

function ListPageFallback() {
  return (
    <>
      <ListHeaderSkeleton />
      <ItemsGridSkeleton count={9} />
    </>
  )
}

export default function ListPage() {
  return (
    <div className="p-4">
      <Suspense fallback={<ListPageFallback />}>
        <ListPageContent />
      </Suspense>
    </div>
  )
}
