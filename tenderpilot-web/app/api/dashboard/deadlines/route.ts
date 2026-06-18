import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const userId = Number((session.user as { id: string }).id);
  const today = new Date().toISOString().split("T")[0];

  const deadlines = db.tender_matches
    .findAll((m) => m.subscriber_id === userId)
    .map((m) => {
      const tender = db.tenders.findOne((t) => t.id === m.tender_id);
      return tender ? { ...tender, match_score: m.match_score } : null;
    })
    .filter((t): t is NonNullable<typeof t> => t !== null && t.is_active === 1 && (t.closing_date || "") >= today)
    .sort((a, b) => (a.closing_date || "").localeCompare(b.closing_date || ""))
    .slice(0, 20);

  return NextResponse.json({ deadlines });
}
