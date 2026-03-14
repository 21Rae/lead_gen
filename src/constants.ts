import { SelectOption } from "./types";

export const REVENUE_RANGES: SelectOption[] = [
  { label: "Under $1M", value: "Under $1M" },
  { label: "$1M–$10M", value: "$1M-$10M" },
  { label: "$10M–$50M", value: "$10M-$50M" },
  { label: "$50M+", value: "$50M+" },
];

export const LEAD_LIMITS: SelectOption[] = [
  { label: "10", value: "10" },
  { label: "25", value: "25" },
  { label: "50", value: "50" },
  { label: "100", value: "100" },
  { label: "500", value: "500" },
];
