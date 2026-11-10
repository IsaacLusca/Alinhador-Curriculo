import type { JobProfile, MasterResume } from "@/lib/schemas";
import { normalizeText } from "@/lib/text";

export type SeniorityLevel =
  | "estagio"
  | "junior"
  | "pleno"
  | "senior"
  | "lead";

const MONTHS: Record<string, number> = {
  jan: 0,
  fev: 1,
  mar: 2,
  abr: 3,
  mai: 4,
  jun: 5,
  jul: 6,
  ago: 7,
  set: 8,
  out: 9,
  nov: 10,
  dez: 11,
};

const REQUIRED_YEARS: Record<SeniorityLevel, number> = {
  estagio: 0,
  junior: 1,
  pleno: 3,
  senior: 5,
  lead: 8,
};

export function detectSeniorityLevel(
  job: Pick<JobProfile, "cargo" | "senioridade">,
): SeniorityLevel | null {
  const text = normalizeText(`${job.senioridade ?? ""} ${job.cargo}`);

  if (
    /\b(lead|lider|lideranca|principal|staff|especialista|coordenador|gerente|manager|head)\b/.test(
      text,
    )
  ) {
    return "lead";
  }

  if (/\b(senior|sr)\b/.test(text)) return "senior";
  if (/\b(pleno|pl)\b/.test(text)) return "pleno";
  if (/\b(junior|jr)\b/.test(text)) return "junior";
  if (/\b(estagio|estagiario|intern|internship)\b/.test(text)) {
    return "estagio";
  }

  return null;
}

function parseDateToken(token: string): number | null {
  const normalized = normalizeText(token).replace(/[.,]/g, "").trim();
  const yearMatch = normalized.match(/(19|20)\d{2}/);

  if (!yearMatch || yearMatch.index === undefined) return null;

  const year = Number(yearMatch[0]);
  const prefix = normalized.slice(0, yearMatch.index).trim();
  const monthName = prefix.match(/^([a-z]{3,})/);
  let month = 0;

  if (monthName) {
    const key = monthName[1].slice(0, 3);
    if (key in MONTHS) month = MONTHS[key];
  }

  return year * 12 + month;
}

function currentMonthIndex(): number {
  const now = new Date();
  return now.getFullYear() * 12 + now.getMonth();
}

function parsePeriod(periodo?: string): [number, number] | null {
  if (!periodo) return null;

  const normalized = normalizeText(periodo);
  const separated = normalized
    .replace(/\s+(?:a|ate)\s+/g, " - ")
    .replace(/\s*-\s*/g, " - ");
  const parts = separated.split(" - ").filter(Boolean);

  if (parts.length === 0) return null;

  const start = parseDateToken(parts[0]);
  if (start === null) return null;

  let end: number | null;

  if (parts.length === 1) {
    end = start + 12;
  } else if (/atual|presente|momento|hoje|now|present/.test(parts[1])) {
    end = currentMonthIndex();
  } else {
    end = parseDateToken(parts[1]);
  }

  if (end === null || end < start) return null;

  return [start, end === start ? start + 1 : end];
}

export function estimateExperienceYears(
  experiencias: { periodo?: string }[],
): number | null {
  const intervals = experiencias
    .map((experience) => parsePeriod(experience.periodo))
    .filter((interval): interval is [number, number] => interval !== null)
    .sort((a, b) => a[0] - b[0]);

  if (intervals.length === 0) return null;

  const merged: [number, number][] = [];

  for (const [start, end] of intervals) {
    const last = merged[merged.length - 1];

    if (last && start <= last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }

  const totalMonths = merged.reduce(
    (total, [start, end]) => total + (end - start),
    0,
  );

  return totalMonths / 12;
}

export function scoreSeniority(
  job: Pick<JobProfile, "cargo" | "senioridade">,
  master: MasterResume,
): number | null {
  const level = detectSeniorityLevel(job);
  if (!level) return null;

  const years = estimateExperienceYears(master.experiencias);
  if (years === null) return null;

  const required = REQUIRED_YEARS[level];
  if (required === 0) return 100;

  return Math.min(100, Math.round((years / required) * 100));
}
