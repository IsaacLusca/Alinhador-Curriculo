import type {
  Adaptation,
  AnalysisCore,
  JobProfile,
  MasterResume,
} from "@/lib/schemas";
import {
  applyMandatoryCap,
  buildCategoryScores,
  classifyAlignment,
  computeAlignmentScore,
} from "@/lib/scoring";
import type { KeywordResult } from "@/lib/text";
import type {
  AlignmentResult,
  TailoredExperience,
  TailoredProject,
  TailoredSkillGroup,
} from "@/types/analysis";

function withIds<T extends object>(
  items: T[],
  prefix: string,
): (T & { id: string })[] {
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

function cleanProject(project: TailoredProjectInput): TailoredProjectInput {
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

export interface BuildAlignmentResultInput {
  master: MasterResume;
  job: JobProfile;
  analysis: AnalysisCore;
  adaptacao: Adaptation;
  keywords: KeywordResult;
  modelo: string;
  avisos: string[];
}

export function buildAlignmentResult({
  master,
  job,
  analysis,
  adaptacao,
  keywords,
  modelo,
  avisos,
}: BuildAlignmentResultInput): AlignmentResult {
  const categorias = buildCategoryScores({
    requisitos: analysis.requisitos,
    notas: analysis.notas,
    keywordsScore: keywords.score,
    master,
    job,
  });

  const rawScore = computeAlignmentScore(categorias);
  const score = applyMandatoryCap(rawScore, analysis.requisitos);

  const experiencias = withIds(
    adaptacao.curriculo.experiencias.map(cleanExperience),
    "exp",
  ) as TailoredExperience[];

  const projetos = withIds(
    adaptacao.curriculo.projetos.map(cleanProject),
    "proj",
  ) as TailoredProject[];

  const skills = withIds(
    adaptacao.curriculo.skills.map((group) => ({
      ...group,
      categoria: group.categoria.trim(),
      itens: group.itens.map((item) => item.trim()).filter(Boolean),
    })),
    "skill",
  ) as TailoredSkillGroup[];

  const alteracoes = [...adaptacao.alteracoes];

  if (avisos.length > 0) {
    alteracoes.push({
      tipo: "mantido",
      alvo: "Validação de fidelidade",
      detalhe: `${avisos.length} ajuste(s) automático(s) para manter o currículo fiel ao original.`,
    });
  }

  return {
    resumo: analysis.resumo,
    requisitos: analysis.requisitos,
    gaps: analysis.gaps,
    keywordsEncontradas: keywords.encontradas,
    keywordsAusentes: keywords.ausentes,
    recomendacoes: analysis.recomendacoes,
    categorias,
    score,
    nivel: classifyAlignment(score),
    vaga: {
      cargo: job.cargo,
      empresa: job.empresa?.trim() || undefined,
      senioridade: job.senioridade?.trim() || undefined,
    },
    curriculo: {
      nome: master.nome,
      titulo: adaptacao.curriculo.titulo?.trim() || master.titulo,
      contato: master.contato,
      resumo: adaptacao.curriculo.resumo?.trim(),
      experiencias,
      projetos,
      skills,
      educacao: adaptacao.curriculo.educacao,
      idiomas: adaptacao.curriculo.idiomas,
      certificacoes: adaptacao.curriculo.certificacoes
        .map((item) => item.trim())
        .filter(Boolean),
    },
    alteracoes,
    meta: {
      geradoEm: new Date().toISOString(),
      modelo,
      avisosValidacao: avisos.length > 0 ? avisos : undefined,
    },
  };
}
