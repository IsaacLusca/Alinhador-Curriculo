import {
  analysisPayloadJsonSchema,
  masterResumeJsonSchema,
  analysisPayloadSchema,
  jobProfileJsonSchema,
  jobProfileSchema,
  masterResumeSchema,
  type JobProfile,
  type MasterResume,
} from "@/lib/schemas";
import { generateJson, getModelName } from "@/lib/gemini";
import {
  SYSTEM_ANALYZE,
  SYSTEM_EXTRACT_JOB,
  SYSTEM_EXTRACT_RESUME,
  buildAnalyzePrompt,
  buildExtractJobPrompt,
  buildExtractResumePrompt,
} from "@/lib/prompts";
import { buildAlignmentResult } from "@/lib/tailoring";
import type { AlignmentResult } from "@/types/analysis";

export class ResumeExtractionError extends Error {}

async function extractMasterResume(texto: string): Promise<MasterResume> {
  const resume = await generateJson({
    sistema: SYSTEM_EXTRACT_RESUME,
    prompt: buildExtractResumePrompt(texto),
    jsonSchema: masterResumeJsonSchema,
    schema: masterResumeSchema,
    temperatura: 0.1,
  });

  const hasContent =
    resume.experiencias.length > 0 ||
    resume.projetos.length > 0 ||
    resume.skills.length > 0;

  if (!hasContent) {
    throw new ResumeExtractionError(
      "Não conseguimos identificar experiências, projetos ou habilidades no texto extraído do currículo. Revise o conteúdo na etapa de upload e tente novamente.",
    );
  }

  return resume;
}

async function extractJobProfile(texto: string): Promise<JobProfile> {
  return generateJson({
    sistema: SYSTEM_EXTRACT_JOB,
    prompt: buildExtractJobPrompt(texto),
    jsonSchema: jobProfileJsonSchema,
    schema: jobProfileSchema,
    temperatura: 0.1,
  });
}

export async function analyzeAlignment(
  curriculoTexto: string,
  vagaTexto: string,
): Promise<AlignmentResult> {
  const [masterResume, jobProfile] = await Promise.all([
    extractMasterResume(curriculoTexto),
    extractJobProfile(vagaTexto),
  ]);

  const payload = await generateJson({
    sistema: SYSTEM_ANALYZE,
    prompt: buildAnalyzePrompt(masterResume, jobProfile),
    jsonSchema: analysisPayloadJsonSchema,
    schema: analysisPayloadSchema,
    temperatura: 0.3,
  });

  return buildAlignmentResult(
    payload,
    masterResume,
    jobProfile,
    getModelName(),
  );
}
