import type {
  AnalysisPayload,
  MasterResume,
} from "@/lib/schemas";
import { classifyAlignment, computeAlignmentScore } from "@/lib/scoring";
import type {
  AlignmentResult,
  TailoredExperience,
  TailoredProject,
  TailoredSkillGroup,
} from "@/types/analysis";

function withIds<T extends object>(items: T[], prefix: string): (T & { id: string })[] {
  return items.map((item, index) => ({ ...item, id: `${prefix}-${index + 1}` }));
}

function cleanBullets(bullets: string[]): string[] {
  return bullets.map((bullet) => bullet.trim()).filter(Boolean);
}

type TailoredExperienceInput = Omit<TailoredExperience, "id">;
type TailoredProjectInput = Omit<TailoredProject, "id">;

function cleanExperience(
  experience: TailoredExperienceInput,
): TailoredExperienceInput {
  return {
    ...experience,
    empresa: experience.empresa.trim(),
    cargo: experience.cargo.trim(),
    periodo: experience.periodo?.trim() || undefined,
    local: experience.local?.trim() || undefined,
    bullets: cleanBullets(experience.bullets),
    motivo: experience.motivo?.trim() || undefined,
  };
}

function cleanProject(
  project: TailoredProjectInput,
): TailoredProjectInput {
  return {
    ...project,
    nome: project.nome.trim(),
    descricao: project.descricao?.trim() || undefined,
    link: project.link?.trim() || undefined,
    tecnologias: project.tecnologias.map((item) => item.trim()).filter(Boolean),
    bullets: cleanBullets(project.bullets),
    motivo: project.motivo?.trim() || undefined,
  };
}

export function buildAlignmentResult(
  payload: AnalysisPayload,
  masterResume: MasterResume,
  model: string,
): AlignmentResult {
  const score = computeAlignmentScore(payload.categorias);

  const experiencias = withIds(
    payload.curriculo.experiencias.map(cleanExperience),
    "exp",
  ) as TailoredExperience[];

  const projetos = withIds(
    payload.curriculo.projetos.map(cleanProject),
    "proj",
  ) as TailoredProject[];

  const skills = withIds(
    payload.curriculo.skills.map((group) => ({
      ...group,
      categoria: group.categoria.trim(),
      itens: group.itens.map((item) => item.trim()).filter(Boolean),
    })),
    "skill",
  ) as TailoredSkillGroup[];

  return {
    ...payload,
    score,
    nivel: classifyAlignment(score),
    curriculo: {
      nome: masterResume.nome,
      titulo: payload.curriculo.titulo?.trim() || masterResume.titulo,
      contato: masterResume.contato,
      resumo: payload.curriculo.resumo?.trim(),
      experiencias,
      projetos,
      skills,
      educacao: payload.curriculo.educacao,
      idiomas: payload.curriculo.idiomas,
      certificacoes: payload.curriculo.certificacoes
        .map((item) => item.trim())
        .filter(Boolean),
    },
    meta: {
      geradoEm: new Date().toISOString(),
      modelo: model,
    },
  };
}
