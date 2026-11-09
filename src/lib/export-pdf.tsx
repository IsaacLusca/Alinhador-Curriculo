"use client";

import {
  buildResumeFileName,
  downloadBlob,
  prepareResumeForExport,
} from "@/lib/resume-export";
import type { TailoredResume } from "@/types/analysis";

export async function downloadResumePdf(
  curriculo: TailoredResume,
): Promise<void> {
  const [{ pdf }, { ResumePdf }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/result/ResumePdf"),
  ]);

  const data = prepareResumeForExport(curriculo);
  const blob = await pdf(<ResumePdf data={data} />).toBlob();

  downloadBlob(blob, buildResumeFileName(data.nome, "pdf"));
}
