export const COMPLIANCE_STORAGE_KEY = "eu-compliance-checker";

export const EXPOSURE_OPTIONS = [
  {
    code: "yes",
    label: "Yes, currently – directly or through customers/traders",
    summary: "Yes – directly or through customers",
  },
  {
    code: "possibly",
    label: "Possibly – may reach the EU through the supply chain",
    summary: "Possibly – via supply chain",
  },
  {
    code: "future",
    label: "Not currently, but possible in future",
    summary: "Planned (future)",
  },
] as const;

export type ExposureCode = (typeof EXPOSURE_OPTIONS)[number]["code"];

type ExposureOption = (typeof EXPOSURE_OPTIONS)[number];

export type StoredComplianceProfile = {
  company?: string;
  companyName?: string;
  email?: string;
  pincode?: string;
  exposure?: string;
  exposureCode?: ExposureCode;
  sector?: string;
  results?: unknown;
  at?: string;
};

const exposureOptionMap = new Map<string, ExposureOption>(
  EXPOSURE_OPTIONS.map((option) => [option.code, option]),
);

export function isExposureCode(value: unknown): value is ExposureCode {
  return typeof value === "string" && exposureOptionMap.has(value);
}

export function getExposureOption(code: ExposureCode): ExposureOption {
  return exposureOptionMap.get(code)!;
}

export function getStoredCompanyName(profile: StoredComplianceProfile): string {
  return profile.companyName ?? profile.company ?? "";
}

export function getStoredExposureCode(profile: StoredComplianceProfile): ExposureCode | "" {
  if (isExposureCode(profile.exposureCode)) return profile.exposureCode;
  if (isExposureCode(profile.exposure)) return profile.exposure;
  return "";
}

export function getStoredExposureLabel(profile: StoredComplianceProfile): string {
  if (
    typeof profile.exposure === "string" &&
    profile.exposure &&
    !isExposureCode(profile.exposure)
  ) {
    return profile.exposure;
  }

  const exposureCode = getStoredExposureCode(profile);
  return exposureCode ? getExposureOption(exposureCode).label : "";
}

export function getStoredExposureSummary(profile: StoredComplianceProfile): string {
  const exposureCode = getStoredExposureCode(profile);
  if (exposureCode) {
    return getExposureOption(exposureCode).summary;
  }

  const exposureLabel = getStoredExposureLabel(profile);
  const matchingOption = EXPOSURE_OPTIONS.find((option) => option.label === exposureLabel);
  return matchingOption?.summary ?? "Not specified";
}

export function readStoredComplianceProfile(): StoredComplianceProfile {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(COMPLIANCE_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as StoredComplianceProfile;
  } catch {
    return {};
  }
}
