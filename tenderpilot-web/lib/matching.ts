import type { Subscriber, Tender } from "./db";

export type MatchResult = {
  score: number;
  reasons: string[];
};

export function calculateMatchScore(subscriber: Subscriber, tender: Tender): MatchResult {
  let score = 0;
  const reasons: string[] = [];

  // CIDB grade match (+30)
  const grade = subscriber.cidb_grade || 0;
  const minGrade = tender.cidb_grade_min || 1;
  const maxGrade = tender.cidb_grade_max || 9;
  if (grade >= minGrade && grade <= maxGrade) {
    score += 30;
    reasons.push(`CIDB Grade ${grade} matches required grade ${minGrade}–${maxGrade}`);
  } else if (grade >= minGrade - 1 && grade <= maxGrade + 1) {
    score += 15;
    reasons.push(`CIDB Grade ${grade} is close to required range`);
  }

  // CIDB class match (+25)
  const subClasses = tryParseArray(subscriber.cidb_classes);
  const tenderClass = tender.cidb_class || "";
  if (tenderClass && subClasses.some((c) => tenderClass.includes(c))) {
    score += 25;
    reasons.push(`CIDB class match: ${tenderClass}`);
  } else if (!tenderClass) {
    score += 12;
    reasons.push("No specific CIDB class required");
  }

  // Province match (+20)
  const subProvinces = tryParseArray(subscriber.provinces);
  const tenderProvince = tender.province || "";
  if (
    tenderProvince &&
    subProvinces.some(
      (p) => p.toLowerCase() === tenderProvince.toLowerCase() || tenderProvince.toLowerCase().includes(p.toLowerCase())
    )
  ) {
    score += 20;
    reasons.push(`Province match: ${tenderProvince}`);
  } else if (!tenderProvince) {
    score += 10;
    reasons.push("National tender (all provinces eligible)");
  }

  // Contract value in range (+10)
  const min = subscriber.contract_value_min || 0;
  const max = subscriber.contract_value_max || Infinity;
  const tenderMin = tender.contract_value_min || 0;
  const tenderMax = tender.contract_value_max || 0;
  const tenderValue = tenderMax || tenderMin;
  if (tenderValue > 0 && tenderValue >= min && tenderValue <= max) {
    score += 10;
    reasons.push(`Contract value R${formatCurrency(tenderValue)} within your range`);
  } else if (!tenderValue) {
    score += 5;
    reasons.push("Contract value not specified");
  }

  // Sector match (+15) — derived from description keywords
  const subSectors = tryParseArray(subscriber.sectors);
  const tenderText = `${tender.title} ${tender.description || ""}`.toLowerCase();
  const sectorKeywords: Record<string, string[]> = {
    "Roads & Infrastructure": ["road", "infrastructure", "bridge", "stormwater", "drainage"],
    "Building & Renovation": ["building", "renovation", "construction", "refurb", "office"],
    Electrical: ["electrical", "wiring", "substation", "solar"],
    Plumbing: ["plumbing", "water", "pipe", "sanitation"],
    "Cleaning Services": ["cleaning", "hygiene", "janitorial"],
    Security: ["security", "guarding", "cctv", "access control"],
    Catering: ["catering", "food", "canteen"],
    ICT: ["ict", "software", "hardware", "network", "it services"],
    Transport: ["transport", "logistics", "fleet", "vehicle"],
    Landscaping: ["landscaping", "garden", "lawn", "greening"],
  };
  const matchedSectors = subSectors.filter((sector) => {
    const keywords = sectorKeywords[sector] || [sector.toLowerCase()];
    return keywords.some((kw) => tenderText.includes(kw));
  });
  if (matchedSectors.length > 0) {
    score += 15;
    reasons.push(`Sector match: ${matchedSectors.join(", ")}`);
  }

  return { score: Math.min(score, 100), reasons };
}

function tryParseArray(val: string | null | undefined): string[] {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [val];
  } catch {
    return val.split(",").map((s) => s.trim());
  }
}

function formatCurrency(val: number): string {
  return val.toLocaleString("en-ZA");
}
