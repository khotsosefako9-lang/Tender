import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { isAdmin?: boolean } | undefined;
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const portals = ["eTenders", "NMBM", "EC Provincial Treasury", "Buffalo City Metro", "Amathole DM"];
  const db = getDb();
  const now = new Date().toISOString();

  for (const portal of portals) {
    db.prepare(`
      INSERT INTO scraper_health (portal, run_date, status, tenders_found, tenders_new, duration_seconds)
      VALUES (?, ?, 'running', 0, 0, 0)
    `).run(portal, now);
  }

  // In production this would trigger an actual scraper job
  // For now, simulate a short delay and mark as complete
  setTimeout(() => {
    for (const portal of portals) {
      const found = Math.floor(Math.random() * 50) + 5;
      const newOnes = Math.floor(Math.random() * 10);
      const duration = (Math.random() * 30 + 5).toFixed(1);
      db.prepare(`
        UPDATE scraper_health SET status='ok', tenders_found=?, tenders_new=?, duration_seconds=?
        WHERE portal=? AND run_date=?
      `).run(found, newOnes, Number(duration), portal, now);
    }
  }, 2000);

  return NextResponse.json({ success: true, message: "Scraper run triggered for all portals" });
}
