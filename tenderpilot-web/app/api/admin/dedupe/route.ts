import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export const maxDuration = 60;

type Row = { id: number; reference_number: string };

async function runDedupe() {
  const sb = getSupabaseClient();

  // 1. Fetch all tenders ordered oldest-first so we always keep the earliest copy
  const { data: tenders, error: fetchErr } = await sb
    .from("tenders")
    .select("id, reference_number")
    .order("id", { ascending: true });
  if (fetchErr) throw new Error(`Fetch tenders: ${fetchErr.message}`);

  // 2. Find duplicate groups — keep the lowest id, collect the rest for deletion
  const seen = new Map<string, number>(); // ref -> canonical id
  const duplicateIds: number[] = [];

  for (const row of (tenders ?? []) as Row[]) {
    const ref = row.reference_number;
    if (seen.has(ref)) {
      duplicateIds.push(row.id);
    } else {
      seen.set(ref, row.id);
    }
  }

  if (duplicateIds.length === 0) {
    return { tenders_removed: 0, matches_removed: 0, message: "No duplicates found." };
  }

  // 3. Delete orphaned tender_matches that point at the duplicate tender rows
  //    (cascade should handle this but Supabase may not enforce FK cascades without RLS)
  const { count: matchCount, error: matchErr } = await sb
    .from("tender_matches")
    .delete({ count: "exact" })
    .in("tender_id", duplicateIds);
  if (matchErr) throw new Error(`Delete matches: ${matchErr.message}`);

  // 4. Delete the duplicate tender rows
  const { count: tenderCount, error: deleteErr } = await sb
    .from("tenders")
    .delete({ count: "exact" })
    .in("id", duplicateIds);
  if (deleteErr) throw new Error(`Delete tenders: ${deleteErr.message}`);

  // 5. Also clean up orphaned tender_matches whose tender no longer exists
  //    (belt-and-suspenders for any stale rows the cascade missed)
  const { data: allMatches } = await sb.from("tender_matches").select("id, tender_id");
  const { data: remainingTenders } = await sb.from("tenders").select("id");
  const validTenderIds = new Set((remainingTenders ?? []).map((t: { id: number }) => t.id));
  const orphanMatchIds = (allMatches ?? [])
    .filter((m: { id: number; tender_id: number }) => !validTenderIds.has(m.tender_id))
    .map((m: { id: number }) => m.id);

  let orphanCount = 0;
  if (orphanMatchIds.length > 0) {
    const { count } = await sb
      .from("tender_matches")
      .delete({ count: "exact" })
      .in("id", orphanMatchIds);
    orphanCount = count ?? 0;
  }

  return {
    tenders_removed: tenderCount ?? duplicateIds.length,
    matches_removed: (matchCount ?? 0) + orphanCount,
    duplicate_refs: duplicateIds.length,
    message: `Removed ${tenderCount ?? duplicateIds.length} duplicate tender rows and ${(matchCount ?? 0) + orphanCount} orphaned matches.`,
  };
}

export async function GET() {
  try {
    const result = await runDedupe();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST() {
  try {
    const result = await runDedupe();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
