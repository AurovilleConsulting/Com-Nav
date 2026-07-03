export const SECTORS = [
  "Iron and steel sector",
  "Aluminium sector",
  "Textiles, garments and footwear sector",
  "Furniture sector",
  "Tyres and rubber products sector",
  "Detergents and cleaning products sector",
  "Paints, coatings and varnishes sector",
  "Lubricants and greases sector",
  "Petrochemicals and basic Chemicals sector",
  "Energy-related products with eco-design requirements",
  "Information and communication technology products / other electronics sector",
  "Livestock and animal husbandry sector",
  "Leather and leather products sector",
  "Process-derived meat products",
  "Cattle / Meat processing sector / cattle-based products",
  "Tropical commodities and derived products sector (coffee, palm oil, rubber, cocoa, soya)",
  "Wood, timber and derived products sector",
  "Cement sector",
  "Fertilisers sector",
  "Electricity generation and supply sector",
  "Hydrogen production sector",
  "Plastics and polymers",
] as const;

export type Sector = (typeof SECTORS)[number];

export const EU_RELEVANCE = [
  "Yes, currently - Our products go to the EU directly or through customers/traders",
  "Possibly - Our products may reach the EU through the supply chain",
  "Not currently, but possible in future",
  "Our products do not currently go to the EU, but this may happen later",
] as const;

export type EuRelevance = (typeof EU_RELEVANCE)[number];

export const CBAM_SECTORS: Sector[] = [
  "Iron and steel sector",
  "Aluminium sector",
  "Cement sector",
  "Fertilisers sector",
  "Electricity generation and supply sector",
  "Hydrogen production sector",
];

export const EUDR_SECTORS: Sector[] = [
  "Livestock and animal husbandry sector",
  "Leather and leather products sector",
  "Process-derived meat products",
  "Cattle / Meat processing sector / cattle-based products",
  "Tropical commodities and derived products sector (coffee, palm oil, rubber, cocoa, soya)",
  "Wood, timber and derived products sector",
  "Tyres and rubber products sector",
];

export const DPP_SECTORS: Sector[] = [
  "Textiles, garments and footwear sector",
  "Furniture sector",
  "Detergents and cleaning products sector",
  "Paints, coatings and varnishes sector",
  "Lubricants and greases sector",
  "Petrochemicals and basic Chemicals sector",
  "Energy-related products with eco-design requirements",
  "Information and communication technology products / other electronics sector",
  "Plastics and polymers",
  "Iron and steel sector",
  "Aluminium sector",
];

export function applicableRegulations(sector: Sector | "") {
  const regs: Array<"DPP" | "EUDR" | "CBAM"> = [];
  if (sector && DPP_SECTORS.includes(sector)) regs.push("DPP");
  if (sector && EUDR_SECTORS.includes(sector)) regs.push("EUDR");
  if (sector && CBAM_SECTORS.includes(sector)) regs.push("CBAM");
  return regs;
}

export function isFutureRelevance(rel: EuRelevance | "") {
  return (
    rel === "Not currently, but possible in future" ||
    rel === "Our products do not currently go to the EU, but this may happen later"
  );
}

export function dppRequirementDate(sector: Sector | ""): string {
  switch (sector) {
    case "Textiles, garments and footwear sector":
      return "Q3 2027";
    case "Leather and leather products sector":
      return "Q3 2027";
    case "Information and communication technology products / other electronics sector":
      return "2027–2028";
    case "Furniture sector":
      return "2028";
    case "Iron and steel sector":
    case "Aluminium sector":
      return "2028–2029";
    case "Cement sector":
    case "Plastics and polymers":
    case "Detergents and cleaning products sector":
    case "Paints, coatings and varnishes sector":
      return "2028–2029";
    case "Energy-related products with eco-design requirements":
      return "From 2027 (product-specific)";
    default:
      return "Indicative: 2028–2030";
  }
}

/* ---------------- DPP ---------------- */
export interface DppQuestion { id: string; text: string; section: "A" | "B" | "C" | "D"; }

export const DPP_SECTIONS = {
  A: { title: "Data Availability & Documentation", maxScore: 8, qCount: 4 },
  B: { title: "Digital Infrastructure & Systems", maxScore: 8, qCount: 4 },
  C: { title: "Supply Chain & Product Information", maxScore: 8, qCount: 4 },
  D: { title: "Sustainability, Compliance & Governance", maxScore: 4, qCount: 2 },
} as const;

export const DPP_QUESTIONS: DppQuestion[] = [
  { id: "A1", section: "A", text: "Do you maintain structured product-level technical documentation for your products?" },
  { id: "A2", section: "A", text: "Do you have reliable data on material composition, components, and product specifications?" },
  { id: "A3", section: "A", text: "Do you maintain records on product origin, manufacturing location, and supplier details?" },
  { id: "A4", section: "A", text: "Do you regularly update product documentation when specifications or suppliers change?" },
  { id: "B1", section: "B", text: "Do you store product and compliance data in a digital system rather than only in paper or scattered files?" },
  { id: "B2", section: "B", text: "Can your organisation link product data to batch numbers, SKUs, QR codes, or other digital identifiers?" },
  { id: "B3", section: "B", text: "Can product information be shared digitally with buyers, auditors, or regulators when required?" },
  { id: "B4", section: "B", text: "Do you have internal systems or processes to control access, versioning, and quality of product data?" },
  { id: "C1", section: "C", text: "Can you collect relevant product information from key suppliers in your supply chain?" },
  { id: "C2", section: "C", text: "Do you ask suppliers for sustainability, material, or compliance-related data?" },
  { id: "C3", section: "C", text: "Can you trace key inputs, materials, or components back to supplier or source level?" },
  { id: "C4", section: "C", text: "Do you have a process to verify or validate supplier-provided product information?" },
  { id: "D1", section: "D", text: "Do you track sustainability indicators such as recycled content, energy use, emissions, durability, repairability, or end-of-life information?" },
  { id: "D2", section: "D", text: "Has someone in your organisation been assigned responsibility for product compliance, sustainability data, or DPP readiness?" },
];

export type YPN = "Yes" | "Partial" | "No" | "";
export const YPN_SCORE: Record<Exclude<YPN, "">, number> = { Yes: 2, Partial: 1, No: 0 };

export function dppScore(answers: Record<string, YPN>) {
  const bySection: Record<"A" | "B" | "C" | "D", number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const q of DPP_QUESTIONS) {
    const a = answers[q.id];
    if (a) bySection[q.section] += YPN_SCORE[a];
  }
  const total = bySection.A + bySection.B + bySection.C + bySection.D;
  const pct = (total / 28) * 100;
  return { bySection, total, pct };
}

/* ---------------- CBAM (Yes=2, Partial=1, No=0) ---------------- */
export type CbamAns = "Yes" | "Partial" | "No" | "";
export const CBAM_SCORE: Record<Exclude<CbamAns, "">, number> = { Yes: 2, Partial: 1, No: 0 };

export const CBAM_SECTIONS = {
  A: "Awareness & scope understanding",
  B: "Data availability & quality",
  C: "Calculation & methodology",
  D: "System & governance",
  E: "Supply chain & verification readiness",
} as const;

export interface CbamQuestion { id: string; text: string; section: keyof typeof CBAM_SECTIONS; }

export const CBAM_QUESTIONS: CbamQuestion[] = [
  { id: "A1", section: "A", text: "Do any of your products supplied to Europe fall under CBAM?" },
  { id: "A2", section: "A", text: "Have any buyers or traders asked you for carbon or emissions information related to your products?" },
  { id: "A3", section: "A", text: "Do you know that default EU emission values may be used if you do not provide actual data?" },
  { id: "B1", section: "B", text: "Do you have basic factory data such as electricity use, fuel use, production volumes, and product details?" },
  { id: "B2", section: "B", text: "Can you easily collect factory data from different records and departments?" },
  { id: "B3", section: "B", text: "Can you obtain data from key suppliers for CBAM-relevant inputs used in your products?" },
  { id: "C1", section: "C", text: "Do you calculate emissions for your factory or products using a recognised method, for example, GHG Protocol or CBAM?" },
  { id: "C2", section: "C", text: "Are your emissions calculation methods, data sources, and key assumptions written down or documented?" },
  { id: "C3", section: "C", text: "Can you calculate emissions at product or installation level for the goods you supply to Europe?" },
  { id: "D1", section: "D", text: "Has someone in your company been assigned to handle CBAM or carbon work?" },
  { id: "D2", section: "D", text: "Have relevant staff received basic training on CBAM, carbon accounting, or emissions reporting?" },
  { id: "D3", section: "D", text: "Do you have a regular process to review and update CBAM-related data and calculations?" },
  { id: "E1", section: "E", text: "Is your EU buyer, importer, or trader working with you on CBAM data needs?" },
  { id: "E2", section: "E", text: "Do you ask your suppliers for data needed to calculate emissions for CBAM?" },
  { id: "E3", section: "E", text: "Have you planned or considered third-party verification of your emissions data?" },
];

export function cbamScore(answers: Record<string, CbamAns>) {
  const bySection: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  for (const q of CBAM_QUESTIONS) {
    const a = answers[q.id];
    if (a) bySection[q.section] += CBAM_SCORE[a];
  }
  const total = Object.values(bySection).reduce((s, n) => s + n, 0);
  const pct = (total / 30) * 100;
  return { bySection, total, pct };
}

/* ---------------- EUDR ---------------- */
export type EudrAns = "YES" | "NO" | "NOT SURE" | "NOT APPLICABLE" | "";
export const EUDR_SCORE: Record<Exclude<EudrAns, "">, number> = {
  YES: 1,
  "NOT APPLICABLE": 1,
  "NOT SURE": 0.5,
  NO: 0,
};

export interface EudrQuestion { id: string; text: string; step: number; gapMessage?: string; }

export const EUDR_STEPS = [
  "Business & Commodity Scope",
  "Supply Chain & Traceability",
  "Geolocation Data Collection",
  "Deforestation-Free & Legality Verification",
  "EU Buyer Communication & DDS Support",
  "Capacity Building",
];

export const EUDR_QUESTIONS: EudrQuestion[] = [
  { id: "1", step: 1, text: "Have you checked whether your commodity falls under specific HS codes listed under EUDR Annex I?", gapMessage: "In-scope products not identified" },
  { id: "2", step: 1, text: "Have you assessed the proportion of your total exports that go to EU countries?", gapMessage: "EU export exposure not assessed" },
  { id: "3", step: 1, text: "Have you identified all product lines (finished goods, semi-processed) that contain or are derived from EUDR commodities?", gapMessage: "Product lines containing EUDR commodities not mapped" },
  { id: "4", step: 2, text: "Do you know the number of individual farm plots contributing to each export batch?", gapMessage: "Farm-plot-to-batch traceability missing" },
  { id: "5", step: 2, text: "Have you assigned unique Batch IDs to procurement from specific farm sources?", gapMessage: "No unique Batch IDs for procurement" },
  { id: "6", step: 2, text: "If you buy through intermediaries (traders/agents), have you requested that they provide farm-level source data?", gapMessage: "Farm-level data not requested from intermediaries" },
  { id: "7", step: 3, text: "Have you started collecting GPS coordinates (latitude/longitude) for all farms supplying your EUDR commodities?", gapMessage: "No GPS data collected" },
  { id: "8", step: 3, text: "For small farms (under 4 hectares), do you have at least a single GPS point for each plot?", gapMessage: "Missing GPS points for small farms" },
  { id: "9", step: 3, text: "For larger farms (over 4 hectares), do you have polygon boundary GPS data for each plot?", gapMessage: "Missing polygon GPS data for large farms" },
  { id: "10", step: 4, text: "Have you confirmed that all supplying farms were NOT on forest land after 31 December 2020?", gapMessage: "No deforestation-free verification" },
  { id: "11", step: 4, text: "Do you have documentary evidence (land records, revenue records) confirming agricultural use of the land prior to 2020?", gapMessage: "No pre-2020 land use evidence" },
  { id: "12", step: 4, text: "Do you have land ownership or land use right documents (Patta, title deed, lease agreement) for all supplying farms?", gapMessage: "Land ownership documents incomplete" },
  { id: "13", step: 5, text: "Are all compliance-related records (land documents, GPS data, supplier declarations) stored securely for at least 5 years?", gapMessage: "No 5-year document retention system" },
  { id: "14", step: 5, text: "Are you aware that your EU buyer must include a valid DDS reference number in EU customs declarations for your shipments?", gapMessage: "DDS reference process not understood" },
  { id: "15", step: 5, text: "Have you discussed EUDR requirements with your EU buyers?", gapMessage: "EUDR requirements not discussed with EU buyers" },
  { id: "16", step: 6, text: "Have you attended any EUDR awareness workshop, webinar, or training?", gapMessage: "No EUDR training attended" },
  { id: "17", step: 6, text: "Is there a designated person or team within your organisation responsible for EUDR compliance?", gapMessage: "No designated compliance responsibility" },
  { id: "18", step: 6, text: "Have you communicated EUDR requirements to your key suppliers?", gapMessage: "EUDR requirements not shared with suppliers" },
];

export function eudrScore(answers: Record<string, EudrAns>) {
  let total = 0;
  for (const q of EUDR_QUESTIONS) {
    const a = answers[q.id];
    if (a) total += EUDR_SCORE[a];
  }
  return { total, pct: (total / 18) * 100 };
}

/* ---------------- Risk band helpers ---------------- */
export type RiskBand = { label: string; tone: "strong-green" | "light-green" | "amber" | "orange" | "red"; };

export function bandFromPct(pct: number): RiskBand["tone"] {
  if (pct >= 80) return "strong-green";
  if (pct >= 60) return "light-green";
  if (pct >= 40) return "amber";
  if (pct >= 20) return "orange";
  return "red";
}

export function dppRiskLabel(pct: number): string {
  if (pct >= 60) return "High readiness";
  if (pct >= 30) return "Moderate readiness";
  return "Low readiness";
}

export function dppRecommendation(pct: number): string {
  if (pct >= 80) return "You are strongly prepared for DPP requirements. Focus on maintaining data quality, keeping product information up to date, and aligning internal systems with future buyer and regulatory expectations.";
  if (pct >= 60) return "You are generally well prepared for DPP requirements. Focus on improving consistency across products, strengthening data quality, and integrating DPP-related processes into existing systems.";
  if (pct >= 40) return "You have a moderate level of DPP readiness. Prioritise closing gaps in product data, digital systems, supplier information, and documentation quality.";
  if (pct >= 20) return "Your DPP readiness is still limited. Establish basic product data systems, assign internal responsibility, and start collecting key supplier and sustainability information.";
  return "Your organisation is at a very early stage of DPP readiness. Immediate action is needed to build product documentation, data systems, and internal compliance ownership.";
}

/* CBAM uses raw total score out of 30 for risk bands:
   Green ≥ 25 | Orange > 15 and < 25 | Red ≤ 15 */
export function cbamBandFromTotal(total: number): "strong-green" | "orange" | "red" {
  if (total >= 25) return "strong-green";
  if (total > 15) return "orange";
  return "red";
}

export function cbamRiskLabel(total: number): string {
  if (total >= 25) return "High readiness";
  if (total > 15) return "Moderate readiness";
  return "Low readiness";
}

export function cbamRecommendation(total: number): string {
  if (total >= 25) return "You are strongly prepared for CBAM, so the priority is to keep your information up to date, follow any changes in the rules and be ready to share your data with EU buyers when needed";
  if (total > 15) return "You are at a moderate level of CBAM readiness and now need to organise your existing practices, document them, and try at least one complete emissions calculation for a main export product.";
  return "Your CBAM preparation is at a very early stage, so you should first understand the basic requirements and start collecting simple data on energy use, production and exports";
}

/* ---------------- DR Readiness (EUDR, CBAM-style scoring) ---------------- */
export type DrAns = "Yes" | "Partial" | "No" | "";
export const DR_SCORE: Record<Exclude<DrAns, "">, number> = { Yes: 2, Partial: 1, No: 0 };

export const DR_SECTIONS = {
  A: "Business & Commodity Scope",
  B: "Supply Chain Mapping & Traceability",
  C: "Geolocation Data Collection",
  D: "Deforestation-Free & Legality Verification",
  E: "EU Buyer Communication & DDS Support",
  F: "Capacity Building",
} as const;

export interface DrQuestion { id: string; text: string; section: keyof typeof DR_SECTIONS; }

export const DR_QUESTIONS: DrQuestion[] = [
  { id: "A1", section: "A", text: "Have you checked whether your commodity falls under specific HS codes listed under EUDR Annex I?" },
  { id: "A2", section: "A", text: "Have you assessed the proportion of your total exports that go to EU countries?" },
  { id: "A3", section: "A", text: "Have you identified all product lines (finished goods, semi-processed) that contain or are derived from EUDR commodities?" },
  { id: "B1", section: "B", text: "Do you know the number of individual farm plots contributing to each export batch?" },
  { id: "B2", section: "B", text: "Have you assigned unique Batch IDs to procurement from specific farm sources?" },
  { id: "B3", section: "B", text: "If you buy through intermediaries (traders/agents), have you requested that they provide farm-level source data?" },
  { id: "C1", section: "C", text: "Have you started collecting GPS coordinates (latitude/longitude) for all farms supplying your EUDR commodities?" },
  { id: "C2", section: "C", text: "Do you maintain plot-level geolocation data for all sourced farms, with GPS points for small farms and polygon boundaries for larger farms, as applicable?" },
  { id: "C3", section: "C", text: "Do you have a mechanism in place to collect GPS data and store it in a structured format that can be exported when needed?" },
  { id: "D1", section: "D", text: "Have you confirmed that all supplying farms were NOT on forest land after 31 December 2020?" },
  { id: "D2", section: "D", text: "Do you have documentary evidence (land records, revenue records) confirming agricultural use of the land prior to 2020?" },
  { id: "D3", section: "D", text: "Do you have land ownership or land use right documents (Patta, title deed, lease agreement) for all supplying farms?" },
  { id: "E1", section: "E", text: "Are all compliance-related records (land documents, GPS data, supplier declarations) stored securely for at least 5 years?" },
  { id: "E2", section: "E", text: "Are you aware that your EU buyer must include a valid DDS reference number in EU customs declarations for your shipments?" },
  { id: "E3", section: "E", text: "Have you discussed EUDR requirements with your EU buyers?" },
  { id: "F1", section: "F", text: "Have you attended any EUDR awareness workshop, webinar, or training?" },
  { id: "F2", section: "F", text: "Is there a designated person or team within your organisation responsible for EUDR compliance?" },
  { id: "F3", section: "F", text: "Have you communicated EUDR requirements to your key suppliers?" },
];

export const DR_MAX_TOTAL = DR_QUESTIONS.length * 2; // 36

export function drScore(answers: Record<string, DrAns>) {
  const bySection: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
  for (const q of DR_QUESTIONS) {
    const a = answers[q.id];
    if (a) bySection[q.section] += DR_SCORE[a];
  }
  const total = Object.values(bySection).reduce((s, n) => s + n, 0);
  const pct = (total / DR_MAX_TOTAL) * 100;
  return { bySection, total, pct };
}

// DR risk bands scaled to /36: Green ≥ 30, Orange > 18 and < 30, Red ≤ 18
export function drBandFromTotal(total: number): "strong-green" | "orange" | "red" {
  if (total >= 30) return "strong-green";
  if (total > 18) return "orange";
  return "red";
}

export function drRiskLabel(total: number): string {
  if (total >= 30) return "High readiness";
  if (total > 18) return "Moderate readiness";
  return "Low readiness";
}

export function drRecommendation(total: number): string {
  if (total >= 30) return "You are strongly prepared for EUDR. Keep your traceability, geolocation and due diligence records up to date and stay aligned with your EU buyers' DDS process.";
  if (total > 18) return "You are at a moderate level of EUDR readiness. Prioritise closing gaps in farm-level traceability, GPS data collection and deforestation-free verification.";
  return "Your EUDR preparation is at a very early stage. Start by mapping in-scope products, collecting farm-level data and assigning internal responsibility for compliance.";
}

export function eudrLabel(pct: number): string {
  if (pct >= 80) return "High EUDR Readiness";
  if (pct >= 60) return "Moderate EUDR Readiness";
  if (pct >= 40) return "Low EUDR Readiness";
  if (pct >= 20) return "High EUDR Compliance Risk";
  return "Very High EUDR Compliance Risk";
}

export function eudrInterpretation(pct: number): string {
  if (pct >= 80) return "Strong EUDR compliance posture. Suitable for EU market access with minimal corrective actions required.";
  if (pct >= 60) return "Partial compliance achieved. Core systems exist, but gaps remain. Improvement actions recommended before full EU alignment.";
  if (pct >= 40) return "Significant compliance gaps identified. Limited visibility across supply chain and incomplete due diligence systems may create market access risks under EUDR requirements.";
  if (pct >= 20) return "High probability of non-compliance and potential disruption to EU exports unless corrective measures are implemented urgently.";
  return "Critical non-compliance risk. Traceability, geolocation, due diligence, and documentation systems are absent or highly inadequate. Products are at serious risk of EU market rejection. Immediate remediation required.";
}

export function eudrSuggestions(answers: Record<string, EudrAns>): string[] {
  const out = new Set<string>();
  const a = (id: string) => answers[id];
  const gap = (id: string) => {
    const v = a(id);
    return v === "NO" || v === "NOT SURE" || v === "";
  };
  if (gap("1") || gap("3")) out.add("Identify in-scope products");
  if (gap("1")) out.add("Review EUDR Annex I categorization");
  if (gap("13")) out.add("Set up 5-year document retention system");
  if (gap("7") || gap("8") || gap("9")) out.add("Collect farm-level geolocation data");
  if (gap("4") || gap("5") || gap("6")) out.add("Establish supplier documentation process");
  if (gap("14") || gap("15")) out.add("Discuss DDS support requirements with EU buyers");
  if (gap("10") || gap("11") || gap("12")) out.add("Gather deforestation-free and legality evidence");
  if (gap("16") || gap("17") || gap("18")) out.add("Assign EUDR responsibility and train teams");
  return Array.from(out);
}

/* ---------------- Regulation reference content (used by Applicability Checker result) ---------------- */
export interface RegulationInfo {
  code: "DPP" | "EUDR" | "CBAM";
  fullName: string;
  oneLiner: string;
  whatItIs: string;
  whoItApplies: string;
  keyObligations: string[];
  keyDates: { label: string; value: string }[];
  whyItMatters: string;
}

export const REGULATION_INFO: Record<"DPP" | "EUDR" | "CBAM", RegulationInfo> = {
  DPP: {
    code: "DPP",
    fullName: "Digital Product Passport",
    oneLiner: "Mandatory digital record of product data, materials, and lifecycle information for the EU market.",
    whatItIs: "Part of the EU Ecodesign for Sustainable Products Regulation (ESPR), the DPP requires manufacturers to make structured product data (composition, origin, repairability, recyclability, durability) accessible digitally via a unique product identifier.",
    whoItApplies: "Producers, importers, and brand owners placing covered products on the EU market — initial scope includes textiles, batteries, electronics, furniture, iron and steel, aluminium, and chemicals.",
    keyObligations: [
      "Maintain structured product-level technical documentation",
      "Provide a unique product identifier (QR code, NFC, RFID) linking to a digital passport",
      "Disclose material composition, origin, and sustainability attributes",
      "Make data accessible to buyers, customs, market surveillance, and end consumers",
      "Assign internal ownership for product compliance data",
    ],
    keyDates: [
      { label: "Batteries (already in force)", value: "Feb 2027" },
      { label: "Textiles, footwear", value: "2027" },
      { label: "Iron & steel, aluminium, furniture", value: "2028" },
      { label: "Electronics / ICT", value: "2027–2028" },
    ],
    whyItMatters: "Without a compliant DPP, products cannot be legally placed on the EU market once sector rules apply. Buyers are already requesting passport-ready data ahead of deadlines.",
  },
  EUDR: {
    code: "EUDR",
    fullName: "EU Deforestation Regulation",
    oneLiner: "Prohibits the EU import or export of seven commodities linked to deforestation after 31 Dec 2020.",
    whatItIs: "Regulation (EU) 2023/1115 requires operators and traders to prove that cattle, cocoa, coffee, oil palm, rubber, soya, wood and their derived products are deforestation-free and produced in compliance with the laws of the country of production.",
    whoItApplies: "EU operators and traders, and indirectly all non-EU suppliers (farms, processors, exporters) of in-scope commodities and derived products, including leather, furniture, tyres, chocolate, and paper.",
    keyObligations: [
      "Collect GPS geolocation for every plot of land of production",
      "Maintain deforestation-free verification dated to 31 Dec 2020 cutoff",
      "Establish a Due Diligence Statement (DDS) submitted to EU TRACES system",
      "Retain compliance documentation for at least 5 years",
      "Demonstrate legality under producing country's laws (land tenure, labour, tax, environmental)",
    ],
    keyDates: [
      { label: "Large operators & traders", value: "30 Dec 2025" },
      { label: "Micro & small enterprises", value: "30 Jun 2026" },
    ],
    whyItMatters: "Shipments without a valid DDS reference are blocked at EU customs. Penalties include fines up to 4% of EU turnover and temporary market exclusion.",
  },
  CBAM: {
    code: "CBAM",
    fullName: "Carbon Border Adjustment Mechanism",
    oneLiner: "Carbon price on embedded emissions of selected high-carbon goods imported into the EU.",
    whatItIs: "Regulation (EU) 2023/956 puts a carbon price on imported iron & steel, aluminium, cement, fertilisers, electricity, and hydrogen, equivalent to the price EU producers pay under the EU ETS, to prevent carbon leakage.",
    whoItApplies: "EU importers (declarants) of in-scope goods. Non-EU producers must supply verified embedded-emissions data — default values may be used otherwise, often resulting in higher liabilities for buyers.",
    keyObligations: [
      "Calculate direct (and where required indirect) embedded emissions per product",
      "Use a recognised methodology (CBAM-aligned or EU-equivalent monitoring rules)",
      "Document data sources, assumptions, and calculation method",
      "Plan for third-party verification by an EU-accredited verifier",
      "Share product-level emissions data with EU importer for quarterly CBAM reports",
    ],
    keyDates: [
      { label: "Transitional reporting (in force)", value: "Oct 2023 – Dec 2025" },
      { label: "Definitive period — certificates & financial liability", value: "1 Jan 2026" },
    ],
    whyItMatters: "Without supplier-provided actual emissions data, EU buyers default to higher EU benchmark values, increasing the carbon cost they pass back through prices or supplier substitution.",
  },
};

/* ---------------- DPP priority gaps (used by DPP dashboard) ---------------- */
export function dppPriorityGaps(answers: Record<string, YPN>): { id: string; text: string; section: string; status: "No answer" | "Gap" | "Partial" }[] {
  const out: { id: string; text: string; section: string; status: "No answer" | "Gap" | "Partial" }[] = [];
  for (const q of DPP_QUESTIONS) {
    const a = answers[q.id];
    if (!a) out.push({ id: q.id, text: q.text, section: q.section, status: "No answer" });
    else if (a === "No") out.push({ id: q.id, text: q.text, section: q.section, status: "Gap" });
    else if (a === "Partial") out.push({ id: q.id, text: q.text, section: q.section, status: "Partial" });
  }
  // Gap first, then Partial, then No answer
  const rank = { "Gap": 0, "Partial": 1, "No answer": 2 } as const;
  return out.sort((a, b) => rank[a.status] - rank[b.status]).slice(0, 8);
}

/* ---------------- CBAM next actions (used by CBAM result) ---------------- */
export function cbamNextActions(answers: Record<string, CbamAns>): string[] {
  const gap = (id: string) => {
    const v = answers[id];
    return v === "No" || v === "Partial" || !v;
  };
  const out: string[] = [];
  if (gap("A1") || gap("A2") || gap("A3")) out.push("Map which of your exports fall under CBAM Annex I and brief commercial teams on default-value risk.");
  if (gap("B1") || gap("B2")) out.push("Centralise factory data: electricity, fuel use, production volumes, by month and by product line.");
  if (gap("B3")) out.push("Identify CBAM-relevant input suppliers (e.g. precursor steel, alumina, ammonia) and request their emissions data.");
  if (gap("C1") || gap("C3")) out.push("Run a pilot product-level emissions calculation using the EU CBAM monitoring methodology.");
  if (gap("C2")) out.push("Document your calculation method, data sources, and assumptions for verifier review.");
  if (gap("D1") || gap("D2")) out.push("Assign a named CBAM owner and provide basic carbon-accounting training to operations and finance staff.");
  if (gap("D3")) out.push("Set a quarterly review cycle for CBAM data aligned to EU buyer reporting deadlines.");
  if (gap("E1") || gap("E2")) out.push("Open a structured CBAM data conversation with each EU buyer and key supplier.");
  if (gap("E3")) out.push("Shortlist an EU-accredited verifier and plan a verification readiness review before the definitive period.");
  return out;
}