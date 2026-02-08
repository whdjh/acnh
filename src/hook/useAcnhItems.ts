"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type {
  Category,
  Item,
  Hemisphere,
  Habitat,
  SortKey,
  ApiItemsResponse,
} from "@/types/acnh"
import { assertJson } from "@/lib/utils"

type UseAcnhItemsOpts = {
  enabled: boolean
  category: Category
  hemisphere: Hemisphere
  month: number
  hour?: number
  habitat?: Habitat
  search?: string
  sort?: SortKey
  locale?: string
}

export function useAcnhItems({
  enabled,
  category,
  hemisphere,
  month,
  hour,
  habitat,
  search,
  sort,
  locale,
}: UseAcnhItemsOpts) {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reqKeyRef = useRef(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  const load = useCallback(async () => {
    if (!enabled) return

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const myKey = ++reqKeyRef.current
    const ac = new AbortController()
    abortControllerRef.current = ac

    setLoading(true)
    setError(null)

    try {
      const isAll = month === 0
      const params = new URLSearchParams({
        hemi: hemisphere,
        _t: String(Date.now()),
      })

      if (locale) {
        params.set("locale", locale)
      }

      if (!isAll) {
        params.set("month", String(month))
        params.set("only", "1")
        if (hour !== undefined && hour >= 0 && hour <= 23) {
          params.set("hour", String(hour))
        }
      }

      if (habitat && habitat !== "all") {
        params.set("habitat", habitat)
      }

      if (search && search.trim()) {
        params.set("search", search.trim())
      }

      if (sort) {
        params.set("sort", sort)
      }

      const res = await fetch(`/api/items/${category}?${params.toString()}`, {
        cache: "no-store",
        signal: ac.signal,
      })

      const data = await assertJson<ApiItemsResponse>(res)
      if (!data.ok) throw new Error(data.error || "fetch failed")

      const formatted: Item[] = (data.data ?? []).map((item): Item => ({
        ...item,
        originalName: item.originalName || item.name_en || item.name,
      }))

      if (reqKeyRef.current === myKey) setItems(formatted)
    } catch (e: unknown) {
      if (reqKeyRef.current !== myKey) return
      if (e instanceof Error && e.name === "AbortError") return
      setError("Failed to load data")
    } finally {
      if (reqKeyRef.current === myKey) {
        setLoading(false)
        if (abortControllerRef.current === ac) {
          abortControllerRef.current = null
        }
      }
    }
  }, [enabled, category, hemisphere, month, hour, habitat, search, sort, locale])

  useEffect(() => {
    void load()
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [load])

  const refetch = useCallback(() => {
    load()
  }, [load])

  return { items, loading, error, refetch }
}
