"use client";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Logo } from "@/components/landing/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Users, TrendingUp, AlertCircle, RefreshCw, LogOut, CheckCircle2 } from "lucide-react";

type Stats = { total: number; byTier: { tier: string; n: number }[]; newThisWeek: number; mrr: number };
type Subscriber = { id: number; email: string; first_name: string; last_name: string; company_name: string; tier: string; cidb_grade: number; status: string; created_at: string };
type HealthRow = { id: number; portal: string; run_date: string; status: string; tenders_found: number; tenders_new: number; error_message: string | null; duration_seconds: number };
type ScrapeResult = { success: boolean; total_found: number; total_new: number; matches_created: number; errors: string[]; portals: HealthRow[] };

export default function AdminPage() {
  const { data: session } = useSession();
  const user = session?.user as { isAdmin?: boolean; name?: string } | undefined;
  const [stats, setStats] = useState<Stats | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [health, setHealth] = useState<HealthRow[]>([]);
  const [triggering, setTriggering] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<ScrapeResult | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const load = () => {
    fetch("/api/admin/stats").then(r => r.json()).then(setStats);
    fetch("/api/admin/subscribers").then(r => r.json()).then(d => setSubscribers(d.subscribers || []));
    fetch("/api/admin/scraper-health").then(r => r.json()).then(d => setHealth(d.health || []));
  };

  useEffect(() => { load(); }, []);

  const triggerScrape = async () => {
    setTriggering(true);
    setScrapeResult(null);
    try {
      const res = await fetch("/api/admin/scrape", { method: "POST" });
      const data = await res.json();
      setScrapeResult(data);
    } catch {
      setScrapeResult(null);
    }
    load();
    setTriggering(false);
  };

  const tierColor: Record<string, string> = { scout: "default", bid: "info", pro: "warning" };

  return (
    <div className="min-h-screen bg-brand-off-white">
      <header className="bg-brand-navy text-white border-b border-blue-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Logo light />
          <div className="flex items-center gap-3">
            <span className="text-sm text-blue-300">Admin Panel</span>
            <Button size="sm" variant="ghost" className="text-white hover:bg-blue-800" onClick={() => signOut({ callbackUrl: "/" })}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-brand-navy">Admin Dashboard</h1>
          <Button onClick={triggerScrape} disabled={triggering} variant="amber" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${triggering ? "animate-spin" : ""}`} />
            {triggering ? "Scraping portals..." : "Run Scraper Now"}
          </Button>
        </div>

        {/* Scrape result banner */}
        {scrapeResult && (
          <div className={`mb-6 p-4 rounded-xl border text-sm flex flex-wrap gap-4 items-center ${scrapeResult.errors?.length ? "bg-amber-50 border-amber-200 text-amber-900" : "bg-green-50 border-green-200 text-green-900"}`}>
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span><strong>Scrape complete.</strong> {scrapeResult.total_found} tenders found across portals, <strong>{scrapeResult.total_new} new</strong> added to database, <strong>{scrapeResult.matches_created} subscriber matches</strong> created.</span>
            {scrapeResult.errors?.length > 0 && (
              <span className="text-amber-700 text-xs">Warnings: {scrapeResult.errors.join(" | ")}</span>
            )}
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="h-5 w-5 text-brand-navy" />
                  <span className="text-sm text-gray-500">Active Subscribers</span>
                </div>
                <div className="text-3xl font-black text-brand-navy">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="h-5 w-5 text-brand-navy" />
                  <span className="text-sm text-gray-500">Monthly Revenue</span>
                </div>
                <div className="text-3xl font-black text-brand-navy">{formatCurrency(stats.mrr)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="text-sm text-gray-500 mb-2">New This Week</div>
                <div className="text-3xl font-black text-brand-navy">{stats.newThisWeek}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="text-sm text-gray-500 mb-2">By Tier</div>
                <div className="space-y-1">
                  {stats.byTier.map(t => (
                    <div key={t.tier} className="flex justify-between text-sm">
                      <span className="capitalize text-gray-600">{t.tier}</span>
                      <span className="font-bold text-brand-navy">{t.n}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl border border-gray-200 p-1 w-fit">
          {[{ id: "overview", label: "Scraper Health" }, { id: "subscribers", label: "Subscribers" }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? "bg-brand-navy text-white" : "text-gray-600 hover:bg-gray-50"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scraper Health */}
        {activeTab === "overview" && (
          <Card>
            <CardHeader><CardTitle>Scraper Health</CardTitle></CardHeader>
            <CardContent className="p-0">
              {health.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>No scraper runs yet. Click "Trigger Scraper Run" above.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                      <tr>
                        {["Portal", "Last Run", "Status", "Tenders Found", "New", "Duration"].map(h => (
                          <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {health.map(row => (
                        <tr key={row.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-brand-navy text-sm">{row.portal}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatDate(row.run_date)}</td>
                          <td className="px-4 py-3">
                            {row.status === "ok" ? (
                              <div className="flex items-center gap-1.5 text-green-600 text-sm">
                                <CheckCircle2 className="h-4 w-4" /> OK
                              </div>
                            ) : row.status === "running" ? (
                              <div className="flex items-center gap-1.5 text-amber-600 text-sm">
                                <RefreshCw className="h-4 w-4 animate-spin" /> Running
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-red-600 text-sm">
                                <AlertCircle className="h-4 w-4" /> Error
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{row.tenders_found}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-green-600">+{row.tenders_new}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{row.duration_seconds}s</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Subscribers */}
        {activeTab === "subscribers" && (
          <Card>
            <CardHeader><CardTitle>All Subscribers ({subscribers.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                    <tr>
                      {["Name", "Company", "Email", "Tier", "CIDB Grade", "Status", "Sign-up Date"].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {subscribers.map(s => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-brand-navy">{s.first_name} {s.last_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-[150px] truncate">{s.company_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{s.email}</td>
                        <td className="px-4 py-3"><Badge variant={tierColor[s.tier] as "default" | "info" | "warning"} className="capitalize">{s.tier}</Badge></td>
                        <td className="px-4 py-3 text-sm text-gray-600">{s.cidb_grade ? `Grade ${s.cidb_grade}` : "N/A"}</td>
                        <td className="px-4 py-3"><Badge variant={s.status === "active" ? "success" : s.status === "pending" ? "warning" : "danger"} className="capitalize">{s.status}</Badge></td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(s.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {subscribers.length === 0 && (
                  <div className="text-center py-12 text-gray-400">No subscribers yet.</div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
