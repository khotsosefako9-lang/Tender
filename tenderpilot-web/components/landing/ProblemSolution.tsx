import { XCircle, CheckCircle } from "lucide-react";

export function ProblemSolution() {
  return (
    <section className="py-20 bg-white px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-navy mb-4">The Challenge, and Our Solution</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
          {/* Problem */}
          <div className="bg-red-50 p-8 md:p-12">
            <div className="flex items-center gap-3 mb-6">
              <XCircle className="h-7 w-7 text-red-500" />
              <h3 className="text-xl font-bold text-red-700">The Problem</h3>
            </div>
            <ul className="space-y-4">
              {[
                "Tenders are scattered across 50+ government portals. You can't check them all daily.",
                "Writing a compliant bid takes a full working day, even before you know if you'll win.",
                "Miss a single deadline or forget a required form and you're automatically disqualified.",
                "You often find out about tenders too late, when there's no time to prepare a quality response.",
                "Compliance documents expire and you don't realise until you're already in the process.",
              ].map((item) => (
                <li key={item} className="flex gap-3 text-red-800 text-sm leading-relaxed">
                  <span className="mt-1 h-2 w-2 rounded-full bg-red-400 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          {/* Solution */}
          <div className="bg-brand-navy p-8 md:p-12">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle className="h-7 w-7 text-green-400" />
              <h3 className="text-xl font-bold text-green-400">The Tenderpilot Solution</h3>
            </div>
            <ul className="space-y-4">
              {[
                "We monitor 100+ portals every morning so you wake up to a curated list of relevant tenders.",
                "AI generates a structured first-draft bid for every match. You review and refine, not write from scratch.",
                "Every tender comes with a compliance checklist so you never miss a required document again.",
                "Alerts go out as soon as a matching tender is published, giving you maximum preparation time.",
                "Your document vault tracks expiry dates and warns you 30 days before anything lapses.",
              ].map((item) => (
                <li key={item} className="flex gap-3 text-blue-100 text-sm leading-relaxed">
                  <CheckCircle className="mt-0.5 h-4 w-4 text-green-400 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="text-center text-gray-500 text-sm mt-8 max-w-xl mx-auto">
          "In the time it used to take to write one bid, you can review and submit five."
        </p>
      </div>
    </section>
  );
}
