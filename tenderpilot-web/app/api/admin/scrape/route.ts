import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { runFullScrape } from "@/lib/scraper";

export const maxDuration = 60; // Vercel Pro: up to 60s; Hobby: 10s

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { isAdmin?: boolean } | undefined;
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get("reset") === "true") {
      // Clear stale/dirty data before a fresh scrape
      await db.tender_matches.truncate();
      await db.tenders.truncate();
    }

    const summary = await runFullScrape();
    return NextResponse.json({ success: true, ...summary });
  } catch (err) {
    console.error("[scrape] unexpected error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
