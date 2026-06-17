import { getListPageSections } from "../listPageViewState"

describe("getListPageSections", () => {
  it("keeps header controls mounted while the list content refreshes", () => {
    expect(getListPageSections({ loading: true, displayedCount: 12 })).toEqual({
      header: "controls",
      body: "loading",
    })
  })

  it("shows the empty state after loading finishes without results", () => {
    expect(getListPageSections({ loading: false, displayedCount: 0 })).toEqual({
      header: "controls",
      body: "empty",
    })
  })

  it("shows items after loading finishes with results", () => {
    expect(getListPageSections({ loading: false, displayedCount: 3 })).toEqual({
      header: "controls",
      body: "items",
    })
  })
})
