import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const db = getDb();
  const deadlines = db.prepare(`
    SELECT t.id, t.title, t.department, t.closing_date, t.tender_type, tm.match_score
    FROM tender_matches tm
    JOIN tenders t ON tm.tender_id = t.id
    WHERE tm.subscriber_id = ? AND t.is_active = 1 AND t.closing_date >= date('now')
    ORDER BY t.closing_date ASC
    LIMIT 20
  `).all(userId);

  return NextResponse.json({ deadlines });
}
