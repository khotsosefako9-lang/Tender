import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { calculateMatchScore } from "@/lib/matching";
import { sendDigestEmail } from "@/lib/email";
import type { Subscriber, Tender } from "@/lib/db";

export async function GET(req: NextRequest) {
  // Verify cron secret in production
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const db = getDb();
  const results = { subscribers: 0, matches: 0, drafts: 0, digests: 0, errors: [] as string[] };

  try {
    // Get all active tenders from last 24 hours
    const tenders = db.prepare(`
      SELECT * FROM tenders WHERE is_active = 1
      AND (scraped_at >= datetime('now', '-1 day') OR scraped_at IS NULL)
    `).all() as Tender[];

    // Get all active subscribers
    const subscribers = db.prepare(
      "SELECT * FROM subscribers WHERE status = 'active'"
    ).all() as Subscriber[];

    results.subscribers = subscribers.length;

    for (const subscriber of subscribers) {
      const matchedTenders: Array<{ title: string; department: string; closing_date: string; match_score: number; tender_type: string }> = [];

      for (const tender of tenders) {
        // Skip if already matched
        const existing = db.prepare(
          "SELECT id FROM tender_matches WHERE subscriber_id = ? AND tender_id = ?"
        ).get(subscriber.id, tender.id);
        if (existing) continue;

        const { score, reasons } = calculateMatchScore(subscriber, tender);
        if (score >= 40) {
          const matchResult = db.prepare(`
            INSERT INTO tender_matches (subscriber_id, tender_id, match_score, match_reasons)
            VALUES (?, ?, ?, ?)
          `).run(subscriber.id, tender.id, score, JSON.stringify(reasons));

          results.matches++;
          matchedTenders.push({
            title: tender.title,
            department: tender.department || "N/A",
            closing_date: tender.closing_date || "N/A",
            match_score: score,
            tender_type: tender.tender_type || "Tender",
          });

          // Generate bid draft for Bid/Pro subscribers
          if (subscriber.tier === "bid" || subscriber.tier === "pro") {
            const matchId = Number(matchResult.lastInsertRowid);
            const draft = generateBidDraft(tender, subscriber);
            db.prepare(`
              INSERT INTO bid_drafts (match_id, executive_summary, methodology, resource_plan,
                risk_management, project_schedule, compliance_checklist, pricing_framework)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(matchId, draft.executive_summary, draft.methodology, draft.resource_plan,
              draft.risk_management, draft.project_schedule, draft.compliance_checklist, draft.pricing_framework);
            db.prepare("UPDATE tender_matches SET bid_draft_generated = 1 WHERE id = ?").run(matchId);
            results.drafts++;
          }
        }
      }

      // Send digest email if there are new matches
      if (matchedTenders.length > 0) {
        try {
          await sendDigestEmail(subscriber, matchedTenders);
          db.prepare(`
            INSERT INTO email_digests (subscriber_id, subject, tender_count, status)
            VALUES (?, ?, ?, 'sent')
          `).run(subscriber.id, `Tenderpilot Daily Digest — ${matchedTenders.length} new matches`, matchedTenders.length);
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
    resource_plan: `**Key Personnel:**\n- Project Manager: Dedicated registered professional with relevant experience\n- Site Supervisor: CIDB-registered with minimum 5 years' applicable experience\n- Safety Officer: Valid SAMTRAC/COMSOC certificate\n- Skilled Labour: As required per scope, supplemented with local labour where possible\n\n**Plant & Equipment:**\nAll plant and equipment required for this project is owned or under long-term hire to ${company}. Full list to be provided upon request.\n\n**Materials:**\nAll materials will be sourced from approved, reputable suppliers with valid compliance certificates. Samples and proof of specification compliance will be submitted for approval before use.`,
    risk_management: `| Risk | Likelihood | Impact | Mitigation |\n|------|------------|--------|------------|\n| Inclement weather delays | Medium | Medium | Build contingency into programme; maintain weather records |\n| Material supply disruptions | Low | High | Multiple approved suppliers identified; early procurement |\n| Scope creep | Medium | High | Formal change order process; written client approval required |\n| Labour disputes | Low | High | BCEA/LRA compliant; fair wages; community liaison |\n| Safety incidents | Low | Very High | Full safety file; daily toolbox talks; PPE enforcement |`,
    project_schedule: `**Indicative Programme (subject to final scope confirmation):**\n\nWeek 1: Site establishment, mobilisation, safety induction\nWeeks 2–3: [Phase 1 activities per scope of work]\nWeeks 4–6: [Phase 2 activities per scope of work]\nWeeks 7–8: [Phase 3 activities per scope of work]\nWeek 9: Snagging, demobilisation, and handover\n\n*Note: Final programme will be developed in consultation with the client following award. This is an indicative timeframe subject to scope confirmation.*`,
    compliance_checklist: JSON.stringify([
      { item: "Valid Tax Clearance Certificate (SARS)", required: true },
      { item: "CIDB Registration Certificate (Grade " + grade + " or higher)", required: true },
      { item: "Company Registration (CIPC)", required: true },
      { item: "CSD Registration Confirmation (Supplier Number)", required: true },
      { item: "B-BBEE Compliance Certificate", required: true },
      { item: "Proof of Address (not older than 3 months)", required: true },
      { item: "Municipal Rates Clearance Certificate", required: true },
      { item: "Banking Details / Bank Confirmation Letter", required: true },
      { item: "Completed Compulsory Enterprise Questionnaire (CIS)", required: true },
      { item: "Signed MBD 4 (Declaration of Interest)", required: true },
      { item: "Signed MBD 6.1 (Preference Points Claim)", required: tender.cidb_grade_min ? Number(tender.cidb_grade_min) >= 3 : false },
      { item: "OHSA Safety Plan", required: true },
      { item: "Site Visit / Compulsory Briefing Attendance Certificate", required: !!(tender as { briefing_mandatory?: number }).briefing_mandatory },
    ]),
    pricing_framework: `**PRICING SCHEDULE (Template Only — Complete with Actual Rates)**\n\n*This section must be completed with actual, carefully calculated rates based on the Bill of Quantities / Schedule of Rates provided in the tender document. Do not submit without completing all rates.*\n\n| Item | Description | Unit | Qty | Rate (R) | Amount (R) |\n|------|-------------|------|-----|----------|------------|\n| 1 | [Item from BoQ] | [unit] | [qty] | | |\n| 2 | [Item from BoQ] | [unit] | [qty] | | |\n| ... | | | | | |\n| | **Subtotal** | | | | |\n| | VAT (15%) | | | | |\n| | **TOTAL BID PRICE** | | | | |\n\n*All prices in South African Rand (ZAR) inclusive of all costs to complete the work. Valid for 90 days from bid closing date.*`,
  };
}
