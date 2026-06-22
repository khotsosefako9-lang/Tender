import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { getSupabaseClient } from "@/lib/supabase";

export const maxDuration = 60;

const DISCLAIMER =
  "AI-GENERATED FIRST DRAFT. Review, edit, and verify all details before submission. " +
  "This document is a starting point only. Tenderpilot accepts no liability for the accuracy or completeness of this draft.";

const COMPLIANCE_DOCS = [
  { item: "CSD Supplier Registration confirmation (Central Supplier Database)", required: true },
  { item: "Valid Tax Clearance Certificate (SARS)", required: true },
  { item: "B-BBEE Certificate / Affidavit (original or certified copy)", required: true },
  { item: "CIDB Registration Certificate (relevant grade and class)", required: true },
  { item: "Company Registration Certificate (CIPC / CIPRO)", required: true },
  { item: "Certified ID copies of all directors/members", required: true },
  { item: "Proof of bank account (cancelled cheque or bank letter)", required: true },
  { item: "Municipal rates clearance / good standing letter", required: false },
  { item: "Professional indemnity / public liability insurance", required: false },
  { item: "Joint Venture agreement (if applicable)", required: false },
];

async function generateDraft(tenderId: number, subscriberId: number) {
  const tender = await db.tenders.findOneWhere("id", tenderId);
  if (!tender) throw new Error("Tender not found");

  const subscriber = await db.subscribers.findOneWhere("id", subscriberId);
  if (!subscriber) throw new Error("Subscriber not found");

  // Check tier — only bid and pro may generate drafts
  if (subscriber.tier === "scout") {
    throw new Error("Bid draft generation requires a Bid or Pro subscription.");
  }

  // Check if a draft already exists for this tender+subscriber combination
  const { data: existingMatch } = await getSupabaseClient()
    .from("tender_matches")
    .select("id")
    .eq("subscriber_id", subscriberId)
    .eq("tender_id", tenderId)
    .maybeSingle();

  const matchId = existingMatch?.id ?? null;

  if (matchId) {
    const { data: existing } = await getSupabaseClient()
      .from("bid_drafts")
      .select("*")
      .eq("match_id", matchId)
      .maybeSingle();
    if (existing) return existing;
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `You are an expert South African tender writer. Generate a professional bid response draft for the following tender.

TENDER DETAILS:
- Title: ${tender.title}
- Department: ${tender.department}
- Reference Number: ${tender.reference_number}
- Portal: ${tender.portal}
- Province: ${tender.province ?? "South Africa"}
- Tender Type: ${tender.tender_type}
- CIDB Grade Required: ${tender.cidb_grade_min}–${tender.cidb_grade_max}
- CIDB Class: ${tender.cidb_class || "Not specified"}
- Closing Date: ${tender.closing_date}
- Description: ${tender.description || tender.title}

BIDDING COMPANY PROFILE:
- Company: ${subscriber.company_name}
- CIDB Grade: ${subscriber.cidb_grade}
- CIDB Classes: ${subscriber.cidb_classes}
- B-BBEE Level: ${subscriber.bbbee_level || "To be confirmed"}
- CSD Number: ${subscriber.csd_number || "Registered"}
- Years in Operation: ${subscriber.years_in_operation || "Established company"}
- Provinces Active: ${subscriber.provinces}
- Sectors: ${subscriber.sectors}

Generate ONLY the following six sections as a JSON object. Do not include any text outside the JSON.

{
  "executive_summary": "2–3 paragraph executive summary positioning the company for this specific tender. Reference the tender title, department, and company name. Professional and persuasive tone.",
  "company_introduction": "2–3 paragraphs introducing ${subscriber.company_name}. Include CIDB grade, registration, B-BBEE level, years in operation, relevant experience in sectors/provinces. Professional tone.",
  "understanding_of_requirements": "2–3 paragraphs demonstrating clear understanding of what the tender requires, referencing the specific scope, location, and deliverables from the description.",
  "methodology": "Structured methodology for delivering this specific tender. Include phases: mobilisation, execution, quality assurance, handover. Bullet-point format acceptable.",
  "resource_plan": "Team structure and key resources for this project. Roles, experience levels, and any specialist subcontractors relevant to ${tender.cidb_class || "the work"}. Keep brief.",
  "project_schedule": "High-level Gantt-style schedule as plain text. 4–8 phases with indicative timeframes (e.g. Week 1–2: Site establishment). Acknowledge that actual schedule will depend on contract award date.",
  "pricing_framework": "BLANK PRICING TABLE ONLY — do not generate any prices or estimates whatsoever. Output only column headers and empty rows for the contractor to complete:\\n\\n| Item | Description | Unit | Qty | Rate (ZAR) | Total (ZAR) |\\n|------|-------------|------|-----|-----------|-------------|\\n| 1    |             |      |     |           |             |\\n| 2    |             |      |     |           |             |\\n| 3    |             |      |     |           |             |\\n| 4    |             |      |     |           |             |\\n| 5    |             |      |     |           |             |\\n|      | **TOTAL**   |      |     |           |             |"
}

Important rules:
- Write specifically for this tender — not generic boilerplate
- Never invent CIDB grades, prices, project values, or company details not provided
- Pricing framework must be a blank table only — no amounts ever
- Keep each section concise and professional`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type from AI");

  // Extract JSON from the response (strip any markdown fences)
  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("AI did not return valid JSON");

  let sections: Record<string, string>;
  try {
    sections = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error("Failed to parse AI response as JSON");
  }

  const draftRow = {
    match_id: matchId,
    executive_summary: `${DISCLAIMER}\n\n${sections.executive_summary ?? ""}`,
    methodology: sections.methodology ?? "",
    resource_plan: `${sections.company_introduction ?? ""}\n\n${sections.resource_plan ?? ""}`,
    risk_management: sections.understanding_of_requirements ?? "",
    project_schedule: sections.project_schedule ?? "",
    compliance_checklist: JSON.stringify(COMPLIANCE_DOCS),
    pricing_framework: sections.pricing_framework ?? "",
    generated_at: new Date().toISOString(),
  };

  // Insert draft and mark the match as having a draft
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: draft, error } = await getSupabaseClient().from("bid_drafts").insert(draftRow as any).select().single();
  if (error) throw new Error(`Failed to save draft: ${error.message}`);

  if (matchId) {
    await getSupabaseClient()
      .from("tender_matches")
      .update({ bid_draft_generated: 1 })
      .eq("id", matchId);
  }

  return draft;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenderId = Number(searchParams.get("tender_id"));
  const subscriberId = Number(searchParams.get("subscriber_id"));
  if (!tenderId || !subscriberId) {
    return NextResponse.json({ error: "tender_id and subscriber_id required" }, { status: 400 });
  }
  try {
    const draft = await generateDraft(tenderId, subscriberId);
    return NextResponse.json({ success: true, draft });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tenderId = Number(body.tender_id);
    const subscriberId = Number(body.subscriber_id);
    if (!tenderId || !subscriberId) {
      return NextResponse.json({ error: "tender_id and subscriber_id required" }, { status: 400 });
    }
    const draft = await generateDraft(tenderId, subscriberId);
    return NextResponse.json({ success: true, draft });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
