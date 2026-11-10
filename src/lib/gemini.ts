import { GoogleGenAI } from "@google/genai";
import type { z } from "zod";

const DEFAULT_MODEL = "gemini-3.5-flash";
const DEFAULT_FALLBACK_MODELS = ["gemini-2.5-flash", "gemini-3.8-flash"];
const MAX_ATTEMPTS_PER_MODEL = 2;
const TRANSIENT_STATUS_CODES = [408, 429, 500, 502, 503, 504];

let client: GoogleGenAI | null = null;

export class GeminiConfigError extends Error {}
export class GeminiResponseError extends Error {}

export function getModelCandidates(): string[] {
  const primary = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  const fallbackEnv = process.env.GEMINI_FALLBACK_MODELS?.trim();

  const fallbacks = (fallbackEnv ? fallbackEnv.split(",") : DEFAULT_FALLBACK_MODELS)
    .map((model) => model.trim())
    .filter(Boolean);

  return [primary, ...fallbacks].filter(
    (model, index, models) => models.indexOf(model) === index,
  );
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

function isTransientError(error: unknown): boolean {
  const status = (error as { status?: unknown } | null)?.status;

  if (
    typeof status === "number" &&
    TRANSIENT_STATUS_CODES.includes(status)
  ) {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error);

  return /503|429|500|502|504|UNAVAILABLE|overloaded|high demand|resource exhausted|rate limit|quota|timeout|deadline|ETIMEDOUT|ECONNRESET|socket hang up/i.test(
    message,
  );
}

interface GenerateJsonOptions<T> {
  sistema: string;
  prompt: string;
  jsonSchema: unknown;
  schema: z.ZodType<T>;
  temperatura?: number;
}

export interface GeneratedJson<T> {
  data: T;
  modelo: string;
}

export async function generateJson<T>({
  sistema,
  prompt,
  jsonSchema,
  schema,
  temperatura = 0.2,
}: GenerateJsonOptions<T>): Promise<GeneratedJson<T>> {
  const ai = getClient();
  const models = getModelCandidates();
  let lastError: unknown;
  let transientFailures = 0;
  let formatFailures = 0;

  for (const model of models) {
    for (
      let attempt = 1;
      attempt <= MAX_ATTEMPTS_PER_MODEL;
      attempt += 1
    ) {
      const correctiveNote =
        attempt > 1
          ? "\n\nSua resposta anterior não seguiu o formato esperado. Responda novamente apenas com um JSON válido, sem Markdown e sem texto fora do JSON, obedecendo exatamente ao schema."
          : "";

      try {
        const response = await ai.models.generateContent({
          model,
          contents: `${prompt}${correctiveNote}`,
          config: {
            systemInstruction: sistema,
            responseMimeType: "application/json",
            responseJsonSchema: jsonSchema,
            temperature: temperatura,
            httpOptions: {
              apiVersion: "v1beta",
              timeout: 60000,
              retryOptions: { attempts: 2, initialDelay: 1, maxDelay: 2 },
            },
          },
        });

        const text = response.text;

        if (!text) {
          lastError = new GeminiResponseError(
            "O modelo não retornou conteúdo.",
          );
          formatFailures += 1;
          continue;
        }

        try {
          const parsed = schema.safeParse(JSON.parse(text));

          if (parsed.success) {
            return { data: parsed.data, modelo: model };
          }

          lastError = parsed.error;
          formatFailures += 1;
        } catch (error) {
          lastError = error;
          formatFailures += 1;
        }
      } catch (error) {
        lastError = error;

        if (!isTransientError(error)) {
          throw error;
        }

        transientFailures += 1;
        break;
      }
    }
  }

  console.error("Falha ao gerar a análise com o Gemini:", lastError);

  if (transientFailures > formatFailures) {
    throw new GeminiResponseError(
      "Os modelos do Gemini estão com alta demanda ou instáveis no momento. Tente novamente em alguns minutos.",
    );
  }

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

  if (/503|UNAVAILABLE|overloaded|high demand|500|502|504/i.test(message)) {
    return "Os modelos do Gemini estão com alta demanda no momento. Tente novamente em alguns minutos.";
  }

  if (/timeout|deadline|ETIMEDOUT/i.test(message)) {
    return "A análise demorou demais para responder. Tente novamente.";
  }

  return "Não foi possível concluir a análise. Verifique sua conexão e tente novamente.";
}
