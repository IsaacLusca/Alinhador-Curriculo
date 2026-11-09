"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Loader2,
  Sparkles,
} from "lucide-react";
import { ResumeUpload } from "@/components/ResumeUpload";
import { DocxParseError, extractTextFromDocx } from "@/lib/docx-parser";
import {
  getJobText,
  getResumeText,
  getServerSnapshot,
  setJobText,
  setResumeText,
  setStoredResult,
  subscribeStorage,
} from "@/lib/storage";
import type { AlignmentResult } from "@/types/analysis";

const MIN_JOB_LENGTH = 30;

const LOADING_STEPS = [
  "Lendo seu currículo mestre...",
  "Extraindo os requisitos da vaga...",
  "Comparando experiência, skills e palavras-chave...",
  "Montando o currículo adaptado...",
  "Finalizando o diagnóstico...",
];

interface StepHeadingProps {
  number: number;
  title: string;
  description: string;
}

function StepHeading({ number, title, description }: StepHeadingProps) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-600 ring-1 ring-indigo-100">
        {number}
      </span>
      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}

export function AnalyzeForm() {
  const router = useRouter();
  const resumeText = useSyncExternalStore(
    subscribeStorage,
    getResumeText,
    getServerSnapshot,
  );
  const jobText = useSyncExternalStore(
    subscribeStorage,
    getJobText,
    getServerSnapshot,
  );
  const [fileName, setFileName] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [parsing, setParsing] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) return;

    const interval = window.setInterval(() => {
      setLoadingStep((current) =>
        Math.min(current + 1, LOADING_STEPS.length - 1),
      );
    }, 4000);

    return () => window.clearInterval(interval);
  }, [loading]);

  const jobLength = jobText.trim().length;
  const canAnalyze =
    resumeText.trim().length > 0 &&
    jobLength >= MIN_JOB_LENGTH &&
    !loading &&
    !parsing;

  const handleFileSelected = async (file: File) => {
    setParsing(true);
    setResumeError(null);
    setWarnings([]);
    setError(null);

    try {
      const parsed = await extractTextFromDocx(file);
      setResumeText(parsed.text);
      setFileName(parsed.fileName);
      setWarnings(parsed.warnings);
    } catch (parseError) {
      console.error(parseError);
      setResumeError(
        parseError instanceof DocxParseError
          ? parseError.message
          : "Não foi possível ler o arquivo. Tente novamente com outro .docx.",
      );
    } finally {
      setParsing(false);
    }
  };

  const handleResumeReset = () => {
    setResumeText("");
    setFileName(null);
    setWarnings([]);
    setResumeError(null);
  };

  const handleAnalyze = async () => {
    if (!canAnalyze) return;

    setLoadingStep(0);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          curriculoTexto: resumeText,
          vagaTexto: jobText,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | AlignmentResult
        | null;

      if (!response.ok) {
        const message =
          data && "error" in data && data.error
            ? data.error
            : "Não foi possível concluir a análise. Tente novamente.";
        throw new Error(message);
      }

      setStoredResult(data as AlignmentResult);
      router.push("/resultado");
    } catch (analysisError) {
      console.error(analysisError);
      setError(
        analysisError instanceof Error
          ? analysisError.message
          : "Não foi possível concluir a análise. Verifique sua conexão e tente novamente.",
      );
      setLoading(false);
    }
  };

  return (
    <div className="mt-10">
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
          <StepHeading
            number={1}
            title="Seu currículo mestre"
            description="O documento completo, com todas as experiências e projetos."
          />
          <ResumeUpload
            text={resumeText}
            fileName={fileName}
            parsing={parsing}
            error={resumeError}
            warnings={warnings}
            disabled={loading}
            onFileSelected={handleFileSelected}
            onTextChange={setResumeText}
            onReset={handleResumeReset}
          />
        </section>

        <section className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
          <StepHeading
            number={2}
            title="Descrição da vaga"
            description="Cole as responsabilidades, requisitos e diferenciais."
          />
          <div className="flex flex-1 flex-col">
            <label htmlFor="vaga" className="sr-only">
              Descrição da vaga
            </label>
            <textarea
              id="vaga"
              value={jobText}
              disabled={loading}
              onChange={(event) => setJobText(event.target.value)}
              placeholder={`Ex.: Desenvolvedor Full Stack (Pleno)\n\nResponsabilidades:\n- Desenvolver e manter aplicações web...\n\nRequisitos:\n- Experiência com React e TypeScript\n- Conhecimento em Node.js e bancos relacionais\n- Inglês intermediário\n\nDiferenciais:\n- AWS, Docker, CI/CD`}
              className="min-h-[220px] flex-1 resize-y rounded-2xl border border-slate-300 bg-slate-50/60 p-4 text-sm leading-relaxed text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 disabled:opacity-70"
            />
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 text-slate-500">
                <Briefcase className="h-3.5 w-3.5" aria-hidden />
                Quanto mais completa a vaga, melhor o alinhamento.
              </span>
              <span
                className={
                  jobLength >= MIN_JOB_LENGTH
                    ? "font-medium text-emerald-600"
                    : "text-slate-400"
                }
              >
                {jobLength.toLocaleString("pt-BR")} caractere
                {jobLength === 1 ? "" : "s"}
              </span>
            </div>
            {jobLength > 0 && jobLength < MIN_JOB_LENGTH && (
              <p className="mt-1 text-xs text-amber-600">
                Cole pelo menos {MIN_JOB_LENGTH} caracteres para analisar.
              </p>
            )}
          </div>
        </section>
      </div>

      <div className="mt-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Tudo pronto para alinhar?
          </p>
          <p className="text-sm text-slate-500">
            A análise leva em torno de 30 segundos e não envia seu currículo
            para nenhum servidor de armazenamento.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={!canAnalyze}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-600/30 transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Analisando...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" aria-hidden />
              Analisar alinhamento
              <ArrowRight className="h-4 w-4" aria-hidden />
            </>
          )}
        </button>
      </div>

      {loading && (
        <div
          role="status"
          className="mt-4 flex items-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800"
        >
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
          <span>{LOADING_STEPS[loadingStep]}</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">Não foi possível analisar</p>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
