import Link from "next/link";
import { Logo } from "@/components/landing/Logo";
import { Footer } from "@/components/landing/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-4 py-4 flex justify-center">
        <Logo />
      </header>
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-brand-navy mb-3">Terms of Service</h1>
          <p className="text-gray-500 text-sm">Last updated: {new Date().toLocaleDateString("en-ZA", { dateStyle: "long" })}</p>
        </div>
        <div className="prose prose-slate max-w-none space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-brand-navy mt-8 mb-3">1. Introduction and Acceptance</h2>
            <p>These Terms of Service ("Terms") govern your access to and use of the Tenderpilot platform ("Service"), operated by Khotso Sefako t/a Tenderpilot ("we", "us", "our"), registered in the Republic of South Africa and based in Gqeberha, Eastern Cape.</p>
            <p>By creating an account or using the Service, you agree to be bound by these Terms. If you do not agree, you must not use the Service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-brand-navy mt-8 mb-3">2. Description of Service</h2>
            <p>Tenderpilot is a software-as-a-service (SaaS) platform that:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Monitors South African government procurement portals for tender opportunities;</li>
              <li>Matches tender opportunities to subscriber profiles based on CIDB registration, province, and sector;</li>
              <li>Generates first-draft bid response documents using artificial intelligence (on Bid and Pro tiers);</li>
              <li>Provides document management and compliance tracking (on Bid and Pro tiers); and</li>
              <li>Sends daily email digests of matched tenders to active subscribers.</li>
            </ul>
            <p className="mt-4">The Service is intended for CIDB-registered businesses and sole traders operating in the Republic of South Africa, with a primary focus on the Eastern Cape province.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-brand-navy mt-8 mb-3">3. Subscription Tiers and Fees</h2>
            <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">3.1 Monthly Subscription</h3>
            <p>The following monthly subscription fees apply (prices inclusive of VAT at 15%):</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Scout:</strong> R399.00 per month</li>
              <li><strong>Bid:</strong> R999.99 per month</li>
              <li><strong>Pro:</strong> R1,999.99 per month</li>
            </ul>
            <p className="mt-3">All fees are denominated in South African Rand (ZAR) and billed monthly via PayFast recurring billing. Prices are subject to change with 30 days' written notice.</p>

            <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">3.2 Success Fee — IMPORTANT</h3>
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg my-4">
              <p className="font-bold text-amber-900 mb-2">Success Fee Disclosure</p>
              <p className="text-amber-800">In addition to the monthly subscription fee, a <strong>success fee of 2% (two percent)</strong> of the awarded contract value is payable to Tenderpilot where:</p>
              <ul className="list-disc pl-6 mt-2 text-amber-800 space-y-1">
                <li>A tender appeared on the Tenderpilot platform during your active subscription period;</li>
                <li>You submitted a bid for that tender; and</li>
                <li>You were awarded the contract and received payment from the procuring department.</li>
              </ul>
              <p className="mt-3 text-amber-800">The success fee is only payable on <strong>awarded and paid contracts</strong> — not on bids submitted. You are required to notify Tenderpilot within 14 calendar days of receiving written notification of any contract award where the tender appeared on the platform during your subscription.</p>
              <p className="mt-2 text-amber-800">The 2% success fee is calculated on the total contract value (inclusive of VAT) and is payable within 30 days of the first payment received from the procuring department under the awarded contract.</p>
            </div>
            <p>Failure to disclose a contract award may result in suspension of your account and legal action to recover the owed success fee plus interest at the prime lending rate plus 2%.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-brand-navy mt-8 mb-3">4. Payment and Billing</h2>
            <p>Subscriptions are processed via PayFast. By subscribing, you authorise PayFast to debit your chosen payment method on a recurring monthly basis. You must maintain a valid payment method. Failed payments may result in suspension of your account after 7 days' notice.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-brand-navy mt-8 mb-3">5. Cancellation Policy</h2>
            <p>You may cancel your subscription at any time from your dashboard settings. Cancellation will take effect at the end of your current billing period — no refunds are issued for partial months. Tenderpilot may cancel your subscription with 30 days' notice, or immediately for breach of these Terms.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-brand-navy mt-8 mb-3">6. Nature of AI-Generated Content</h2>
            <p>AI-generated bid drafts provided by Tenderpilot are <strong>first drafts only</strong>. They are provided as a starting point and must be reviewed, amended, verified, and completed by you before submission. Tenderpilot makes no warranty that any AI-generated draft will result in a successful bid, meet all technical requirements of a specific tender, or be free of errors.</p>
            <p>You are solely responsible for the accuracy, completeness, and compliance of any bid document you submit to a procuring authority. Tenderpilot is not liable for any disqualification, loss of opportunity, or other consequence arising from the use of AI-generated content.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-brand-navy mt-8 mb-3">7. Accuracy of Tender Information</h2>
            <p>Tender information is sourced from publicly available government procurement portals. While we make reasonable efforts to ensure accuracy, Tenderpilot cannot guarantee that all tender information is complete, current, or error-free. Always verify tender details directly on the relevant procuring department's portal before submitting a bid.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-brand-navy mt-8 mb-3">8. Intellectual Property</h2>
            <p>The Tenderpilot platform, including its software, algorithms, branding, and design, is the intellectual property of Khotso Sefako t/a Tenderpilot. You are granted a limited, non-exclusive, non-transferable licence to use the Service for your business purposes during your active subscription. You may not copy, reproduce, resell, or reverse-engineer any part of the Service.</p>
            <p>Content you upload to the platform (compliance documents, company information) remains your property. You grant Tenderpilot a limited licence to use such content solely to provide the Service to you.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-brand-navy mt-8 mb-3">9. Limitation of Liability</h2>
            <p>To the maximum extent permitted by South African law, Tenderpilot's total liability to you for any claim arising from your use of the Service shall not exceed the subscription fees paid by you in the 3 months preceding the claim. Tenderpilot is not liable for indirect, consequential, or loss-of-profit damages.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-brand-navy mt-8 mb-3">10. Governing Law and Jurisdiction</h2>
            <p>These Terms are governed by the laws of the Republic of South Africa. Any disputes shall be subject to the exclusive jurisdiction of the courts of the Eastern Cape, South Africa, with Gqeberha (Port Elizabeth) as the agreed jurisdiction.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-brand-navy mt-8 mb-3">11. Contact</h2>
            <p>Khotso Sefako t/a Tenderpilot · Gqeberha, Eastern Cape, South Africa<br />
            Phone: <a href="tel:+27655769100" className="text-brand-navy underline">+27 65 576 9100</a><br />
            Email: <a href="mailto:khotso@tenderpilot.co.za" className="text-brand-navy underline">khotso@tenderpilot.co.za</a></p>
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
