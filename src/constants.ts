import { SelectOption } from "./types";

export const SENIORITY_LEVELS: SelectOption[] = [
  { label: "Owner", value: "Owner" },
  { label: "Founder", value: "Founder" },
  { label: "C-Level", value: "C-Level" },
  { label: "Partner", value: "Partner" },
  { label: "Director", value: "Director" },
];

export const INDUSTRIES: SelectOption[] = [
  { label: "Ecommerce", value: "Ecommerce" },
  { label: "SaaS", value: "SaaS" },
  { label: "Fintech", value: "Fintech" },
  { label: "HealthTech", value: "HealthTech" },
  { label: "Marketing", value: "Marketing" },
  { label: "AI", value: "AI" },
  { label: "Consulting", value: "Consulting" },
];

export const COMPANY_SIZES: SelectOption[] = [
  { label: "1–10 employees", value: "1-10" },
  { label: "11–50 employees", value: "11-50" },
  { label: "51–200 employees", value: "51-200" },
  { label: "201–500 employees", value: "201-500" },
  { label: "500+", value: "500+" },
];

export const REVENUE_RANGES: SelectOption[] = [
  { label: "Under $1M", value: "Under $1M" },
  { label: "$1M–$10M", value: "$1M-$10M" },
  { label: "$10M–$50M", value: "$10M-$50M" },
  { label: "$50M+", value: "$50M+" },
];

export const TECH_STACKS: SelectOption[] = [
  { label: "Shopify", value: "Shopify" },
  { label: "WooCommerce", value: "WooCommerce" },
  { label: "Salesforce", value: "Salesforce" },
  { label: "HubSpot", value: "HubSpot" },
  { label: "Klaviyo", value: "Klaviyo" },
  { label: "Stripe", value: "Stripe" },
  { label: "AWS", value: "AWS" },
];

export const GROWTH_SIGNALS: SelectOption[] = [
  { label: "Company currently hiring", value: "hiring" },
  { label: "Recently active on LinkedIn", value: "active_linkedin" },
  { label: "Recently raised funding", value: "raised_funding" },
  { label: "Recently launched a product", value: "launched_product" },
  { label: "Recently updated website", value: "updated_website" },
];

export const LEAD_LIMITS: SelectOption[] = [
  { label: "10", value: "10" },
  { label: "25", value: "25" },
  { label: "50", value: "50" },
  { label: "100", value: "100" },
  { label: "500", value: "500" },
];
