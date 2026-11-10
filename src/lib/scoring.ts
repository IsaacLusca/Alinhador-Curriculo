import type {
  CategoryScores,
  JobProfile,
  MasterResume,
  ModelNotes,
  RequirementMatch,
} from "@/lib/schemas";
import { scoreSeniority } from "@/lib/seniority";

export const SCORE_WEIGHTS: Record<keyof CategoryScores, number> = {
  skills: 0.4,
  experiencias: 0.25,
  senioridade: 0.15,
  formacaoIdiomas: 0.1,
  keywords: 0.1,
};

const PRIORITY_WEIGHT = { alta: 3, media: 2, baixa: 1 } as const;
const STATUS_VALUE = { atende: 1, parcial: 0.5, ausente: 0 } as const;

export function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error(`Valor de score inválido: ${value}`);
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

export function scoreRequirementCoverage(
  requisitos: RequirementMatch[],
): number | null {
  if (requisitos.length === 0) return null;

  const totalWeight = requisitos.reduce(
    (total, requirement) => total + PRIORITY_WEIGHT[requirement.prioridade],
    0,
  );

  if (totalWeight === 0) return null;

  const obtained = requisitos.reduce(
    (total, requirement) =>
      total +
      PRIORITY_WEIGHT[requirement.prioridade] *
        STATUS_VALUE[requirement.status],
    0,
  );

  return clampScore((obtained / totalWeight) * 100);
}

export function scoreSkillRequirements(
  requisitos: RequirementMatch[],
): number | null {
  return scoreRequirementCoverage(
    requisitos.filter((requirement) => requirement.tipo === "skill"),
  );
}

export function scoreKeywords(
  encontradas: string[],
  ausentes: string[],
): number {
  const total = encontradas.length + ausentes.length;
  if (total === 0) return 100;

  return clampScore((encontradas.length / total) * 100);
}

export function buildCategoryScores(params: {
  requisitos: RequirementMatch[];
  notas: ModelNotes;
  keywordsScore: number;
  master: MasterResume;
  job: JobProfile;
}): CategoryScores {
  const { requisitos, notas, keywordsScore, master, job } = params;
  const computedSkills = scoreSkillRequirements(requisitos);
  const computedSeniority = scoreSeniority(job, master);

  return {
    skills: computedSkills ?? clampScore(notas.skills),
    experiencias: clampScore(notas.experiencias),
    senioridade: computedSeniority ?? clampScore(notas.senioridade),
    formacaoIdiomas: clampScore(notas.formacaoIdiomas),
    keywords: clampScore(keywordsScore),
  };
}

/**
 * Um requisito eliminatório ausente não pode conviver com um score alto.
 * 1 ausência obrigatória limita o score a 69; 2 ou mais, a 54.
 */
export function applyMandatoryCap(
  score: number,
  requisitos: RequirementMatch[],
): number {
  const missingMandatory = requisitos.filter(
    (requirement) => requirement.obrigatorio && requirement.status === "ausente",
  ).length;

  if (missingMandatory >= 2) return Math.min(score, 54);
  if (missingMandatory === 1) return Math.min(score, 69);

  return score;
}

export function computeAlignmentScore(scores: CategoryScores): number {
  const weighted = (
    Object.keys(SCORE_WEIGHTS) as (keyof CategoryScores)[]
  ).reduce(
    (total, key) => total + clampScore(scores[key]) * SCORE_WEIGHTS[key],
    0,
  );

  return Math.round(weighted);
}

export function classifyAlignment(
  score: number,
): "bem_alinhado" | "parcialmente_alinhado" | "nao_alinhado" {
  if (score >= 75) return "bem_alinhado";
  if (score >= 45) return "parcialmente_alinhado";
  return "nao_alinhado";
}
