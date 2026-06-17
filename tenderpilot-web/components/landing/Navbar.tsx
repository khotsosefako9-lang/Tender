"use client";
import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Logo />
        <div className="hidden md:flex items-center gap-6">
          <Link href="/#how-it-works" className="text-sm text-gray-600 hover:text-brand-navy transition-colors">How It Works</Link>
          <Link href="/#pricing" className="text-sm text-gray-600 hover:text-brand-navy transition-colors">Pricing</Link>
          <Link href="/#faq" className="text-sm text-gray-600 hover:text-brand-navy transition-colors">FAQ</Link>
          <Link href="/login" className="text-sm text-gray-600 hover:text-brand-navy transition-colors">Login</Link>
          <Button asChild size="sm">
            <Link href="/onboard">Get Started</Link>
          </Button>
        </div>
        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 flex flex-col gap-4">
          <Link href="/#how-it-works" onClick={() => setOpen(false)} className="text-gray-700 hover:text-brand-navy">How It Works</Link>
          <Link href="/#pricing" onClick={() => setOpen(false)} className="text-gray-700 hover:text-brand-navy">Pricing</Link>
          <Link href="/#faq" onClick={() => setOpen(false)} className="text-gray-700 hover:text-brand-navy">FAQ</Link>
          <Link href="/login" onClick={() => setOpen(false)} className="text-gray-700 hover:text-brand-navy">Login</Link>
          <Button asChild className="w-full">
            <Link href="/onboard" onClick={() => setOpen(false)}>Get Started</Link>
          </Button>
        </div>
      )}
    </nav>
  );
}
