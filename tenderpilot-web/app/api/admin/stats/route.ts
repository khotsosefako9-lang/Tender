import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

const PRICES: Record<string, number> = { scout: 399, bid: 999.99, pro: 1999.99 };

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { isAdmin?: boolean } | undefined;
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = getDb();
  const total = (db.prepare("SELECT COUNT(*) as n FROM subscribers WHERE status = 'active'").get() as { n: number }).n;
  const byTier = db.prepare("SELECT tier, COUNT(*) as n FROM subscribers WHERE status = 'active' GROUP BY tier").all() as { tier: string; n: number }[];
  const newThisWeek = (db.prepare("SELECT COUNT(*) as n FROM subscribers WHERE created_at >= datetime('now', '-7 days')").get() as { n: number }).n;

  const mrr = byTier.reduce((acc, row) => acc + (PRICES[row.tier] || 0) * row.n, 0);

  return NextResponse.json({ total, byTier, newThisWeek, mrr });
}
