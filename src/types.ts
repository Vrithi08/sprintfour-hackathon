export interface PIISpan {
  id: string;
  text: string;
  type: string; // "NAME" | "EMAIL" | "PHONE" | "SSN" | "ADDRESS" | "DATE" | "ORG" | "OTHER"
  start: number;
  end: number;
  confidence: number; // 0-1
  status: "redacted" | "flagged_kept" | "not_pii";
  reasoning: string;
  reasoningWorried: string;
}

export interface DocumentAnalysis {
  id: string;
  title: string;
  originalText: string;
  spans: PIISpan[];
  safetyScore: number;
  analyzedAt: string;
}

export interface AskWhyRequest {
  span: PIISpan;
  question: string;
  worriedMode: boolean;
}

export interface AskWhyResponse {
  answer: string;
  generatedAt: string;
  fallback?: boolean;
}
