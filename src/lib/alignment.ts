import {
  adaptationJsonSchema,
  adaptationSchema,
  analysisCoreJsonSchema,
  analysisCoreSchema,
  jobProfileJsonSchema,
  jobProfileSchema,
  masterResumeJsonSchema,
  masterResumeSchema,
  type AnalysisCore,
  type JobProfile,
  type MasterResume,
  type OutputLanguage,
} from "@/lib/schemas";
import { generateJson } from "@/lib/gemini";
import {
  SYSTEM_EXTRACT_RESUME,
  SYSTEM_REPAIR,
  buildAdaptationPrompt,
  buildAnalyzePrompt,
  buildExtractJobPrompt,
  buildExtractResumePrompt,
  buildRepairPrompt,
  getAdaptSystem,
  getAnalyzeSystem,
  getExtractJobSystem,
} from "@/lib/prompts";
import {
  checkAdaptation,
  sanitizeAdaptation,
  sanitizeEvidence,
} from "@/lib/fidelity";
import { getContentLimits } from "@/lib/limits";
import { analyzeKeywords, buildMasterResumeText } from "@/lib/text";
import { buildAlignmentResult } from "@/lib/tailoring";
import type { AlignmentResult } from "@/types/analysis";

export class ResumeExtractionError extends Error {}

async function extractMasterResume(texto: string): Promise<MasterResume> {
  const { data: resume } = await generateJson({
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

async function extractJobProfile(
  texto: string,
  idioma: OutputLanguage,
): Promise<JobProfile> {
  const { data } = await generateJson({
    sistema: getExtractJobSystem(idioma),
    prompt: buildExtractJobPrompt(texto),
    jsonSchema: jobProfileJsonSchema,
    schema: jobProfileSchema,
    temperatura: 0.1,
  });

  return data;
}

export async function analyzeAlignment(
  curriculoTexto: string,
  vagaTexto: string,
  idiomaSaida: OutputLanguage,
): Promise<AlignmentResult> {
  const [masterResume, jobProfile] = await Promise.all([
    extractMasterResume(curriculoTexto),
    extractJobProfile(vagaTexto, idiomaSaida),
  ]);

  const masterText = buildMasterResumeText(masterResume);

  const { data: rawAnalysis } = await generateJson({
    sistema: getAnalyzeSystem(idiomaSaida),
    prompt: buildAnalyzePrompt(masterResume, jobProfile),
    jsonSchema: analysisCoreJsonSchema,
    schema: analysisCoreSchema,
    temperatura: 0.1,
  });

  const requisitos = sanitizeEvidence(rawAnalysis.requisitos, masterText);
  const keywords = analyzeKeywords(
    rawAnalysis.keywordsEncontradas,
    rawAnalysis.keywordsAusentes,
    masterText,
  );

  const analysis: AnalysisCore = {
    ...rawAnalysis,
    requisitos,
    keywordsEncontradas: keywords.encontradas,
    keywordsAusentes: keywords.ausentes,
  };

  const { data: initialAdaptation, modelo: initialModel } = await generateJson({
    sistema: getAdaptSystem(idiomaSaida),
    prompt: buildAdaptationPrompt({
      curriculo: masterResume,
      vaga: jobProfile,
      analise: analysis,
      limites: getContentLimits(jobProfile),
      idioma: idiomaSaida,
    }),
    jsonSchema: adaptationJsonSchema,
    schema: adaptationSchema,
    temperatura: 0.2,
  });

  let adaptation = initialAdaptation;
  let modelo = initialModel;

  let violations = checkAdaptation(adaptation, masterResume, analysis);

  if (violations.length > 0) {
    try {
      const { data: repaired, modelo: repairModel } = await generateJson({
        sistema: SYSTEM_REPAIR,
        prompt: buildRepairPrompt(adaptation, violations),
        jsonSchema: adaptationJsonSchema,
        schema: adaptationSchema,
        temperatura: 0.1,
      });

      adaptation = repaired;
      modelo = repairModel;
      violations = checkAdaptation(adaptation, masterResume, analysis);
    } catch (error) {
      console.error(
        "Reparo de fidelidade falhou; aplicando restauração determinística.",
        error,
      );
    }
  }

  const { adaptacao, avisos } = sanitizeAdaptation(
    adaptation,
    masterResume,
    analysis,
  );

  if (violations.length > 0) {
    avisos.push(
      `${violations.length} violação(ões) de fidelidade restaram após o reparo; os itens afetados foram restaurados do currículo mestre.`,
    );
  }

  return buildAlignmentResult({
    master: masterResume,
    job: jobProfile,
    analysis,
    adaptacao,
    keywords,
    modelo,
    avisos,
  });
}
