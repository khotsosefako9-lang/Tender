import Link from "next/link";

interface LogoProps {
  className?: string;
  light?: boolean;
}

export function Logo({ className = "", light = false }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-2 font-bold ${className}`}>
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="14" cy="14" r="13" stroke={light ? "#f59e0b" : "#1e3a5f"} strokeWidth="2" />
        <circle cx="14" cy="14" r="2.5" fill={light ? "#f59e0b" : "#1e3a5f"} />
        {/* Compass needle */}
        <path d="M14 4L16 14L14 12L12 14L14 4Z" fill={light ? "#f59e0b" : "#1e3a5f"} />
        <path d="M14 24L12 14L14 16L16 14L14 24Z" fill={light ? "rgba(245,158,11,0.4)" : "rgba(30,58,95,0.3)"} />
        {/* Cardinal marks */}
        <line x1="14" y1="2" x2="14" y2="5" stroke={light ? "#f59e0b" : "#1e3a5f"} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="14" y1="23" x2="14" y2="26" stroke={light ? "#f59e0b" : "#1e3a5f"} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="2" y1="14" x2="5" y2="14" stroke={light ? "#f59e0b" : "#1e3a5f"} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="23" y1="14" x2="26" y2="14" stroke={light ? "#f59e0b" : "#1e3a5f"} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span className={`text-xl tracking-tight ${light ? "text-white" : "text-brand-navy"}`}>
        Tender<span className={light ? "text-brand-amber" : "text-brand-amber"}>pilot</span>
      </span>
    </Link>
  );
}
