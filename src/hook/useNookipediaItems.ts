"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { Category, Item } from "@/types/acnh";

/** 내부 전용: 응답이 JSON인지 보장 */
async function assertJson<T = any>(res: Response): Promise<T> {
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const text = await res.text().catch(() => "");
    throw new Error(`Expected JSON, got ${ct}. ${text.slice(0, 160)}`);
  }
  return res.json();
}

type UseNookipediaItemsOpts = {
  enabled: boolean;
  category: Category;
  hemisphere: "north" | "south";
  month: number;
};

export function useNookipediaItems({
  enabled,
  category,
  hemisphere,
  month,
}: UseNookipediaItemsOpts) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 최신 요청만 반영하기 위한 키
  const reqKeyRef = useRef(0);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);

    const myKey = ++reqKeyRef.current;
    const ac = new AbortController();

    try {
      const params = new URLSearchParams({
        month: String(month),
        hemi: hemisphere,
        only: "1",
        _t: String(Date.now()),
      });

      const res = await fetch(`/api/nookipedia/${category}?${params.toString()}`, {
        cache: "no-store",
        signal: ac.signal,
      });

      const data = await assertJson<{ ok: boolean; data?: any; error?: string }>(res);
      if (!data.ok) throw new Error(data.error || "fetch failed");

      const formatted: Item[] = (data.data ?? []).map((item: any) => ({
        ...item,
        originalName: item.originalName || item.name_en || item.name,
      }));

      if (reqKeyRef.current === myKey) {
        setItems(formatted);
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        console.error("GET /api/nookipedia failed:", e);
        if (reqKeyRef.current === myKey) {
          setItems([]);
          setError(e?.message ?? "데이터를 불러오지 못했습니다.");
        }
      }
    } finally {
      if (reqKeyRef.current === myKey) setLoading(false);
    }

    // 외부에서 cleanup 할 필요는 없지만 패턴상 반환
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
