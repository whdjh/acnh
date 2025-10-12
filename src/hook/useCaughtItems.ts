"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { Category } from "@/types/acnh";

/** 내부 전용: 응답이 JSON인지 보장 */
async function assertJson<T = any>(res: Response): Promise<T> {
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const text = await res.text().catch(() => "");
    throw new Error(`Expected JSON, got ${ct}. ${text.slice(0, 160)}`);
  }
  return res.json();
}

type UseCaughtItemsOpts = {
  enabled: boolean;
  userId?: number;
  category: Category;
};

export function useCaughtItems({ enabled, userId, category }: UseCaughtItemsOpts) {
  const [caughtSet, setCaughtSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 최신 요청만 반영하기 위한 토큰
  const reqKeyRef = useRef(0);

  /** GET /api/caught */
  const doFetch = useCallback(async () => {
    if (!enabled || !userId) return;
    setLoading(true);
    setError(null);

    const myKey = ++reqKeyRef.current;
    const ac = new AbortController();

    try {
      const params = new URLSearchParams({
        userId: String(userId),
        category,
        _t: String(Date.now()),
      });

      const res = await fetch(`/api/caught?${params.toString()}`, {
        cache: "no-store",
        signal: ac.signal,
      });

      const data = await assertJson<{ items?: string[] }>(res);
      // 최신 요청만 반영
      if (reqKeyRef.current === myKey) {
        setCaughtSet(new Set(data.items ?? []));
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        console.error("GET /api/caught failed:", e);
        if (reqKeyRef.current === myKey) {
          setCaughtSet(new Set());
          setError(e?.message ?? "불러오기 실패");
        }
      }
    } finally {
      if (reqKeyRef.current === myKey) setLoading(false);
    }

    // cleanup에서 abort(의미상; 여기서는 별도 effect가 아니라 직접 호출이므로 생략 가능)
    return () => ac.abort();
  }, [enabled, userId, category]);

  // 마운트/의존성 변경 시 자동 로드
  useEffect(() => {
    if (!enabled || !userId) {
      setCaughtSet(new Set());
      setError(null);
      setLoading(false);
      return;
    }
    doFetch();
  }, [enabled, userId, category, doFetch]);

  /** POST /api/caught/toggle (낙관적 업데이트 포함) */
  const toggleCatch = useCallback(
    async (itemName: string) => {
      if (!userId) return;

      // 낙관적 업데이트: 현재 스냅샷 저장
      setCaughtSet((prev) => {
        const next = new Set(prev);
        if (next.has(itemName)) next.delete(itemName);
        else next.add(itemName);
        return next;
      });

      try {
        const res = await fetch("/api/caught/toggle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            userId,
            category,
            itemName,
            _t: Date.now(),
          }),
        });

        const data = await assertJson<{ caught: boolean }>(res);

        // 서버 결과로 정합성 보정
        setCaughtSet((prev) => {
          const next = new Set(prev);
          if (data.caught) next.add(itemName);
          else next.delete(itemName);
          return next;
        });
      } catch (e) {
        console.error("POST /api/caught/toggle failed:", e);
        // 실패 시 낙관적 변경 롤백
        setCaughtSet((prev) => {
          const next = new Set(prev);
          if (next.has(itemName)) next.delete(itemName);
          else next.add(itemName);
          return next;
        });
        alert("상태 변경에 실패했습니다.");
      }
    },
    [userId, category]
  );

  /** 외부에서 강제 새로고침하고 싶을 때 */
  const refetch = useCallback(() => {
    doFetch();
  }, [doFetch]);

  return { caughtSet, toggleCatch, loading, error, refetch };
}
