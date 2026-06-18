"use client";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    id: "scout",
    name: "Scout",
    price: "R399",
    period: "/month",
    description: "Perfect for businesses just getting started with government procurement.",
    features: [
      "Daily matched tender alerts",
      "CIDB grade + class filtering",
      "Province filtering",
      "Sector filtering",
      "Daily email digest",
      "Access to 100+ portals",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    id: "bid",
    name: "Bid",
    price: "R999.99",
    period: "/month",
    description: "Everything you need to submit competitive, compliant bids efficiently.",
    features: [
      "Everything in Scout",
      "AI-drafted bid response per match",
      "Ready-to-submit document package",
      "Compliance checklist per tender",
      "Copy-to-clipboard draft sections",
      "Match score explanation",
    ],
    cta: "Get Started",
    highlighted: true,
    badge: "Most Popular",
  },
  {
    id: "pro",
    name: "Pro",
    price: "R1,999.99",
    period: "/month",
    description: "Full intelligence suite for serious tender businesses.",
    features: [
      "Everything in Bid",
      "Compliance document vault",
      "Document expiry tracking + alerts",
      "Bid award history (who won, at what price)",
      "Competitive intelligence by sector",
      "Priority email support",
    ],
    cta: "Get Started",
    highlighted: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 bg-brand-off-white px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-navy mb-4">Simple, Transparent Pricing</h2>
          <p className="text-gray-600 max-w-xl mx-auto">Choose the tier that matches your ambition. Cancel anytime.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 items-start">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-8 border ${
                plan.highlighted
                  ? "bg-brand-navy border-brand-navy shadow-2xl text-white"
                  : "bg-white border-gray-200 shadow-sm"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-brand-amber text-white text-xs font-bold px-4 py-1.5 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}
              <div className="mb-6">
                <h3 className={`text-xl font-bold mb-1 ${plan.highlighted ? "text-white" : "text-brand-navy"}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mb-4 ${plan.highlighted ? "text-blue-200" : "text-gray-500"}`}>
                  {plan.description}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className={`text-4xl font-black ${plan.highlighted ? "text-white" : "text-brand-navy"}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ${plan.highlighted ? "text-blue-200" : "text-gray-400"}`}>{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${plan.highlighted ? "text-brand-amber" : "text-green-500"}`} />
                    <span className={`text-sm ${plan.highlighted ? "text-blue-100" : "text-gray-600"}`}>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className={`w-full ${plan.highlighted ? "bg-brand-amber hover:bg-amber-600 text-white" : ""}`}
                variant={plan.highlighted ? "amber" : "outline"}
              >
                <Link href={`/onboard?plan=${plan.id}`}>{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
        <p className="text-center text-gray-500 text-sm mt-8 max-w-2xl mx-auto">
          A <strong>2% success fee</strong> applies on the value of any tender awarded through Tenderpilot during your active subscription. Full details in our{" "}
          <Link href="/terms" className="underline text-brand-navy">Terms of Service</Link>.
        </p>
      </div>
    </section>
  );
}
