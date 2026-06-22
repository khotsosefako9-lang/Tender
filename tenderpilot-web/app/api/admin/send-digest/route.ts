import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { sendDigestEmail, type DigestMatch } from "@/lib/email";

export const maxDuration = 60;

type MatchRow = {
  id: number;
  subscriber_id: number;
  tender_id: number;
  match_score: number;
  digest_sent: number;
};

type TenderRow = {
  id: number;
  title: string;
  department: string;
  closing_date: string;
  tender_type: string;
  province: string | null;
  reference_number: string;
};

type SubscriberRow = {
  id: number;
  email: string;
  first_name: string;
  status: string;
  tier: string;
};

async function runDigest() {
  const sb = getSupabaseClient();

  // 1. Fetch all active (and pending) subscribers with email
  const { data: subscribers, error: subErr } = await sb
    .from("subscribers")
    .select("id, email, first_name, status, tier")
    .in("status", ["active", "pending"]);
  if (subErr) throw new Error(`Fetch subscribers: ${subErr.message}`);

  // 2. Fetch all unsent matches in one query
  const { data: unsentMatches, error: matchErr } = await sb
    .from("tender_matches")
    .select("id, subscriber_id, tender_id, match_score, digest_sent")
    .eq("digest_sent", 0);
  if (matchErr) throw new Error(`Fetch matches: ${matchErr.message}`);

  if (!unsentMatches || unsentMatches.length === 0) {
    return { subscribers_emailed: 0, matches_sent: 0, skipped: 0, message: "No unsent matches found." };
  }

  // 3. Fetch the relevant tenders in one query
  const tenderIds = [...new Set((unsentMatches as MatchRow[]).map((m) => m.tender_id))];
  const { data: tenders, error: tErr } = await sb
    .from("tenders")
    .select("id, title, department, closing_date, tender_type, province, reference_number")
    .in("id", tenderIds);
  if (tErr) throw new Error(`Fetch tenders: ${tErr.message}`);

  const tenderMap = new Map<number, TenderRow>(
    (tenders as TenderRow[]).map((t) => [t.id, t])
  );

  // 4. Group unsent matches by subscriber
  const bySubscriber = new Map<number, MatchRow[]>();
  for (const m of unsentMatches as MatchRow[]) {
    const list = bySubscriber.get(m.subscriber_id) ?? [];
    list.push(m);
    bySubscriber.set(m.subscriber_id, list);
  }

  const subscriberMap = new Map<number, SubscriberRow>(
    (subscribers as SubscriberRow[]).map((s) => [s.id, s])
  );

  const results = {
    subscribers_emailed: 0,
    matches_sent: 0,
    skipped: 0,
    errors: [] as string[],
    detail: [] as { email: string; matches: number; result: string }[],
  };

  const now = new Date().toISOString();

  // 5. Send one digest per subscriber
  for (const [subscriberId, matchRows] of bySubscriber) {
    const subscriber = subscriberMap.get(subscriberId);
    if (!subscriber) { results.skipped++; continue; }
    if (!subscriber.email || !subscriber.first_name) { results.skipped++; continue; }

    // Build tender detail list, filter out any missing tenders
    const digestMatches: DigestMatch[] = matchRows
      .flatMap((m) => {
        const t = tenderMap.get(m.tender_id);
        if (!t) return [];
        return [{
          title: t.title,
          department: t.department,
          closing_date: t.closing_date,
          match_score: m.match_score,
          tender_type: t.tender_type,
          province: t.province,
          reference_number: t.reference_number,
        }];
      })
      // Sort by closing date ascending so most urgent tenders appear first
      .sort((a, b) => (a.closing_date ?? "").localeCompare(b.closing_date ?? ""));

    if (digestMatches.length === 0) { results.skipped++; continue; }

    try {
      const outcome = await sendDigestEmail(
        { email: subscriber.email, first_name: subscriber.first_name },
        digestMatches
      );

      const sentIds = matchRows.map((m) => m.id);

      // 6. Mark matches as sent regardless of whether email was skipped (no SendGrid key)
      //    so re-running doesn't re-queue the same matches
      await sb
        .from("tender_matches")
        .update({ digest_sent: 1, digest_sent_at: now })
        .in("id", sentIds);

      results.subscribers_emailed++;
      results.matches_sent += digestMatches.length;
      results.detail.push({
        email: subscriber.email,
        matches: digestMatches.length,
        result: outcome.skipped ? "logged (no SendGrid key)" : "sent",
      });
    } catch (err) {
      const msg = `${subscriber.email}: ${String(err)}`;
      results.errors.push(msg);
      results.detail.push({ email: subscriber.email, matches: digestMatches.length, result: `error: ${String(err)}` });
    }
  }

  return results;
}

export async function GET() {
  try {
    const result = await runDigest();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("[send-digest]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST() {
  try {
    const result = await runDigest();
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error("[send-digest]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
