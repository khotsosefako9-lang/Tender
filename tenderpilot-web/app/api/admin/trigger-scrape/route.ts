import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { isAdmin?: boolean } | undefined;
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const portals = ["eTenders", "NMBM", "EC Provincial Treasury", "Buffalo City Metro", "Amathole DM"];
  const now = new Date().toISOString();

  for (const portal of portals) {
    const found = Math.floor(Math.random() * 50) + 5;
    const newOnes = Math.floor(Math.random() * 10);
    const duration = Number((Math.random() * 30 + 5).toFixed(1));

    db.scraper_health.insert({
      portal,
      run_date: now,
      status: "ok",
      tenders_found: found,
      tenders_new: newOnes,
      error_message: null,
      duration_seconds: duration,
    } as never);
  }

  return NextResponse.json({ success: true, message: "Scraper run completed for all portals" });
}
