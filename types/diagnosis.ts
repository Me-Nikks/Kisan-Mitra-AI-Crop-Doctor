export interface DiagnosisStep {
  step: number;
  action: string;
  action_hindi: string;
  product: string | null;
  dosage: string | null;
}

export interface DiagnosisResult {
  disease_name: string;
  disease_name_hindi: string;
  confidence: "high" | "medium" | "low";
  severity: "mild" | "moderate" | "severe";
  affected_part: string;
  cause: string;
  cause_hindi: string;
  steps: DiagnosisStep[];
  prevention: string;
  prevention_hindi: string;
  urgency: "immediate" | "within_week" | "monitor";
  not_sure: boolean;
  error?: string;
}

export type AppLanguage = "hindi" | "english";
