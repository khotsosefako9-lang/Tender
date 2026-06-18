/**
 * In-memory database layer.
 *
 * Vercel serverless functions are stateless — data resets between cold starts.
 * This is intentional for deployment compatibility; swap for a persistent DB
 * (e.g. PlanetScale, Turso, Neon, or Supabase) for production persistence.
 *
 * The API surface mirrors what the rest of the app expects so no other files
 * need to change.
 */

export type Subscriber = {
  id: number;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone: string;
  company_name: string;
  csd_number: string;
  cipc_number: string;
  cidb_grade: number;
  cidb_classes: string;
  bbbee_level: string;
  provinces: string;
  sectors: string;
  contract_value_min: number;
  contract_value_max: number;
  tender_types: string;
  years_in_operation: number;
  tier: string;
  status: string;
  payfast_token: string;
  subscription_start: string;
  subscription_end: string;
  onboarding_complete: number;
  created_at: string;
};

export type Tender = {
  id: number;
  reference_number: string;
  title: string;
  description: string;
  department: string;
  portal: string;
  province: string;
  tender_type: string;
  cidb_grade_min: number;
  cidb_grade_max: number;
  cidb_class: string;
  contract_value_min: number;
  contract_value_max: number;
  briefing_mandatory: number;
  closing_date: string;
  is_active: number;
  created_at: string;
};

export type TenderMatch = {
  id: number;
  subscriber_id: number;
  tender_id: number;
  match_score: number;
  match_reasons: string;
  digest_sent: number;
  bid_draft_generated: number;
  created_at: string;
};

// ─── In-memory stores ────────────────────────────────────────────────────────

let nextId = { subscribers: 1, tenders: 1, matches: 1, drafts: 1, docs: 1, awards: 1, health: 1, digests: 1 };

const stores: {
  subscribers: Map<number, Subscriber>;
  tenders: Map<number, Tender>;
  tender_matches: Map<number, TenderMatch & Record<string, unknown>>;
  bid_drafts: Map<number, Record<string, unknown>>;
  subscriber_documents: Map<number, Record<string, unknown>>;
  tender_awards: Map<number, Record<string, unknown>>;
  scraper_health: Map<number, Record<string, unknown>>;
  email_digests: Map<number, Record<string, unknown>>;
} = {
  subscribers: new Map(),
  tenders: new Map(),
  tender_matches: new Map(),
  bid_drafts: new Map(),
  subscriber_documents: new Map(),
  tender_awards: new Map(),
  scraper_health: new Map(),
  email_digests: new Map(),
};

// Seed some demo tenders so the dashboard isn't empty
function seedDemoData() {
  if (stores.tenders.size > 0) return;
  const now = new Date().toISOString();
  const closing = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    return d.toISOString().split("T")[0];
  };
  const demotenders: Omit<Tender, "id">[] = [
    {
      reference_number: "EC/PT/2024/001",
      title: "Repair and Maintenance of Municipal Roads — Eastern Cape",
      description: "Routine maintenance and repair of Class 3 rural roads in the Eastern Cape region.",
      department: "EC Department of Public Works",
      portal: "eTenders",
      province: "Eastern Cape",
      tender_type: "Formal Tender",
      cidb_grade_min: 4,
      cidb_grade_max: 7,
      cidb_class: "CE",
      contract_value_min: 500000,
      contract_value_max: 5000000,
      briefing_mandatory: 1,
      closing_date: closing(14),
      is_active: 1,
      created_at: now,
    },
    {
      reference_number: "NMBM/2024/0042",
      title: "Construction of New School Buildings — Phase 2",
      description: "Construction of 8 classroom blocks and ablution facilities at three primary schools.",
      department: "Nelson Mandela Bay Municipality",
      portal: "NMBM",
      province: "Eastern Cape",
      tender_type: "Formal Tender",
      cidb_grade_min: 5,
      cidb_grade_max: 9,
      cidb_class: "GB",
      contract_value_min: 2000000,
      contract_value_max: 15000000,
      briefing_mandatory: 1,
      closing_date: closing(21),
      is_active: 1,
      created_at: now,
    },
    {
      reference_number: "EC/DOH/2024/089",
      title: "Electrical Upgrades at Health Facilities",
      description: "Supply and installation of electrical infrastructure upgrades at 12 clinics.",
      department: "EC Department of Health",
      portal: "EC Provincial Treasury",
      province: "Eastern Cape",
      tender_type: "RFQ",
      cidb_grade_min: 2,
      cidb_grade_max: 5,
      cidb_class: "EB",
      contract_value_min: 100000,
      contract_value_max: 800000,
      briefing_mandatory: 0,
      closing_date: closing(7),
      is_active: 1,
      created_at: now,
    },
    {
      reference_number: "BCM/2024/112",
      title: "Cleaning Services — Buffalo City Metro Offices",
      description: "Provision of professional cleaning and hygiene services at 5 municipal office buildings.",
      department: "Buffalo City Metropolitan Municipality",
      portal: "eTenders",
      province: "Eastern Cape",
      tender_type: "RFP",
      cidb_grade_min: 1,
      cidb_grade_max: 3,
      cidb_class: "",
      contract_value_min: 50000,
      contract_value_max: 300000,
      briefing_mandatory: 0,
      closing_date: closing(5),
      is_active: 1,
      created_at: now,
    },
    {
      reference_number: "NatT/2024/0897",
      title: "Supply and Installation of Solar Panels — Government Buildings",
      description: "National tender for renewable energy installations across government buildings.",
      department: "Department of Public Works and Infrastructure",
      portal: "eTenders",
      province: "",
      tender_type: "Formal Tender",
      cidb_grade_min: 5,
      cidb_grade_max: 9,
      cidb_class: "EB",
      contract_value_min: 5000000,
      contract_value_max: 50000000,
      briefing_mandatory: 1,
      closing_date: closing(30),
      is_active: 1,
      created_at: now,
    },
  ];

  for (const t of demotenders) {
    const id = nextId.tenders++;
    stores.tenders.set(id, { id, ...t });
  }

  // Seed some award history
  const awards = [
    { tender_reference: "EC/PT/2023/044", tender_title: "Resurfacing of Provincial Roads — N2 Corridor", department: "EC Department of Public Works", portal: "eTenders", awarded_to: "Lungisa Construction (Pty) Ltd", award_value: 3250000, award_date: "2024-03-15", province: "Eastern Cape", sector: "Roads & Infrastructure" },
    { tender_reference: "NMBM/2023/0098", tender_title: "Construction of Community Hall — Motherwell", department: "Nelson Mandela Bay Municipality", portal: "NMBM", awarded_to: "Phakama Building Contractors", award_value: 8750000, award_date: "2024-02-28", province: "Eastern Cape", sector: "Building & Renovation" },
    { tender_reference: "EC/DOE/2023/201", tender_title: "Electrical Maintenance — Schools Programme", department: "EC Department of Education", portal: "EC Provincial Treasury", awarded_to: "Bongani Electrical CC", award_value: 450000, award_date: "2024-04-10", province: "Eastern Cape", sector: "Electrical" },
  ];
  for (const a of awards) {
    const id = nextId.awards++;
    stores.tender_awards.set(id, { id, ...a, scraped_at: new Date().toISOString() });
  }
}

seedDemoData();

// ─── DB proxy ────────────────────────────────────────────────────────────────

type Row = Record<string, unknown>;

function makeTable<T extends Row>(map: Map<number, T>) {
  return {
    insert(row: Omit<T, "id">): T {
      const key = (map.size > 0 ? Math.max(...Array.from(map.keys())) : 0) + 1;
      const full = { id: key, ...row } as unknown as T;
      map.set(key, full);
      return full;
    },
    findAll(predicate?: (r: T) => boolean): T[] {
      const all = Array.from(map.values());
      return predicate ? all.filter(predicate) : all;
    },
    findOne(predicate: (r: T) => boolean): T | undefined {
      return Array.from(map.values()).find(predicate);
    },
    update(predicate: (r: T) => boolean, patch: Partial<T>): void {
      for (const [k, v] of map.entries()) {
        if (predicate(v)) map.set(k, { ...v, ...patch });
      }
    },
    delete(predicate: (r: T) => boolean): void {
      for (const [k, v] of map.entries()) {
        if (predicate(v)) map.delete(k);
      }
    },
  };
}

// ─── Public API (mirrors the sqlite queries used throughout the app) ──────────

export const db = {
  subscribers: makeTable<Subscriber>(stores.subscribers as Map<number, Subscriber>),
  tenders: makeTable<Tender>(stores.tenders as Map<number, Tender>),
  tender_matches: makeTable(stores.tender_matches),
  bid_drafts: makeTable(stores.bid_drafts),
  subscriber_documents: makeTable(stores.subscriber_documents),
  tender_awards: makeTable(stores.tender_awards),
  scraper_health: makeTable(stores.scraper_health),
  email_digests: makeTable(stores.email_digests),
};

/** Helper used by the matching engine and other lib code that needs raw access */
export function getDb() {
  return db;
}
