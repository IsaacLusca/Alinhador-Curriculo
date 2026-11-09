"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import {
  ArrowLeft,
  Download,
  FileDown,
  FileText,
  Lightbulb,
  Loader2,
  ScanSearch,
  Target,
} from "lucide-react";
import { ChangeLog } from "@/components/result/ChangeLog";
import { GapsAndKeywords } from "@/components/result/GapsAndKeywords";
import { LevelBadge } from "@/components/result/badges";
import { RecommendationsPanel } from "@/components/result/RecommendationsPanel";
import { RequirementsList } from "@/components/result/RequirementsList";
import { ResumeEditor } from "@/components/result/ResumeEditor";
import { ScoreBreakdown } from "@/components/result/ScoreBreakdown";
import { ScoreGauge } from "@/components/result/ScoreGauge";
import { downloadResumeDocx } from "@/lib/export-docx";
import { downloadResumePdf } from "@/lib/export-pdf";
import { ALIGNMENT_LEVEL_DESCRIPTION } from "@/lib/labels";
import {
  getResultRaw,
  getServerSnapshot,
  parseStoredResult,
  setStoredResult,
  subscribeStorage,
} from "@/lib/storage";
import type { TailoredResume } from "@/types/analysis";

type TabId = "diagnostico" | "curriculo" | "recomendacoes";

const TABS: { id: TabId; label: string; icon: typeof Target }[] = [
  { id: "diagnostico", label: "Diagnóstico", icon: Target },
  { id: "curriculo", label: "Currículo alinhado", icon: FileText },
  { id: "recomendacoes", label: "Recomendações", icon: Lightbulb },
];

export function ResultView() {
  const raw = useSyncExternalStore(
    subscribeStorage,
    getResultRaw,
    getServerSnapshot,
  );
  const result = useMemo(() => parseStoredResult(raw), [raw]);
  const [activeTab, setActiveTab] = useState<TabId>("diagnostico");
  const [exporting, setExporting] = useState<"pdf" | "docx" | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleResumeChange = (
    updater: (current: TailoredResume) => TailoredResume,
  ) => {
    const current = parseStoredResult(getResultRaw());
    if (!current) return;

    setStoredResult({ ...current, curriculo: updater(current.curriculo) });
  };

  const handleExport = async (format: "pdf" | "docx") => {
    const current = parseStoredResult(getResultRaw());
    if (!current) return;

    setExporting(format);
    setExportError(null);

    try {
      if (format === "pdf") {
        await downloadResumePdf(current.curriculo);
      } else {
        await downloadResumeDocx(current.curriculo);
      }
    } catch (exportFailure) {
      console.error("Erro ao exportar currículo:", exportFailure);
      setExportError(
        "Não foi possível gerar o arquivo. Tente novamente em instantes.",
      );
    } finally {
      setExporting(null);
    }
  };

  if (!result) {
    return (
      <main className="relative mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <ScanSearch className="h-6 w-6" aria-hidden />
          </span>
          <h1 className="mt-4 text-xl font-semibold text-slate-900">
            Nenhuma análise encontrada
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Envie seu currículo e a descrição de uma vaga para gerar o
            diagnóstico de alinhamento.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Ir para o início
          </Link>
        </div>
      </main>
    );
  }

  const geradoEm = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(result.meta.geradoEm));

  return (
    <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Nova análise
        </Link>
        <p className="text-xs text-slate-500">
          Gerado em {geradoEm} · {result.meta.modelo}
        </p>
      </div>

      <section className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
        <div className="flex flex-col items-start gap-8 p-6 sm:p-8 lg:flex-row lg:items-center">
          <ScoreGauge score={result.score} nivel={result.nivel} />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <LevelBadge nivel={result.nivel} />
              {result.vaga.senioridade && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {result.vaga.senioridade}
                </span>
              )}
            </div>

            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Análise para {result.vaga.cargo}
            </h1>
            {result.vaga.empresa && (
              <p className="mt-0.5 text-sm font-medium text-slate-500">
                {result.vaga.empresa}
              </p>
            )}

            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              {result.resumo}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              {ALIGNMENT_LEVEL_DESCRIPTION[result.nivel]}
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-5 sm:px-8">
          <ScoreBreakdown categorias={result.categorias} />
        </div>
      </section>

      <div className="mt-8 flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-current={active ? "page" : undefined}
              className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
                active
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {activeTab === "diagnostico" && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <RequirementsList requisitos={result.requisitos} />
            </div>
            <GapsAndKeywords
              gaps={result.gaps}
              keywordsEncontradas={result.keywordsEncontradas}
              keywordsAusentes={result.keywordsAusentes}
            />
          </div>
        )}

        {activeTab === "curriculo" && (
          <div>
            <div className="mb-4 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Exportar currículo alinhado
                </p>
                <p className="text-xs text-slate-500">
                  O arquivo é gerado com os itens incluídos e as suas edições.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleExport("pdf")}
                  disabled={exporting !== null}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {exporting === "pdf" ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <FileDown className="h-4 w-4" aria-hidden />
                  )}
                  Baixar PDF
                </button>
                <button
                  type="button"
                  onClick={() => handleExport("docx")}
                  disabled={exporting !== null}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {exporting === "docx" ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Download className="h-4 w-4" aria-hidden />
                  )}
                  Baixar DOCX
                </button>
              </div>
            </div>

            {exportError && (
              <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                {exportError}
              </p>
            )}

            <div className="grid gap-6 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <ResumeEditor
                  curriculo={result.curriculo}
                  onChange={handleResumeChange}
                />
              </div>
              <div>
                <ChangeLog alteracoes={result.alteracoes} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "recomendacoes" && (
          <RecommendationsPanel recomendacoes={result.recomendacoes} />
        )}
      </div>
    </main>
  );
}
