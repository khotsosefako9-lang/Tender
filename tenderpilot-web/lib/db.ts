/**
 * Supabase database layer. All methods are async.
 * API surface mirrors the previous in-memory store so call sites only need await added.
 */
import { supabase } from "./supabase";

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
  digest_sent_at: string;
  bid_draft_generated: number;
  created_at: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>;

function makeTable<T extends AnyRow>(tableName: string) {
  return {
    async insert(row: Omit<T, "id">): Promise<T> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await supabase.from(tableName).insert(row as any).select().single();
      if (error) throw new Error(`[db.${tableName}.insert] ${error.message}`);
      return data as T;
    },

    async findAll(predicate?: (r: T) => boolean): Promise<T[]> {
      const { data, error } = await supabase.from(tableName).select("*");
      if (error) throw new Error(`[db.${tableName}.findAll] ${error.message}`);
      const rows = (data ?? []) as T[];
      return predicate ? rows.filter(predicate) : rows;
    },

    async findOne(predicate: (r: T) => boolean): Promise<T | undefined> {
      const { data, error } = await supabase.from(tableName).select("*");
      if (error) throw new Error(`[db.${tableName}.findOne] ${error.message}`);
      return ((data ?? []) as T[]).find(predicate);
    },

    async update(predicate: (r: T) => boolean, patch: Partial<T>): Promise<void> {
      const { data, error } = await supabase.from(tableName).select("*");
      if (error) throw new Error(`[db.${tableName}.update] ${error.message}`);
      const matches = ((data ?? []) as T[]).filter(predicate);
      for (const row of matches) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateError } = await supabase.from(tableName).update(patch as any).eq("id", (row as unknown as { id: number }).id);
        if (updateError) throw new Error(`[db.${tableName}.update] ${updateError.message}`);
      }
    },

    async delete(predicate: (r: T) => boolean): Promise<void> {
      const { data, error } = await supabase.from(tableName).select("id");
      if (error) throw new Error(`[db.${tableName}.delete] ${error.message}`);
      const matches = ((data ?? []) as T[]).filter(predicate);
      for (const row of matches) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await supabase.from(tableName).delete().eq("id", (row as unknown as { id: number }).id);
      }
    },
  };
}

export const db = {
  subscribers: makeTable<Subscriber>("subscribers"),
  tenders: makeTable<Tender>("tenders"),
  tender_matches: makeTable<TenderMatch & AnyRow>("tender_matches"),
  bid_drafts: makeTable<AnyRow>("bid_drafts"),
  subscriber_documents: makeTable<AnyRow>("subscriber_documents"),
  tender_awards: makeTable<AnyRow>("tender_awards"),
  scraper_health: makeTable<AnyRow>("scraper_health"),
  email_digests: makeTable<AnyRow>("email_digests"),
};

export function getDb() {
  return db;
}
