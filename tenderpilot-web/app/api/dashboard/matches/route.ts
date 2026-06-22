import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const userId = Number((session.user as { id: string }).id);
  if (!userId) return NextResponse.json({ matches: [] });

  const rawMatches = (await db.tender_matches.findAll((m) => m.subscriber_id === userId))
    .sort((a, b) => new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime())
    .slice(0, 10);

  const matches = await Promise.all(
    rawMatches.map(async (m) => {
      const tender = await db.tenders.findOne((t) => t.id === m.tender_id);
      const draft = await db.bid_drafts.findOne((d) => d.match_id === m.id);
      return {
        ...m,
        tender_id: tender?.id ?? 0,
        title: tender?.title ?? "Unknown Tender",
        department: tender?.department ?? "",
        closing_date: tender?.closing_date ?? "",
        tender_type: tender?.tender_type ?? "Tender",
        contract_value_max: tender?.contract_value_max ?? 0,
        province: tender?.province ?? "",
        reference_number: tender?.reference_number ?? "",
        draft_id: draft ? draft.id : null,
      };
    })
  );

  return NextResponse.json({ matches });
}
