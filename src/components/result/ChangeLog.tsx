import { Check, Pencil, RefreshCw, X } from "lucide-react";
import { CHANGE_TYPE_LABEL } from "@/lib/labels";
import type { ChangeLogEntry, ChangeType } from "@/lib/schemas";

interface ChangeLogProps {
  alteracoes: ChangeLogEntry[];
}

const CHANGE_STYLES: Record<
  ChangeType,
  { icon: typeof X; classes: string }
> = {
  removido: { icon: X, classes: "bg-red-50 text-red-600" },
  reordenado: { icon: RefreshCw, classes: "bg-indigo-50 text-indigo-600" },
  reescrito: { icon: Pencil, classes: "bg-amber-50 text-amber-600" },
  mantido: { icon: Check, classes: "bg-emerald-50 text-emerald-600" },
};

export function ChangeLog({ alteracoes }: ChangeLogProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
      <h2 className="text-lg font-semibold text-slate-900">
        O que mudou no currículo
      </h2>
      <p className="text-sm text-slate-500">
        Cada corte e reescrita tem um motivo ligado à vaga. Reative o que
        discordar no editor.
      </p>

      {alteracoes.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          Nenhuma alteração relevante registrada.
        </p>
      ) : (
        <ol className="mt-4 space-y-3">
          {alteracoes.map((alteracao, index) => {
            const styles = CHANGE_STYLES[alteracao.tipo];
            const Icon = styles.icon;

            return (
              <li key={`${alteracao.alvo}-${index}`} className="flex gap-3">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${styles.classes}`}
                  title={CHANGE_TYPE_LABEL[alteracao.tipo]}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {CHANGE_TYPE_LABEL[alteracao.tipo]}
                  </p>
                  <p className="text-sm font-medium text-slate-800">
                    {alteracao.alvo}
                  </p>
                  <p className="text-sm text-slate-500">{alteracao.detalhe}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
