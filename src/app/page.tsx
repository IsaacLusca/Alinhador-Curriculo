import { Sparkles } from "lucide-react";
import { AnalyzeForm } from "@/components/AnalyzeForm";
import { AppFooter } from "@/components/AppFooter";
import { AppHeader } from "@/components/AppHeader";
import { PageBackground } from "@/components/PageBackground";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <PageBackground />

      <AppHeader />

      <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 pb-20 pt-12 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-3 py-1 text-xs font-medium text-indigo-700 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Análise com IA, sem inventar experiência
          </span>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Seu currículo,{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 bg-clip-text text-transparent">
              alinhado à vaga certa
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Envie seu currículo mestre em .docx, cole a descrição da vaga e
            receba um diagnóstico honesto, um currículo enxugado só com o que
            importa e um plano do que desenvolver para fechar as lacunas.
          </p>
        </section>

        <AnalyzeForm />
      </main>

      <AppFooter />
    </div>
  );
}
