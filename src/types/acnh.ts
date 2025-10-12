export interface HemisphereMonths { months_array: number[] } // 1~12
export type Category = "fish" | "bug" | "sea" | "fossil";

export type TimesByMonthValue =
  | string
  | number[]
  | boolean[]
  | { start: string; end: string }[]
  | null
  | undefined;

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
}
