import type { Metadata } from "next";
import { AppFooter } from "@/components/AppFooter";
import { AppHeader } from "@/components/AppHeader";
import { PageBackground } from "@/components/PageBackground";
import { ResultView } from "@/components/result/ResultView";

export const metadata: Metadata = {
  title: "Resultado da análise | Alinhador de Currículo",
};

export default function ResultadoPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <PageBackground />
      <AppHeader />
      <ResultView />
      <AppFooter />
    </div>
  );
}
