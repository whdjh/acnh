type ListPageBody = "loading" | "empty" | "items"

export function getListPageSections({
  loading,
  displayedCount,
}: {
  loading: boolean
  displayedCount: number
}): { header: "controls"; body: ListPageBody } {
  if (loading) {
    return { header: "controls", body: "loading" }
  }

  return { header: "controls", body: displayedCount === 0 ? "empty" : "items" }
}
