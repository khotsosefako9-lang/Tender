/**
 * Utilities for extracting structured data from unstructured tender text.
 */

/** Detect CIDB class from title/description (e.g. "CE", "GB", "EB") */
export function detectCidbClass(text: string): string {
  const lower = text.toLowerCase();
  const classes: Array<[string, string[]]> = [
    ["CE", ["civil engineering", "civil eng", "roads", "infrastructure", "earthworks", "drainage", "stormwater"]],
    ["GB", ["general building", "building works", "construction of", "renovation", "refurbish"]],
    ["EB", ["electrical", "wiring", "substation", "hv", "lv ", "mv ", "solar panel", "photovoltaic"]],
    ["ME", ["mechanical", "hvac", "plumbing", "fire protection", "air conditioning"]],
    ["SB", ["specialist building", "piling", "waterproofing", "demolition"]],
    ["SI", ["specialist civil", "tunnelling", "dredging", "hazardous"]],
    ["EP", ["electrical", "instrumentation", "process control"]],
    ["SF", ["specialist fire", "fire fighting", "sprinkler"]],
  ];
  for (const [code, keywords] of classes) {
    if (keywords.some((kw) => lower.includes(kw))) return code;
  }
  // Try explicit CIDB class mention
  const explicit = text.match(/\bCIDB\s+(?:class\s+)?([A-Z]{2})\b/i);
  if (explicit) return explicit[1].toUpperCase();
  return "";
}

/** Extract CIDB grade range from text, e.g. "Grade 5-7", "Grade 4 to 6", "Grading: 5GB" */
export function detectCidbGrade(text: string): { min: number; max: number } {
  // Pattern: "5GB", "7CE", "3ME" etc.
  const gradeClass = text.match(/\b([1-9])([A-Z]{2})\b/);
  if (gradeClass) {
    const g = parseInt(gradeClass[1]);
    return { min: Math.max(1, g - 1), max: Math.min(9, g) };
  }
  // Pattern: "Grade 4-7", "Grade 4 to 7"
  const range = text.match(/[Gg]rade\s+([1-9])\s*(?:-|to)\s*([1-9])/);
  if (range) return { min: parseInt(range[1]), max: parseInt(range[2]) };
  // Pattern: "Grade 5"
  const single = text.match(/[Gg]rade\s+([1-9])/);
  if (single) {
    const g = parseInt(single[1]);
    return { min: Math.max(1, g - 1), max: Math.min(9, g + 1) };
  }
  // Pattern: "CIDB 6" or ">= 5"
  const cidb = text.match(/CIDB\s+([1-9])/i);
  if (cidb) {
    const g = parseInt(cidb[1]);
    return { min: g, max: Math.min(9, g + 2) };
  }
  return { min: 1, max: 9 };
}

/** Detect tender type from text */
export function detectTenderType(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("request for quotation") || lower.includes("rfq")) return "RFQ";
  if (lower.includes("request for proposal") || lower.includes("rfp")) return "RFP";
  if (lower.includes("request for information") || lower.includes("rfi")) return "RFI";
  if (lower.includes("expression of interest") || lower.includes("eoi")) return "EOI";
  return "Formal Tender";
}

/** Estimate contract value range from text */
export function detectContractValue(text: string): { min: number; max: number } {
  // "R 5 million", "R5m", "R5,000,000"
  const millionMatch = text.match(/R\s*([0-9.,]+)\s*(?:million|m\b)/i);
  if (millionMatch) {
    const val = parseFloat(millionMatch[1].replace(/,/g, "")) * 1_000_000;
    return { min: Math.round(val * 0.5), max: Math.round(val * 2) };
  }
  // "R 2,500,000"
  const explicitMatch = text.match(/R\s*([0-9]{1,3}(?:[,\s][0-9]{3})+)/);
  if (explicitMatch) {
    const val = parseInt(explicitMatch[1].replace(/[,\s]/g, ""));
    return { min: Math.round(val * 0.5), max: Math.round(val * 2) };
  }
  return { min: 0, max: 0 };
}

/** Parse a South African date string to YYYY-MM-DD */
export function parseSaDate(raw: string): string {
  if (!raw) return "";
  // Already ISO: 2024-06-21
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) return raw.trim();
  // "21 June 2024", "21/06/2024", "2024/06/21"
  const parsed = new Date(raw.replace(/\//g, "-"));
  if (!isNaN(parsed.getTime())) return parsed.toISOString().split("T")[0];
  return "";
}

/**
 * Generate a stable deterministic reference ID when the scraper cannot parse
 * a real reference number from the portal. Uses a simple djb2-style hash of
 * title+portal so the same tender always produces the same ID across runs.
 * Prefix makes it easy to identify synthetically-generated refs in the DB.
 */
export function stableRef(prefix: string, title: string, portal: string): string {
  const input = `${title.toLowerCase().trim()}|${portal.toLowerCase().trim()}`;
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(i);
    hash = hash >>> 0; // keep unsigned 32-bit
  }
  return `${prefix}/AUTO/${hash.toString(36).toUpperCase()}`;
}

/** Normalise whitespace in scraped strings */
export function clean(s: string | undefined | null): string {
  return (s ?? "").replace(/\s+/g, " ").trim();
}

// Drupal Views renders null taxonomy fields as these sentinel strings
const EMPTY_SENTINELS = new Set(["EMPTY", "N/A", "n/a", "-", "—", "null", "undefined", "None"]);

/** Return null if the value is empty/sentinel, otherwise return the cleaned string. */
export function cleanOrNull(s: string | undefined | null): string | null {
  const cleaned = clean(s);
  if (!cleaned || EMPTY_SENTINELS.has(cleaned)) return null;
  return cleaned;
}
