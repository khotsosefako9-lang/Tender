import Link from "next/link";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Logo } from "@/components/landing/Logo";
import { Button } from "@/components/ui/button";

export default function WelcomePage({
  searchParams,
}: {
  searchParams: { name?: string; tier?: string };
}) {
  const name = searchParams.name || "there";
  const tierLabel: Record<string, string> = { scout: "Scout", bid: "Bid", pro: "Pro" };
  const tier = tierLabel[searchParams.tier || "scout"] || "Scout";

  return (
    <div className="min-h-screen bg-brand-off-white flex flex-col items-center justify-center px-4 py-12">
      <div className="mb-8"><Logo /></div>
      <div className="max-w-lg w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-brand-navy mb-2">
          You're in, {name}.
        </h1>
        <p className="text-gray-500 mb-8">
          Your <strong className="text-brand-navy">{tier}</strong> subscription is now active.
        </p>
        <div className="bg-gray-50 rounded-xl p-6 text-left mb-8 space-y-4">
          <h3 className="font-semibold text-brand-navy">What happens next:</h3>
          <div className="space-y-3">
            {[
              "Your business profile has been saved and our matching engine is running.",
              "Your first daily tender digest will arrive tomorrow morning in your inbox.",
              "Log in to your dashboard to upload compliance documents and complete your vault.",
            ].map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-amber text-white text-xs flex items-center justify-center flex-shrink-0 font-bold">{i + 1}</div>
                <p className="text-sm text-gray-600 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
        <Button asChild size="lg" className="w-full gap-2">
          <Link href="/dashboard">
            Go to Dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
