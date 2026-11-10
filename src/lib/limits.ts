import type { JobProfile } from "@/lib/schemas";
import { detectSeniorityLevel } from "@/lib/seniority";

export interface ContentLimits {
  maxExperiencias: number;
  maxProjetos: number;
  maxBulletsExperiencia: number;
  maxBulletsProjeto: number;
}

/**
 * Limites calculados a partir do nível da vaga para caber em uma página.
 * Estágio/júnior mantém mais espaço para projetos de portfólio.
 */
export function getContentLimits(job: JobProfile): ContentLimits {
  const level = detectSeniorityLevel(job);

  if (level === "estagio" || level === "junior") {
    return {
      maxExperiencias: 4,
      maxProjetos: 4,
      maxBulletsExperiencia: 3,
      maxBulletsProjeto: 2,
    };
  }

  if (level === "senior" || level === "lead") {
    return {
      maxExperiencias: 4,
      maxProjetos: 2,
      maxBulletsExperiencia: 4,
      maxBulletsProjeto: 2,
    };
  }

  return {
    maxExperiencias: 3,
    maxProjetos: 3,
    maxBulletsExperiencia: 3,
    maxBulletsProjeto: 2,
  };
}
