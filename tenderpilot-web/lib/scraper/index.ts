import { db } from "@/lib/db";
import { calculateMatchScore } from "@/lib/matching";
import { scrapeEtendersSearch } from "./etenders";
import { scrapeNmbm } from "./nmbm";
import { scrapeEcTreasury } from "./ec-treasury";
import type { ScrapedTender, PortalResult } from "./types";
import type { Tender } from "@/lib/db";

export type ScrapeRunSummary = {
  portals: PortalResult[];
  total_found: number;
  total_new: number;
  matches_created: number;
  errors: string[];
};

/** Upsert a scraped tender by reference_number; return true if it was new. */
async function upsertTender(scraped: ScrapedTender): Promise<{ tender: Tender; isNew: boolean }> {
  const existing = await db.tenders.findOne(
    (t) => t.reference_number === scraped.reference_number
  );

  if (existing) {
    // Update closing date and active status in case they changed
    await db.tenders.update((t) => t.id === existing.id, {
      closing_date: scraped.closing_date || existing.closing_date,
      is_active: 1,
    });
    return { tender: { ...existing, closing_date: scraped.closing_date || existing.closing_date }, isNew: false };
  }

  const tender = await db.tenders.insert({
    ...scraped,
    is_active: 1,
    created_at: new Date().toISOString(),
  });
  return { tender, isNew: true };
}

/** Run matching for a newly inserted tender against all active subscribers. */
async function matchTender(tender: Tender): Promise<number> {
  const subscribers = await db.subscribers.findAll((s) => s.status === "active");
  let matchCount = 0;

  for (const subscriber of subscribers) {
    const alreadyMatched = await db.tender_matches.findOne(
      (m) => m.subscriber_id === subscriber.id && m.tender_id === tender.id
    );
    if (alreadyMatched) continue;

    const { score, reasons } = calculateMatchScore(subscriber, tender);
    if (score >= 40) {
      await db.tender_matches.insert({
        subscriber_id: subscriber.id,
        tender_id: tender.id,
        match_score: score,
        match_reasons: JSON.stringify(reasons),
        digest_sent: 0,
        digest_sent_at: "",
        bid_draft_generated: 0,
        created_at: new Date().toISOString(),
      });
      matchCount++;
    }
  }
  return matchCount;
}

/** Run a single portal scraper and record health. */
async function runPortal(
  portalName: string,
  scraper: () => Promise<ScrapedTender[]>
): Promise<{ result: PortalResult; newTenders: Tender[] }> {
  const start = Date.now();
  const newTenders: Tender[] = [];
  let tendersFound = 0;
  let tendersNew = 0;
  let errorMessage: string | null = null;
  let status: "ok" | "error" = "ok";

  try {
    const scraped = await scraper();
    tendersFound = scraped.length;

    for (const s of scraped) {
      if (!s.reference_number || !s.title) continue;
      const { tender, isNew } = await upsertTender(s);
      if (isNew) {
        newTenders.push(tender);
        tendersNew++;
      }
    }
  } catch (err) {
    status = "error";
    errorMessage = String(err);
    console.error(`[scraper:${portalName}]`, err);
  }

  const duration = Number(((Date.now() - start) / 1000).toFixed(1));

  await db.scraper_health.insert({
    portal: portalName,
    run_date: new Date().toISOString(),
    status,
    tenders_found: tendersFound,
    tenders_new: tendersNew,
    error_message: errorMessage,
    duration_seconds: duration,
  } as never);

  return {
    result: { portal: portalName, tenders_found: tendersFound, tenders_new: tendersNew, duration_seconds: duration, status, error_message: errorMessage },
    newTenders,
  };
}

/** Run all portal scrapers, upsert tenders, then run matching. */
export async function runFullScrape(): Promise<ScrapeRunSummary> {
  const portals: PortalResult[] = [];
  const allNewTenders: Tender[] = [];
  const errors: string[] = [];

  const scrapers: Array<[string, () => Promise<ScrapedTender[]>]> = [
    ["eTenders", () => scrapeEtendersSearch("Eastern Cape")],
    ["NMBM", scrapeNmbm],
    ["EC Provincial Treasury", scrapeEcTreasury],
  ];

  for (const [name, fn] of scrapers) {
    const { result, newTenders } = await runPortal(name, fn);
    portals.push(result);
    allNewTenders.push(...newTenders);
    if (result.error_message) errors.push(`${name}: ${result.error_message}`);
  }

  // Run matching for all newly inserted tenders
  let matchesCreated = 0;
  for (const tender of allNewTenders) {
    matchesCreated += await matchTender(tender);
  }

  return {
    portals,
    total_found: portals.reduce((n, p) => n + p.tenders_found, 0),
    total_new: portals.reduce((n, p) => n + p.tenders_new, 0),
    matches_created: matchesCreated,
    errors,
  };
}
