/**
 * Scraper for the Nelson Mandela Bay Municipality procurement portal.
 * URL: https://www.nmbm.co.za/category/tenders/
 */
import * as cheerio from "cheerio";
import type { ScrapedTender } from "./types";
import { detectCidbClass, detectCidbGrade, detectTenderType, detectContractValue, parseSaDate, clean, stableRef } from "./parse-helpers";

const BASE = "https://www.nmbm.co.za";
const TENDERS_URL = `${BASE}/category/tenders/`;

const FETCH_HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; Tenderpilot/1.0; +https://tenderpilot.co.za/bot)",
  Accept: "text/html,application/xhtml+xml",
};

export async function scrapeNmbm(): Promise<ScrapedTender[]> {
  const tenders: ScrapedTender[] = [];

  let html: string;
  try {
    const res = await fetch(TENDERS_URL, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    html = await res.text();
  } catch (err) {
    console.error("[nmbm] fetch error:", err);
    return [];
  }

  const $ = cheerio.load(html);

  // NMBM uses a WordPress/CMS listing — articles or list items per tender
  $("article, .tender-item, .entry, li.tender, tr").each((_i, el) => {
    const text = clean($(el).text());
    const titleEl = $(el).find("h2, h3, h4, .title, a").first();
    const title = clean(titleEl.text()) || text.split("\n")[0];
    if (!title || title.length < 5) return;

    // Extract reference number (e.g. NMBM/2024/001, T2024/01)
    const refMatch = text.match(/(?:NMBM|NMB|T)\s*[/\-]?\s*20\d{2}\s*[/\-]\s*\d+/i);
    const refNumber = refMatch ? refMatch[0].replace(/\s+/g, "") : stableRef("NMBM", title, "NMBM");

    // Extract closing date
    const closingMatch = text.match(/(?:closing|closes?|deadline)[:\s]+([^\n,]+)/i);
    const closingDate = parseSaDate(closingMatch ? closingMatch[1] : "");

    const combined = `${title} ${text}`;
    const { min: gradeMin, max: gradeMax } = detectCidbGrade(combined);
    const { min: valueMin, max: valueMax } = detectContractValue(combined);

    tenders.push({
      reference_number: refNumber,
      title,
      description: text.slice(0, 500),
      department: "Nelson Mandela Bay Municipality",
      portal: "NMBM",
      province: "Eastern Cape",
      tender_type: detectTenderType(combined),
      cidb_grade_min: gradeMin,
      cidb_grade_max: gradeMax,
      cidb_class: detectCidbClass(combined),
      contract_value_min: valueMin,
      contract_value_max: valueMax,
      briefing_mandatory: /compulsory|mandatory/i.test(combined) ? 1 : 0,
      closing_date: closingDate,
    });
  });

  return tenders;
}
