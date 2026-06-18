import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  if (userId === "admin") return NextResponse.json({ matches: [] });

  const db = getDb();
  const matches = db.prepare(`
    SELECT tm.id, tm.match_score, tm.match_reasons, tm.bid_draft_generated, tm.created_at,
           t.id as tender_id, t.title, t.department, t.closing_date, t.tender_type,
           t.contract_value_max, t.province, t.reference_number,
           bd.id as draft_id
    FROM tender_matches tm
    JOIN tenders t ON tm.tender_id = t.id
    LEFT JOIN bid_drafts bd ON bd.match_id = tm.id
    WHERE tm.subscriber_id = ? AND t.is_active = 1
    ORDER BY tm.created_at DESC
    LIMIT 10
  `).all(userId);

  return NextResponse.json({ matches });
}
