"use client";

import {
  Award,
  Briefcase,
  FolderGit2,
  GraduationCap,
  Languages,
  Plus,
  Sparkles,
  Trash2,
  Wrench,
} from "lucide-react";
import type {
  TailoredExperience,
  TailoredProject,
  TailoredResume,
  TailoredSkillGroup,
} from "@/types/analysis";

interface ResumeEditorProps {
  curriculo: TailoredResume;
  onChange: (updater: (current: TailoredResume) => TailoredResume) => void;
}

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

const textareaClass =
  "w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm leading-relaxed text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  label: string;
}

function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
        checked ? "bg-indigo-600" : "bg-slate-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

interface SectionHeaderProps {
  icon: typeof Briefcase;
  title: string;
  count?: string;
  description: string;
}

function SectionHeader({
  icon: Icon,
  title,
  count,
  description,
}: SectionHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-2">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>
      {count && (
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {count}
        </span>
      )}
    </header>
  );
}

interface ExperienceCardProps {
  item: TailoredExperience;
  onToggle: (id: string, incluido: boolean) => void;
  onBulletChange: (id: string, index: number, value: string) => void;
  onBulletRemove: (id: string, index: number) => void;
  onBulletAdd: (id: string) => void;
}

function ExperienceCard({
  item,
  onToggle,
  onBulletChange,
  onBulletRemove,
  onBulletAdd,
}: ExperienceCardProps) {
  return (
    <article
      className={`rounded-2xl border p-4 transition ${
        item.incluido
          ? "border-slate-200 bg-white"
          : "border-dashed border-slate-300 bg-slate-50/70"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3
            className={`text-sm font-semibold ${
              item.incluido ? "text-slate-900" : "text-slate-500"
            }`}
          >
            {item.cargo}
          </h3>
          <p className="text-xs text-slate-500">
            {[item.empresa, item.periodo, item.local].filter(Boolean).join(" · ")}
          </p>
        </div>
        <Toggle
          checked={item.incluido}
          onChange={() => onToggle(item.id, !item.incluido)}
          label={
            item.incluido
              ? "Remover esta experiência do currículo"
              : "Incluir esta experiência no currículo"
          }
        />
      </div>

      {!item.incluido && item.motivo && (
        <p className="mt-2 text-xs text-slate-500">
          Motivo do corte: {item.motivo}
        </p>
      )}

      {item.incluido && (
        <div className="mt-3 space-y-2">
          {item.bullets.map((bullet, index) => (
            <div key={`${item.id}-bullet-${index}`} className="flex items-start gap-2">
              <span className="mt-3 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
              <textarea
                rows={2}
                value={bullet}
                onChange={(event) =>
                  onBulletChange(item.id, index, event.target.value)
                }
                className={textareaClass}
              />
              <button
                type="button"
                onClick={() => onBulletRemove(item.id, index)}
                className="mt-1 rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                aria-label="Remover este bullet"
                title="Remover este bullet"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onBulletAdd(item.id)}
            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 transition hover:text-indigo-800"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Adicionar bullet
          </button>
        </div>
      )}
    </article>
  );
}

interface ProjectCardProps {
  item: TailoredProject;
  onToggle: (id: string, incluido: boolean) => void;
  onDescriptionChange: (id: string, value: string) => void;
  onBulletChange: (id: string, index: number, value: string) => void;
  onBulletRemove: (id: string, index: number) => void;
  onBulletAdd: (id: string) => void;
}

function ProjectCard({
  item,
  onToggle,
  onDescriptionChange,
  onBulletChange,
  onBulletRemove,
  onBulletAdd,
}: ProjectCardProps) {
  return (
    <article
      className={`rounded-2xl border p-4 transition ${
        item.incluido
          ? "border-slate-200 bg-white"
          : "border-dashed border-slate-300 bg-slate-50/70"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3
            className={`text-sm font-semibold ${
              item.incluido ? "text-slate-900" : "text-slate-500"
            }`}
          >
            {item.nome}
          </h3>
          {item.link && (
            <p className="truncate text-xs text-slate-500">{item.link}</p>
          )}
        </div>
        <Toggle
          checked={item.incluido}
          onChange={() => onToggle(item.id, !item.incluido)}
          label={
            item.incluido
              ? "Remover este projeto do currículo"
              : "Incluir este projeto no currículo"
          }
        />
      </div>

      {!item.incluido && item.motivo && (
        <p className="mt-2 text-xs text-slate-500">
          Motivo do corte: {item.motivo}
        </p>
      )}

      {item.incluido && (
        <div className="mt-3 space-y-2">
          <input
            value={item.descricao ?? ""}
            onChange={(event) =>
              onDescriptionChange(item.id, event.target.value)
            }
            placeholder="Descrição curta do projeto"
            className={inputClass}
            aria-label="Descrição do projeto"
          />

          {item.tecnologias.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.tecnologias.map((tech) => (
                <span
                  key={tech}
                  className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-medium text-slate-700"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}

          {item.bullets.map((bullet, index) => (
            <div key={`${item.id}-bullet-${index}`} className="flex items-start gap-2">
              <span className="mt-3 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
              <textarea
                rows={2}
                value={bullet}
                onChange={(event) =>
                  onBulletChange(item.id, index, event.target.value)
                }
                className={textareaClass}
              />
              <button
                type="button"
                onClick={() => onBulletRemove(item.id, index)}
                className="mt-1 rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                aria-label="Remover este bullet"
                title="Remover este bullet"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onBulletAdd(item.id)}
            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 transition hover:text-indigo-800"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Adicionar bullet
          </button>
        </div>
      )}
    </article>
  );
}

export function ResumeEditor({ curriculo, onChange }: ResumeEditorProps) {
  const contatoLine = [
    curriculo.contato.email,
    curriculo.contato.telefone,
    curriculo.contato.linkedin,
    curriculo.contato.github,
    curriculo.contato.site,
    curriculo.contato.localizacao,
  ]
    .filter(Boolean)
    .join(" · ");

  const patchResume = (partial: Partial<TailoredResume>) => {
    onChange((current) => ({ ...current, ...partial }));
  };

  const patchExperience = (
    id: string,
    updater: (item: TailoredExperience) => TailoredExperience,
  ) => {
    onChange((current) => ({
      ...current,
      experiencias: current.experiencias.map((item) =>
        item.id === id ? updater(item) : item,
      ),
    }));
  };

  const patchProject = (
    id: string,
    updater: (item: TailoredProject) => TailoredProject,
  ) => {
    onChange((current) => ({
      ...current,
      projetos: current.projetos.map((item) =>
        item.id === id ? updater(item) : item,
      ),
    }));
  };

  const patchSkillGroup = (
    id: string,
    updater: (item: TailoredSkillGroup) => TailoredSkillGroup,
  ) => {
    onChange((current) => ({
      ...current,
      skills: current.skills.map((item) =>
        item.id === id ? updater(item) : item,
      ),
    }));
  };

  const includedExperiences = curriculo.experiencias.filter(
    (item) => item.incluido,
  ).length;
  const includedProjects = curriculo.projetos.filter(
    (item) => item.incluido,
  ).length;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
        <SectionHeader
          icon={Sparkles}
          title="Resumo profissional"
          description="Reescrito para a vaga. Edite livremente."
        />

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <p className="text-sm font-semibold text-slate-900">
            {curriculo.nome ?? "Nome não identificado no currículo"}
          </p>
          <p className="text-xs text-slate-500">
            {contatoLine || "Contato não identificado no currículo"}
          </p>
        </div>

        <label
          htmlFor="titulo-profissional"
          className="mt-4 block text-sm font-medium text-slate-700"
        >
          Título profissional
        </label>
        <input
          id="titulo-profissional"
          value={curriculo.titulo ?? ""}
          onChange={(event) =>
            patchResume({ titulo: event.target.value })
          }
          placeholder="Ex.: Desenvolvedor Backend | Python & AWS"
          className={`${inputClass} mt-1.5`}
        />

        <label
          htmlFor="resumo-profissional"
          className="mt-4 block text-sm font-medium text-slate-700"
        >
          Resumo
        </label>
        <textarea
          id="resumo-profissional"
          rows={4}
          value={curriculo.resumo ?? ""}
          onChange={(event) =>
            patchResume({ resumo: event.target.value })
          }
          className={`${textareaClass} mt-1.5`}
        />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
        <SectionHeader
          icon={Briefcase}
          title="Experiências"
          count={`${includedExperiences} de ${curriculo.experiencias.length} incluídas`}
          description="Desative o que não for relevante para esta vaga."
        />

        {curriculo.experiencias.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            Nenhuma experiência identificada no currículo.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {curriculo.experiencias.map((item) => (
              <ExperienceCard
                key={item.id}
                item={item}
                onToggle={(id, incluido) =>
                  patchExperience(id, (current) => ({ ...current, incluido }))
                }
                onBulletChange={(id, index, value) =>
                  patchExperience(id, (current) => ({
                    ...current,
                    bullets: current.bullets.map((bullet, bulletIndex) =>
                      bulletIndex === index ? value : bullet,
                    ),
                  }))
                }
                onBulletRemove={(id, index) =>
                  patchExperience(id, (current) => ({
                    ...current,
                    bullets: current.bullets.filter(
                      (_, bulletIndex) => bulletIndex !== index,
                    ),
                  }))
                }
                onBulletAdd={(id) =>
                  patchExperience(id, (current) => ({
                    ...current,
                    bullets: [...current.bullets, ""],
                  }))
                }
              />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
        <SectionHeader
          icon={FolderGit2}
          title="Projetos"
          count={`${includedProjects} de ${curriculo.projetos.length} incluídos`}
          description="Mantenha apenas os projetos que reforçam a vaga."
        />

        {curriculo.projetos.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            Nenhum projeto identificado no currículo.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {curriculo.projetos.map((item) => (
              <ProjectCard
                key={item.id}
                item={item}
                onToggle={(id, incluido) =>
                  patchProject(id, (current) => ({ ...current, incluido }))
                }
                onDescriptionChange={(id, value) =>
                  patchProject(id, (current) => ({
                    ...current,
                    descricao: value,
                  }))
                }
                onBulletChange={(id, index, value) =>
                  patchProject(id, (current) => ({
                    ...current,
                    bullets: current.bullets.map((bullet, bulletIndex) =>
                      bulletIndex === index ? value : bullet,
                    ),
                  }))
                }
                onBulletRemove={(id, index) =>
                  patchProject(id, (current) => ({
                    ...current,
                    bullets: current.bullets.filter(
                      (_, bulletIndex) => bulletIndex !== index,
                    ),
                  }))
                }
                onBulletAdd={(id) =>
                  patchProject(id, (current) => ({
                    ...current,
                    bullets: [...current.bullets, ""],
                  }))
                }
              />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
        <SectionHeader
          icon={Wrench}
          title="Habilidades"
          description="Grupos selecionados a partir do currículo mestre."
        />

        {curriculo.skills.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            Nenhum grupo de habilidades identificado.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {curriculo.skills.map((group) => (
              <div
                key={group.id}
                className={`flex items-start justify-between gap-3 rounded-2xl border p-4 ${
                  group.incluido
                    ? "border-slate-200 bg-white"
                    : "border-dashed border-slate-300 bg-slate-50/70"
                }`}
              >
                <div className="min-w-0">
                  <p
                    className={`text-sm font-semibold ${
                      group.incluido ? "text-slate-900" : "text-slate-500"
                    }`}
                  >
                    {group.categoria}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    {group.itens.join(" · ")}
                  </p>
                </div>
                <Toggle
                  checked={group.incluido}
                  onChange={() =>
                    patchSkillGroup(group.id, (current) => ({
                      ...current,
                      incluido: !current.incluido,
                    }))
                  }
                  label={
                    group.incluido
                      ? "Remover este grupo de habilidades"
                      : "Incluir este grupo de habilidades"
                  }
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <GraduationCap className="h-4 w-4 text-indigo-600" aria-hidden />
              Formação
            </h2>
            <ul className="mt-2 space-y-2">
              {curriculo.educacao.length === 0 ? (
                <li className="text-sm text-slate-500">
                  Nenhuma formação identificada.
                </li>
              ) : (
                curriculo.educacao.map((item, index) => (
                  <li key={`${item.curso}-${index}`} className="text-sm">
                    <p className="font-medium text-slate-800">{item.curso}</p>
                    <p className="text-xs text-slate-500">
                      {[item.instituicao, item.periodo, item.status]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Languages className="h-4 w-4 text-indigo-600" aria-hidden />
              Idiomas
            </h2>
            <ul className="mt-2 space-y-2">
              {curriculo.idiomas.length === 0 ? (
                <li className="text-sm text-slate-500">
                  Nenhum idioma identificado.
                </li>
              ) : (
                curriculo.idiomas.map((item, index) => (
                  <li key={`${item.idioma}-${index}`} className="text-sm">
                    <p className="font-medium text-slate-800">{item.idioma}</p>
                    {item.nivel && (
                      <p className="text-xs text-slate-500">{item.nivel}</p>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="sm:col-span-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Award className="h-4 w-4 text-indigo-600" aria-hidden />
              Certificações
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {curriculo.certificacoes.length === 0 ? (
                <li className="text-sm text-slate-500">
                  Nenhuma certificação identificada.
                </li>
              ) : (
                curriculo.certificacoes.map((item, index) => (
                  <li
                    key={`${item}-${index}`}
                    className="text-sm text-slate-700"
                  >
                    {item}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
