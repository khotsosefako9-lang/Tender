"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "What portals do you monitor?",
    a: "Tenderpilot monitors eTenders (the National Treasury portal), Nelson Mandela Bay Municipality (NMBM), Eastern Cape Provincial Treasury, Buffalo City Metropolitan Municipality, and 95+ other national and provincial procurement portals. We're continuously adding new sources.",
  },
  {
    q: "How does the CIDB grade filter work?",
    a: "When you set up your profile, you enter your CIDB registration grade (1–9) and class (CE, GB, ME, EB, SQ). Our matching engine only surfaces tenders whose grade and class requirements fall within your registration — so you only see tenders you're actually eligible to bid on.",
  },
  {
    q: "Is the AI draft ready to submit as-is?",
    a: "No — and we're transparent about that. The AI draft is a structured first draft: it fills in the standard sections using your company profile and publicly available tender information. You must review it, add your specific pricing, and verify compliance before submitting. Think of it as a very good starting point, not a finished document.",
  },
  {
    q: "What documents do I need to upload?",
    a: "For full functionality, you'll want to upload: Tax Clearance Certificate, CIDB Registration Certificate, B-BBEE Certificate, CIPC Company Registration, CSD Registration Confirmation, Proof of Address, Municipal Rates Account, and Banking Details. The platform tracks expiry dates on all of them.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. You can cancel your subscription at any time from your dashboard. Your subscription will remain active until the end of the billing period you've already paid for. There are no cancellation fees.",
  },
  {
    q: "What is the 2% success fee?",
    a: "If a tender that appeared on Tenderpilot during your active subscription is awarded to your business, a success fee of 2% of the awarded tender value becomes payable to Tenderpilot. This is disclosed at sign-up in our Terms of Service and is only payable on actual awarded and paid contracts — not on bids submitted.",
  },
  {
    q: "Do you cover tenders outside the Eastern Cape?",
    a: "We cover all national tenders (published on eTenders) regardless of province. For provincial and municipal tenders, our current focus is the Eastern Cape — Buffalo City, NMBM, Amathole, OR Tambo, and Eastern Cape Provincial Treasury. We're expanding to other provinces based on subscriber demand.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="faq" className="py-20 bg-white px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-navy mb-4">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-semibold text-brand-navy pr-4">{faq.q}</span>
                <ChevronDown className={cn("h-5 w-5 text-gray-400 flex-shrink-0 transition-transform", open === i && "rotate-180")} />
              </button>
              {open === i && (
                <div className="px-5 pb-5">
                  <p className="text-gray-600 leading-relaxed text-sm">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
