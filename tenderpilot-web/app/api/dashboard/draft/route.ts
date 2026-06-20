import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const matchId = Number(searchParams.get("match_id"));
  if (!matchId) return NextResponse.json({ error: "match_id required" }, { status: 400 });

  const userId = Number((session.user as { id: string }).id);
  const match = await db.tender_matches.findOne((m) => m.id === matchId && m.subscriber_id === userId);
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

  const draft = await db.bid_drafts.findOne((d) => d.match_id === matchId);
  if (!draft) return NextResponse.json({ error: "No draft available" }, { status: 404 });

  return NextResponse.json({ draft });
}
