export interface LocationFilters {
  country: string;
  region: string;
  city: string;
}

export interface LeadFormData {
  job_titles: string;
  seniority_level: string[];
  keywords: string;
  industries: string[];
  company_size: string[];
  revenue_range: string;
  founded_after: string;
  location: LocationFilters;
  tech_stack: string[];
  signals: string[];
  lead_limit: number;
  service_offered: string;
  problem_solved: string;
  business_details?: {
    name: string;
    description: string;
    target_audience: string;
    usp: string;
  };
}

export interface SavedTemplate {
  id: string;
  name: string;
  data: LeadFormData;
  timestamp: number;
}

export interface SelectOption {
  label: string;
  value: string;
}
