"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CircleCheck,
  Download,
  FileDown,
  FileText,
  Lightbulb,
  Loader2,
  Paperclip,
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
import { FaithfulDocxError } from "@/lib/docx-editor";
import { loadDocxFile, saveDocxFile } from "@/lib/docx-store";
import {
  downloadFaithfulDocx,
  downloadResumeDocx,
} from "@/lib/export-docx";
import { downloadResumePdf } from "@/lib/export-pdf";
import { ALIGNMENT_LEVEL_DESCRIPTION } from "@/lib/labels";
import {
  getResultRaw,
  getServerSnapshot,
  parseStoredResult,
  setStoredResult,
  subscribeStorage,
} from "@/lib/storage";
import type { AlignmentResult, TailoredResume } from "@/types/analysis";

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
  const [exporting, setExporting] = useState<
    "pdf" | "docx-fiel" | "docx-limpo" | null
  >(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string[]>([]);
  const [noticeTone, setNoticeTone] = useState<"success" | "warning">(
    "success",
  );
  const [needsReattach, setNeedsReattach] = useState(false);
  const reattachInputRef = useRef<HTMLInputElement>(null);

  const handleResumeChange = (
    updater: (current: TailoredResume) => TailoredResume,
  ) => {
    const current = parseStoredResult(getResultRaw());
    if (!current) return;

    setStoredResult({ ...current, curriculo: updater(current.curriculo) });
  };

  const resetExportFeedback = () => {
    setExportError(null);
    setExportNotice([]);
    setNeedsReattach(false);
  };

  const handleStandardExport = async (format: "pdf" | "docx-limpo") => {
    const current = parseStoredResult(getResultRaw());
    if (!current) return;

    setExporting(format);
    resetExportFeedback();

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

  const exportFaithfulWithResult = async (current: AlignmentResult) => {
    setExporting("docx-fiel");
    setExportError(null);
    setExportNotice([]);
    setNeedsReattach(false);

    try {
      if (!current.meta.docxId) {
        setExportError(
          "O DOCX original não está mais disponível no navegador. Reanexe o arquivo para exportar com a formatação original.",
        );
        setNeedsReattach(true);
        return;
      }

      const stored = await loadDocxFile(current.meta.docxId);

      if (!stored) {
        setExportError(
          "Não encontramos o DOCX original salvo. Reanexe o arquivo para exportar com a formatação original.",
        );
        setNeedsReattach(true);
        return;
      }

      const warnings = await downloadFaithfulDocx(
        stored.bytes,
        current,
        stored.fileName,
      );

      setNoticeTone(warnings.length > 0 ? "warning" : "success");
      setExportNotice(
        warnings.length > 0
          ? warnings
          : ["DOCX gerado preservando a formatação original."],
      );
    } catch (exportFailure) {
      console.error("Erro ao exportar DOCX fiel:", exportFailure);

      if (exportFailure instanceof FaithfulDocxError) {
        setExportError(
          `Não foi possível preservar a formatação: ${exportFailure.message} Use o DOCX limpo como alternativa.`,
        );
      } else {
        setExportError(
          "Não foi possível gerar o DOCX fiel. Use o DOCX limpo como alternativa.",
        );
      }
    } finally {
      setExporting(null);
    }
  };

  const handleFaithfulExport = async () => {
    const current = parseStoredResult(getResultRaw());
    if (!current) return;

    await exportFaithfulWithResult(current);
  };

  const handleReattach = async (file: File) => {
    const current = parseStoredResult(getResultRaw());
    if (!current) return;

    setExporting("docx-fiel");
    setExportError(null);

    try {
      const docxId = crypto.randomUUID();

      await saveDocxFile({
        id: docxId,
        fileName: file.name,
        bytes: await file.arrayBuffer(),
      });

      const updated: AlignmentResult = {
        ...current,
        meta: { ...current.meta, docxId, docxFileName: file.name },
      };

      setStoredResult(updated);
      setNeedsReattach(false);
      await exportFaithfulWithResult(updated);
    } catch (reattachFailure) {
      console.error("Erro ao reanexar DOCX:", reattachFailure);
      setExportError("Não foi possível reanexar o DOCX. Tente novamente.");
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
            <div className="min-w-0 lg:col-span-2">
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
            <div className="mb-4 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Exportar currículo
                </p>
                <p className="text-xs text-slate-500">
                  O DOCX fiel aplica as edições no arquivo original, mantendo
                  fonte, margens, bullets e layout. O DOCX limpo e o PDF usam o
                  layout padronizado.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleFaithfulExport}
                  disabled={exporting !== null}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {exporting === "docx-fiel" ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Download className="h-4 w-4" aria-hidden />
                  )}
                  Baixar DOCX fiel
                </button>
                <button
                  type="button"
                  onClick={() => handleStandardExport("docx-limpo")}
                  disabled={exporting !== null}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {exporting === "docx-limpo" ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <FileText className="h-4 w-4" aria-hidden />
                  )}
                  Baixar DOCX limpo
                </button>
                <button
                  type="button"
                  onClick={() => handleStandardExport("pdf")}
                  disabled={exporting !== null}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {exporting === "pdf" ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <FileDown className="h-4 w-4" aria-hidden />
                  )}
                  Baixar PDF
                </button>
              </div>
            </div>

            <input
              ref={reattachInputRef}
              id="reattach-docx"
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void handleReattach(file);
              }}
            />

            {exportError && (
              <div className="mb-4 flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
                <p>{exportError}</p>
                {needsReattach && (
                  <button
                    type="button"
                    onClick={() => reattachInputRef.current?.click()}
                    disabled={exporting !== null}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <Paperclip className="h-3.5 w-3.5" aria-hidden />
                    Reanexar .docx
                  </button>
                )}
              </div>
            )}

            {exportNotice.length > 0 && (
              <div
                className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
                  noticeTone === "warning"
                    ? "border-amber-200 bg-amber-50 text-amber-800"
                    : "border-emerald-200 bg-emerald-50 text-emerald-800"
                }`}
              >
                <p className="flex items-center gap-1.5 font-medium">
                  {noticeTone === "warning" ? (
                    <AlertTriangle className="h-4 w-4" aria-hidden />
                  ) : (
                    <CircleCheck className="h-4 w-4" aria-hidden />
                  )}
                  {noticeTone === "warning"
                    ? "DOCX gerado com avisos"
                    : "DOCX fiel gerado"}
                </p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-xs">
                  {exportNotice.map((notice) => (
                    <li key={notice}>{notice}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid gap-6 xl:grid-cols-3">
              <div className="min-w-0 xl:col-span-2">
                <ResumeEditor
                  curriculo={result.curriculo}
                  onChange={handleResumeChange}
                />
              </div>
              <div className="min-w-0">
                <ChangeLog
                  alteracoes={result.alteracoes}
                  avisos={result.meta.avisosValidacao}
                />
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
