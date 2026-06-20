-- Run this in the Supabase SQL editor to create all tables

create table if not exists subscribers (
  id bigserial primary key,
  email text unique not null,
  password_hash text not null,
  first_name text not null default '',
  last_name text not null default '',
  phone text not null default '',
  company_name text not null default '',
  csd_number text not null default '',
  cipc_number text not null default '',
  cidb_grade integer not null default 0,
  cidb_classes text not null default '[]',
  bbbee_level text not null default '',
  provinces text not null default '[]',
  sectors text not null default '[]',
  contract_value_min bigint not null default 0,
  contract_value_max bigint not null default 0,
  tender_types text not null default '[]',
  years_in_operation integer not null default 0,
  tier text not null default 'scout',
  status text not null default 'pending',
  payfast_token text not null default '',
  subscription_start text not null default '',
  subscription_end text not null default '',
  onboarding_complete integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists tenders (
  id bigserial primary key,
  reference_number text not null default '',
  title text not null default '',
  description text not null default '',
  department text not null default '',
  portal text not null default '',
  province text not null default '',
  tender_type text not null default '',
  cidb_grade_min integer not null default 0,
  cidb_grade_max integer not null default 0,
  cidb_class text not null default '',
  contract_value_min bigint not null default 0,
  contract_value_max bigint not null default 0,
  briefing_mandatory integer not null default 0,
  closing_date text not null default '',
  is_active integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists tender_matches (
  id bigserial primary key,
  subscriber_id bigint not null references subscribers(id) on delete cascade,
  tender_id bigint not null references tenders(id) on delete cascade,
  match_score integer not null default 0,
  match_reasons text not null default '[]',
  digest_sent integer not null default 0,
  digest_sent_at text not null default '',
  bid_draft_generated integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists bid_drafts (
  id bigserial primary key,
  match_id bigint not null references tender_matches(id) on delete cascade,
  executive_summary text not null default '',
  methodology text not null default '',
  resource_plan text not null default '',
  risk_management text not null default '',
  project_schedule text not null default '',
  compliance_checklist text not null default '[]',
  pricing_framework text not null default '',
  generated_at timestamptz not null default now()
);

create table if not exists subscriber_documents (
  id bigserial primary key,
  subscriber_id bigint not null references subscribers(id) on delete cascade,
  document_type text not null default '',
  document_name text not null default '',
  file_path text not null default '',
  expiry_date text,
  is_expired integer not null default 0,
  uploaded_at timestamptz not null default now()
);

create table if not exists tender_awards (
  id bigserial primary key,
  tender_reference text not null default '',
  tender_title text not null default '',
  department text not null default '',
  portal text not null default '',
  awarded_to text not null default '',
  award_value bigint not null default 0,
  award_date text not null default '',
  province text not null default '',
  sector text not null default '',
  scraped_at timestamptz not null default now()
);

create table if not exists scraper_health (
  id bigserial primary key,
  portal text not null default '',
  run_date timestamptz not null default now(),
  status text not null default 'ok',
  tenders_found integer not null default 0,
  tenders_new integer not null default 0,
  error_message text,
  duration_seconds numeric not null default 0
);

create table if not exists email_digests (
  id bigserial primary key,
  subscriber_id bigint not null references subscribers(id) on delete cascade,
  subject text not null default '',
  tender_count integer not null default 0,
  sent_at timestamptz not null default now(),
  status text not null default 'sent'
);

-- Disable RLS (service role bypasses anyway, but keep it simple)
alter table subscribers disable row level security;
alter table tenders disable row level security;
alter table tender_matches disable row level security;
alter table bid_drafts disable row level security;
alter table subscriber_documents disable row level security;
alter table tender_awards disable row level security;
alter table scraper_health disable row level security;
alter table email_digests disable row level security;

-- Seed demo tenders
insert into tenders (reference_number, title, description, department, portal, province, tender_type, cidb_grade_min, cidb_grade_max, cidb_class, contract_value_min, contract_value_max, briefing_mandatory, closing_date, is_active)
values
  ('EC/PT/2024/001', 'Repair and Maintenance of Municipal Roads: Eastern Cape', 'Routine maintenance and repair of Class 3 rural roads in the Eastern Cape region.', 'EC Department of Public Works', 'eTenders', 'Eastern Cape', 'Formal Tender', 4, 7, 'CE', 500000, 5000000, 1, (current_date + interval '14 days')::text, 1),
  ('NMBM/2024/0042', 'Construction of New School Buildings, Phase 2', 'Construction of 8 classroom blocks and ablution facilities at three primary schools.', 'Nelson Mandela Bay Municipality', 'NMBM', 'Eastern Cape', 'Formal Tender', 5, 9, 'GB', 2000000, 15000000, 1, (current_date + interval '21 days')::text, 1),
  ('EC/DOH/2024/089', 'Electrical Upgrades at Health Facilities', 'Supply and installation of electrical infrastructure upgrades at 12 clinics.', 'EC Department of Health', 'EC Provincial Treasury', 'Eastern Cape', 'RFQ', 2, 5, 'EB', 100000, 800000, 0, (current_date + interval '7 days')::text, 1),
  ('BCM/2024/112', 'Cleaning Services: Buffalo City Metro Offices', 'Provision of professional cleaning and hygiene services at 5 municipal office buildings.', 'Buffalo City Metropolitan Municipality', 'eTenders', 'Eastern Cape', 'RFP', 1, 3, '', 50000, 300000, 0, (current_date + interval '5 days')::text, 1),
  ('NatT/2024/0897', 'Supply and Installation of Solar Panels: Government Buildings', 'National tender for renewable energy installations across government buildings.', 'Department of Public Works and Infrastructure', 'eTenders', '', 'Formal Tender', 5, 9, 'EB', 5000000, 50000000, 1, (current_date + interval '30 days')::text, 1)
on conflict do nothing;

insert into tender_awards (tender_reference, tender_title, department, portal, awarded_to, award_value, award_date, province, sector)
values
  ('EC/PT/2023/044', 'Resurfacing of Provincial Roads: N2 Corridor', 'EC Department of Public Works', 'eTenders', 'Lungisa Construction (Pty) Ltd', 3250000, '2024-03-15', 'Eastern Cape', 'Roads & Infrastructure'),
  ('NMBM/2023/0098', 'Construction of Community Hall: Motherwell', 'Nelson Mandela Bay Municipality', 'NMBM', 'Phakama Building Contractors', 8750000, '2024-02-28', 'Eastern Cape', 'Building & Renovation'),
  ('EC/DOE/2023/201', 'Electrical Maintenance: Schools Programme', 'EC Department of Education', 'EC Provincial Treasury', 'Bongani Electrical CC', 450000, '2024-04-10', 'Eastern Cape', 'Electrical')
on conflict do nothing;
