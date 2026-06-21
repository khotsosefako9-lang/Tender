import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runAllMatching } from "@/lib/scraper";

export const maxDuration = 60;

export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { isAdmin?: boolean } | undefined;
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    // includeAllStatuses=true so pending subscribers are tested during admin use
    const summary = await runAllMatching(true);
    return NextResponse.json({ success: true, ...summary });
  } catch (err) {
    console.error("[run-matching] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
