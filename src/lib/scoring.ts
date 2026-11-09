import type { AlignmentLevel, CategoryScores } from "@/lib/schemas";

export const SCORE_WEIGHTS: Record<keyof CategoryScores, number> = {
  skills: 0.4,
  experiencias: 0.25,
  senioridade: 0.15,
  formacaoIdiomas: 0.1,
  keywords: 0.1,
};

export function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
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

export function classifyAlignment(score: number): AlignmentLevel {
  if (score >= 75) return "bem_alinhado";
  if (score >= 45) return "parcialmente_alinhado";
  return "nao_alinhado";
}
