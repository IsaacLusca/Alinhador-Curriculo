import type { TailoredResume } from "@/types/analysis";

export interface ExportableResume {
  nome: string;
  titulo?: string;
  contatoLinha: string;
  resumo?: string;
  experiencias: {
    cargo: string;
    empresa: string;
    periodo?: string;
    local?: string;
    bullets: string[];
  }[];
  projetos: {
    nome: string;
    descricao?: string;
    tecnologias: string[];
    bullets: string[];
    link?: string;
  }[];
  skills: {
    categoria: string;
    itens: string[];
  }[];
  educacao: {
    curso: string;
    instituicao: string;
    periodo?: string;
    status?: string;
  }[];
  idiomas: {
    idioma: string;
    nivel?: string;
  }[];
  certificacoes: string[];
}

function cleanList(values: string[]): string[] {
  return values.map((value) => value.trim()).filter(Boolean);
}

export function prepareResumeForExport(
  curriculo: TailoredResume,
): ExportableResume {
  const contatoLinha = [
    curriculo.contato.email,
    curriculo.contato.telefone,
    curriculo.contato.linkedin,
    curriculo.contato.github,
    curriculo.contato.site,
    curriculo.contato.localizacao,
  ]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(" · ");

  return {
    nome: curriculo.nome?.trim() || "Currículo",
    titulo: curriculo.titulo?.trim() || undefined,
    contatoLinha,
    resumo: curriculo.resumo?.trim() || undefined,
    experiencias: curriculo.experiencias
      .filter((item) => item.incluido)
      .map((item) => ({
        cargo: item.cargo.trim(),
        empresa: item.empresa.trim(),
        periodo: item.periodo?.trim() || undefined,
        local: item.local?.trim() || undefined,
        bullets: cleanList(item.bullets),
      })),
    projetos: curriculo.projetos
      .filter((item) => item.incluido)
      .map((item) => ({
        nome: item.nome.trim(),
        descricao: item.descricao?.trim() || undefined,
        tecnologias: cleanList(item.tecnologias),
        bullets: cleanList(item.bullets),
        link: item.link?.trim() || undefined,
      })),
    skills: curriculo.skills
      .filter((item) => item.incluido)
      .map((item) => ({
        categoria: item.categoria.trim(),
        itens: cleanList(item.itens),
      }))
      .filter((item) => item.itens.length > 0),
    educacao: curriculo.educacao.map((item) => ({
      curso: item.curso.trim(),
      instituicao: item.instituicao.trim(),
      periodo: item.periodo?.trim() || undefined,
      status: item.status?.trim() || undefined,
    })),
    idiomas: curriculo.idiomas.map((item) => ({
      idioma: item.idioma.trim(),
      nivel: item.nivel?.trim() || undefined,
    })),
    certificacoes: cleanList(curriculo.certificacoes),
  };
}

export function buildResumeFileName(
  nome: string,
  extension: "pdf" | "docx",
): string {
  const slug = nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `curriculo-${slug || "alinhado"}.${extension}`;
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
