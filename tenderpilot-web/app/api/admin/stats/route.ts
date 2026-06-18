import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const PRICES: Record<string, number> = { scout: 399, bid: 999.99, pro: 1999.99 };

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { isAdmin?: boolean } | undefined;
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const active = db.subscribers.findAll((s) => s.status === "active");
  const total = active.length;

  const tierCounts: Record<string, number> = {};
  for (const s of active) tierCounts[s.tier] = (tierCounts[s.tier] || 0) + 1;
  const byTier = Object.entries(tierCounts).map(([tier, n]) => ({ tier, n }));

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const newThisWeek = db.subscribers.findAll((s) => s.created_at >= weekAgo).length;

  const mrr = active.reduce((acc, s) => acc + (PRICES[s.tier] || 0), 0);

  return NextResponse.json({ total, byTier, newThisWeek, mrr });
}
