export type ScrapedTender = {
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
};

export type PortalResult = {
  portal: string;
  tenders_found: number;
  tenders_new: number;
  duration_seconds: number;
  status: "ok" | "error";
  error_message: string | null;
};
