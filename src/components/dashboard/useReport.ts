'use client';

import { useAnalysis } from '@/context/AnalysisContext';
import type { CareerAnalysis, IntelligenceReport } from '@/lib/types';

export interface ReportData {
  report: IntelligenceReport;
  career: CareerAnalysis;
}

/** Only call from within a section that is rendered when analysis is ready. */
export function useReport(): ReportData {
  const { data } = useAnalysis();
  if (!data?.report || !data.career) {
    // Defensive: sections are only rendered once data is ready.
    throw new Error('Analysis data not available');
  }
  return { report: data.report, career: data.career };
}

export function useMaybeReport(): ReportData | null {
  const { data } = useAnalysis();
  if (!data?.report || !data.career) return null;
  return { report: data.report, career: data.career };
}