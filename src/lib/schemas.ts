import { z } from "zod";

export const prioritySchema = z.enum(["alta", "media", "baixa"]);
export const matchStatusSchema = z.enum(["atende", "parcial", "ausente"]);
export const requirementTypeSchema = z.enum([
  "skill",
  "experiencia",
  "formacao",
  "idioma",
  "comportamental",
  "outro",
]);
export const alignmentLevelSchema = z.enum([
  "bem_alinhado",
  "parcialmente_alinhado",
  "nao_alinhado",
]);
export const changeTypeSchema = z.enum([
  "removido",
  "reordenado",
  "reescrito",
  "mantido",
]);
export const outputLanguageSchema = z.enum(["pt-BR", "en"]);

export const contactInfoSchema = z
  .object({
    email: z.string().optional(),
    telefone: z.string().optional(),
    linkedin: z.string().optional(),
    github: z.string().optional(),
    site: z.string().optional(),
    localizacao: z.string().optional(),
  })
  .default({});

export const experienceSchema = z.object({
  empresa: z.string(),
  cargo: z.string(),
  periodo: z.string().optional(),
  local: z.string().optional(),
  bullets: z.array(z.string()).default([]),
});

export const projectSchema = z.object({
  nome: z.string(),
  descricao: z.string().optional(),
  tecnologias: z.array(z.string()).default([]),
  bullets: z.array(z.string()).default([]),
  link: z.string().optional(),
});

export const skillGroupSchema = z.object({
  categoria: z.string(),
  itens: z.array(z.string()).default([]),
});

export const educationSchema = z.object({
  instituicao: z.string(),
  curso: z.string(),
  periodo: z.string().optional(),
  status: z.string().optional(),
});

export const languageSchema = z.object({
  idioma: z.string(),
  nivel: z.string().optional(),
});

export const masterResumeSchema = z.object({
  nome: z.string().optional(),
  titulo: z.string().optional(),
  contato: contactInfoSchema,
  resumo: z.string().optional(),
  experiencias: z.array(experienceSchema).default([]),
  projetos: z.array(projectSchema).default([]),
  skills: z.array(skillGroupSchema).default([]),
  educacao: z.array(educationSchema).default([]),
  idiomas: z.array(languageSchema).default([]),
  certificacoes: z.array(z.string()).default([]),
});

export const jobRequirementSchema = z.object({
  descricao: z.string(),
  tipo: requirementTypeSchema,
  obrigatorio: z.boolean().default(false),
});

export const jobProfileSchema = z.object({
  cargo: z.string(),
  empresa: z.string().optional(),
  senioridade: z.string().optional(),
  resumo: z.string().optional(),
  requisitos: z.array(jobRequirementSchema).default([]),
});

export const requirementMatchSchema = jobRequirementSchema.extend({
  status: matchStatusSchema,
  evidencia: z.string().optional(),
  prioridade: prioritySchema,
});

export const skillRecommendationSchema = z.object({
  nome: z.string(),
  motivo: z.string(),
  prioridade: prioritySchema,
});

export const projectSuggestionSchema = z.object({
  titulo: z.string(),
  descricao: z.string(),
  stack: z.array(z.string()).default([]),
  entregaveis: z.array(z.string()).default([]),
  cobreGaps: z.array(z.string()).default([]),
});

export const developmentRecommendationsSchema = z.object({
  ferramentas: z.array(skillRecommendationSchema).default([]),
  projetos: z.array(projectSuggestionSchema).default([]),
});

export const changeLogEntrySchema = z.object({
  tipo: changeTypeSchema,
  alvo: z.string(),
  detalhe: z.string(),
});

export const tailoredExperienceSchema = experienceSchema.extend({
  incluido: z.boolean().default(true),
  motivo: z.string().optional(),
});

export const tailoredProjectSchema = projectSchema.extend({
  incluido: z.boolean().default(true),
  motivo: z.string().optional(),
});

export const tailoredSkillGroupSchema = skillGroupSchema.extend({
  incluido: z.boolean().default(true),
});

export const tailoredResumePayloadSchema = z.object({
  titulo: z.string().optional(),
  resumo: z.string().optional(),
  experiencias: z.array(tailoredExperienceSchema).default([]),
  projetos: z.array(tailoredProjectSchema).default([]),
  skills: z.array(tailoredSkillGroupSchema).default([]),
  educacao: z.array(educationSchema).default([]),
  idiomas: z.array(languageSchema).default([]),
  certificacoes: z.array(z.string()).default([]),
});

export const categoryScoresSchema = z.object({
  skills: z.number().int().min(0).max(100),
  experiencias: z.number().int().min(0).max(100),
  senioridade: z.number().int().min(0).max(100),
  formacaoIdiomas: z.number().int().min(0).max(100),
  keywords: z.number().int().min(0).max(100),
});

export const modelNotesSchema = z.object({
  skills: z.number().int().min(0).max(100),
  experiencias: z.number().int().min(0).max(100),
  senioridade: z.number().int().min(0).max(100),
  formacaoIdiomas: z.number().int().min(0).max(100),
});

export const analysisCoreSchema = z.object({
  resumo: z.string(),
  requisitos: z.array(requirementMatchSchema).default([]),
  gaps: z.array(z.string()).default([]),
  keywordsEncontradas: z.array(z.string()).default([]),
  keywordsAusentes: z.array(z.string()).default([]),
  notas: modelNotesSchema,
  recomendacoes: developmentRecommendationsSchema,
});

export const adaptationSchema = z.object({
  curriculo: tailoredResumePayloadSchema,
  alteracoes: z.array(changeLogEntrySchema).default([]),
});

export const analyzeRequestSchema = z.object({
  curriculoTexto: z
    .string()
    .trim()
    .min(50, "O currículo extraído está vazio ou muito curto.")
    .max(120000, "O currículo é muito grande para ser analisado."),
  vagaTexto: z
    .string()
    .trim()
    .min(30, "Cole a descrição completa da vaga.")
    .max(60000, "A descrição da vaga é muito grande para ser analisada."),
  idiomaSaida: outputLanguageSchema.default("pt-BR"),
});

export type MasterResume = z.infer<typeof masterResumeSchema>;
export type JobProfile = z.infer<typeof jobProfileSchema>;
export type AnalysisCore = z.infer<typeof analysisCoreSchema>;
export type Adaptation = z.infer<typeof adaptationSchema>;
export type ModelNotes = z.infer<typeof modelNotesSchema>;
export type OutputLanguage = z.infer<typeof outputLanguageSchema>;
export type CategoryScores = z.infer<typeof categoryScoresSchema>;
export type RequirementMatch = z.infer<typeof requirementMatchSchema>;
export type DevelopmentRecommendations = z.infer<
  typeof developmentRecommendationsSchema
>;
export type ChangeLogEntry = z.infer<typeof changeLogEntrySchema>;
export type TailoredResumePayload = z.infer<
  typeof tailoredResumePayloadSchema
>;
export type AlignmentLevel = z.infer<typeof alignmentLevelSchema>;
export type MatchStatus = z.infer<typeof matchStatusSchema>;
export type Priority = z.infer<typeof prioritySchema>;
export type RequirementType = z.infer<typeof requirementTypeSchema>;
export type ChangeType = z.infer<typeof changeTypeSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type Project = z.infer<typeof projectSchema>;
export type SkillGroup = z.infer<typeof skillGroupSchema>;
export type Education = z.infer<typeof educationSchema>;
export type Language = z.infer<typeof languageSchema>;
export type ContactInfo = z.infer<typeof contactInfoSchema>;

const jsonString = { type: "string" } as const;
const jsonStringArray = { type: "array", items: jsonString } as const;
const jsonScore = {
  type: "integer",
  minimum: 0,
  maximum: 100,
} as const;

export const masterResumeJsonSchema = {
  type: "object",
  properties: {
    nome: jsonString,
    titulo: jsonString,
    contato: {
      type: "object",
      properties: {
        email: jsonString,
        telefone: jsonString,
        linkedin: jsonString,
        github: jsonString,
        site: jsonString,
        localizacao: jsonString,
      },
    },
    resumo: jsonString,
    experiencias: {
      type: "array",
      items: {
        type: "object",
        properties: {
          empresa: jsonString,
          cargo: jsonString,
          periodo: jsonString,
          local: jsonString,
          bullets: jsonStringArray,
        },
        required: ["empresa", "cargo", "bullets"],
      },
    },
    projetos: {
      type: "array",
      items: {
        type: "object",
        properties: {
          nome: jsonString,
          descricao: jsonString,
          tecnologias: jsonStringArray,
          bullets: jsonStringArray,
          link: jsonString,
        },
        required: ["nome", "tecnologias", "bullets"],
      },
    },
    skills: {
      type: "array",
      items: {
        type: "object",
        properties: {
          categoria: jsonString,
          itens: jsonStringArray,
        },
        required: ["categoria", "itens"],
      },
    },
    educacao: {
      type: "array",
      items: {
        type: "object",
        properties: {
          instituicao: jsonString,
          curso: jsonString,
          periodo: jsonString,
          status: jsonString,
        },
        required: ["instituicao", "curso"],
      },
    },
    idiomas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          idioma: jsonString,
          nivel: jsonString,
        },
        required: ["idioma"],
      },
    },
    certificacoes: jsonStringArray,
  },
  required: [
    "nome",
    "contato",
    "experiencias",
    "projetos",
    "skills",
    "educacao",
    "idiomas",
    "certificacoes",
  ],
} as const;

export const jobProfileJsonSchema = {
  type: "object",
  properties: {
    cargo: jsonString,
    empresa: jsonString,
    senioridade: jsonString,
    resumo: jsonString,
    requisitos: {
      type: "array",
      items: {
        type: "object",
        properties: {
          descricao: jsonString,
          tipo: {
            type: "string",
            enum: [
              "skill",
              "experiencia",
              "formacao",
              "idioma",
              "comportamental",
              "outro",
            ],
          },
          obrigatorio: { type: "boolean" },
        },
        required: ["descricao", "tipo", "obrigatorio"],
      },
    },
  },
  required: ["cargo", "requisitos"],
} as const;

const requirementMatchJsonSchema = {
  type: "object",
  properties: {
    descricao: jsonString,
    tipo: {
      type: "string",
      enum: [
        "skill",
        "experiencia",
        "formacao",
        "idioma",
        "comportamental",
        "outro",
      ],
    },
    obrigatorio: { type: "boolean" },
    status: {
      type: "string",
      enum: ["atende", "parcial", "ausente"],
    },
    evidencia: jsonString,
    prioridade: {
      type: "string",
      enum: ["alta", "media", "baixa"],
    },
  },
  required: [
    "descricao",
    "tipo",
    "obrigatorio",
    "status",
    "evidencia",
    "prioridade",
  ],
} as const;

const recommendationsJsonSchema = {
  type: "object",
  properties: {
    ferramentas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          nome: jsonString,
          motivo: jsonString,
          prioridade: {
            type: "string",
            enum: ["alta", "media", "baixa"],
          },
        },
        required: ["nome", "motivo", "prioridade"],
      },
    },
    projetos: {
      type: "array",
      items: {
        type: "object",
        properties: {
          titulo: jsonString,
          descricao: jsonString,
          stack: jsonStringArray,
          entregaveis: jsonStringArray,
          cobreGaps: jsonStringArray,
        },
        required: [
          "titulo",
          "descricao",
          "stack",
          "entregaveis",
          "cobreGaps",
        ],
      },
    },
  },
  required: ["ferramentas", "projetos"],
} as const;

export const analysisCoreJsonSchema = {
  type: "object",
  properties: {
    resumo: jsonString,
    requisitos: {
      type: "array",
      items: requirementMatchJsonSchema,
    },
    gaps: jsonStringArray,
    keywordsEncontradas: jsonStringArray,
    keywordsAusentes: jsonStringArray,
    notas: {
      type: "object",
      properties: {
        skills: jsonScore,
        experiencias: jsonScore,
        senioridade: jsonScore,
        formacaoIdiomas: jsonScore,
      },
      required: ["skills", "experiencias", "senioridade", "formacaoIdiomas"],
    },
    recomendacoes: recommendationsJsonSchema,
  },
  required: [
    "resumo",
    "requisitos",
    "gaps",
    "keywordsEncontradas",
    "keywordsAusentes",
    "notas",
    "recomendacoes",
  ],
} as const;

const tailoredResumeJsonSchema = {
  type: "object",
  properties: {
    titulo: jsonString,
    resumo: jsonString,
    experiencias: {
      type: "array",
      items: {
        type: "object",
        properties: {
          empresa: jsonString,
          cargo: jsonString,
          periodo: jsonString,
          local: jsonString,
          bullets: jsonStringArray,
          incluido: { type: "boolean" },
          motivo: jsonString,
        },
        required: ["empresa", "cargo", "bullets", "incluido"],
      },
    },
    projetos: {
      type: "array",
      items: {
        type: "object",
        properties: {
          nome: jsonString,
          descricao: jsonString,
          tecnologias: jsonStringArray,
          bullets: jsonStringArray,
          link: jsonString,
          incluido: { type: "boolean" },
          motivo: jsonString,
        },
        required: ["nome", "tecnologias", "bullets", "incluido"],
      },
    },
    skills: {
      type: "array",
      items: {
        type: "object",
        properties: {
          categoria: jsonString,
          itens: jsonStringArray,
          incluido: { type: "boolean" },
        },
        required: ["categoria", "itens", "incluido"],
      },
    },
    educacao: {
      type: "array",
      items: {
        type: "object",
        properties: {
          instituicao: jsonString,
          curso: jsonString,
          periodo: jsonString,
          status: jsonString,
        },
        required: ["instituicao", "curso"],
      },
    },
    idiomas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          idioma: jsonString,
          nivel: jsonString,
        },
        required: ["idioma"],
      },
    },
    certificacoes: jsonStringArray,
  },
  required: [
    "titulo",
    "resumo",
    "experiencias",
    "projetos",
    "skills",
    "educacao",
    "idiomas",
    "certificacoes",
  ],
} as const;

const changeLogJsonSchema = {
  type: "array",
  items: {
    type: "object",
    properties: {
      tipo: {
        type: "string",
        enum: ["removido", "reordenado", "reescrito", "mantido"],
      },
      alvo: jsonString,
      detalhe: jsonString,
    },
    required: ["tipo", "alvo", "detalhe"],
  },
} as const;

export const adaptationJsonSchema = {
  type: "object",
  properties: {
    curriculo: tailoredResumeJsonSchema,
    alteracoes: changeLogJsonSchema,
  },
  required: ["curriculo", "alteracoes"],
} as const;
