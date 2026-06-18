import Database from "better-sqlite3";
import path from "path";

const DB_PATH = process.env.DATABASE_URL
  ? path.resolve(process.cwd(), process.env.DATABASE_URL)
  : path.resolve(process.cwd(), "../tenderpilot/tenderpilot.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    try {
      db = new Database(DB_PATH);
      db.pragma("journal_mode = WAL");
      db.pragma("foreign_keys = ON");
      initSchema(db);
    } catch {
      // Fallback to in-memory DB for development without the real DB file
      db = new Database(":memory:");
      db.pragma("journal_mode = WAL");
      initSchema(db);
    }
  }
  return db;
}

function initSchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS tenders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference_number TEXT,
      title TEXT NOT NULL,
      description TEXT,
      department TEXT,
      portal TEXT,
      province TEXT,
      tender_type TEXT,
      cidb_grade_min INTEGER,
      cidb_grade_max INTEGER,
      cidb_class TEXT,
      contract_value_min REAL,
      contract_value_max REAL,
      briefing_date TEXT,
      briefing_mandatory INTEGER DEFAULT 0,
      closing_date TEXT,
      clarification_deadline TEXT,
      document_url TEXT,
      raw_html TEXT,
      scraped_at TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      phone TEXT,
      company_name TEXT,
      csd_number TEXT,
      cipc_number TEXT,
      cidb_grade INTEGER,
      cidb_classes TEXT,
      bbbee_level TEXT,
      provinces TEXT,
      sectors TEXT,
      contract_value_min REAL,
      contract_value_max REAL,
      tender_types TEXT,
      years_in_operation INTEGER,
      tier TEXT DEFAULT 'scout',
      status TEXT DEFAULT 'pending',
      payfast_token TEXT,
      subscription_start TEXT,
      subscription_end TEXT,
      onboarding_complete INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subscriber_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscriber_id INTEGER NOT NULL,
      document_type TEXT NOT NULL,
      document_name TEXT,
      file_path TEXT,
      expiry_date TEXT,
      is_expired INTEGER DEFAULT 0,
      uploaded_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (subscriber_id) REFERENCES subscribers(id)
    );

    CREATE TABLE IF NOT EXISTS tender_matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscriber_id INTEGER NOT NULL,
      tender_id INTEGER NOT NULL,
      match_score INTEGER DEFAULT 0,
      match_reasons TEXT,
      digest_sent INTEGER DEFAULT 0,
      digest_sent_at TEXT,
      bid_draft_generated INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (subscriber_id) REFERENCES subscribers(id),
      FOREIGN KEY (tender_id) REFERENCES tenders(id)
    );

    CREATE TABLE IF NOT EXISTS bid_drafts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id INTEGER NOT NULL,
      executive_summary TEXT,
      methodology TEXT,
      resource_plan TEXT,
      risk_management TEXT,
      project_schedule TEXT,
      compliance_checklist TEXT,
      pricing_framework TEXT,
      generated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (match_id) REFERENCES tender_matches(id)
    );

    CREATE TABLE IF NOT EXISTS email_digests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscriber_id INTEGER NOT NULL,
      subject TEXT,
      tender_count INTEGER DEFAULT 0,
      sent_at TEXT DEFAULT (datetime('now')),
      status TEXT DEFAULT 'sent',
      FOREIGN KEY (subscriber_id) REFERENCES subscribers(id)
    );

    CREATE TABLE IF NOT EXISTS tender_awards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tender_reference TEXT,
      tender_title TEXT,
      department TEXT,
      portal TEXT,
      awarded_to TEXT,
      award_value REAL,
      award_date TEXT,
      province TEXT,
      sector TEXT,
      scraped_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS scraper_health (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      portal TEXT NOT NULL,
      run_date TEXT DEFAULT (datetime('now')),
      status TEXT DEFAULT 'ok',
      tenders_found INTEGER DEFAULT 0,
      tenders_new INTEGER DEFAULT 0,
      error_message TEXT,
      duration_seconds REAL
    );
  `);
}

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
