import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { caughtItems, categoryEnum } from "@/db/schema";

export const runtime = "nodejs";

type Category = typeof categoryEnum.enumValues[number];
function isCategory(v: unknown): v is Category {
  return typeof v === "string" && (categoryEnum.enumValues as readonly string[]).includes(v);
}

// POST /api/caught/toggle
// body: { userId: number|string, category: "fish"|"bug"|"sea"|"fossil", itemName: string }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId = Number(body.userId);
    const categoryStr = body.category;
    const itemName = body.itemName as string | undefined;

    if (!Number.isFinite(userId) || !isCategory(categoryStr) || !itemName) {
      return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
    }
    const category: Category = categoryStr;

    const exists = await db
      .select({ itemName: caughtItems.itemName })
      .from(caughtItems)
      .where(and(
        eq(caughtItems.userId, userId),
        eq(caughtItems.category, category),
        eq(caughtItems.itemName, itemName)
      ));

    if (exists.length > 0) {
      await db.delete(caughtItems).where(and(
        eq(caughtItems.userId, userId),
        eq(caughtItems.category, category),
        eq(caughtItems.itemName, itemName)
      ));
      return NextResponse.json({ ok: true, caught: false });
    } else {
      await db.insert(caughtItems).values({ userId, category, itemName });
      return NextResponse.json({ ok: true, caught: true });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
