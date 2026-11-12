import { normalizeComparable, normalizeText } from "@/lib/text";

export type SectionKey =
  | "resumo"
  | "formacao"
  | "experiencias"
  | "projetos"
  | "competencias"
  | "informacoes"
  | "certificacoes"
  | "idiomas"
  | "outro";

export interface DocxParagraphInfo {
  index: number;
  text: string;
  normalized: string;
  comparable: string;
  isBlank: boolean;
  isBullet: boolean;
  isTechnologies: boolean;
  isHeading: boolean;
  headingKey?: SectionKey;
}

export interface DocxSectionInfo {
  key: SectionKey;
  headingIndex: number;
  startIndex: number;
  endIndex: number;
}

export interface DocxStructure {
  paragraphs: DocxParagraphInfo[];
  sections: DocxSectionInfo[];
  unsupportedReasons: string[];
}

export interface DocxItemRange {
  startIndex: number;
  endIndex: number;
  bulletIndices: number[];
}

export interface DocxMappingResult {
  ranges: Map<string, DocxItemRange>;
  error?: string;
}

const SECTION_PATTERNS: Array<[SectionKey, RegExp]> = [
  ["resumo", /^resumo( profissional)?:?$/],
  ["formacao", /^formacao( academica)?:?$/],
  [
    "experiencias",
    /^experiencia(s)?( profissional| de trabalho| relevante)?:?$/,
  ],
  ["projetos", /^(projetos|portfolio)( selecionados| relevantes)?:?$/],
  [
    "competencias",
    /^(competencias|habilidades|conhecimentos|skills|stack tecnica):?$/,
  ],
  [
    "informacoes",
    /^(informacoes adicionais|informacoes complementares|outras informacoes|adicionais):?$/,
  ],
  [
    "certificacoes",
    /^(certificacoes|certificados|cursos e certificacoes):?$/,
  ],
  ["idiomas", /^(idiomas|linguas|language):?$/],
];

const BULLET_PATTERN = /^\s*[•▪◦‣·●○■□♦\-–—*]\s*/;

const TECHNOLOGIES_PATTERN = /^tecnologias?\s*:/;

function paragraphText(paragraph: Element): string {
  return Array.from(paragraph.getElementsByTagName("w:t"))
    .map((node) => node.textContent ?? "")
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function identifySectionKey(
  normalizedText: string,
): SectionKey | null {
  if (!normalizedText || normalizedText.length > 80) return null;

  for (const [key, pattern] of SECTION_PATTERNS) {
    if (pattern.test(normalizedText)) return key;
  }

  return null;
}

function paragraphHasBottomBorder(paragraph: Element): boolean {
  const pPr = paragraph.getElementsByTagName("w:pPr")[0];
  if (!pPr) return false;

  const bottom = pPr.getElementsByTagName("w:bottom")[0];
  if (!bottom) return false;

  const value = bottom.getAttribute("w:val");
  const size = Number(bottom.getAttribute("w:sz") ?? "0");

  return value !== "nil" && value !== "none" && size > 0;
}

function detectUnsupportedReasons(body: Element): string[] {
  const reasons: string[] = [];

  if (body.getElementsByTagName("w:tbl").length > 0) {
    reasons.push("o currículo usa tabelas");
  }

  if (body.getElementsByTagName("w:txbxContent").length > 0) {
    reasons.push("o currículo usa caixas de texto");
  }

  if (
    body.getElementsByTagName("w:ins").length > 0 ||
    body.getElementsByTagName("w:del").length > 0
  ) {
    reasons.push("o currículo tem alterações controladas");
  }

  if (body.getElementsByTagName("w:sdt").length > 0) {
    reasons.push("o currículo usa controles de conteúdo");
  }

  const columns = Array.from(body.getElementsByTagName("w:cols"));
  for (const column of columns) {
    const count = Number(column.getAttribute("w:num") ?? "1");
    if (count > 1) {
      reasons.push("o currículo usa layout em colunas");
      break;
    }
  }

  return [...new Set(reasons)];
}

export function analyzeDocxStructure(doc: Document): DocxStructure {
  const body = doc.getElementsByTagName("w:body")[0];
  if (!body) {
    return {
      paragraphs: [],
      sections: [],
      unsupportedReasons: ["não encontramos o corpo do documento"],
    };
  }

  const unsupportedReasons = detectUnsupportedReasons(body);
  const paragraphElements = Array.from(body.getElementsByTagName("w:p"));

  const paragraphs = paragraphElements.map((paragraph, index) => {
    const text = paragraphText(paragraph);
    const normalized = normalizeText(text);
    const comparable = normalizeComparable(text);
    const isBlank = text.length === 0;
    const isBullet =
      BULLET_PATTERN.test(text) ||
      paragraph.getElementsByTagName("w:numPr").length > 0;
    const isTechnologies = TECHNOLOGIES_PATTERN.test(normalized);
    const knownKey = identifySectionKey(normalized);
    const hasBottomBorder = paragraphHasBottomBorder(paragraph);
    const isHeading =
      !isBlank &&
      !isBullet &&
      (knownKey !== null || hasBottomBorder) &&
      normalized.length <= 80;

    return {
      index,
      text,
      normalized,
      comparable,
      isBlank,
      isBullet,
      isTechnologies,
      isHeading,
      headingKey: isHeading
        ? (knownKey ?? ("outro" satisfies SectionKey))
        : undefined,
    };
  });

  const headingParagraphs = paragraphs.filter(
    (paragraph) => paragraph.isHeading,
  );

  const sections: DocxSectionInfo[] = headingParagraphs.map(
    (heading, headingPosition) => ({
      key: heading.headingKey ?? "outro",
      headingIndex: heading.index,
      startIndex: heading.index + 1,
      endIndex:
        headingParagraphs[headingPosition + 1]?.index ?? paragraphs.length,
    }),
  );

  return { paragraphs, sections, unsupportedReasons };
}

export function findSection(
  structure: DocxStructure,
  key: SectionKey,
): DocxSectionInfo | undefined {
  return structure.sections.find((section) => section.key === key);
}

function findAnchorIndex(
  structure: DocxStructure,
  section: DocxSectionInfo,
  variants: string[],
  expectedNextText?: string,
): number | null {
  const candidates: Array<{ index: number; score: number }> = [];

  for (
    let index = section.startIndex;
    index < section.endIndex;
    index += 1
  ) {
    const paragraph = structure.paragraphs[index];

    if (
      !paragraph ||
      paragraph.isBlank ||
      paragraph.isBullet ||
      paragraph.isTechnologies ||
      paragraph.isHeading
    ) {
      continue;
    }

    for (const variant of variants) {
      if (!variant) continue;

      if (
        paragraph.comparable.startsWith(variant) ||
        paragraph.comparable.includes(variant)
      ) {
        let score = paragraph.comparable.startsWith(variant) ? 3 : 1;

        if (expectedNextText) {
          const next = structure.paragraphs
            .slice(index + 1, section.endIndex)
            .find((candidate) => !candidate.isBlank);

          if (next && next.comparable.includes(expectedNextText)) {
            score += 2;
          }
        }

        candidates.push({ index, score });
        break;
      }
    }
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.score - a.score);

  if (
    candidates.length > 1 &&
    candidates[0].score === candidates[1].score
  ) {
    return null;
  }

  return candidates[0].index;
}

function buildRanges(
  structure: DocxStructure,
  section: DocxSectionInfo,
  entries: Array<{ id: string; startIndex: number }>,
): DocxMappingResult {
  const sorted = [...entries].sort(
    (a, b) => a.startIndex - b.startIndex,
  );

  const ranges = new Map<string, DocxItemRange>();

  for (let index = 0; index < sorted.length; index += 1) {
    const entry = sorted[index];
    const endIndex = sorted[index + 1]?.startIndex ?? section.endIndex;
    const bulletIndices: number[] = [];

    for (
      let paragraphIndex = entry.startIndex;
      paragraphIndex < endIndex;
      paragraphIndex += 1
    ) {
      if (structure.paragraphs[paragraphIndex]?.isBullet) {
        bulletIndices.push(paragraphIndex);
      }
    }

    ranges.set(entry.id, {
      startIndex: entry.startIndex,
      endIndex,
      bulletIndices,
    });
  }

  return { ranges };
}

export function mapExperienceBlocks(
  structure: DocxStructure,
  experiences: Array<{ id: string; empresa: string; cargo: string }>,
): DocxMappingResult {
  const section = findSection(structure, "experiencias");

  if (!section) {
    return {
      ranges: new Map(),
      error: 'não encontramos a seção "Experiência Profissional"',
    };
  }

  const usedStarts = new Set<number>();
  const entries: Array<{ id: string; startIndex: number }> = [];

  for (const experience of experiences) {
    const company = normalizeComparable(experience.empresa);
    const role = normalizeComparable(experience.cargo);
    const variants = [company];

    if (company.includes(" - ")) {
      variants.push(company.split(" - ")[0].trim());
    }

    let startIndex = findAnchorIndex(structure, section, variants, role);

    if (startIndex === null && company.length > 20) {
      const shortCompany = company.split(" ").slice(0, 3).join(" ");
      startIndex = findAnchorIndex(
        structure,
        section,
        [shortCompany],
        role,
      );
    }

    if (startIndex === null || usedStarts.has(startIndex)) {
      return {
        ranges: new Map(),
        error: `não conseguimos localizar a experiência "${experience.empresa} — ${experience.cargo}" no arquivo original`,
      };
    }

    usedStarts.add(startIndex);
    entries.push({ id: experience.id, startIndex });
  }

  return buildRanges(structure, section, entries);
}

export function mapProjectBlocks(
  structure: DocxStructure,
  projects: Array<{ id: string; nome: string }>,
): DocxMappingResult {
  const section = findSection(structure, "projetos");

  if (!section) {
    return {
      ranges: new Map(),
      error: 'não encontramos a seção "Projetos"',
    };
  }

  const usedStarts = new Set<number>();
  const entries: Array<{ id: string; startIndex: number }> = [];

  for (const project of projects) {
    const full = normalizeComparable(project.nome);
    const short = normalizeComparable(project.nome.split("|")[0]);
    const variants = [...new Set([full, short].filter(Boolean))];

    const startIndex = findAnchorIndex(structure, section, variants);

    if (startIndex === null || usedStarts.has(startIndex)) {
      return {
        ranges: new Map(),
        error: `não conseguimos localizar o projeto "${project.nome}" no arquivo original`,
      };
    }

    usedStarts.add(startIndex);
    entries.push({ id: project.id, startIndex });
  }

  return buildRanges(structure, section, entries);
}

export function mapSkillBlocks(
  structure: DocxStructure,
  skills: Array<{ id: string; categoria: string }>,
): DocxMappingResult {
  const section = findSection(structure, "competencias");

  if (!section) {
    return {
      ranges: new Map(),
      error: 'não encontramos a seção "Competências"',
    };
  }

  const ranges = new Map<string, DocxItemRange>();

  for (const skill of skills) {
    const category = normalizeComparable(skill.categoria);
    let foundIndex: number | null = null;

    for (
      let index = section.startIndex;
      index < section.endIndex;
      index += 1
    ) {
      const paragraph = structure.paragraphs[index];

      if (
        !paragraph ||
        paragraph.isBlank ||
        paragraph.isBullet ||
        paragraph.isHeading
      ) {
        continue;
      }

      if (
        paragraph.comparable.startsWith(`${category}:`) ||
        paragraph.comparable.startsWith(`${category} `)
      ) {
        foundIndex = index;
        break;
      }
    }

    if (foundIndex === null) {
      return {
        ranges: new Map(),
        error: `não conseguimos localizar a categoria de habilidades "${skill.categoria}" no arquivo original`,
      };
    }

    ranges.set(skill.id, {
      startIndex: foundIndex,
      endIndex: foundIndex + 1,
      bulletIndices: [],
    });
  }

  return { ranges };
}

export function findSummaryIndices(
  structure: DocxStructure,
): { firstIndex: number; extraIndices: number[] } | null {
  const section = findSection(structure, "resumo");
  if (!section) return null;

  const contentIndices: number[] = [];

  for (
    let index = section.startIndex;
    index < section.endIndex;
    index += 1
  ) {
    const paragraph = structure.paragraphs[index];

    if (paragraph && !paragraph.isBlank && !paragraph.isHeading) {
      contentIndices.push(index);
    }
  }

  if (contentIndices.length === 0) return null;

  return {
    firstIndex: contentIndices[0],
    extraIndices: contentIndices.slice(1),
  };
}

export function findTitleIndex(structure: DocxStructure): number | null {
  const firstHeadingIndex =
    structure.sections[0]?.headingIndex ?? structure.paragraphs.length;

  const beforeSections = structure.paragraphs.filter(
    (paragraph) =>
      paragraph.index < firstHeadingIndex &&
      !paragraph.isBlank &&
      !paragraph.isHeading,
  );

  if (beforeSections.length < 2) return null;

  return beforeSections[1].index;
}
