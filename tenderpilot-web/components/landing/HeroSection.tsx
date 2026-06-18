"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-navy via-[#1e3a5f] to-[#0f2240] py-24 md:py-32 px-4">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
      />
      <div className="relative max-w-5xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
            Never Miss a<br />
            <span className="text-brand-amber">Government Tender</span><br />
            Again
          </h1>
          <p className="text-lg md:text-xl text-blue-200 max-w-2xl mx-auto mb-10 leading-relaxed">
            Tenderpilot monitors 100+ South African procurement portals daily, matches opportunities to your business profile, and generates your first draft bid document, automatically.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="xl" variant="amber">
              <Link href="/onboard">
                Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline" className="border-white/40 text-white hover:bg-white/10 hover:text-white">
              <Link href="#how-it-works">
                <Play className="mr-2 h-4 w-4" /> See How It Works
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
