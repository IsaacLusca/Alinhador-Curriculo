import type { AlignmentResult } from "@/types/analysis";

const RESUME_KEY = "alinhador:curriculo-texto";
const JOB_KEY = "alinhador:vaga-texto";
const RESULT_KEY = "alinhador:resultado";

const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

function read(key: string): string {
  try {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function write(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
    notify();
  } catch {
    // Armazenamento indisponível (modo privado ou cota cheia).
  }
}

function remove(key: string): void {
  try {
    window.localStorage.removeItem(key);
    notify();
  } catch {
    // Armazenamento indisponível (modo privado ou cota cheia).
  }
}

export function subscribeStorage(listener: () => void): () => void {
  listeners.add(listener);

  if (typeof window === "undefined") {
    return () => {
      listeners.delete(listener);
    };
  }

  const handleStorage = (event: StorageEvent) => {
    if (
      event.key === null ||
      [RESUME_KEY, JOB_KEY, RESULT_KEY].includes(event.key)
    ) {
      listener();
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

export function getServerSnapshot(): string {
  return "";
}

export function getResumeText(): string {
  return read(RESUME_KEY);
}

export function setResumeText(text: string): void {
  write(RESUME_KEY, text);
}

export function getJobText(): string {
  return read(JOB_KEY);
}

export function setJobText(text: string): void {
  write(JOB_KEY, text);
}

export function getResultRaw(): string {
  return read(RESULT_KEY);
}

export function setStoredResult(result: AlignmentResult): void {
  write(RESULT_KEY, JSON.stringify(result));
}

export function clearStoredResult(): void {
  remove(RESULT_KEY);
}

export function parseStoredResult(raw: string): AlignmentResult | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<AlignmentResult>;

    if (
      typeof parsed.score !== "number" ||
      !parsed.curriculo ||
      !Array.isArray(parsed.requisitos)
    ) {
      return null;
    }

    return parsed as AlignmentResult;
  } catch {
    return null;
  }
}
