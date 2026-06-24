import { NextRequest, NextResponse } from "next/server";
import { runFullScrape } from "@/lib/scraper";
import { runAllMatching } from "@/lib/scraper";
import { getSupabaseClient } from "@/lib/supabase";
import { sendDigestEmail, type DigestMatch } from "@/lib/email";

// Vercel Hobby: 60s max on cron routes (cron invocations are exempt from the
// 10s limit that applies to regular serverless functions on Hobby).
// Pro plan also supports 60s. Set to 60 to give the pipeline as much room as possible.
export const maxDuration = 60;

function isAuthorised(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // no secret configured — allow (dev only)
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

async function runDailyPipeline() {
  const summary = {
    scrape: null as Awaited<ReturnType<typeof runFullScrape>> | null,
    matching: null as Awaited<ReturnType<typeof runAllMatching>> | null,
    digest: { subscribers_emailed: 0, matches_sent: 0, skipped: 0, errors: [] as string[] },
    errors: [] as string[],
  };

  // ── Stage 1: Scrape ───────────────────────────────────────────────────────
  try {
    summary.scrape = await runFullScrape();
  } catch (err) {
    summary.errors.push(`Scrape: ${String(err)}`);
  }

  // ── Stage 2: Matching ────────────────────────────────────────────────────
  // runAllMatching(true) includes pending subscribers so test accounts work.
  // It only inserts matches that don't already exist, so running after
  // runFullScrape (which also runs matching) is safe — it's a no-op for
  // already-matched pairs and catches any that were missed.
  try {
    summary.matching = await runAllMatching(true);
  } catch (err) {
    summary.errors.push(`Matching: ${String(err)}`);
  }

  // ── Stage 3: Email digest ────────────────────────────────────────────────
  try {
    const sb = getSupabaseClient();

    const { data: unsentMatches } = await sb
      .from("tender_matches")
      .select("id, subscriber_id, tender_id, match_score, digest_sent")
      .eq("digest_sent", 0);

    if (unsentMatches && unsentMatches.length > 0) {
      const tenderIds = [...new Set(unsentMatches.map((m: { tender_id: number }) => m.tender_id))];
      const { data: tenders } = await sb.from("tenders").select("id, title, department, closing_date, tender_type, province, reference_number").in("id", tenderIds);
      const { data: subscribers } = await sb.from("subscribers").select("id, email, first_name, status, tier").in("status", ["active", "pending"]);

      type TRow = { id: number; title: string; department: string; closing_date: string; tender_type: string; province: string | null; reference_number: string };
      type SRow = { id: number; email: string; first_name: string };
      type MRow = { id: number; subscriber_id: number; tender_id: number; match_score: number };

      const tenderMap = new Map<number, TRow>((tenders ?? []).map((t: TRow) => [t.id, t]));
      const subMap = new Map<number, SRow>((subscribers ?? []).map((s: SRow) => [s.id, s]));

      const bySubscriber = new Map<number, MRow[]>();
      for (const m of (unsentMatches as MRow[])) {
        const arr = bySubscriber.get(m.subscriber_id) ?? [];
        arr.push(m);
        bySubscriber.set(m.subscriber_id, arr);
      }

      const now = new Date().toISOString();

      for (const [subId, matchRows] of bySubscriber) {
        const sub = subMap.get(subId);
        if (!sub) { summary.digest.skipped++; continue; }

        const digestMatches: DigestMatch[] = matchRows.flatMap((m) => {
          const t = tenderMap.get(m.tender_id);
          if (!t) return [];
          return [{ title: t.title, department: t.department, closing_date: t.closing_date, match_score: m.match_score, tender_type: t.tender_type, province: t.province, reference_number: t.reference_number }];
        }).sort((a, b) => (a.closing_date ?? "").localeCompare(b.closing_date ?? ""));

        if (digestMatches.length === 0) { summary.digest.skipped++; continue; }

        try {
          await sendDigestEmail({ email: sub.email, first_name: sub.first_name }, digestMatches);
          await sb.from("tender_matches").update({ digest_sent: 1, digest_sent_at: now }).in("id", matchRows.map((m) => m.id));
          summary.digest.subscribers_emailed++;
          summary.digest.matches_sent += digestMatches.length;
        } catch (err) {
          summary.digest.errors.push(`${sub.email}: ${String(err)}`);
        }
      }
    }
  } catch (err) {
    summary.errors.push(`Digest: ${String(err)}`);
  }

  return summary;
}

export async function GET(req: NextRequest) {
  if (!isAuthorised(req)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  try {
    const summary = await runDailyPipeline();
    return NextResponse.json({ success: true, ...summary });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorised(req)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  try {
    const summary = await runDailyPipeline();
    return NextResponse.json({ success: true, ...summary });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
