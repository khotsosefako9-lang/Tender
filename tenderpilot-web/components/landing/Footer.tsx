import Link from "next/link";
import { Logo } from "./Logo";
import { Phone, Mail, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-brand-navy text-white py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <Logo light />
            <p className="text-blue-300 text-sm mt-4 max-w-sm leading-relaxed">
              Tenderpilot helps CIDB-registered South African SMEs find, match, and respond to government tenders efficiently. Built for contractors, tradespeople, and service providers in the Eastern Cape.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-blue-300">
              <li><Link href="/#how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link href="/#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/#faq" className="hover:text-white transition-colors">FAQ</Link></li>
              <li><Link href="/onboard" className="hover:text-white transition-colors">Sign Up</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Login</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-blue-300">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <a href="tel:+27655769100" className="hover:text-white">+27 65 576 9100</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <a href="mailto:khotsosefako0@gmail.com" className="hover:text-white">khotsosefako0@gmail.com</a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>Gqeberha (Port Elizabeth), Eastern Cape, South Africa</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-blue-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-blue-400 text-sm">© {new Date().getFullYear()} Tenderpilot. Built for South African SMEs.</p>
          <div className="flex gap-6 text-sm text-blue-400">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
