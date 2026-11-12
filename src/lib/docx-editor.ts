import JSZip from "jszip";
import {
  analyzeDocxStructure,
  findSection,
  findSummaryIndices,
  findTitleIndex,
  mapExperienceBlocks,
  mapProjectBlocks,
  mapSkillBlocks,
  type DocxMappingResult,
  type DocxStructure,
} from "@/lib/docx-structure";
import { normalizeText } from "@/lib/text";
import type { AlignmentResult } from "@/types/analysis";

const WORD_NAMESPACE =
  "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export class FaithfulDocxError extends Error {
  readonly code: "unsupported" | "mapping" | "invalid";

  constructor(
    message: string,
    code: "unsupported" | "mapping" | "invalid" = "mapping",
  ) {
    super(message);
    this.name = "FaithfulDocxError";
    this.code = code;
  }
}

export interface EditedDocx {
  blob: Blob;
  warnings: string[];
}

function bodyParagraphs(doc: Document): Element[] {
  const body = doc.getElementsByTagName("w:body")[0];
  if (!body) return [];
  return Array.from(body.getElementsByTagName("w:p"));
}

function paragraphText(paragraph: Element): string {
  return Array.from(paragraph.getElementsByTagName("w:t"))
    .map((node) => node.textContent ?? "")
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function runText(run: Element): string {
  return Array.from(run.getElementsByTagName("w:t"))
    .map((node) => node.textContent ?? "")
    .join("");
}

function directRuns(paragraph: Element): Element[] {
  return Array.from(paragraph.childNodes).filter(
    (node): node is Element =>
      node.nodeType === 1 && node.nodeName === "w:r",
  );
}

function directContent(paragraph: Element): Element[] {
  return Array.from(paragraph.childNodes).filter(
    (node): node is Element =>
      node.nodeType === 1 && node.nodeName !== "w:pPr",
  );
}

function referenceRunProperties(
  paragraph: Element,
  keepPrefixRuns: number,
): Element | undefined {
  const content = directContent(paragraph);
  const candidates = [
    ...content.slice(keepPrefixRuns),
    ...content.slice(0, keepPrefixRuns),
  ];

  for (const child of candidates) {
    if (child.nodeName !== "w:r") continue;

    const properties = child.getElementsByTagName("w:rPr")[0];
    if (properties) return properties.cloneNode(true) as Element;
  }

  const paragraphProperties = paragraph.getElementsByTagName("w:pPr")[0];
  const paragraphRunProperties =
    paragraphProperties?.getElementsByTagName("w:rPr")[0];

  return paragraphRunProperties
    ? (paragraphRunProperties.cloneNode(true) as Element)
    : undefined;
}

function replaceParagraphText(
  paragraph: Element,
  text: string,
  keepPrefixRuns = 0,
): void {
  const document = paragraph.ownerDocument;
  if (!document) return;

  const safeText = text.replace(/\r?\n+/g, " ");
  const referenceProperties = referenceRunProperties(
    paragraph,
    keepPrefixRuns,
  );
  const content = directContent(paragraph);
  const prefix = new Set(content.slice(0, keepPrefixRuns));

  for (const child of Array.from(paragraph.childNodes)) {
    if (child.nodeType === 1 && child.nodeName === "w:pPr") continue;
    if (child.nodeType === 1 && prefix.has(child as Element)) continue;
    if (child.nodeType === 3 && (child.nodeValue ?? "").trim() === "") {
      paragraph.removeChild(child);
      continue;
    }
    if (child.nodeType === 1) paragraph.removeChild(child);
  }

  const run = document.createElementNS(WORD_NAMESPACE, "w:r");
  if (referenceProperties) run.appendChild(referenceProperties);

  const textNode = document.createElementNS(WORD_NAMESPACE, "w:t");
  textNode.setAttribute("xml:space", "preserve");
  textNode.textContent = safeText;
  run.appendChild(textNode);
  paragraph.appendChild(run);
}

function bulletMarkerInfo(paragraph: Element): {
  keepRuns: number;
  prefix: string;
} {
  const runs = directRuns(paragraph);
  const firstRunText = runs[0] ? runText(runs[0]) : "";

  if (firstRunText.trim() && /^\s*[•▪◦‣·●○■□♦\-–—*]\s*$/.test(firstRunText)) {
    return { keepRuns: 1, prefix: "" };
  }

  const fullText = paragraphText(paragraph);
  const match = fullText.match(/^(\s*[•▪◦‣·●○■□♦\-–—*]\s*)/);

  if (match) return { keepRuns: 0, prefix: match[1] };

  return { keepRuns: 0, prefix: "" };
}

function cleanBulletText(text: string): string {
  return text
    .trim()
    .replace(/^[•▪◦‣·●○■□♦\-–—*]\s*/, "")
    .trim();
}

function cleanBullets(bullets: string[]): string[] {
  return bullets
    .map(cleanBulletText)
    .filter(
      (bullet) =>
        bullet.length > 0 && !/^tecnologias?\s*:/i.test(normalizeText(bullet)),
    );
}

function rewriteBullet(paragraph: Element, text: string): void {
  const { keepRuns, prefix } = bulletMarkerInfo(paragraph);
  replaceParagraphText(paragraph, `${prefix}${text}`, keepRuns);
}

function rewriteSkillParagraph(
  paragraph: Element,
  category: string,
  items: string[],
): void {
  const runs = directRuns(paragraph);
  const firstRunText = runs[0] ? runText(runs[0]).trim() : "";
  const normalizedCategory = normalizeText(category);
  const normalizedFirstRun = normalizeText(firstRunText);

  const keepLabel =
    firstRunText.endsWith(":") &&
    (normalizedFirstRun.startsWith(normalizedCategory) ||
      normalizedFirstRun.length <= 80);

  if (keepLabel) {
    replaceParagraphText(paragraph, items.join(", "), 1);
  } else {
    replaceParagraphText(paragraph, `${category}: ${items.join(", ")}`, 0);
  }
}

function addRangeToDeleteSet(
  deleteSet: Set<Element>,
  paragraphElements: Element[],
  startIndex: number,
  endIndex: number,
): void {
  for (let index = startIndex; index < endIndex; index += 1) {
    const paragraph = paragraphElements[index];
    if (paragraph) deleteSet.add(paragraph);
  }
}

function findBulletTemplate(
  structure: DocxStructure,
  paragraphElements: Element[],
): Element | null {
  const bulletParagraph = structure.paragraphs.find(
    (paragraph) => paragraph.isBullet,
  );

  if (!bulletParagraph) return null;

  return paragraphElements[bulletParagraph.index] ?? null;
}

function applyBulletEdits(params: {
  paragraphElements: Element[];
  rangeStart: number;
  rangeEnd: number;
  bulletIndices: number[];
  bullets: string[];
  structure: DocxStructure;
  deleteSet: Set<Element>;
  warnings: string[];
  label: string;
}): void {
  const {
    paragraphElements,
    rangeStart,
    rangeEnd,
    bulletIndices,
    bullets,
    structure,
    deleteSet,
    warnings,
    label,
  } = params;

  const originalBullets = bulletIndices
    .map((index) => paragraphElements[index])
    .filter((element): element is Element => Boolean(element));

  let insertionPoint: Element | null =
    originalBullets[originalBullets.length - 1] ??
    paragraphElements[rangeStart] ??
    null;

  if (originalBullets.length === 0) {
    for (let index = rangeStart; index < rangeEnd; index += 1) {
      const paragraph = structure.paragraphs[index];
      const element = paragraphElements[index];

      if (
        !paragraph ||
        !element ||
        paragraph.isBlank ||
        paragraph.isBullet ||
        paragraph.isTechnologies ||
        paragraph.isHeading
      ) {
        continue;
      }

      insertionPoint = element;
    }
  }

  if (!insertionPoint) {
    warnings.push(`Não encontramos um ponto de inserção de bullets em ${label}.`);
    return;
  }

  for (let index = 0; index < bullets.length; index += 1) {
    if (index < originalBullets.length) {
      rewriteBullet(originalBullets[index], bullets[index]);
      continue;
    }

    const source =
      originalBullets[originalBullets.length - 1] ??
      findBulletTemplate(structure, paragraphElements);

    if (!source || !source.parentNode) {
      warnings.push(
        `Não foi possível adicionar um bullet extra em ${label} (o arquivo não tem um bullet modelo).`,
      );
      break;
    }

    const clone = source.cloneNode(true) as Element;
    source.parentNode.insertBefore(clone, insertionPoint.nextSibling);
    insertionPoint = clone;

    if (originalBullets.length === 0) {
      originalBullets.push(clone);
    }

    rewriteBullet(clone, bullets[index]);
  }

  for (let index = bullets.length; index < bulletIndices.length; index += 1) {
    const paragraph = paragraphElements[bulletIndices[index]];
    if (paragraph) deleteSet.add(paragraph);
  }
}

function removeSection(
  structure: DocxStructure,
  paragraphElements: Element[],
  deleteSet: Set<Element>,
  key: "experiencias" | "projetos" | "competencias",
): void {
  const section = findSection(structure, key);
  if (!section) return;

  if (paragraphElements[section.headingIndex]) {
    deleteSet.add(paragraphElements[section.headingIndex]);
  }

  addRangeToDeleteSet(
    deleteSet,
    paragraphElements,
    section.startIndex,
    section.endIndex,
  );
}

function requireMapping(mapping: DocxMappingResult): void {
  if (mapping.error) {
    throw new FaithfulDocxError(mapping.error, "mapping");
  }
}

export async function editDocxWithResume(
  bytes: ArrayBuffer,
  result: AlignmentResult,
): Promise<EditedDocx> {
  const warnings: string[] = [];
  const zip = await JSZip.loadAsync(bytes);
  const documentEntry = zip.file("word/document.xml");

  if (!documentEntry) {
    throw new FaithfulDocxError(
      "O arquivo não contém word/document.xml.",
      "invalid",
    );
  }

  const documentXml = await documentEntry.async("string");
  const parser = new DOMParser();
  const document = parser.parseFromString(documentXml, "text/xml");

  if (document.getElementsByTagName("parsererror").length > 0) {
    throw new FaithfulDocxError(
      "Não foi possível interpretar o XML do DOCX.",
      "invalid",
    );
  }

  const structure = analyzeDocxStructure(document);

  if (structure.unsupportedReasons.length > 0) {
    throw new FaithfulDocxError(
      `Este layout não é compatível com a edição fiel: ${structure.unsupportedReasons.join("; ")}.`,
      "unsupported",
    );
  }

  const paragraphElements = bodyParagraphs(document);

  const experienceMapping = mapExperienceBlocks(
    structure,
    result.curriculo.experiencias,
  );
  requireMapping(experienceMapping);

  const projectMapping = mapProjectBlocks(
    structure,
    result.curriculo.projetos,
  );
  requireMapping(projectMapping);

  const skillMapping = mapSkillBlocks(structure, result.curriculo.skills);
  requireMapping(skillMapping);

  const deleteSet = new Set<Element>();

  const hasIncludedExperiences = result.curriculo.experiencias.some(
    (experience) => experience.incluido,
  );
  const hasIncludedProjects = result.curriculo.projetos.some(
    (project) => project.incluido,
  );
  const hasIncludedSkills = result.curriculo.skills.some(
    (group) => group.incluido,
  );

  if (!hasIncludedExperiences) {
    removeSection(structure, paragraphElements, deleteSet, "experiencias");
  } else {
    for (const experience of result.curriculo.experiencias) {
      const range = experienceMapping.ranges.get(experience.id);
      if (!range) continue;

      if (!experience.incluido) {
        addRangeToDeleteSet(
          deleteSet,
          paragraphElements,
          range.startIndex,
          range.endIndex,
        );
        continue;
      }

      applyBulletEdits({
        paragraphElements,
        rangeStart: range.startIndex,
        rangeEnd: range.endIndex,
        bulletIndices: range.bulletIndices,
        bullets: cleanBullets(experience.bullets),
        structure,
        deleteSet,
        warnings,
        label: `experiência "${experience.empresa}"`,
      });
    }
  }

  if (!hasIncludedProjects) {
    removeSection(structure, paragraphElements, deleteSet, "projetos");
  } else {
    for (const project of result.curriculo.projetos) {
      const range = projectMapping.ranges.get(project.id);
      if (!range) continue;

      if (!project.incluido) {
        addRangeToDeleteSet(
          deleteSet,
          paragraphElements,
          range.startIndex,
          range.endIndex,
        );
        continue;
      }

      applyBulletEdits({
        paragraphElements,
        rangeStart: range.startIndex,
        rangeEnd: range.endIndex,
        bulletIndices: range.bulletIndices,
        bullets: cleanBullets(project.bullets),
        structure,
        deleteSet,
        warnings,
        label: `projeto "${project.nome}"`,
      });
    }
  }

  if (!hasIncludedSkills) {
    removeSection(structure, paragraphElements, deleteSet, "competencias");
  } else {
    for (const group of result.curriculo.skills) {
      const range = skillMapping.ranges.get(group.id);
      if (!range) continue;

      const paragraph = paragraphElements[range.startIndex];
      if (!paragraph) continue;

      if (!group.incluido || group.itens.length === 0) {
        deleteSet.add(paragraph);
        continue;
      }

      rewriteSkillParagraph(paragraph, group.categoria, group.itens);
    }
  }

  const titleIndex = findTitleIndex(structure);
  if (titleIndex !== null && result.curriculo.titulo?.trim()) {
    const titleParagraph = paragraphElements[titleIndex];
    if (titleParagraph) {
      replaceParagraphText(titleParagraph, result.curriculo.titulo.trim());
    }
  } else if (result.curriculo.titulo?.trim()) {
    warnings.push(
      "Não encontramos o parágrafo do título profissional; o título original foi mantido.",
    );
  }

  const summaryIndices = findSummaryIndices(structure);
  if (summaryIndices && result.curriculo.resumo?.trim()) {
    const summaryParagraph =
      paragraphElements[summaryIndices.firstIndex];
    if (summaryParagraph) {
      replaceParagraphText(summaryParagraph, result.curriculo.resumo.trim());
    }
    for (const extraIndex of summaryIndices.extraIndices) {
      const extraParagraph = paragraphElements[extraIndex];
      if (extraParagraph) deleteSet.add(extraParagraph);
    }
  } else if (result.curriculo.resumo?.trim()) {
    warnings.push(
      "Não encontramos o parágrafo do resumo; o resumo original foi mantido.",
    );
  }

  for (const paragraph of deleteSet) {
    paragraph.parentNode?.removeChild(paragraph);
  }

  const serializer = new XMLSerializer();
  let editedXml = serializer.serializeToString(document);

  if (!editedXml.startsWith("<?xml")) {
    editedXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n${editedXml}`;
  }

  zip.file("word/document.xml", editedXml);

  const editedBytes = await zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
  });

  const checkZip = await JSZip.loadAsync(editedBytes);
  const checkXml = await checkZip.file("word/document.xml")?.async("string");

  if (!checkXml) {
    throw new FaithfulDocxError(
      "O DOCX editado não contém word/document.xml.",
      "invalid",
    );
  }

  const checkDocument = parser.parseFromString(checkXml, "text/xml");
  if (checkDocument.getElementsByTagName("parsererror").length > 0) {
    throw new FaithfulDocxError(
      "O DOCX editado gerou um XML inválido.",
      "invalid",
    );
  }

  return {
    blob: new Blob(
      [
        editedBytes.buffer.slice(
          editedBytes.byteOffset,
          editedBytes.byteOffset + editedBytes.byteLength,
        ) as ArrayBuffer,
      ],
      { type: DOCX_MIME },
    ),
    warnings,
  };
}

export function faithfulDocxFileName(originalFileName: string): string {
  return `${originalFileName.replace(/\.docx$/i, "")}-adaptado.docx`;
}
