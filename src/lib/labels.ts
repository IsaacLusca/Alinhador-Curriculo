import type {
  AlignmentLevel,
  CategoryScores,
  ChangeType,
  MatchStatus,
  Priority,
  RequirementType,
} from "@/lib/schemas";

export const ALIGNMENT_LEVEL_LABEL: Record<AlignmentLevel, string> = {
  bem_alinhado: "Bem alinhado",
  parcialmente_alinhado: "Parcialmente alinhado",
  nao_alinhado: "Não alinhado",
};

export const ALIGNMENT_LEVEL_DESCRIPTION: Record<AlignmentLevel, string> = {
  bem_alinhado:
    "Seu currículo cobre a maior parte do que a vaga pede. A versão adaptada destaca o que importa.",
  parcialmente_alinhado:
    "Você atende parte dos requisitos. A versão adaptada prioriza o que já existe e as recomendações mostram o que desenvolver.",
  nao_alinhado:
    "Há uma distância relevante entre o currículo e a vaga. Veja as lacunas e o plano de desenvolvimento sugerido.",
};

export const MATCH_STATUS_LABEL: Record<MatchStatus, string> = {
  atende: "Atende",
  parcial: "Parcial",
  ausente: "Ausente",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

export const REQUIREMENT_TYPE_LABEL: Record<RequirementType, string> = {
  skill: "Tecnologia",
  experiencia: "Experiência",
  formacao: "Formação",
  idioma: "Idioma",
  comportamental: "Comportamental",
  outro: "Outro",
};

export const CHANGE_TYPE_LABEL: Record<ChangeType, string> = {
  removido: "Removido",
  reordenado: "Reordenado",
  reescrito: "Reescrito",
  mantido: "Mantido",
};

export const CATEGORY_LABEL: Record<keyof CategoryScores, string> = {
  skills: "Tecnologias",
  experiencias: "Experiências",
  senioridade: "Senioridade",
  formacaoIdiomas: "Formação e idiomas",
  keywords: "Palavras-chave",
};
