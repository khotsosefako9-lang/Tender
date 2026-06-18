import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { isAdmin?: boolean } | undefined;
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Return the most recent row per portal
  const all = db.scraper_health.findAll();
  const byPortal = new Map<string, typeof all[0]>();
  for (const row of all) {
    const portal = String(row.portal);
    const existing = byPortal.get(portal);
    if (!existing || String(row.run_date) > String(existing.run_date)) {
      byPortal.set(portal, row);
    }
  }

  return NextResponse.json({ health: Array.from(byPortal.values()) });
}
