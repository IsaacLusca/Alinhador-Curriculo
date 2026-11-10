import type { MasterResume } from "@/lib/schemas";

const ALIAS_GROUPS: string[][] = [
  ["postgresql", "postgres", "psql"],
  ["nodejs", "node.js", "node"],
  ["javascript", "js"],
  ["typescript", "ts"],
  ["kubernetes", "k8s"],
  ["ci/cd", "cicd", "continuous integration", "integracao continua"],
  ["api rest", "apis rest", "rest api", "rest"],
  ["aws", "amazon web services"],
  ["gcp", "google cloud", "google cloud platform"],
  ["github actions", "gh actions"],
  ["tailwind", "tailwind css"],
  ["fastapi", "fast api"],
  ["kafka", "apache kafka"],
  ["nestjs", "nest.js", "nest"],
  ["nextjs", "next.js", "next"],
  ["react", "react.js", "reactjs"],
  ["vue", "vue.js", "vuejs"],
  ["golang", "go"],
  ["mongodb", "mongo"],
  ["mysql", "my sql"],
  ["power bi", "powerbi"],
  ["csharp", "c#", ".net", "dotnet"],
  ["ruby", "ruby on rails", "rails"],
  ["php", "laravel"],
  ["spring", "spring boot"],
  ["ingles", "english", "ingles avancado"],
  ["espanhol", "spanish"],
];

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeComparable(value: string): string {
  return normalizeText(value).replace(/\s*-\s*/g, "-");
}

export function termVariants(term: string): string[] {
  const normalized = normalizeText(term);
  const variants = new Set<string>([normalized]);

  for (const group of ALIAS_GROUPS) {
    const normalizedGroup = group.map((item) => normalizeText(item));

    if (normalizedGroup.includes(normalized)) {
      for (const variant of normalizedGroup) variants.add(variant);
    }
  }

  return [...variants].filter(Boolean);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsVariant(normalizedHaystack: string, variant: string): boolean {
  if (!variant) return false;

  if (variant.length <= 4 && !variant.includes(" ")) {
    const pattern = new RegExp(
      `(^|[^a-z0-9])${escapeRegExp(variant)}([^a-z0-9]|$)`,
    );
    return pattern.test(normalizedHaystack);
  }

  return normalizedHaystack.includes(variant);
}

export function containsTerm(haystack: string, term: string): boolean {
  const normalizedHaystack = normalizeText(haystack);

  return termVariants(term).some((variant) =>
    containsVariant(normalizedHaystack, variant),
  );
}

export function findTermsInText(text: string, terms: string[]): string[] {
  return terms.filter((term) => containsTerm(text, term));
}

export interface KeywordResult {
  encontradas: string[];
  ausentes: string[];
  score: number;
}

export function analyzeKeywords(
  encontradas: string[],
  ausentes: string[],
  masterText: string,
): KeywordResult {
  const seen = new Set<string>();
  const candidates: string[] = [];

  for (const term of [...encontradas, ...ausentes]) {
    const trimmed = term.trim();
    const key = normalizeText(trimmed);

    if (!trimmed || seen.has(key)) continue;

    seen.add(key);
    candidates.push(trimmed);
  }

  const found: string[] = [];
  const missing: string[] = [];

  for (const term of candidates) {
    if (containsTerm(masterText, term)) {
      found.push(term);
    } else {
      missing.push(term);
    }
  }

  const total = found.length + missing.length;
  const score = total === 0 ? 100 : Math.round((found.length / total) * 100);

  return { encontradas: found, ausentes: missing, score };
}

export function buildMasterResumeText(master: MasterResume): string {
  return [
    master.nome,
    master.titulo,
    master.resumo,
    ...master.experiencias.flatMap((experience) => [
      experience.empresa,
      experience.cargo,
      experience.periodo,
      experience.local,
      ...experience.bullets,
    ]),
    ...master.projetos.flatMap((project) => [
      project.nome,
      project.descricao,
      ...project.tecnologias,
      ...project.bullets,
    ]),
    ...master.skills.flatMap((group) => [group.categoria, ...group.itens]),
    ...master.educacao.flatMap((education) => [
      education.instituicao,
      education.curso,
      education.periodo,
      education.status,
    ]),
    ...master.idiomas.flatMap((language) => [
      language.idioma,
      language.nivel,
    ]),
    ...master.certificacoes,
  ]
    .filter(Boolean)
    .join("\n");
}
