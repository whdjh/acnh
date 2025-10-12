"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Category, Item } from "@/types/acnh";

type UseAcnhItemsOpts = {
  enabled: boolean;
  category: Category;
  hemisphere: "north" | "south";
  /** 월: 1~12, 전체는 0 */
  month: number;
};

async function assertJson<T = any>(res: Response): Promise<T> {
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const text = await res.text().catch(() => "");
    throw new Error(`Expected JSON, got ${ct}. ${text.slice(0, 160)}`);
  }
  return res.json();
}

export function useAcnhItems({
  enabled,
  category,
  hemisphere,
  month,
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
      }

      const res = await fetch(`/api/items/${category}?${params.toString()}`, {
        cache: "no-store",
        signal: ac.signal,
      });

      const data = await assertJson<{ ok: boolean; data?: any; error?: string }>(res);
      if (!data.ok) throw new Error(data.error || "fetch failed");

      const formatted: Item[] = (data.data ?? []).map((item: any) => ({
        ...item,
        originalName: item.originalName || item.name_en || item.name,
      }));

      if (reqKeyRef.current === myKey) setItems(formatted);
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        console.error("GET /api/items failed:", e);
        if (reqKeyRef.current === myKey) {
          setItems([]);
          setError(e?.message ?? "데이터를 불러오지 못했습니다.");
        }
      }
    } finally {
      if (reqKeyRef.current === myKey) setLoading(false);
    }

    return () => ac.abort();
  }, [enabled, category, hemisphere, month]);

  useEffect(() => {
    load();
  }, [load]);

  const refetch = useCallback(() => {
    load();
  }, [load]);

  return { items, loading, error, refetch };
}
