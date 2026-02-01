"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  Category,
  Item,
  Hemisphere,
  Habitat,
  SortKey,
  ApiItemsResponse,
} from "@/types/acnh";
import { assertJson } from "@/lib/utils";

type UseAcnhItemsOpts = {
  enabled: boolean;
  category: Category;
  hemisphere: Hemisphere;
  /** 월: 1~12, 전체는 0 */
  month: number;
  /** 시간: 0~23, 월이 0이면 무시됨 */
  hour?: number;
  /** 서식지 필터 (fish 전용) */
  habitat?: Habitat;
  /** 검색어 (한글/영어 이름 검색) */
  search?: string;
  /** 정렬 */
  sort?: SortKey;
};

export function useAcnhItems({
  enabled,
  category,
  hemisphere,
  month,
  hour,
  habitat,
  search,
  sort,
}: UseAcnhItemsOpts) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reqKeyRef = useRef(0);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);

    const myKey = ++reqKeyRef.current;
    const ac = new AbortController();

    try {
      const isAll = month === 0;
      const params = new URLSearchParams({
        hemi: hemisphere,
        _t: String(Date.now()),
      });

      // 월 모드(1~12)면 서버측 필터 사용, 전체(0)면 월 파라미터 생략
      if (!isAll) {
        params.set("month", String(month));
        params.set("only", "1");
        // 시간 필터도 서버 위임 (월 모드일 때만 의미 있음)
        if (hour !== undefined && hour >= 0 && hour <= 23) {
          params.set("hour", String(hour));
        }
      }

      // 서식지 필터 (fish 전용, 월과 무관하게 적용)
      if (habitat && habitat !== "all") {
        params.set("habitat", habitat);
      }

      // 검색 필터
      if (search && search.trim()) {
        params.set("search", search.trim());
      }

      // 정렬
      if (sort) {
        params.set("sort", sort);
      }

      const res = await fetch(`/api/items/${category}?${params.toString()}`, {
        cache: "no-store",
        signal: ac.signal,
      });

      const data = await assertJson<ApiItemsResponse>(res);
      if (!data.ok) throw new Error(data.error || "fetch failed");

      const formatted: Item[] = (data.data ?? []).map((item): Item => ({
        ...item,
        originalName: item.originalName || item.name_en || item.name,
      }));

      if (reqKeyRef.current === myKey) setItems(formatted);
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== "AbortError") {
        console.error("GET /api/items failed:", e);
        if (reqKeyRef.current === myKey) {
          setItems([]);
          setError(e.message ?? "데이터를 불러오지 못했습니다.");
        }
      }
    } finally {
      if (reqKeyRef.current === myKey) setLoading(false);
    }

    return () => ac.abort();
  }, [enabled, category, hemisphere, month, hour, habitat, search, sort]);

  useEffect(() => {
    load();
  }, [load]);

  const refetch = useCallback(() => {
    load();
  }, [load]);

  return { items, loading, error, refetch };
}
