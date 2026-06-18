import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateMatchScore } from "@/lib/matching";
import { sendDigestEmail } from "@/lib/email";
import type { Subscriber, Tender } from "@/lib/db";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const results = { subscribers: 0, matches: 0, drafts: 0, digests: 0, errors: [] as string[] };

  try {
    const tenders = db.tenders.findAll((t) => t.is_active === 1);
    const subscribers = db.subscribers.findAll((s) => s.status === "active");

    results.subscribers = subscribers.length;

    for (const subscriber of subscribers) {
      const newMatches: Array<{ title: string; department: string; closing_date: string; match_score: number; tender_type: string }> = [];

      for (const tender of tenders) {
        const alreadyMatched = db.tender_matches.findOne(
          (m) => m.subscriber_id === subscriber.id && m.tender_id === tender.id
        );
        if (alreadyMatched) continue;

        const { score, reasons } = calculateMatchScore(subscriber, tender);
        if (score >= 40) {
          const now = new Date().toISOString();
          const match = db.tender_matches.insert({
            subscriber_id: subscriber.id,
            tender_id: tender.id,
            match_score: score,
            match_reasons: JSON.stringify(reasons),
            digest_sent: 0,
            digest_sent_at: "",
            bid_draft_generated: 0,
            created_at: now,
          });
          results.matches++;

          newMatches.push({
            title: tender.title,
            department: tender.department || "N/A",
            closing_date: tender.closing_date || "N/A",
            match_score: score,
            tender_type: tender.tender_type || "Tender",
          });

          if (subscriber.tier === "bid" || subscriber.tier === "pro") {
            const draft = generateBidDraft(tender, subscriber);
            db.bid_drafts.insert({ match_id: match.id, ...draft, generated_at: now } as never);
            db.tender_matches.update((m) => m.id === match.id, { bid_draft_generated: 1 });
            results.drafts++;
          }
        }
      }

      if (newMatches.length > 0) {
        try {
          await sendDigestEmail(subscriber, newMatches);
          db.email_digests.insert({
            subscriber_id: subscriber.id,
            subject: `Tenderpilot Daily Digest — ${newMatches.length} new matches`,
            tender_count: newMatches.length,
            sent_at: new Date().toISOString(),
            status: "sent",
          } as never);
          results.digests++;
        } catch (err) {
          results.errors.push(`Email to ${subscriber.email}: ${err}`);
        }
      }
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }

  return NextResponse.json({ success: true, ...results });
}

function generateBidDraft(tender: Tender, subscriber: Subscriber) {
  const company = subscriber.company_name || "Our Company";
  const grade = subscriber.cidb_grade || "N/A";
  return {
    executive_summary: `${company} hereby submits this bid in response to ${tender.reference_number || "the above"}: "${tender.title}" as advertised by ${tender.department || "the procuring department"}.\n\n${company} is a CIDB Grade ${grade} registered contractor with proven experience in delivering quality projects within budget and on schedule. We have the capacity, capability, and commitment to successfully complete this project in full compliance with all specified requirements.\n\nThis bid represents our firm commitment to delivering excellent results that meet and exceed the procuring department's expectations.`,
    methodology: `Our approach to "${tender.title}" will follow a structured project methodology:\n\n**Phase 1: Project Initiation & Planning**\nWithin the first week of award, we will establish the project team, conduct a site inspection, and develop a detailed project execution plan aligned with the scope of work.\n\n**Phase 2: Mobilisation**\nAll required plant, equipment, and materials will be sourced from approved suppliers. Our team will be fully briefed on safety requirements, quality standards, and project milestones.\n\n**Phase 3: Execution**\nWork will proceed according to the approved work programme, with weekly progress meetings with the client's representative. All work will be inspected and signed off before proceeding to the next phase.\n\n**Phase 4: Completion & Handover**\nAll punch list items will be resolved, as-built documentation prepared, and a formal handover conducted with the client.`,
    resource_plan: `**Key Personnel:**\n- Project Manager: Dedicated registered professional with relevant experience\n- Site Supervisor: CIDB-registered with minimum 5 years' applicable experience\n- Safety Officer: Valid SAMTRAC/COMSOC certificate\n- Skilled Labour: As required per scope, supplemented with local labour where possible\n\n**Plant & Equipment:**\nAll plant and equipment required for this project is owned or under long-term hire to ${company}. Full list to be provided upon request.\n\n**Materials:**\nAll materials will be sourced from approved, reputable suppliers with valid compliance certificates.`,
    risk_management: `| Risk | Likelihood | Impact | Mitigation |\n|------|------------|--------|------------|\n| Inclement weather delays | Medium | Medium | Build contingency into programme; maintain weather records |\n| Material supply disruptions | Low | High | Multiple approved suppliers identified; early procurement |\n| Scope creep | Medium | High | Formal change order process; written client approval required |\n| Labour disputes | Low | High | BCEA/LRA compliant; fair wages; community liaison |\n| Safety incidents | Low | Very High | Full safety file; daily toolbox talks; PPE enforcement |`,
    project_schedule: `**Indicative Programme (subject to final scope confirmation):**\n\nWeek 1: Site establishment, mobilisation, safety induction\nWeeks 2–3: Phase 1 activities per scope of work\nWeeks 4–6: Phase 2 activities per scope of work\nWeeks 7–8: Phase 3 activities per scope of work\nWeek 9: Snagging, demobilisation, and handover\n\n*Note: Final programme will be developed in consultation with the client following award.*`,
    compliance_checklist: JSON.stringify([
      { item: "Valid Tax Clearance Certificate (SARS)", required: true },
      { item: `CIDB Registration Certificate (Grade ${grade} or higher)`, required: true },
      { item: "Company Registration (CIPC)", required: true },
      { item: "CSD Registration Confirmation (Supplier Number)", required: true },
      { item: "B-BBEE Compliance Certificate", required: true },
      { item: "Proof of Address (not older than 3 months)", required: true },
      { item: "Municipal Rates Clearance Certificate", required: true },
      { item: "Banking Details / Bank Confirmation Letter", required: true },
      { item: "Signed MBD 4 (Declaration of Interest)", required: true },
      { item: "Signed MBD 6.1 (Preference Points Claim)", required: true },
      { item: "OHSA Safety Plan", required: true },
      { item: "Site Visit / Compulsory Briefing Certificate", required: tender.briefing_mandatory === 1 },
    ]),
    pricing_framework: `**PRICING SCHEDULE (Template Only — Complete with Actual Rates)**\n\n*This section must be completed with actual, carefully calculated rates based on the Bill of Quantities / Schedule of Rates provided in the tender document.*\n\n| Item | Description | Unit | Qty | Rate (R) | Amount (R) |\n|------|-------------|------|-----|----------|------------|\n| 1 | [Item from BoQ] | [unit] | [qty] | | |\n| 2 | [Item from BoQ] | [unit] | [qty] | | |\n| | **Subtotal** | | | | |\n| | VAT (15%) | | | | |\n| | **TOTAL BID PRICE** | | | | |\n\n*All prices in South African Rand (ZAR). Valid for 90 days from bid closing date.*`,
  };
}
