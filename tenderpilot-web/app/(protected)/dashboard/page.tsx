"use client";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Logo } from "@/components/landing/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, expiryLabel, deadlineUrgency, formatCurrency } from "@/lib/utils";
import {
  LogOut, Upload, Info, FileText, Calendar, Trophy, Copy, Check,
  TrendingUp, Clock, AlertTriangle, CheckCircle2, XCircle
} from "lucide-react";

type Match = {
  id: number; tender_id: number; match_score: number; match_reasons: string; bid_draft_generated: number;
  title: string; department: string; closing_date: string; tender_type: string;
  contract_value_max: number; province: string; draft_id: number | null;
};
type Doc = { id: number; document_type: string; document_name: string; expiry_date: string | null; uploaded_at: string };
type Deadline = { id: number; title: string; department: string; closing_date: string; match_score: number };
type Award = { id: number; tender_title: string; department: string; awarded_to: string; award_value: number; award_date: string };

function MatchScoreBar({ score }: { score: number }) {
  const color = score >= 75 ? "bg-green-500" : score >= 50 ? "bg-brand-amber" : "bg-orange-400";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-bold text-gray-700">{score}%</span>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      title="Copy to clipboard"
    >
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

function BidDraftModal({ matchId, onClose }: { matchId: number; onClose: () => void }) {
  const [draft, setDraft] = useState<Record<string, string> | null>(null);
  useEffect(() => {
    fetch(`/api/dashboard/draft?match_id=${matchId}`).then(r => r.json()).then(d => setDraft(d.draft));
  }, [matchId]);

  const sections = draft ? [
    { key: "executive_summary", label: "Executive Summary" },
    { key: "resource_plan", label: "Company Introduction & Resource Plan" },
    { key: "risk_management", label: "Understanding of Requirements" },
    { key: "methodology", label: "Proposed Methodology & Approach" },
    { key: "project_schedule", label: "Project Schedule" },
    { key: "pricing_framework", label: "Pricing Framework (Blank — complete before submission)" },
  ] : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-brand-navy">AI Bid Draft</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        {!draft ? (
          <div className="p-12 text-center text-gray-400">Loading draft...</div>
        ) : (
          <div className="p-6 space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-700">
              <strong>Important:</strong> This is an AI-generated first draft. Review carefully, add actual pricing, and verify compliance before submitting.
            </div>
            {sections.map(({ key, label }) => (
              <div key={key} className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="font-semibold text-brand-navy text-sm">{label}</h3>
                  <CopyButton text={draft[key] || ""} />
                </div>
                <div className="p-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{draft[key]}</pre>
                </div>
              </div>
            ))}
            {draft.compliance_checklist && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="font-semibold text-brand-navy text-sm">Compliance Checklist</h3>
                </div>
                <div className="p-4 space-y-2">
                  {JSON.parse(draft.compliance_checklist).map((item: { item: string; required: boolean }, i: number) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      {item.required ? <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" /> : <XCircle className="h-4 w-4 text-gray-300 flex-shrink-0" />}
                      <span className={item.required ? "text-gray-700" : "text-gray-400"}>{item.item}</span>
                      {!item.required && <span className="text-xs text-gray-400">(if applicable)</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function UploadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [docType, setDocType] = useState("");
  const [expiry, setExpiry] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const DOC_TYPES = ["Tax Clearance", "CIDB Certificate", "B-BBEE Certificate", "Company Registration (CIPC)",
    "CSD Registration Confirmation", "Proof of Address", "Municipal Account", "Banking Details"];

  const upload = async () => {
    if (!file || !docType) { setError("Please select a document type and file"); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("document_type", docType);
    if (expiry) fd.append("expiry_date", expiry);
    const res = await fetch("/api/dashboard/documents/upload", { method: "POST", body: fd });
    const json = await res.json();
    setUploading(false);
    if (json.success) { onSuccess(); onClose(); }
    else setError(json.error || "Upload failed");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-brand-navy mb-4">Upload Document</h2>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Document Type *</label>
            <select className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy" value={docType} onChange={e => setDocType(e.target.value)}>
              <option value="">Select document type</option>
              {DOC_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Expiry Date (optional)</label>
            <input type="date" className="w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy" value={expiry} onChange={e => setExpiry(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">File * (PDF, JPG, PNG, max 5MB)</label>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="w-full text-sm" onChange={e => setFile(e.target.files?.[0] || null)} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" onClick={upload} disabled={uploading}>{uploading ? "Uploading..." : "Upload"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const user = session?.user as { name?: string; email?: string; tier?: string; isAdmin?: boolean } | undefined;
  const [activeTab, setActiveTab] = useState("matches");
  const [matches, setMatches] = useState<Match[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [awards, setAwards] = useState<Award[]>([]);
  const [showDraft, setShowDraft] = useState<number | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showScoreInfo, setShowScoreInfo] = useState(false);
  const [generatingDraft, setGeneratingDraft] = useState<number | null>(null);
  const tier = user?.tier || "scout";
  const userId = Number((session?.user as { id?: string })?.id ?? 0);

  useEffect(() => {
    fetch("/api/dashboard/matches").then(r => r.json()).then(d => setMatches(d.matches || []));
    fetch("/api/dashboard/documents").then(r => r.json()).then(d => setDocs(d.documents || []));
    fetch("/api/dashboard/deadlines").then(r => r.json()).then(d => setDeadlines(d.deadlines || []));
    if (tier === "pro") fetch("/api/dashboard/awards").then(r => r.json()).then(d => setAwards(d.awards || []));
  }, [tier]);

  const loadMatches = () =>
    fetch("/api/dashboard/matches").then(r => r.json()).then(d => setMatches(d.matches || []));

  const generateBidDraft = async (match: Match) => {
    if (!userId || !match.tender_id) return;
    setGeneratingDraft(match.id);
    try {
      const res = await fetch("/api/bid-draft/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tender_id: match.tender_id, subscriber_id: userId }),
      });
      const data = await res.json();
      if (data.success) {
        await loadMatches();
        // Open the draft viewer immediately
        setShowDraft(match.id);
      }
    } finally {
      setGeneratingDraft(null);
    }
  };

  const tabs = [
    { id: "matches", label: "Matches", icon: TrendingUp },
    { id: "vault", label: "Document Vault", icon: FileText },
    { id: "deadlines", label: "Deadlines", icon: Calendar },
    ...(tier === "pro" ? [{ id: "awards", label: "Award History", icon: Trophy }] : []),
  ];

  const urgencyColor = { urgent: "text-red-600 bg-red-50 border-red-200", warning: "text-amber-600 bg-amber-50 border-amber-200", ok: "text-green-700 bg-green-50 border-green-200" };

  const tierBadge: Record<string, string> = { scout: "bg-gray-100 text-gray-700", bid: "bg-blue-100 text-blue-800", pro: "bg-purple-100 text-purple-800" };

  return (
    <div className="min-h-screen bg-brand-off-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${tierBadge[tier]}`}>{tier}</span>
            {user?.isAdmin && <Button asChild size="sm" variant="outline"><a href="/admin">Admin</a></Button>}
            <Button size="sm" variant="ghost" onClick={() => signOut({ callbackUrl: "/" })}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-brand-navy">
            Good {new Date().getHours() < 12 ? "morning" : "afternoon"}, {user?.name?.split(" ")[0]}.
          </h1>
          <p className="text-gray-500 mt-1">Here's your tender intelligence overview.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Tenders matched", value: matches.length, sub: "this session" },
            { label: "Bids drafted", value: matches.filter(m => m.bid_draft_generated).length, sub: "available to review" },
            { label: "Documents", value: docs.length, sub: "in vault" },
            { label: "Upcoming deadlines", value: deadlines.length, sub: "active" },
          ].map(stat => (
            <Card key={stat.label}>
              <CardContent className="p-5">
                <div className="text-3xl font-black text-brand-navy">{stat.value}</div>
                <div className="text-sm font-medium text-gray-700 mt-1">{stat.label}</div>
                <div className="text-xs text-gray-400">{stat.sub}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl border border-gray-200 p-1 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? "bg-brand-navy text-white" : "text-gray-600 hover:bg-gray-50"}`}
            >
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Matches Tab */}
        {activeTab === "matches" && (
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Recent Tender Matches</CardTitle>
              <button onClick={() => setShowScoreInfo(true)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-brand-navy">
                <Info className="h-3.5 w-3.5" /> How is match score calculated?
              </button>
            </CardHeader>
            <CardContent className="p-0">
              {matches.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>No matches yet. Your first digest will arrive tomorrow morning.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                      <tr>
                        {["Tender", "Department", "Closing Date", "Match", "Type", "Actions"].map(h => (
                          <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {matches.map(m => (
                        <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-brand-navy text-sm max-w-xs truncate" title={m.title}>{m.title}</p>
                            {m.province && <p className="text-xs text-gray-400 mt-0.5">{m.province}</p>}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 max-w-[150px] truncate">{m.department}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{formatDate(m.closing_date)}</td>
                          <td className="px-4 py-3"><MatchScoreBar score={m.match_score} /></td>
                          <td className="px-4 py-3">
                            <Badge variant="info">{m.tender_type || "Tender"}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2 items-center">
                              {(tier === "bid" || tier === "pro") && (
                                m.draft_id ? (
                                  <Button size="sm" variant="outline" onClick={() => setShowDraft(m.id)} className="text-xs gap-1">
                                    <FileText className="h-3 w-3" /> View Draft
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="amber"
                                    onClick={() => generateBidDraft(m)}
                                    disabled={generatingDraft === m.id}
                                    className="text-xs gap-1"
                                  >
                                    <FileText className="h-3 w-3" />
                                    {generatingDraft === m.id ? "Generating..." : "Generate Draft"}
                                  </Button>
                                )
                              )}
                              {tier === "scout" && (
                                <span className="text-xs text-gray-400 italic">Upgrade to Bid</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Document Vault Tab */}
        {activeTab === "vault" && (
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Document Vault</CardTitle>
              {(tier === "bid" || tier === "pro") && (
                <Button size="sm" onClick={() => setShowUpload(true)} className="gap-2">
                  <Upload className="h-4 w-4" /> Upload
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {tier === "scout" ? (
                <div className="text-center py-12 text-gray-400">
                  <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Document vault available on Bid and Pro plans</p>
                  <Button asChild className="mt-4" size="sm"><a href="/onboard?plan=bid">Upgrade to Bid</a></Button>
                </div>
              ) : docs.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>No documents uploaded yet.</p>
                  <Button size="sm" className="mt-4" onClick={() => setShowUpload(true)}>Upload your first document</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {docs.map(doc => {
                    const { label, status } = expiryLabel(doc.expiry_date);
                    return (
                      <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-brand-navy/10 flex items-center justify-center">
                            <FileText className="h-4 w-4 text-brand-navy" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{doc.document_type}</p>
                            <p className="text-xs text-gray-400">{doc.document_name} · Uploaded {formatDate(doc.uploaded_at)}</p>
                          </div>
                        </div>
                        <Badge variant={status === "valid" ? "success" : status === "expiring" ? "warning" : "danger"}>
                          {label}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Deadlines Tab */}
        {activeTab === "deadlines" && (
          <Card>
            <CardHeader><CardTitle>Upcoming Deadlines</CardTitle></CardHeader>
            <CardContent>
              {deadlines.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>No upcoming deadlines. Matches will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {deadlines.map(d => {
                    const urgency = deadlineUrgency(d.closing_date);
                    const colors = urgencyColor[urgency];
                    const daysLeft = Math.ceil((new Date(d.closing_date).getTime() - Date.now()) / 86400000);
                    return (
                      <div key={d.id} className={`flex items-center justify-between p-4 rounded-xl border ${colors}`}>
                        <div className="flex items-center gap-3">
                          {urgency === "urgent" ? <AlertTriangle className="h-5 w-5 flex-shrink-0" /> :
                            urgency === "warning" ? <Clock className="h-5 w-5 flex-shrink-0" /> :
                            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />}
                          <div>
                            <p className="font-medium text-sm">{d.title}</p>
                            <p className="text-xs opacity-75">{d.department}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <p className="font-bold text-sm">{formatDate(d.closing_date)}</p>
                          <p className="text-xs opacity-75">{daysLeft === 0 ? "Today!" : daysLeft === 1 ? "1 day left" : `${daysLeft} days left`}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Awards Tab (Pro only) */}
        {activeTab === "awards" && tier === "pro" && (
          <Card>
            <CardHeader><CardTitle>Bid Award History</CardTitle></CardHeader>
            <CardContent className="p-0">
              {awards.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Trophy className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>No award history available for your sectors yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                      <tr>
                        {["Tender", "Department", "Awarded To", "Award Value", "Date"].map(h => (
                          <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {awards.map(a => (
                        <tr key={a.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-brand-navy max-w-xs truncate">{a.tender_title}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{a.department}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{a.awarded_to}</td>
                          <td className="px-4 py-3 text-sm font-semibold">{a.award_value ? formatCurrency(a.award_value) : "N/A"}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatDate(a.award_date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Match Score Info Modal */}
      {showScoreInfo && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowScoreInfo(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-brand-navy mb-4">How We Calculate Your Match Score</h2>
            <div className="space-y-3">
              {[
                { label: "CIDB Grade Match", points: 30, desc: "Your registration grade falls within the tender's required grade range" },
                { label: "CIDB Class Match", points: 25, desc: "Your class (e.g. GB, CE) matches the tender's required discipline" },
                { label: "Province Match", points: 20, desc: "The tender's province matches one of your operating provinces" },
                { label: "Sector Match", points: 15, desc: "The tender's scope aligns with your registered sectors of work" },
                { label: "Contract Value Match", points: 10, desc: "The tender value falls within your preferred contract value range" },
              ].map(s => (
                <div key={s.label} className="flex gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="w-10 h-6 bg-brand-amber text-white text-xs font-bold rounded flex items-center justify-center flex-shrink-0">+{s.points}</div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{s.label}</p>
                    <p className="text-xs text-gray-500">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4">Maximum score: 100. Only tenders with a score of 40+ are included in your digest.</p>
            <Button className="w-full mt-4" onClick={() => setShowScoreInfo(false)}>Got it</Button>
          </div>
        </div>
      )}

      {showDraft && <BidDraftModal matchId={showDraft} onClose={() => setShowDraft(null)} />}
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onSuccess={() => fetch("/api/dashboard/documents").then(r => r.json()).then(d => setDocs(d.documents || []))} />}
    </div>
  );
}
