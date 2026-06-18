const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "noreply@tenderpilot.co.za";

async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY.startsWith("SG.placeholder")) {
    console.log("[Email] SendGrid not configured, logging email:", { to, subject });
    return;
  }
  const sgMail = (await import("@sendgrid/mail")).default;
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  await sgMail.send({ to, from: FROM_EMAIL, subject, html });
}

export async function sendWelcomeEmail(subscriber: {
  email: string;
  first_name: string;
  tier: string;
}) {
  const tierLabel = { scout: "Scout", bid: "Bid", pro: "Pro" }[subscriber.tier] || subscriber.tier;
  await sendEmail(
    subscriber.email,
    "Welcome to Tenderpilot: You're all set!",
    `
    <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
      <div style="background: #1e3a5f; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Tenderpilot</h1>
      </div>
      <div style="background: white; padding: 32px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
        <h2 style="color: #1e3a5f; margin-top: 0;">Welcome, ${subscriber.first_name}!</h2>
        <p style="color: #374151;">Your <strong>${tierLabel}</strong> subscription is now active. Here's what happens next:</p>
        <ul style="color: #374151; line-height: 2;">
          <li>Your business profile has been saved</li>
          <li>Your first daily digest will arrive tomorrow morning</li>
          <li>Log in to your dashboard to upload compliance documents</li>
        </ul>
        <a href="${process.env.NEXTAUTH_URL}/dashboard"
           style="display: inline-block; background: #1e3a5f; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 16px;">
          Go to Dashboard
        </a>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
        <p style="color: #6b7280; font-size: 12px;">
          Tenderpilot · Gqeberha, Eastern Cape · +27 65 576 9100<br/>
          <em>A 2% success fee applies on awarded tenders. See your Terms of Service for details.</em>
        </p>
      </div>
    </div>
    `
  );
}

export async function sendDigestEmail(
  subscriber: { email: string; first_name: string },
  matches: Array<{ title: string; department: string; closing_date: string; match_score: number; tender_type: string }>
) {
  const rows = matches
    .map(
      (m) => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px; color: #1e3a5f; font-weight: 500;">${m.title}</td>
      <td style="padding: 12px; color: #374151;">${m.department}</td>
      <td style="padding: 12px; color: #374151;">${m.closing_date}</td>
      <td style="padding: 12px;">
        <span style="background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 9999px; font-size: 12px; font-weight: 600;">
          ${m.match_score}%
        </span>
      </td>
    </tr>`
    )
    .join("");

  await sendEmail(
    subscriber.email,
    `Tenderpilot Daily Digest: ${matches.length} new matches`,
    `
    <div style="font-family: Inter, sans-serif; max-width: 700px; margin: 0 auto; padding: 32px;">
      <div style="background: #1e3a5f; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Tenderpilot Daily Digest</h1>
        <p style="color: #93c5fd; margin: 4px 0 0;">${new Date().toLocaleDateString("en-ZA", { dateStyle: "full" })}</p>
      </div>
      <div style="background: white; padding: 32px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
        <p style="color: #374151;">Good morning, ${subscriber.first_name}. Here are your <strong>${matches.length} new tender matches</strong>:</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <thead>
            <tr style="background: #f8f9fa;">
              <th style="padding: 12px; text-align: left; color: #6b7280; font-size: 12px; text-transform: uppercase;">Tender</th>
              <th style="padding: 12px; text-align: left; color: #6b7280; font-size: 12px; text-transform: uppercase;">Department</th>
              <th style="padding: 12px; text-align: left; color: #6b7280; font-size: 12px; text-transform: uppercase;">Closing</th>
              <th style="padding: 12px; text-align: left; color: #6b7280; font-size: 12px; text-transform: uppercase;">Match</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <a href="${process.env.NEXTAUTH_URL}/dashboard"
           style="display: inline-block; background: #1e3a5f; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 24px;">
          View All Matches &amp; Drafts
        </a>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
        <p style="color: #6b7280; font-size: 12px;">Tenderpilot · Gqeberha, Eastern Cape · +27 65 576 9100</p>
      </div>
    </div>
    `
  );
}
