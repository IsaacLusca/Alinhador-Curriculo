"use client";

import {
  AlertTriangle,
  Check,
  ChevronDown,
  FileText,
  Loader2,
  RotateCcw,
  Upload,
} from "lucide-react";
import { useRef, useState, type DragEvent } from "react";

interface ResumeUploadProps {
  text: string;
  fileName: string | null;
  parsing: boolean;
  error: string | null;
  warnings: string[];
  disabled?: boolean;
  onFileSelected: (file: File) => void;
  onTextChange: (text: string) => void;
  onReset: () => void;
}

export function ResumeUpload({
  text,
  fileName,
  parsing,
  error,
  warnings,
  disabled = false,
  onFileSelected,
  onTextChange,
  onReset,
}: ResumeUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const openPicker = () => {
    if (!disabled && !parsing) inputRef.current?.click();
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDragging(false);

    if (disabled || parsing) return;

    const file = event.dataTransfer.files?.[0];
    if (file) onFileSelected(file);
  };

  return (
    <div className="flex flex-1 flex-col">
      <input
        ref={inputRef}
        type="file"
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onFileSelected(file);
        }}
      />

      {text ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Check className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">
                {fileName ?? "Currículo salvo no navegador"}
              </p>
              <p className="text-xs text-slate-600">
                {text.length.toLocaleString("pt-BR")} caracteres extraídos
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={openPicker}
                disabled={disabled || parsing}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Trocar
              </button>
              <button
                type="button"
                onClick={onReset}
                disabled={disabled || parsing}
                className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Remover currículo"
                title="Remover currículo"
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>

          <details className="group mt-3">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-medium text-slate-600 transition hover:text-slate-900">
              <ChevronDown
                className="h-3.5 w-3.5 transition group-open:rotate-180"
                aria-hidden
              />
              Revisar texto extraído
            </summary>
            <textarea
              value={text}
              disabled={disabled}
              onChange={(event) => onTextChange(event.target.value)}
              rows={10}
              spellCheck={false}
              className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white p-3 font-mono text-xs leading-relaxed text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-70"
            />
            <p className="mt-2 text-xs text-slate-500">
              Ajuste o texto se a leitura não capturou alguma seção. Tabelas e
              colunas às vezes perdem o formato no Word.
            </p>
          </details>

          {warnings.length > 0 && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="flex items-center gap-1.5 text-xs font-medium text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                Avisos da leitura do arquivo
              </p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-amber-700">
                {warnings.slice(0, 3).map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          disabled={disabled || parsing}
          className={`flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center outline-none transition focus-visible:border-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-70 ${
            dragging
              ? "border-indigo-400 bg-indigo-50/70"
              : "border-slate-300 bg-slate-50/60 hover:border-indigo-300 hover:bg-indigo-50/40"
          }`}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200">
            {parsing ? (
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
            ) : (
              <Upload className="h-6 w-6" aria-hidden />
            )}
          </span>
          <span className="text-sm font-medium text-slate-800">
            {parsing
              ? "Lendo seu currículo..."
              : "Arraste seu currículo .docx aqui"}
          </span>
          <span className="text-xs text-slate-500">
            ou clique para selecionar o arquivo
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500">
            <FileText className="h-3 w-3" aria-hidden />
            .docx até 10 MB
          </span>
        </button>
      )}

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
