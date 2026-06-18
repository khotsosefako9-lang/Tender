"use client";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { UserCircle, Search, FileText } from "lucide-react";

const steps = [
  {
    icon: UserCircle,
    step: "01",
    title: "Set up your profile",
    description: "Tell us your CIDB grade, class, sectors, and contract value range. Takes 5 minutes. We use this to filter out the noise and only surface tenders you're actually eligible for.",
  },
  {
    icon: Search,
    step: "02",
    title: "We find your matches",
    description: "Every morning, Tenderpilot scans 100+ portals — eTenders, NMBM, EC Provincial Treasury, and more — and surfaces tenders matched to your exact profile with a percentage match score.",
  },
  {
    icon: FileText,
    step: "03",
    title: "Receive your draft",
    description: "Your daily email includes matched tenders, AI-drafted bid responses, and a ready-to-submit document package — complete with a compliance checklist for every tender.",
  },
];

export function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <section id="how-it-works" className="py-20 bg-brand-off-white px-4" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-navy mb-4">How Tenderpilot Works</h2>
          <p className="text-gray-600 max-w-xl mx-auto">From registration to your first draft bid — three simple steps.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="relative bg-white rounded-xl p-8 border border-gray-200 shadow-sm"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-brand-navy/10 flex items-center justify-center">
                  <s.icon className="h-6 w-6 text-brand-navy" />
                </div>
                <span className="text-4xl font-black text-gray-100 absolute top-6 right-8">{s.step}</span>
              </div>
              <h3 className="text-xl font-bold text-brand-navy mb-3">{s.title}</h3>
              <p className="text-gray-600 leading-relaxed">{s.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
