import { GoogleGenAI } from "@google/genai";
import type { z } from "zod";

const DEFAULT_MODEL = "gemini-3.8-flash";
const MAX_ATTEMPTS = 2;

let client: GoogleGenAI | null = null;

export class GeminiConfigError extends Error {}
export class GeminiResponseError extends Error {}

export function getModelName(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    throw new GeminiConfigError(
      "A chave GEMINI_API_KEY não está configurada. Copie .env.local.example para .env.local e informe sua chave.",
    );
  }

  if (!client) {
    client = new GoogleGenAI({ apiKey });
  }

  return client;
}

interface GenerateJsonOptions<T> {
  sistema: string;
  prompt: string;
  jsonSchema: unknown;
  schema: z.ZodType<T>;
  temperatura?: number;
}

export async function generateJson<T>({
  sistema,
  prompt,
  jsonSchema,
  schema,
  temperatura = 0.2,
}: GenerateJsonOptions<T>): Promise<T> {
  const ai = getClient();
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const correctiveNote =
      attempt > 1
        ? "\n\nSua resposta anterior não seguiu o formato esperado. Responda novamente apenas com um JSON válido, sem Markdown e sem texto fora do JSON, obedecendo exatamente ao schema."
        : "";

    const response = await ai.models.generateContent({
      model: getModelName(),
      contents: `${prompt}${correctiveNote}`,
      config: {
        systemInstruction: sistema,
        responseMimeType: "application/json",
        responseJsonSchema: jsonSchema,
        temperature: temperatura,
      },
    });

    const text = response.text;

    if (!text) {
      lastError = new GeminiResponseError(
        "O modelo não retornou conteúdo. Tente novamente.",
      );
      continue;
    }

    try {
      const parsed = schema.safeParse(JSON.parse(text));

      if (parsed.success) {
        return parsed.data;
      }

      lastError = parsed.error;
    } catch (error) {
      lastError = error;
    }
  }

  console.error("Falha ao interpretar a resposta do Gemini:", lastError);

  throw new GeminiResponseError(
    "Não foi possível interpretar a resposta da IA. Tente novamente.",
  );
}

export function describeGeminiError(error: unknown): string {
  if (error instanceof GeminiConfigError) {
    return error.message;
  }

  if (error instanceof GeminiResponseError) {
    return error.message;
  }

  const message = error instanceof Error ? error.message : String(error);

  if (/api key|api_key|401|403|permission denied|unauthenticated/i.test(message)) {
    return "A chave da API do Gemini é inválida ou não tem permissão para usar este modelo.";
  }

  if (/quota|rate limit|429|resource exhausted/i.test(message)) {
    return "O limite de uso gratuito da API do Gemini foi atingido. Aguarde alguns minutos e tente novamente.";
  }

  if (/timeout|deadline|ETIMEDOUT/i.test(message)) {
    return "A análise demorou demais para responder. Tente novamente.";
  }

  return "Não foi possível concluir a análise. Verifique sua conexão e tente novamente.";
}
