const MAX_FILE_SIZE = 10 * 1024 * 1024;

export interface ParsedResumeFile {
  fileName: string;
  text: string;
  warnings: string[];
}

export class DocxParseError extends Error {}

const BLOCK_TAGS = new Set([
  "P",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "LI",
  "TR",
  "BLOCKQUOTE",
]);

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function htmlToStructuredText(html: string): string {
  const document = new DOMParser().parseFromString(html, "text/html");
  const lines: string[] = [];

  const walk = (element: Element) => {
    for (const child of Array.from(element.children)) {
      const tag = child.tagName;

      if (!BLOCK_TAGS.has(tag)) {
        walk(child);
        continue;
      }

      if (tag === "LI") {
        const text = collapseWhitespace(child.textContent ?? "");
        if (text) lines.push(`- ${text}`);
        continue;
      }

      if (tag === "TR") {
        const cells = Array.from(child.children)
          .map((cell) => collapseWhitespace(cell.textContent ?? ""))
          .filter(Boolean);
        if (cells.length > 0) lines.push(cells.join(" | "));
        continue;
      }

      const text = collapseWhitespace(child.textContent ?? "");
      if (!text) continue;

      if (/^H[1-6]$/.test(tag)) {
        lines.push("", `## ${text}`, "");
      } else {
        lines.push(text, "");
      }
    }
  };

  walk(document.body);

  return lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function validateResumeFile(file: File): void {
  const name = file.name.toLowerCase();

  if (!name.endsWith(".docx")) {
    throw new DocxParseError(
      "Formato não suportado. Envie um arquivo .docx (Word). Arquivos .doc antigos não são aceitos.",
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new DocxParseError(
      "O arquivo é maior que 10 MB. Envie uma versão mais leve do currículo.",
    );
  }
}

export async function extractTextFromDocx(
  file: File,
): Promise<ParsedResumeFile> {
  validateResumeFile(file);

  let html: string;
  let messages: { type: "warning" | "error"; message: string }[] = [];

  try {
    const mammoth = (await import("mammoth/mammoth.browser")).default;
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    html = result.value;
    messages = result.messages;
  } catch (error) {
    console.error("Erro ao ler DOCX:", error);
    throw new DocxParseError(
      "Não foi possível ler o arquivo. Verifique se ele é um .docx válido e tente novamente.",
    );
  }

  const text = htmlToStructuredText(html);

  if (!text || text.length < 50) {
    throw new DocxParseError(
      "O arquivo não contém texto suficiente. Se o currículo for uma imagem escaneada, exporte-o novamente como texto no Word.",
    );
  }

  return {
    fileName: file.name,
    text,
    warnings: messages
      .filter((message) => message.type === "warning")
      .map((message) => message.message),
  };
}
