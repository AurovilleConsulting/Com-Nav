import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { EuRelevance, Sector, YPN, CbamAns, EudrAns } from "./assessment-data";

interface Org {
  name: string;
  whatsapp: string;
  relevance: EuRelevance | "";
  sector: Sector | "";
}

interface State {
  org: Org;
  dpp: Record<string, YPN>;
  cbam: Record<string, CbamAns>;
  eudr: Record<string, EudrAns>;
}

const DEFAULT: State = {
  org: { name: "", whatsapp: "", relevance: "", sector: "" },
  dpp: {},
  cbam: {},
  eudr: {},
};

const STORAGE_KEY = "compliance-assessment-v1";

interface Ctx extends State {
  setOrg: (patch: Partial<Org>) => void;
  setDpp: (id: string, v: YPN) => void;
  setCbam: (id: string, v: CbamAns) => void;
  setEudr: (id: string, v: EudrAns) => void;
  resetAll: () => void;
  resetModule: (m: "dpp" | "eudr" | "cbam") => void;
}

const AssessmentCtx = createContext<Ctx | null>(null);

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(DEFAULT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) setState({ ...DEFAULT, ...JSON.parse(raw) });
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, [state, hydrated]);

  const value: Ctx = {
    ...state,
    setOrg: (patch) => setState((s) => ({ ...s, org: { ...s.org, ...patch } })),
    setDpp: (id, v) => setState((s) => ({ ...s, dpp: { ...s.dpp, [id]: v } })),
    setCbam: (id, v) => setState((s) => ({ ...s, cbam: { ...s.cbam, [id]: v } })),
    setEudr: (id, v) => setState((s) => ({ ...s, eudr: { ...s.eudr, [id]: v } })),
    resetAll: () => setState(DEFAULT),
    resetModule: (m) => setState((s) => ({ ...s, [m]: {} } as State)),
  };

  return <AssessmentCtx.Provider value={value}>{children}</AssessmentCtx.Provider>;
}

export function useAssessment() {
  const c = useContext(AssessmentCtx);
  if (!c) throw new Error("useAssessment must be used within AssessmentProvider");
  return c;
}