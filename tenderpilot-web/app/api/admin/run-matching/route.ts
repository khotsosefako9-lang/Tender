import { NextResponse } from "next/server";
import { runAllMatching } from "@/lib/scraper";

export const maxDuration = 60;

// Auth temporarily removed for testing — re-add before go-live
export async function POST() {
  try {
    const summary = await runAllMatching(true);
    return NextResponse.json({ success: true, ...summary });
  } catch (err) {
    console.error("[run-matching] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
