/**
 * Scraper for the Eastern Cape Provincial Treasury tender bulletin.
 * URL: https://www.ectreasury.gov.za/tenders
 */
import * as cheerio from "cheerio";
import type { ScrapedTender } from "./types";
import { detectCidbClass, detectCidbGrade, detectTenderType, detectContractValue, parseSaDate, clean } from "./parse-helpers";

const TENDERS_URL = "https://www.ectreasury.gov.za/tenders";

const FETCH_HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; Tenderpilot/1.0; +https://tenderpilot.co.za/bot)",
  Accept: "text/html,application/xhtml+xml",
};

export async function scrapeEcTreasury(): Promise<ScrapedTender[]> {
  const tenders: ScrapedTender[] = [];

  let html: string;
  try {
    const res = await fetch(TENDERS_URL, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    html = await res.text();
  } catch (err) {
    console.error("[ec-treasury] fetch error:", err);
    return [];
  }

  const $ = cheerio.load(html);

  // Look for tender tables or lists
  $("table tbody tr, .views-row, article.tender, .tender-listing li").each((_i, el) => {
    const cells = $(el).find("td");
    let title = "";
    let refNumber = "";
    let department = "";
    let closingRaw = "";

    if (cells.length >= 3) {
      // Table row
      refNumber = clean($(cells[0]).text());
      title = clean($(cells[1]).text()) || clean($(cells[2]).text());
      department = clean($(cells[cells.length - 3]).text());
      closingRaw = clean($(cells[cells.length - 1]).text());
    } else {
      // List or article
      title = clean($(el).find("h2,h3,h4,a,.title").first().text()) || clean($(el).text()).split("\n")[0];
      const text = clean($(el).text());
      const refMatch = text.match(/(?:EC|RFQ|T)[/\-]?\w*[/\-]?20\d{2}[/\-]\d+/i);
      refNumber = refMatch ? refMatch[0] : `ECT/${new Date().getFullYear()}/${Date.now()}`;
      const closingMatch = text.match(/(?:closing|closes?)[:\s]+([^\n,;]+)/i);
      closingRaw = closingMatch ? closingMatch[1] : "";
    }

    if (!title || title.length < 5) return;
    if (!refNumber) refNumber = `ECT/${new Date().getFullYear()}/${Date.now()}`;

    const combined = `${title} ${department}`;
    const { min: gradeMin, max: gradeMax } = detectCidbGrade(combined);
    const { min: valueMin, max: valueMax } = detectContractValue(combined);

    tenders.push({
      reference_number: refNumber,
      title,
      description: title,
      department: department || "EC Provincial Treasury",
      portal: "EC Provincial Treasury",
      province: "Eastern Cape",
      tender_type: detectTenderType(combined),
      cidb_grade_min: gradeMin,
      cidb_grade_max: gradeMax,
      cidb_class: detectCidbClass(combined),
      contract_value_min: valueMin,
      contract_value_max: valueMax,
      briefing_mandatory: /compulsory|mandatory/i.test(combined) ? 1 : 0,
      closing_date: parseSaDate(closingRaw),
    });
  });

  return tenders;
}
