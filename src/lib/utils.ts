import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 응답이 JSON 형식인지 검증하고 파싱
 * @param res - 검증할 Response 객체
 * @returns 파싱된 JSON 데이터
 * @throws JSON 형식이 아닌 경우 Error를 throw
 */
export async function assertJson<T = unknown>(res: Response): Promise<T> {
  const ct = res.headers.get("content-type") || ""
  if (!ct.includes("application/json")) {
    const text = await res.text().catch(() => "")
    throw new Error(`Expected JSON, got ${ct}. ${text.slice(0, 160)}`)
  }
  return res.json()
}
