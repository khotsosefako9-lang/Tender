import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { isAdmin?: boolean } | undefined;
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = getDb();
  const health = db.prepare(`
    SELECT sh.*, (
      SELECT MAX(run_date) FROM scraper_health sh2 WHERE sh2.portal = sh.portal
    ) as last_run
    FROM scraper_health sh
    WHERE sh.id IN (
      SELECT MAX(id) FROM scraper_health GROUP BY portal
    )
    ORDER BY sh.portal
  `).all();

  return NextResponse.json({ health });
}
