// ============================================
// 공통 타입
// ============================================

export interface HemisphereMonths { months_array: number[] } // 1~12
export type Category = "fish" | "bug" | "sea" | "fossil";
export type Hemisphere = "north" | "south";
export type SortKey = "priceDesc" | "priceAsc";
export type Habitat = "all" | "pond" | "river" | "clifftop" | "riverMouth" | "pier" | "sea";

export type TimesByMonthValue =
  | string
  | number[]
  | boolean[]
  | { start: string; end: string }[]
  | null
  | undefined;

// ============================================
// 아이템 타입
// ============================================

export interface Item {
  name: string;
  originalName: string;
  image_url: string;
  location?: string;
  sell_nook?: number;

  north: HemisphereMonths;
  south: HemisphereMonths;

  times_by_month?: Record<string, TimesByMonthValue>;
  north_times_by_month?: Record<string, TimesByMonthValue>;
  south_times_by_month?: Record<string, TimesByMonthValue>;
  shadow_size?: string;
}

// ============================================
// API 응답 타입
// ============================================

/** GET /api/items/[category] 응답의 개별 아이템 */
export interface ApiItemResponse {
  originalName?: string;
  name: string;
  name_en?: string;
  image_url: string;
  location?: string;
  sell_nook?: number;
  north: { months_array: number[] };
  south: { months_array: number[] };
  times_by_month?: Record<string, TimesByMonthValue>;
  north_times_by_month?: Record<string, TimesByMonthValue>;
  south_times_by_month?: Record<string, TimesByMonthValue>;
  shadow_size?: string;
}

/** GET /api/items/[category] 응답 */
export interface ApiItemsResponse {
  ok: boolean;
  data?: ApiItemResponse[];
  error?: string;
}

/** GET /api/caught 응답 */
export interface ApiCaughtResponse {
  ok?: boolean;
  items?: string[];
  error?: string;
}

/** POST /api/caught/toggle 응답 */
export interface ApiToggleResponse {
  ok?: boolean;
  caught: boolean;
  error?: string;
}
