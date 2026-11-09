import {
  Check,
  Code2,
  Lightbulb,
  Rocket,
  Target,
  Wrench,
} from "lucide-react";
import { PriorityBadge } from "@/components/result/badges";
import type { DevelopmentRecommendations } from "@/lib/schemas";

interface RecommendationsPanelProps {
  recomendacoes: DevelopmentRecommendations;
}

export function RecommendationsPanel({
  recomendacoes,
}: RecommendationsPanelProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-3xl border border-indigo-200 bg-indigo-50/70 p-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-indigo-600 ring-1 ring-indigo-100">
          <Lightbulb className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-indigo-900">
            Sugestões para o seu desenvolvimento
          </h2>
          <p className="mt-0.5 text-sm text-indigo-800/80">
            Estes itens <strong>não foram adicionados</strong> ao currículo.
            São caminhos para você aprender e comprovar com projetos reais
            antes de incluir no seu histórico.
          </p>
        </div>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
        <header className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Wrench className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Tecnologias e ferramentas para aprender
            </h2>
            <p className="text-sm text-slate-500">
              Priorizadas pelo impacto no alinhamento com esta vaga.
            </p>
          </div>
        </header>

        {recomendacoes.ferramentas.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            Nenhuma ferramenta adicional é necessária para esta vaga.
          </p>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {recomendacoes.ferramentas.map((ferramenta) => (
              <article
                key={ferramenta.nome}
                className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {ferramenta.nome}
                  </h3>
                  <PriorityBadge prioridade={ferramenta.prioridade} />
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {ferramenta.motivo}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60">
        <header className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Rocket className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Projetos de portfólio sugeridos
            </h2>
            <p className="text-sm text-slate-500">
              Ideias que praticam as lacunas e geram evidência real.
            </p>
          </div>
        </header>

        {recomendacoes.projetos.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            Nenhum projeto adicional é necessário para esta vaga.
          </p>
        ) : (
          <div className="mt-5 space-y-4">
            {recomendacoes.projetos.map((projeto) => (
              <article
                key={projeto.titulo}
                className="rounded-2xl border border-slate-200 p-5"
              >
                <div className="flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-slate-400" aria-hidden />
                  <h3 className="text-base font-semibold text-slate-900">
                    {projeto.titulo}
                  </h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {projeto.descricao}
                </p>

                {projeto.stack.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {projeto.stack.map((item) => (
                      <span
                        key={item}
                        className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-medium text-slate-700"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                )}

                {projeto.entregaveis.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Entregáveis
                    </h4>
                    <ul className="mt-2 space-y-1.5">
                      {projeto.entregaveis.map((entregavel) => (
                        <li
                          key={entregavel}
                          className="flex items-start gap-2 text-sm text-slate-700"
                        >
                          <Check
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600"
                            aria-hidden
                          />
                          {entregavel}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {projeto.cobreGaps.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                      <Target className="h-3.5 w-3.5" aria-hidden />
                      Cobre:
                    </span>
                    {projeto.cobreGaps.map((gap) => (
                      <span
                        key={gap}
                        className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700"
                      >
                        {gap}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
