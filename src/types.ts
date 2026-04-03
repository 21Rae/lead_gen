export type SourceType = string;

export interface LocationFilters {
  country: string;
  region: string;
  city: string;
}

export interface LeadFormData {
  // Common fields
  keywords: string;
  location: LocationFilters;
  
  // Gabriel specific
  persona_name?: string;
  business_type?: string;
  revenue_stage?: string;
  decision_maker?: string;
  typical_problems?: string;
  services_needed?: string;
  
  // LinkedIn specific
  job_titles?: string;
  seniority_level?: string;
  industries?: string;
  company_size?: string;
  revenue_range?: string;
  founded_after?: string;

  // Upwork specific
  skills?: string;
  budget_range?: string;
  job_type?: string;

  // YC specific
  batch?: string;
  stage?: string;

  // Reddit specific
  subreddits?: string;
  min_karma?: string;
}

export interface AppState {
  activeSource: SourceType;
  formData: Record<SourceType, LeadFormData>;
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
