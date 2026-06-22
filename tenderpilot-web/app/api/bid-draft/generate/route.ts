import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { getSupabaseClient } from "@/lib/supabase";

export const maxDuration = 10; // Vercel Hobby plan limit

const DISCLAIMER =
  "AI-GENERATED FIRST DRAFT. Review, edit, and verify all details before submission. " +
  "Tenderpilot accepts no liability for the accuracy or completeness of this draft.";

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

const BLANK_PRICING_TABLE =
  "| Item | Description | Unit | Qty | Rate (ZAR) | Total (ZAR) |\n" +
  "|------|-------------|------|-----|------------|-------------|\n" +
  "| 1    |             |      |     |            |             |\n" +
  "| 2    |             |      |     |            |             |\n" +
  "| 3    |             |      |     |            |             |\n" +
  "| 4    |             |      |     |            |             |\n" +
  "| 5    |             |      |     |            |             |\n" +
  "|      | **TOTAL**   |      |     |            |             |";

async function generateDraft(tenderId: number, subscriberId: number) {
  // Run DB lookups in parallel to save time
  const [tender, subscriber] = await Promise.all([
    db.tenders.findOneWhere("id", tenderId),
    db.subscribers.findOneWhere("id", subscriberId),
  ]);

  if (!tender) throw new Error("Tender not found");
  if (!subscriber) throw new Error("Subscriber not found");
  if (subscriber.tier === "scout") throw new Error("Bid draft generation requires a Bid or Pro subscription.");

  // Check for existing match + draft in parallel
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

  // Tight prompt — one focused paragraph per section keeps tokens low and Haiku fast
  const prompt = `You are a South African tender writer. Return ONLY a JSON object (no markdown, no extra text) with these exact keys. Each value must be a plain string, 3–5 sentences max except where noted.

{
  "executive_summary": "Opening paragraph (3–4 sentences) why ${subscriber.company_name} is the right choice for: ${tender.title} (${tender.reference_number}), ${tender.department}. Mention CIDB Grade ${subscriber.cidb_grade}, B-BBEE ${subscriber.bbbee_level || "compliant"}, and relevant sector experience.",
  "company_introduction": "3–4 sentences on ${subscriber.company_name}: CIDB Grade ${subscriber.cidb_grade} (${subscriber.cidb_classes}), operating in ${subscriber.provinces}, sectors: ${subscriber.sectors}. Mention CSD registration and compliance standing.",
  "understanding_of_requirements": "3–4 sentences showing grasp of the scope: ${tender.description || tender.title}. Reference province (${tender.province ?? "South Africa"}), tender type (${tender.tender_type}), and CIDB class (${tender.cidb_class || "general"}).",
  "methodology": "4–6 bullet points covering: mobilisation, execution, QA/QC, stakeholder communication, handover. Specific to ${tender.cidb_class || "the work type"}.",
  "resource_plan": "3–4 sentences: key roles (site manager, foreman, safety officer, labourers), any specialist subcontractors for ${tender.cidb_class || "the scope"}, and commitment to local labour from ${tender.province ?? "the region"}.",
  "project_schedule": "Plain-text schedule, 4–6 phases with week ranges, e.g. 'Week 1–2: Site establishment'. End with: Actual dates subject to contract award."
}

Rules: never invent prices or values; use only details provided above; be concise.`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected AI response type");

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
    pricing_framework: BLANK_PRICING_TABLE,
    generated_at: new Date().toISOString(),
  };

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
