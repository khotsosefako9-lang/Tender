import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const matchId = searchParams.get("match_id");
  if (!matchId) return NextResponse.json({ error: "match_id required" }, { status: 400 });

  const db = getDb();
  const userId = (session.user as { id: string }).id;

  // Verify the match belongs to this subscriber
  const match = db.prepare("SELECT id FROM tender_matches WHERE id = ? AND subscriber_id = ?").get(matchId, userId);
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

  const draft = db.prepare("SELECT * FROM bid_drafts WHERE match_id = ?").get(matchId);
  if (!draft) return NextResponse.json({ error: "No draft available for this match" }, { status: 404 });

  return NextResponse.json({ draft });
}
