import { AlertTriangle, Check, X } from "lucide-react";

interface GapsAndKeywordsProps {
  gaps: string[];
  keywordsEncontradas: string[];
  keywordsAusentes: string[];
}

export function GapsAndKeywords({
  gaps,
  keywordsEncontradas,
  keywordsAusentes,
}: GapsAndKeywordsProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden />
          Lacunas para fechar
        </h2>

        {gaps.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            Nenhuma lacuna relevante identificada nesta vaga.
          </p>
        ) : (
          <ol className="mt-4 space-y-2">
            {gaps.map((gap, index) => (
              <li
                key={`${gap}-${index}`}
                className="flex gap-3 rounded-xl border border-amber-100 bg-amber-50/50 p-3 text-sm text-slate-700"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[11px] font-semibold text-amber-700">
                  {index + 1}
                </span>
                {gap}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
        <h2 className="text-lg font-semibold text-slate-900">
          Palavras-chave da vaga
        </h2>

        <div className="mt-4">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            <Check className="h-3.5 w-3.5" aria-hidden />
            Encontradas no currículo
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {keywordsEncontradas.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma identificada.</p>
            ) : (
              keywordsEncontradas.map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200"
                >
                  {keyword}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="mt-5">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-red-700">
            <X className="h-3.5 w-3.5" aria-hidden />
            Ausentes
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {keywordsAusentes.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nenhuma palavra-chave relevante ausente.
              </p>
            ) : (
              keywordsAusentes.map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full border border-dashed border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500"
                >
                  {keyword}
                </span>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
