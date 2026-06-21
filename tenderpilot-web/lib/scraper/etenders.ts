/**
 * Scraper for the National Treasury eTenders portal (etenders.treasury.gov.za).
 *
 * Province filter: Eastern Cape = tid 196
 * The portal runs Drupal with a standard Views table layout.
 * Pagination: ?page=0, ?page=1, …
 */
import * as cheerio from "cheerio";
import type { ScrapedTender } from "./types";
import {
  detectCidbClass,
  detectCidbGrade,
  detectTenderType,
  detectContractValue,
  parseSaDate,
  clean,
} from "./parse-helpers";

const BASE = "https://etenders.treasury.gov.za";
// Eastern Cape province taxonomy ID on the Drupal site
const EC_PROVINCE_TID = "196";
const MAX_PAGES = 5; // Limit to 5 pages per run (~125 tenders)

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (compatible; Tenderpilot/1.0; +https://tenderpilot.co.za/bot)",
  Accept: "text/html,application/xhtml+xml",
  "Accept-Language": "en-ZA,en;q=0.9",
  "Cache-Control": "no-cache",
};

export async function scrapeEtenders(): Promise<ScrapedTender[]> {
  const tenders: ScrapedTender[] = [];

  for (let page = 0; page < MAX_PAGES; page++) {
    const url = `${BASE}/content/advertised-tenders?field_province_tid=${EC_PROVINCE_TID}&page=${page}`;
    let html: string;
    try {
      const res = await fetch(url, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(30_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      html = await res.text();
    } catch (err) {
      console.error(`[etenders] fetch error page ${page}:`, err);
      break;
    }

    const $ = cheerio.load(html);
    const rows = $("table.views-table tbody tr, table tbody tr");

    if (rows.length === 0) break; // No more results

    rows.each((_i, el) => {
      const cells = $(el).find("td");
      if (cells.length < 4) return;

      // Column order varies — identify by header or position
      // Typical order: Department | Province | Description | Tender No | Briefing Date | Compulsory | Closing Date | Type
      const getText = (idx: number) => clean($(cells[idx]).text());
      const getLink = (idx: number) => {
        const a = $(cells[idx]).find("a");
        return a.length ? (a.attr("href") ?? "") : "";
      };

      // Try to read header row to determine column order
      const department = getText(0);
      const province = getText(1);
      const titleCell = cells.length >= 8 ? getText(2) : getText(2);
      const refNumber = cells.length >= 8 ? getText(3) : getText(1);
      const briefingRaw = cells.length >= 8 ? getText(4) : "";
      const compulsoryRaw = cells.length >= 8 ? getText(5) : "";
      const closingRaw = cells.length >= 8 ? getText(6) : getText(cells.length - 1);
      const tenderTypeRaw = cells.length >= 8 ? getText(7) : "";

      if (!refNumber || !titleCell) return;

      const combined = `${titleCell} ${department}`;
      const { min: gradeMin, max: gradeMax } = detectCidbGrade(combined);
      const { min: valueMin, max: valueMax } = detectContractValue(combined);

      tenders.push({
        reference_number: refNumber,
        title: titleCell,
        description: titleCell,
        department,
        portal: "eTenders",
        province: province || "Eastern Cape",
        tender_type: tenderTypeRaw ? clean(tenderTypeRaw) : detectTenderType(combined),
        cidb_grade_min: gradeMin,
        cidb_grade_max: gradeMax,
        cidb_class: detectCidbClass(combined),
        contract_value_min: valueMin,
        contract_value_max: valueMax,
        briefing_mandatory: /yes|compulsory|mandatory/i.test(compulsoryRaw) ? 1 : 0,
        closing_date: parseSaDate(closingRaw),
      });
    });

    // If fewer than 25 rows were found, we're on the last page
    if (rows.length < 25) break;
  }

  return tenders;
}

/**
 * Scrape eTenders using the search API endpoint (JSON — more reliable than HTML).
 * Falls back to HTML scraping if the API is unavailable.
 */
export async function scrapeEtendersSearch(province = "Eastern Cape"): Promise<ScrapedTender[]> {
  // Try the search/filter endpoint that returns JSON (if available)
  const searchUrl = `${BASE}/content/advertised-tenders?province=${encodeURIComponent(province)}&_format=json`;
  try {
    const res = await fetch(searchUrl, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(15_000) });
    if (res.ok && res.headers.get("content-type")?.includes("json")) {
      const data = await res.json() as Array<Record<string, string>>;
      if (Array.isArray(data) && data.length > 0) {
        return data.map((row) => {
          const combined = `${row.title ?? ""} ${row.department ?? ""}`;
          const { min: gradeMin, max: gradeMax } = detectCidbGrade(combined);
          const { min: valueMin, max: valueMax } = detectContractValue(combined);
          return {
            reference_number: row.tender_number ?? row.reference ?? "",
            title: clean(row.title ?? row.description ?? ""),
            description: clean(row.description ?? row.title ?? ""),
            department: clean(row.department ?? ""),
            portal: "eTenders",
            province: province,
            tender_type: detectTenderType(combined),
            cidb_grade_min: gradeMin,
            cidb_grade_max: gradeMax,
            cidb_class: detectCidbClass(combined),
            contract_value_min: valueMin,
            contract_value_max: valueMax,
            briefing_mandatory: /yes|compulsory|mandatory/i.test(row.briefing_compulsory ?? "") ? 1 : 0,
            closing_date: parseSaDate(row.closing_date ?? ""),
          };
        });
      }
    }
  } catch {
    // fall through to HTML scraping
  }
  return scrapeEtenders();
}
