import type {
  AlignmentLevel,
  AnalysisPayload,
  ContactInfo,
  Education,
  Experience,
  Language,
  Project,
  SkillGroup,
} from "@/lib/schemas";

export interface TailoredExperience extends Experience {
  id: string;
  incluido: boolean;
  motivo?: string;
}

export interface TailoredProject extends Project {
  id: string;
  incluido: boolean;
  motivo?: string;
}

export interface TailoredSkillGroup extends SkillGroup {
  id: string;
  incluido: boolean;
}

export interface TailoredResume {
  nome?: string;
  titulo?: string;
  contato: ContactInfo;
  resumo?: string;
  experiencias: TailoredExperience[];
  projetos: TailoredProject[];
  skills: TailoredSkillGroup[];
  educacao: Education[];
  idiomas: Language[];
  certificacoes: string[];
}

export interface ResultMeta {
  geradoEm: string;
  modelo: string;
}

export interface JobSummary {
  cargo: string;
  empresa?: string;
  senioridade?: string;
}

export interface AlignmentResult
  extends Omit<AnalysisPayload, "curriculo"> {
  score: number;
  nivel: AlignmentLevel;
  vaga: JobSummary;
  curriculo: TailoredResume;
  meta: ResultMeta;
}
