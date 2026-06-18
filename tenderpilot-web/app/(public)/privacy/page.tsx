import Link from "next/link";
import { Logo } from "@/components/landing/Logo";
import { Footer } from "@/components/landing/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-4 py-4 flex justify-center">
        <Logo />
      </header>
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-brand-navy mb-3">Privacy Policy</h1>
          <p className="text-gray-500 text-sm">Last updated: {new Date().toLocaleDateString("en-ZA", { dateStyle: "long" })}</p>
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 font-medium">POPIA Compliance Notice</p>
            <p className="text-sm text-blue-700 mt-1">This Privacy Policy is prepared in compliance with the Protection of Personal Information Act 4 of 2013 (POPIA) of the Republic of South Africa.</p>
          </div>
        </div>
        <div className="prose prose-slate max-w-none space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-brand-navy mt-8 mb-3">1. Responsible Party</h2>
            <p>The Responsible Party (as defined under POPIA) is:</p>
            <p className="bg-gray-50 p-4 rounded-lg text-sm">
              <strong>Khotso Sefako t/a Tenderpilot</strong><br />
              Gqeberha (Port Elizabeth), Eastern Cape, Republic of South Africa<br />
              Phone: +27 65 576 9100<br />
              Email: khotsosefako0@gmail.com
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-brand-navy mt-8 mb-3">2. Personal Information We Collect</h2>
            <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Full name, email address, phone number, and password (for account creation)</li>
              <li>Business name, CIPC registration number, CSD supplier number, and B-BBEE level</li>
              <li>CIDB registration grade and class</li>
              <li>Provinces of operation and business sectors</li>
              <li>Contract value preferences</li>
              <li>Compliance documents uploaded to your document vault (Tax Clearance, CIDB Certificate, etc.)</li>
              <li>Payment information (processed by PayFast; we do not store card details)</li>
            </ul>
            <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">2.2 Information Collected Automatically</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Login timestamps and session information</li>
              <li>Pages visited within the dashboard</li>
              <li>Email open and click events (via SendGrid)</li>
              <li>Device type and browser for security logging</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-brand-navy mt-8 mb-3">3. Purpose of Processing</h2>
            <p>We collect and use your personal information solely for the following purposes (as required by POPIA Section 13):</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Service delivery:</strong> Matching tenders to your profile, generating bid drafts, and sending daily digests</li>
              <li><strong>Account management:</strong> Creating and maintaining your subscriber account</li>
              <li><strong>Billing and payment:</strong> Processing monthly subscriptions and success fees</li>
              <li><strong>Communication:</strong> Sending service notifications, welcome emails, and digest emails</li>
              <li><strong>Legal compliance:</strong> Maintaining records as required by applicable South African law</li>
              <li><strong>Service improvement:</strong> Analysing aggregate usage patterns to improve the platform (no individual profiling for marketing)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-brand-navy mt-8 mb-3">4. Lawful Basis for Processing</h2>
            <p>We process your personal information on the following lawful grounds under POPIA:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Contract:</strong> Processing necessary to perform our subscription agreement with you</li>
              <li><strong>Consent:</strong> Where you have explicitly agreed (e.g. marketing communications)</li>
              <li><strong>Legitimate interests:</strong> Security monitoring and fraud prevention</li>
              <li><strong>Legal obligation:</strong> Tax records and financial compliance</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-brand-navy mt-8 mb-3">5. How We Store Your Data</h2>
            <p>Your data is stored in a secured SQLite database hosted on Vercel's infrastructure. We implement the following security measures:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Passwords are hashed using bcrypt (never stored in plain text)</li>
              <li>All data transmission uses HTTPS/TLS encryption</li>
              <li>Uploaded documents are stored in a private directory not publicly accessible</li>
              <li>Admin access requires separate credentials distinct from subscriber accounts</li>
              <li>Database access is restricted to server-side code only</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-brand-navy mt-8 mb-3">6. Third-Party Service Providers</h2>
            <p>We share limited personal information with the following third-party operators (operators as defined by POPIA):</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>PayFast (South Africa):</strong> Payment processing. PayFast receives your name, email, and subscription amount. We do not receive or store card details.</li>
              <li><strong>Twilio/SendGrid:</strong> Email delivery service. Receives your email address and email content for delivery purposes.</li>
              <li><strong>Vercel:</strong> Hosting infrastructure. Your data resides on Vercel's servers in accordance with their data processing agreements.</li>
              <li><strong>Anthropic (Claude API):</strong> AI bid draft generation. Tender information and your company profile details are transmitted to generate bid drafts. No personal identification data beyond company name and CIDB grade is transmitted.</li>
            </ul>
            <p>We do not sell your personal information to any third party.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-brand-navy mt-8 mb-3">7. Your Rights Under POPIA</h2>
            <p>As a data subject under POPIA, you have the following rights:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Right of access:</strong> Request a copy of all personal information we hold about you</li>
              <li><strong>Right to correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Right to deletion:</strong> Request deletion of your personal information (subject to legal retention requirements)</li>
              <li><strong>Right to object:</strong> Object to the processing of your personal information</li>
              <li><strong>Right to lodge a complaint:</strong> Lodge a complaint with the Information Regulator of South Africa</li>
            </ul>
            <p>To exercise any of these rights, contact us at <a href="mailto:khotsosefako0@gmail.com" className="text-brand-navy underline">khotsosefako0@gmail.com</a>. We will respond within 30 days.</p>
            <p className="mt-2">The Information Regulator of South Africa can be contacted at:<br />
            <a href="https://www.justice.gov.za/inforeg/" className="text-brand-navy underline">www.justice.gov.za/inforeg</a> · inforeg@justice.gov.za</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-brand-navy mt-8 mb-3">8. Data Retention</h2>
            <p>We retain your personal information for the following periods:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Account data: Duration of active subscription + 5 years (for financial records)</li>
              <li>Uploaded compliance documents: Deleted within 30 days of account closure upon request</li>
              <li>Email logs: 12 months</li>
              <li>Payment records: 7 years (as required by South African tax law)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-brand-navy mt-8 mb-3">9. Cookies</h2>
            <p>Tenderpilot uses only essential cookies required for authentication (session token) and security (CSRF protection). We do not use advertising cookies or third-party tracking cookies.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-brand-navy mt-8 mb-3">10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of material changes via email at least 14 days before they take effect. Continued use of the Service after the effective date constitutes acceptance of the updated policy.</p>
          </section>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-200">
          <Link href="/" className="text-brand-navy text-sm hover:underline">← Back to Tenderpilot</Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
