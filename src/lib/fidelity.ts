import type {
  Adaptation,
  AnalysisCore,
  Education,
  Experience,
  Language,
  MasterResume,
  Project,
  RequirementMatch,
} from "@/lib/schemas";

type PayloadExperience = Adaptation["curriculo"]["experiencias"][number];
type PayloadProject = Adaptation["curriculo"]["projetos"][number];
import {
  containsTerm,
  findTermsInText,
  normalizeComparable,
  normalizeText,
} from "@/lib/text";

const MAX_VIOLATIONS = 20;
const MAX_WARNINGS = 12;

export interface AdaptationSanitization {
  adaptacao: Adaptation;
  avisos: string[];
}

function cleanEvidence(value?: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  return trimmed
    .replace(/^["“”'‘’]+/, "")
    .replace(/["“”'‘’]+$/, "")
    .trim();
}

export function sanitizeEvidence(
  requisitos: RequirementMatch[],
  masterText: string,
): RequirementMatch[] {
  const normalizedMaster = normalizeText(masterText);

  return requisitos.map((requirement) => {
    if (requirement.status === "ausente") {
      return { ...requirement, evidencia: undefined };
    }

    const evidence = cleanEvidence(requirement.evidencia);

    if (!evidence || !normalizedMaster.includes(normalizeText(evidence))) {
      return { ...requirement, status: "ausente", evidencia: undefined };
    }

    return { ...requirement, evidencia: evidence };
  });
}

function experienceText(experience: Experience): string {
  return [
    experience.empresa,
    experience.cargo,
    experience.periodo,
    experience.local,
    ...experience.bullets,
  ]
    .filter(Boolean)
    .join(" ");
}

function projectText(project: Project): string {
  return [
    project.nome,
    project.descricao,
    ...project.tecnologias,
    ...project.bullets,
  ]
    .filter(Boolean)
    .join(" ");
}

function findMasterExperience(
  experience: Pick<Experience, "empresa" | "cargo">,
  master: MasterResume,
): Experience | undefined {
  const company = normalizeComparable(experience.empresa);
  const role = normalizeComparable(experience.cargo);

  return (
    master.experiencias.find(
      (item) =>
        normalizeComparable(item.empresa) === company &&
        normalizeComparable(item.cargo) === role,
    ) ??
    master.experiencias.find(
      (item) => normalizeComparable(item.empresa) === company,
    ) ??
    master.experiencias.find(
      (item) => normalizeComparable(item.cargo) === role,
    )
  );
}

function findMasterProject(
  project: Pick<Project, "nome">,
  master: MasterResume,
): Project | undefined {
  const name = normalizeComparable(project.nome);

  return master.projetos.find(
    (item) => normalizeComparable(item.nome) === name,
  );
}

function findMasterEducation(
  education: Pick<Education, "curso" | "instituicao">,
  master: MasterResume,
): Education | undefined {
  return (
    master.educacao.find(
      (item) =>
        normalizeComparable(item.curso) ===
        normalizeComparable(education.curso),
    ) ??
    master.educacao.find(
      (item) =>
        normalizeComparable(item.instituicao) ===
        normalizeComparable(education.instituicao),
    )
  );
}

function findMasterLanguage(
  language: Pick<Language, "idioma">,
  master: MasterResume,
): Language | undefined {
  return master.idiomas.find(
    (item) =>
      normalizeComparable(item.idioma) === normalizeComparable(language.idioma),
  );
}

function looksLikeTechnology(term: string): boolean {
  return /^[A-Z0-9]/.test(term.trim());
}

function buildTechVocabulary(
  master: MasterResume,
  analysis: AnalysisCore,
): string[] {
  const terms = new Set<string>();

  for (const group of master.skills) {
    for (const item of group.itens) {
      if (item.trim()) terms.add(item.trim());
    }
  }

  for (const project of master.projetos) {
    for (const technology of project.tecnologias) {
      if (technology.trim()) terms.add(technology.trim());
    }
  }

  for (const term of [
    ...analysis.keywordsEncontradas,
    ...analysis.keywordsAusentes,
  ]) {
    const trimmed = term.trim();
    if (trimmed.length >= 2 && looksLikeTechnology(trimmed)) {
      terms.add(trimmed);
    }
  }

  return [...terms];
}

function termsOutsideItem(
  text: string | undefined,
  masterItemText: string,
  vocabulary: string[],
): string[] {
  if (!text) return [];

  return findTermsInText(text, vocabulary).filter(
    (term) => !containsTerm(masterItemText, term),
  );
}

function pushViolation(violations: string[], message: string): void {
  if (
    violations.length < MAX_VIOLATIONS &&
    !violations.includes(message)
  ) {
    violations.push(message);
  }
}

export function checkAdaptation(
  adaptation: Adaptation,
  master: MasterResume,
  analysis: AnalysisCore,
): string[] {
  const violations: string[] = [];
  const vocabulary = buildTechVocabulary(master, analysis);

  for (const experience of adaptation.curriculo.experiencias) {
    const masterExperience = findMasterExperience(experience, master);

    if (!masterExperience) {
      pushViolation(
        violations,
        `A experiência "${experience.cargo} — ${experience.empresa}" não existe no currículo mestre.`,
      );
      continue;
    }

    if (
      normalizeComparable(experience.empresa) !==
      normalizeComparable(masterExperience.empresa)
    ) {
      pushViolation(
        violations,
        `A empresa "${experience.empresa}" difere do mestre ("${masterExperience.empresa}").`,
      );
    }

    if (
      normalizeComparable(experience.cargo) !==
      normalizeComparable(masterExperience.cargo)
    ) {
      pushViolation(
        violations,
        `O cargo "${experience.cargo}" difere do mestre ("${masterExperience.cargo}").`,
      );
    }

    if (
      normalizeComparable(experience.periodo ?? "") !==
      normalizeComparable(masterExperience.periodo ?? "")
    ) {
      pushViolation(
        violations,
        `O período da experiência "${masterExperience.empresa}" difere do mestre.`,
      );
    }

    const itemText = experienceText(masterExperience);

    for (const bullet of experience.bullets) {
      for (const term of termsOutsideItem(bullet, itemText, vocabulary)) {
        pushViolation(
          violations,
          `Um bullet da experiência "${masterExperience.empresa}" cita "${term}", que não aparece nesse mesmo item do currículo mestre.`,
        );
      }
    }
  }

  for (const project of adaptation.curriculo.projetos) {
    const masterProject = findMasterProject(project, master);

    if (!masterProject) {
      pushViolation(
        violations,
        `O projeto "${project.nome}" não existe no currículo mestre.`,
      );
      continue;
    }

    for (const technology of project.tecnologias) {
      if (
        !masterProject.tecnologias.some(
          (item) =>
            normalizeComparable(item) === normalizeComparable(technology),
        )
      ) {
        pushViolation(
          violations,
          `A tecnologia "${technology}" não faz parte do projeto "${masterProject.nome}" no currículo mestre.`,
        );
      }
    }

    const itemText = projectText(masterProject);
    const texts = [project.descricao, ...project.bullets];

    for (const text of texts) {
      for (const term of termsOutsideItem(text, itemText, vocabulary)) {
        pushViolation(
          violations,
          `O projeto "${masterProject.nome}" cita "${term}", que não aparece nesse mesmo item do currículo mestre.`,
        );
      }
    }
  }

  for (const group of adaptation.curriculo.skills) {
    const masterGroup = master.skills.find(
      (item) =>
        normalizeComparable(item.categoria) ===
        normalizeComparable(group.categoria),
    );

    if (!masterGroup) {
      pushViolation(
        violations,
        `O grupo de habilidades "${group.categoria}" não existe no currículo mestre.`,
      );
      continue;
    }

    for (const item of group.itens) {
      if (
        !masterGroup.itens.some(
          (masterItem) =>
            normalizeComparable(masterItem) === normalizeComparable(item),
        )
      ) {
        pushViolation(
          violations,
          `A habilidade "${item}" não existe no grupo "${masterGroup.categoria}" do currículo mestre.`,
        );
      }
    }
  }

  for (const education of adaptation.curriculo.educacao) {
    const masterEducation = findMasterEducation(education, master);

    if (!masterEducation) {
      pushViolation(
        violations,
        `A formação "${education.curso}" não existe no currículo mestre.`,
      );
      continue;
    }

    if (
      normalizeComparable(education.curso) !==
        normalizeComparable(masterEducation.curso) ||
      normalizeComparable(education.instituicao) !==
        normalizeComparable(masterEducation.instituicao)
    ) {
      pushViolation(
        violations,
        `Os dados da formação "${masterEducation.curso}" diferem do currículo mestre.`,
      );
    }
  }

  for (const language of adaptation.curriculo.idiomas) {
    const masterLanguage = findMasterLanguage(language, master);

    if (!masterLanguage) {
      pushViolation(
        violations,
        `O idioma "${language.idioma}" não existe no currículo mestre.`,
      );
      continue;
    }

    if (
      normalizeComparable(language.nivel ?? "") !==
      normalizeComparable(masterLanguage.nivel ?? "")
    ) {
      pushViolation(
        violations,
        `O nível do idioma "${masterLanguage.idioma}" difere do currículo mestre.`,
      );
    }
  }

  for (const certification of adaptation.curriculo.certificacoes) {
    if (
      !master.certificacoes.some(
        (item) =>
          normalizeComparable(item) === normalizeComparable(certification),
      )
    ) {
      pushViolation(
        violations,
        `A certificação "${certification}" não existe no currículo mestre.`,
      );
    }
  }

  return violations;
}

function experienceHasOutsideTerms(
  experience: PayloadExperience,
  masterExperience: Experience,
  vocabulary: string[],
): boolean {
  const itemText = experienceText(masterExperience);

  return experience.bullets.some(
    (bullet) => termsOutsideItem(bullet, itemText, vocabulary).length > 0,
  );
}

function projectHasOutsideTerms(
  project: PayloadProject,
  masterProject: Project,
  vocabulary: string[],
): boolean {
  const itemText = projectText(masterProject);
  const texts = [project.descricao, ...project.bullets];

  return texts.some(
    (text) => termsOutsideItem(text, itemText, vocabulary).length > 0,
  );
}

export function sanitizeAdaptation(
  adaptation: Adaptation,
  master: MasterResume,
  analysis: AnalysisCore,
): AdaptationSanitization {
  const avisos: string[] = [];
  const vocabulary = buildTechVocabulary(master, analysis);

  const warn = (message: string) => {
    if (avisos.length < MAX_WARNINGS && !avisos.includes(message)) {
      avisos.push(message);
    }
  };

  const experiencias = adaptation.curriculo.experiencias.flatMap(
    (experience) => {
      const masterExperience = findMasterExperience(experience, master);

      if (!masterExperience) {
        warn(
          `Experiência "${experience.cargo} — ${experience.empresa}" removida por não existir no currículo mestre.`,
        );
        return [];
      }

      if (
        normalizeComparable(experience.empresa) !==
          normalizeComparable(masterExperience.empresa) ||
        normalizeComparable(experience.cargo) !==
          normalizeComparable(masterExperience.cargo) ||
        normalizeComparable(experience.periodo ?? "") !==
          normalizeComparable(masterExperience.periodo ?? "") ||
        normalizeComparable(experience.local ?? "") !==
          normalizeComparable(masterExperience.local ?? "")
      ) {
        warn(
          `Dados da experiência "${masterExperience.empresa}" restaurados do currículo mestre.`,
        );
      }

      const bullets = experienceHasOutsideTerms(
        experience,
        masterExperience,
        vocabulary,
      )
        ? masterExperience.bullets
        : experience.bullets;

      if (bullets !== experience.bullets) {
        warn(
          `Bullets da experiência "${masterExperience.empresa}" restaurados do original por citar tecnologia fora do item.`,
        );
      }

      return [
        {
          ...experience,
          empresa: masterExperience.empresa,
          cargo: masterExperience.cargo,
          periodo: masterExperience.periodo,
          local: masterExperience.local,
          bullets,
        },
      ];
    },
  );

  const projetos = adaptation.curriculo.projetos.flatMap((project) => {
    const masterProject = findMasterProject(project, master);

    if (!masterProject) {
      warn(
        `Projeto "${project.nome}" removido por não existir no currículo mestre.`,
      );
      return [];
    }

    const tecnologias = project.tecnologias.flatMap((technology) => {
      const masterTechnology = masterProject.tecnologias.find(
        (item) =>
          normalizeComparable(item) === normalizeComparable(technology),
      );

      if (!masterTechnology) {
        warn(
          `Tecnologia "${technology}" removida do projeto "${masterProject.nome}" por não existir no mestre.`,
        );
        return [];
      }

      return [masterTechnology];
    });

    const hasOutsideTerms = projectHasOutsideTerms(
      project,
      masterProject,
      vocabulary,
    );

    if (hasOutsideTerms) {
      warn(
        `Descrição e bullets do projeto "${masterProject.nome}" restaurados do original por citar tecnologia fora do item.`,
      );
    }

    return [
      {
        ...project,
        nome: masterProject.nome,
        descricao: hasOutsideTerms
          ? masterProject.descricao
          : project.descricao,
        tecnologias,
        bullets: hasOutsideTerms ? masterProject.bullets : project.bullets,
        link: masterProject.link,
      },
    ];
  });

  const skills = adaptation.curriculo.skills.flatMap((group) => {
    const masterGroup = master.skills.find(
      (item) =>
        normalizeComparable(item.categoria) ===
        normalizeComparable(group.categoria),
    );

    if (!masterGroup) {
      warn(
        `Grupo de habilidades "${group.categoria}" removido por não existir no currículo mestre.`,
      );
      return [];
    }

    const itens = group.itens.flatMap((item) => {
      const masterItem = masterGroup.itens.find(
        (candidate) =>
          normalizeComparable(candidate) === normalizeComparable(item),
      );

      if (!masterItem) {
        warn(
          `Habilidade "${item}" removida do grupo "${masterGroup.categoria}" por não existir no mestre.`,
        );
        return [];
      }

      return [masterItem];
    });

    if (itens.length === 0) return [];

    return [{ ...group, categoria: masterGroup.categoria, itens }];
  });

  const educacao = adaptation.curriculo.educacao.flatMap((education) => {
    const masterEducation = findMasterEducation(education, master);

    if (!masterEducation) {
      warn(
        `Formação "${education.curso}" removida por não existir no currículo mestre.`,
      );
      return [];
    }

    if (
      normalizeComparable(education.curso) !==
        normalizeComparable(masterEducation.curso) ||
      normalizeComparable(education.instituicao) !==
        normalizeComparable(masterEducation.instituicao) ||
      normalizeComparable(education.periodo ?? "") !==
        normalizeComparable(masterEducation.periodo ?? "") ||
      normalizeComparable(education.status ?? "") !==
        normalizeComparable(masterEducation.status ?? "")
    ) {
      warn(
        `Dados da formação "${masterEducation.curso}" restaurados do currículo mestre.`,
      );
    }

    return [
      {
        curso: masterEducation.curso,
        instituicao: masterEducation.instituicao,
        periodo: masterEducation.periodo,
        status: masterEducation.status,
      },
    ];
  });

  const idiomas = adaptation.curriculo.idiomas.flatMap((language) => {
    const masterLanguage = findMasterLanguage(language, master);

    if (!masterLanguage) {
      warn(
        `Idioma "${language.idioma}" removido por não existir no currículo mestre.`,
      );
      return [];
    }

    if (
      normalizeComparable(language.nivel ?? "") !==
      normalizeComparable(masterLanguage.nivel ?? "")
    ) {
      warn(
        `Nível do idioma "${masterLanguage.idioma}" restaurado do currículo mestre.`,
      );
    }

    return [{ idioma: masterLanguage.idioma, nivel: masterLanguage.nivel }];
  });

  const certificacoes = Array.from(
    new Set(
      adaptation.curriculo.certificacoes.flatMap((certification) => {
        const masterCertification = master.certificacoes.find(
          (item) =>
            normalizeComparable(item) === normalizeComparable(certification),
        );

        if (!masterCertification) {
          warn(
            `Certificação "${certification}" removida por não existir no currículo mestre.`,
          );
          return [];
        }

        return [masterCertification];
      }),
    ),
  );

  return {
    adaptacao: {
      curriculo: {
        ...adaptation.curriculo,
        experiencias,
        projetos,
        skills,
        educacao,
        idiomas,
        certificacoes,
      },
      alteracoes: adaptation.alteracoes,
    },
    avisos,
  };
}
