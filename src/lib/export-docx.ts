import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import {
  buildResumeFileName,
  downloadBlob,
  prepareResumeForExport,
  type ExportableResume,
} from "@/lib/resume-export";
import type { TailoredResume } from "@/types/analysis";

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 100 },
    border: {
      bottom: {
        color: "CBD5E1",
        style: BorderStyle.SINGLE,
        size: 6,
        space: 2,
      },
    },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        size: 20,
        color: "334155",
        characterSpacing: 20,
      }),
    ],
  });
}

function bulletParagraph(text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 50 },
    children: [new TextRun({ text, size: 20 })],
  });
}

function buildDocument(data: ExportableResume): Document {
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: data.nome, bold: true, size: 40, color: "0F172A" }),
      ],
    }),
  );

  if (data.titulo) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 60 },
        children: [
          new TextRun({ text: data.titulo, size: 24, color: "334155" }),
        ],
      }),
    );
  }

  if (data.contatoLinha) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 120 },
        children: [
          new TextRun({ text: data.contatoLinha, size: 18, color: "64748B" }),
        ],
      }),
    );
  }

  if (data.resumo) {
    children.push(sectionHeading("Resumo"));
    children.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: data.resumo, size: 20 })],
      }),
    );
  }

  if (data.experiencias.length > 0) {
    children.push(sectionHeading("Experiência Profissional"));

    for (const experience of data.experiencias) {
      children.push(
        new Paragraph({
          spacing: { before: 80 },
          children: [
            new TextRun({
              text: `${experience.cargo} — ${experience.empresa}`,
              bold: true,
              size: 21,
            }),
          ],
        }),
      );

      const meta = [experience.periodo, experience.local]
        .filter(Boolean)
        .join(" · ");

      if (meta) {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [new TextRun({ text: meta, size: 18, color: "64748B" })],
          }),
        );
      }

      for (const bullet of experience.bullets) {
        children.push(bulletParagraph(bullet));
      }
    }
  }

  if (data.projetos.length > 0) {
    children.push(sectionHeading("Projetos"));

    for (const project of data.projetos) {
      children.push(
        new Paragraph({
          spacing: { before: 80 },
          children: [
            new TextRun({ text: project.nome, bold: true, size: 21 }),
            ...(project.link
              ? [
                  new TextRun({
                    text: `  ${project.link}`,
                    size: 17,
                    color: "64748B",
                  }),
                ]
              : []),
          ],
        }),
      );

      if (project.descricao) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: project.descricao, size: 20, italics: true }),
            ],
          }),
        );
      }

      if (project.tecnologias.length > 0) {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: project.tecnologias.join(" · "),
                size: 18,
                color: "475569",
              }),
            ],
          }),
        );
      }

      for (const bullet of project.bullets) {
        children.push(bulletParagraph(bullet));
      }
    }
  }

  if (data.skills.length > 0) {
    children.push(sectionHeading("Habilidades"));

    for (const group of data.skills) {
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: `${group.categoria}: `, bold: true, size: 20 }),
            new TextRun({ text: group.itens.join(", "), size: 20 }),
          ],
        }),
      );
    }
  }

  if (data.educacao.length > 0) {
    children.push(sectionHeading("Formação"));

    for (const item of data.educacao) {
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: `${item.curso} — ${item.instituicao}`,
              size: 20,
            }),
          ],
        }),
      );

      const meta = [item.periodo, item.status].filter(Boolean).join(" · ");

      if (meta) {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [new TextRun({ text: meta, size: 18, color: "64748B" })],
          }),
        );
      }
    }
  }

  if (data.idiomas.length > 0) {
    children.push(sectionHeading("Idiomas"));

    for (const item of data.idiomas) {
      const label = item.nivel ? `${item.idioma} — ${item.nivel}` : item.idioma;
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [new TextRun({ text: label, size: 20 })],
        }),
      );
    }
  }

  if (data.certificacoes.length > 0) {
    children.push(sectionHeading("Certificações"));

    for (const item of data.certificacoes) {
      children.push(bulletParagraph(item));
    }
  }

  return new Document({
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 20, color: "1E293B" },
          paragraph: { spacing: { line: 276 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        children,
      },
    ],
  });
}

export async function downloadResumeDocx(
  curriculo: TailoredResume,
): Promise<void> {
  const data = prepareResumeForExport(curriculo);
  const document = buildDocument(data);
  const blob = await Packer.toBlob(document);
  downloadBlob(blob, buildResumeFileName(data.nome, "docx"));
}
