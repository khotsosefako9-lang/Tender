"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Logo } from "@/components/landing/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, ChevronRight, ChevronLeft } from "lucide-react";

const STEPS = ["Personal Details", "Company Details", "CIDB Profile", "Contract Preferences", "Choose Plan", "Payment"];

const CIDB_CLASSES = [
  { id: "CE", label: "CE — Civil Engineering" },
  { id: "GB", label: "GB — General Building" },
  { id: "ME", label: "ME — Mechanical Engineering" },
  { id: "EB", label: "EB — Electrical Engineering" },
  { id: "SQ", label: "SQ — Specialist Works" },
];

const PROVINCES = [
  "Eastern Cape", "Western Cape", "Northern Cape", "KwaZulu-Natal",
  "Free State", "Mpumalanga", "Limpopo", "North West", "Gauteng",
];

const SECTORS = [
  "Roads & Infrastructure", "Building & Renovation", "Electrical", "Plumbing",
  "Cleaning Services", "Security", "Catering", "ICT", "Transport", "Landscaping", "Other",
];

const BBBEE_LEVELS = ["Level 1", "Level 2", "Level 3", "Level 4", "Level 5", "Level 6", "Level 7", "Level 8", "Exempt Micro Enterprise (EME)"];

const PLANS = [
  {
    id: "scout", name: "Scout", price: "R399/month",
    features: ["Daily matched tender alerts", "CIDB grade + class filtering", "Province filtering", "Email digest"],
  },
  {
    id: "bid", name: "Bid", price: "R999.99/month", popular: true,
    features: ["Everything in Scout", "AI-drafted bid response per match", "Ready-to-submit document package", "Compliance checklist per tender"],
  },
  {
    id: "pro", name: "Pro", price: "R1,999.99/month",
    features: ["Everything in Bid", "Compliance document vault", "Document expiry tracking", "Bid award history", "Priority support"],
  },
];

type FormData = {
  first_name: string; last_name: string; email: string; phone: string; password: string; confirm_password: string;
  company_name: string; cipc_number: string; csd_number: string; bbbee_level: string; years_in_operation: string;
  cidb_grade: string; cidb_classes: string[]; provinces: string[]; sectors: string[];
  contract_value_min: string; contract_value_max: string; tender_types: string[];
  plan: string; accepted_terms: boolean;
};

const INITIAL: FormData = {
  first_name: "", last_name: "", email: "", phone: "", password: "", confirm_password: "",
  company_name: "", cipc_number: "", csd_number: "", bbbee_level: "", years_in_operation: "",
  cidb_grade: "", cidb_classes: [], provinces: ["Eastern Cape"], sectors: [],
  contract_value_min: "", contract_value_max: "", tender_types: [],
  plan: "bid", accepted_terms: false,
};

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-1 mb-10">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
            i < current ? "bg-green-500 text-white" :
            i === current ? "bg-brand-navy text-white" :
            "bg-gray-200 text-gray-400"
          }`}>
            {i < current ? <Check className="h-4 w-4" /> : i + 1}
          </div>
          {i < total - 1 && <div className={`w-8 h-0.5 ${i < current ? "bg-green-500" : "bg-gray-200"}`} />}
        </div>
      ))}
    </div>
  );
}

function MultiCheckbox({ options, selected, onChange }: { options: { id: string; label: string }[]; selected: string[]; onChange: (v: string[]) => void }) {
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {options.map((o) => (
        <label key={o.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
          selected.includes(o.id) ? "border-brand-navy bg-blue-50" : "border-gray-200 hover:border-gray-300"
        }`}>
          <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${selected.includes(o.id) ? "bg-brand-navy border-brand-navy" : "border-gray-300"}`}>
            {selected.includes(o.id) && <Check className="h-3 w-3 text-white" />}
          </div>
          <input type="checkbox" className="sr-only" checked={selected.includes(o.id)} onChange={() => toggle(o.id)} />
          <span className="text-sm text-gray-700">{o.label}</span>
        </label>
      ))}
    </div>
  );
}

function formatCurrencyInput(val: string): string {
  const num = val.replace(/\D/g, "");
  return num ? Number(num).toLocaleString("en-ZA") : "";
}

function OnboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("onboard_data");
      if (saved) return { ...INITIAL, ...JSON.parse(saved), plan: searchParams.get("plan") || "bid" };
    }
    return { ...INITIAL, plan: searchParams.get("plan") || "bid" };
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(false);

  const set = (field: keyof FormData, value: unknown) => {
    setData((prev) => {
      const next = { ...prev, [field]: value };
      sessionStorage.setItem("onboard_data", JSON.stringify(next));
      return next;
    });
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateStep = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (step === 0) {
      if (!data.first_name.trim()) e.first_name = "First name is required";
      if (!data.last_name.trim()) e.last_name = "Last name is required";
      if (!data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "Please enter a valid email address";
      if (!data.phone.match(/^(\+27|0)[0-9]{9}$/)) e.phone = "Please enter a valid South African phone number (e.g. 0765769100 or +27765769100)";
      if (data.password.length < 8) e.password = "Password must be at least 8 characters";
      if (data.password !== data.confirm_password) e.confirm_password = "Passwords do not match";
    }
    if (step === 1) {
      if (!data.company_name.trim()) e.company_name = "Company name is required";
    }
    if (step === 2) {
      if (!data.cidb_grade) e.cidb_grade = "Please select your CIDB grade";
      if (data.cidb_classes.length === 0) e.cidb_classes = "Select at least one CIDB class";
      if (data.provinces.length === 0) e.provinces = "Select at least one province";
    }
    if (step === 4) {
      if (!data.accepted_terms) e.accepted_terms = "You must accept the Terms of Service to continue";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep()) setStep((s) => Math.min(s + 1, STEPS.length - 1)); };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.redirect_url) {
        sessionStorage.removeItem("onboard_data");
        window.location.href = json.redirect_url;
      } else {
        alert(json.error || "An error occurred. Please try again.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const planDetails = PLANS.find((p) => p.id === data.plan);
  const planPrices: Record<string, string> = { scout: "R399.00", bid: "R999.99", pro: "R1,999.99" };

  return (
    <div className="min-h-screen bg-brand-off-white">
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex justify-center">
        <Logo />
      </div>
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-brand-navy mb-1">{STEPS[step]}</h1>
          <p className="text-gray-500 text-sm">Step {step + 1} of {STEPS.length}</p>
        </div>
        <StepIndicator current={step} total={STEPS.length} />
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          {step === 0 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input id="first_name" value={data.first_name} onChange={(e) => set("first_name", e.target.value)} className="mt-1" />
                  {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input id="last_name" value={data.last_name} onChange={(e) => set("last_name", e.target.value)} className="mt-1" />
                  {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input id="email" type="email" value={data.email} onChange={(e) => set("email", e.target.value)} className="mt-1" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input id="phone" type="tel" placeholder="+27 65 576 9100 or 0655769100" value={data.phone} onChange={(e) => set("phone", e.target.value)} className="mt-1" />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input id="password" type="password" placeholder="Minimum 8 characters" value={data.password} onChange={(e) => set("password", e.target.value)} className="mt-1" />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>
              <div>
                <Label htmlFor="confirm_password">Confirm Password *</Label>
                <Input id="confirm_password" type="password" value={data.confirm_password} onChange={(e) => set("confirm_password", e.target.value)} className="mt-1" />
                {errors.confirm_password && <p className="text-red-500 text-xs mt-1">{errors.confirm_password}</p>}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <Label htmlFor="company_name">Company Name *</Label>
                <Input id="company_name" value={data.company_name} onChange={(e) => set("company_name", e.target.value)} className="mt-1" />
                {errors.company_name && <p className="text-red-500 text-xs mt-1">{errors.company_name}</p>}
              </div>
              <div>
                <Label htmlFor="cipc_number">CIPC Registration Number (optional)</Label>
                <Input id="cipc_number" placeholder="e.g. 2015/123456/07" value={data.cipc_number} onChange={(e) => set("cipc_number", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="csd_number">CSD Supplier Number (optional)</Label>
                <Input id="csd_number" placeholder="e.g. MAAA0000001" value={data.csd_number} onChange={(e) => set("csd_number", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="bbbee_level">B-BBEE Level</Label>
                <select id="bbbee_level" className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy" value={data.bbbee_level} onChange={(e) => set("bbbee_level", e.target.value)}>
                  <option value="">Select B-BBEE level</option>
                  {BBBEE_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="years_in_operation">Years in Operation</Label>
                <Input id="years_in_operation" type="number" min="0" max="100" value={data.years_in_operation} onChange={(e) => set("years_in_operation", e.target.value)} className="mt-1" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="cidb_grade">CIDB Grade *</Label>
                <select id="cidb_grade" className="mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy" value={data.cidb_grade} onChange={(e) => set("cidb_grade", e.target.value)}>
                  <option value="">Select your CIDB grade</option>
                  {[1,2,3,4,5,6,7,8,9].map((g) => <option key={g} value={String(g)}>Grade {g}</option>)}
                </select>
                {errors.cidb_grade && <p className="text-red-500 text-xs mt-1">{errors.cidb_grade}</p>}
              </div>
              <div>
                <Label className="mb-3 block">CIDB Class/es *</Label>
                <MultiCheckbox options={CIDB_CLASSES} selected={data.cidb_classes} onChange={(v) => set("cidb_classes", v)} />
                {errors.cidb_classes && <p className="text-red-500 text-xs mt-1">{errors.cidb_classes}</p>}
              </div>
              <div>
                <Label className="mb-3 block">Provinces You Operate In *</Label>
                <MultiCheckbox options={PROVINCES.map((p) => ({ id: p, label: p }))} selected={data.provinces} onChange={(v) => set("provinces", v)} />
                {errors.provinces && <p className="text-red-500 text-xs mt-1">{errors.provinces}</p>}
              </div>
              <div>
                <Label className="mb-3 block">Sectors (optional)</Label>
                <MultiCheckbox options={SECTORS.map((s) => ({ id: s, label: s }))} selected={data.sectors} onChange={(v) => set("sectors", v)} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min_value">Minimum Contract Value (R)</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-2.5 text-gray-500 text-sm">R</span>
                    <Input id="min_value" className="pl-7" placeholder="50,000" value={data.contract_value_min}
                      onChange={(e) => set("contract_value_min", formatCurrencyInput(e.target.value))} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="max_value">Maximum Contract Value (R)</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-2.5 text-gray-500 text-sm">R</span>
                    <Input id="max_value" className="pl-7" placeholder="5,000,000" value={data.contract_value_max}
                      onChange={(e) => set("contract_value_max", formatCurrencyInput(e.target.value))} />
                  </div>
                </div>
              </div>
              <div>
                <Label className="mb-3 block">Tender Types of Interest</Label>
                <MultiCheckbox
                  options={[
                    { id: "Formal Tender", label: "Formal Tender" },
                    { id: "RFQ", label: "RFQ (Request for Quotation)" },
                    { id: "RFP", label: "RFP (Request for Proposal)" },
                  ]}
                  selected={data.tender_types}
                  onChange={(v) => set("tender_types", v)}
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="grid gap-4">
                {PLANS.map((plan) => (
                  <label key={plan.id} className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all ${
                    data.plan === plan.id ? "border-brand-navy bg-blue-50" : "border-gray-200 hover:border-gray-300"
                  }`}>
                    <input type="radio" name="plan" value={plan.id} checked={data.plan === plan.id} onChange={() => set("plan", plan.id)} className="sr-only" />
                    {plan.popular && <span className="absolute top-3 right-3 bg-brand-amber text-white text-xs font-bold px-2 py-0.5 rounded-full">Most Popular</span>}
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${data.plan === plan.id ? "border-brand-navy" : "border-gray-300"}`}>
                        {data.plan === plan.id && <div className="w-2 h-2 rounded-full bg-brand-navy" />}
                      </div>
                      <h3 className="font-bold text-brand-navy">{plan.name}</h3>
                      <span className="text-sm text-gray-500 ml-auto font-semibold">{plan.price}</span>
                    </div>
                    <ul className="ml-7 space-y-1">
                      {plan.features.slice(0, 3).map((f) => (
                        <li key={f} className="text-xs text-gray-600 flex items-center gap-2">
                          <Check className="h-3 w-3 text-green-500 flex-shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                  </label>
                ))}
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-amber-800 font-medium mb-1">Success Fee Disclosure</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  A <strong>2% success fee</strong> on the value of any tender awarded to you that appeared on Tenderpilot during your active subscription is payable to Tenderpilot. This is only payable on actually awarded and paid contracts — not on bids submitted. Full details in our Terms of Service.
                </p>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <div className={`mt-0.5 w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${data.accepted_terms ? "bg-brand-navy border-brand-navy" : "border-gray-300"}`}
                  onClick={() => set("accepted_terms", !data.accepted_terms)}>
                  {data.accepted_terms && <Check className="h-3 w-3 text-white" />}
                </div>
                <input type="checkbox" className="sr-only" checked={data.accepted_terms} onChange={() => set("accepted_terms", !data.accepted_terms)} />
                <span className="text-sm text-gray-700">
                  I have read and accept the <a href="/terms" target="_blank" className="text-brand-navy underline">Terms of Service</a> and <a href="/privacy" target="_blank" className="text-brand-navy underline">Privacy Policy</a>, including the 2% success fee disclosure.
                </span>
              </label>
              {errors.accepted_terms && <p className="text-red-500 text-xs">{errors.accepted_terms}</p>}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="font-bold text-brand-navy mb-4">Order Summary</h3>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Plan</span>
                  <span className="font-semibold text-brand-navy">{planDetails?.name}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Billing</span>
                  <span className="font-semibold text-brand-navy">Monthly</span>
                </div>
                <div className="border-t border-gray-200 pt-3 mt-3 flex items-center justify-between">
                  <span className="font-bold text-gray-900">Total today</span>
                  <span className="text-2xl font-black text-brand-navy">{planPrices[data.plan]}</span>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p><span className="font-medium">Subscriber:</span> {data.first_name} {data.last_name}</p>
                <p><span className="font-medium">Email:</span> {data.email}</p>
                <p><span className="font-medium">Company:</span> {data.company_name}</p>
                <p><span className="font-medium">CIDB Grade:</span> {data.cidb_grade}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  You'll be redirected to PayFast to complete your payment securely. Your subscription will activate immediately after successful payment.
                </p>
              </div>
              <Button className="w-full" size="lg" onClick={submit} disabled={loading} variant="amber">
                {loading ? "Processing..." : "Pay with PayFast →"}
              </Button>
              <p className="text-center text-xs text-gray-400">
                Secured by PayFast · Cancel anytime from your dashboard
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-between mt-6">
          <Button variant="ghost" onClick={back} disabled={step === 0} className="gap-2">
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
          {step < STEPS.length - 1 && (
            <Button onClick={next} className="gap-2">
              {step === STEPS.length - 2 ? "Review & Pay" : "Continue"} <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OnboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OnboardContent />
    </Suspense>
  );
}
