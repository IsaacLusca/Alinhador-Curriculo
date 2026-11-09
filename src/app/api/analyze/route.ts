import { NextResponse } from "next/server";
import { analyzeAlignment, ResumeExtractionError } from "@/lib/alignment";
import { describeGeminiError } from "@/lib/gemini";
import { analyzeRequestSchema } from "@/lib/schemas";

export const maxDuration = 120;

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Não foi possível ler a requisição." },
      { status: 400 },
    );
  }

  const parsed = analyzeRequestSchema.safeParse(body);

  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ?? "Dados inválidos na requisição.";

    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const result = await analyzeAlignment(
      parsed.data.curriculoTexto,
      parsed.data.vagaTexto,
    );

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ResumeExtractionError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    console.error("Erro na análise de alinhamento:", error);

    return NextResponse.json(
      { error: describeGeminiError(error) },
      { status: 502 },
    );
  }
}
