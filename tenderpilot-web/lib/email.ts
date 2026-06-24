const FROM_EMAIL = process.env.FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL || "noreply@tenderpilot.co.za";
const DASHBOARD_URL = process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/dashboard` : "https://tenderpilot.co.za/dashboard";

async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY.startsWith("SG.placeholder")) {
    console.log("[Email] SendGrid not configured, logging email:", { to, subject });
    return { skipped: true };
  }
  const sgMail = (await import("@sendgrid/mail")).default;
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  await sgMail.send({ to, from: FROM_EMAIL, subject, html });
  return { sent: true };
}

export async function sendWelcomeEmail(subscriber: {
  email: string;
  first_name: string;
  tier: string;
}) {
  const tierLabel = { scout: "Scout", bid: "Bid", pro: "Pro" }[subscriber.tier] || subscriber.tier;
  await sendEmail(
    subscriber.email,
    "Welcome to Tenderpilot — you're all set!",
    emailWrapper(`
      <h2 style="color:#1e3a5f;margin:0 0 8px;">Welcome, ${subscriber.first_name}!</h2>
      <p style="color:#374151;margin:0 0 20px;">Your <strong>${tierLabel}</strong> subscription is now active. Here's what happens next:</p>
      <ul style="color:#374151;line-height:2;padding-left:20px;margin:0 0 24px;">
        <li>Your business profile has been saved</li>
        <li>Your first daily digest will arrive tomorrow morning</li>
        <li>Log in to your dashboard to upload compliance documents</li>
      </ul>
      ${ctaButton("Go to Dashboard", DASHBOARD_URL)}
      <p style="color:#6b7280;font-size:12px;margin-top:24px;">
        <em>A 2% success fee applies on awarded tenders. See your Terms of Service for details.</em>
      </p>
    `, "Welcome to Tenderpilot")
  );
}

export type DigestMatch = {
  title: string;
  department: string;
  closing_date: string;
  match_score: number;
  tender_type: string;
  province?: string | null;
  reference_number?: string;
};

export async function sendDigestEmail(
  subscriber: { email: string; first_name: string },
  matches: DigestMatch[]
): Promise<{ sent: boolean; skipped?: boolean }> {
  const dateStr = new Date().toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const tenderCards = matches.map((m) => {
    const urgency = (() => {
      if (!m.closing_date) return "";
      const days = Math.ceil((new Date(m.closing_date).getTime() - Date.now()) / 86_400_000);
      if (days <= 3) return `<span style="background:#fef2f2;color:#dc2626;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:700;">⚠ ${days}d left</span>`;
      if (days <= 7) return `<span style="background:#fff7ed;color:#c2410c;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;">${days}d left</span>`;
      return "";
    })();

    const scoreColor = m.match_score >= 75 ? "#16a34a" : m.match_score >= 50 ? "#d97706" : "#ea580c";

    return `
    <div style="border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin-bottom:16px;background:#fff;">
      <!-- Two-column table keeps title and score apart in all email clients -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
        <tr>
          <td style="vertical-align:top;padding-right:16px;">
            <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#1e3a5f;line-height:1.4;">${escHtml(m.title)}</p>
            <p style="margin:0;font-size:13px;color:#6b7280;">${escHtml(m.department)}${m.province ? ` &middot; ${escHtml(m.province)}` : ""}</p>
          </td>
          <td width="60" style="vertical-align:top;text-align:right;white-space:nowrap;padding-left:16px;">
            <div style="font-size:20px;font-weight:800;color:${scoreColor};line-height:1;">${m.match_score}%</div>
            <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:.5px;">match</div>
          </td>
        </tr>
      </table>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
        <span style="background:#eff6ff;color:#1d4ed8;padding:3px 10px;border-radius:9999px;font-size:12px;font-weight:500;">${escHtml(m.tender_type || "Tender")}</span>
        ${m.reference_number ? `<span style="background:#f3f4f6;color:#6b7280;padding:3px 10px;border-radius:9999px;font-size:12px;">${escHtml(m.reference_number)}</span>` : ""}
        ${m.closing_date ? `<span style="color:#6b7280;font-size:12px;">Closes ${new Date(m.closing_date).toLocaleDateString("en-ZA", { day:"numeric", month:"short", year:"numeric" })}</span>` : ""}
        ${urgency}
      </div>
    </div>`;
  }).join("");

  const body = `
    <p style="color:#374151;margin:0 0 6px;">Good morning, <strong>${escHtml(subscriber.first_name)}</strong>.</p>
    <p style="color:#374151;margin:0 0 24px;">You have <strong>${matches.length} new tender match${matches.length === 1 ? "" : "es"}</strong> as of ${dateStr}.</p>
    ${tenderCards}
    <div style="text-align:center;margin:28px 0 8px;">
      ${ctaButton("View Matches &amp; Generate Drafts", DASHBOARD_URL)}
    </div>
    <p style="color:#9ca3af;font-size:12px;text-align:center;margin:16px 0 0;">
      You're receiving this because you have an active Tenderpilot subscription.<br/>
      To update your preferences, visit your <a href="${DASHBOARD_URL}" style="color:#1e3a5f;">dashboard</a>.
    </p>
  `;

  const result = await sendEmail(
    subscriber.email,
    `Tenderpilot: ${matches.length} new tender match${matches.length === 1 ? "" : "es"} — ${dateStr}`,
    emailWrapper(body, `${matches.length} New Tender Match${matches.length === 1 ? "" : "es"}`)
  );

  return result as { sent: boolean; skipped?: boolean };
}

/* ── Helpers ───────────────────────────────────────────────────────────── */

function escHtml(s: string | null | undefined): string {
  return (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function ctaButton(label: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:#1e3a5f;color:#fff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">${label}</a>`;
}

function emailWrapper(body: string, previewText: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Tenderpilot</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <!-- preview text -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escHtml(previewText)} — Tenderpilot&nbsp;&#847;&nbsp;</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:640px;">
        <!-- Header -->
        <tr><td style="background:#1e3a5f;padding:24px 32px;border-radius:12px 12px 0 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <span style="color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">Tender<span style="color:#f59e0b;">pilot</span></span>
              </td>
              <td align="right">
                <span style="color:#93c5fd;font-size:13px;">Daily Digest</span>
              </td>
            </tr>
          </table>
        </td></tr>
        <!-- Body -->
        <tr><td style="background:#fff;padding:32px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
          ${body}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:20px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;text-align:center;">
          <p style="color:#9ca3af;font-size:12px;margin:0;">
            Tenderpilot &middot; Gqeberha, Eastern Cape &middot;
            <a href="mailto:khotsosefako0@gmail.com" style="color:#9ca3af;">khotsosefako0@gmail.com</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
