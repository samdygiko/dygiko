import { NextResponse } from "next/server";
import { SIC_CODE_OPTIONS } from "@/lib/sic-codes";

// Module-level cache — persists for the lifetime of the server instance
let cachedCodes: string[] | null = null;

const PRIMARY_URL =
  "https://raw.githubusercontent.com/WardBrian/uk-sic-codes/main/sic_codes.json";
const FALLBACK_URL =
  "https://raw.githubusercontent.com/matthewShim/companies-house-sic-codes/master/sic-codes.json";

function normalise(data: unknown): string[] | null {
  if (!data || typeof data !== "object") return null;

  if (Array.isArray(data)) {
    if (data.length === 0) return null;
    const first = data[0] as Record<string, unknown>;

    // matthewShim format: [{SicCode, SicDescription}]
    if (typeof first.SicCode === "string") {
      return (data as { SicCode: string; SicDescription: string }[]).map(
        (item) => `${item.SicCode} — ${item.SicDescription}`
      );
    }
    // Generic: [{code, description}]
    if (typeof first.code === "string" && typeof first.description === "string") {
      return (data as { code: string; description: string }[]).map(
        (item) => `${item.code} — ${item.description}`
      );
    }
    // Plain strings already formatted
    if (typeof first === "string") {
      return data as string[];
    }
    return null;
  }

  // Object map: {"43220": "Plumbing...", ...}
  const obj = data as Record<string, unknown>;
  const entries = Object.entries(obj);
  if (entries.length === 0) return null;
  if (typeof entries[0][1] === "string") {
    return entries.map(([code, desc]) => `${code} — ${desc as string}`);
  }

  return null;
}

async function tryFetch(url: string): Promise<string[] | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    const codes = normalise(data);
    // Sanity check — expect at least 100 codes
    return codes && codes.length >= 100 ? codes : null;
  } catch {
    return null;
  }
}

function hardcodedFallback(): string[] {
  // Convert existing ` - ` separator to ` — `
  return SIC_CODE_OPTIONS.map((s) => s.replace(" - ", " — "));
}

export async function GET() {
  if (cachedCodes) {
    return NextResponse.json({ codes: cachedCodes, source: "cache" });
  }

  // Try primary source
  let codes = await tryFetch(PRIMARY_URL);

  // Try fallback GitHub source
  if (!codes) {
    codes = await tryFetch(FALLBACK_URL);
  }

  // Use hardcoded list
  if (!codes) {
    codes = hardcodedFallback();
    cachedCodes = codes;
    return NextResponse.json({ codes, source: "hardcoded" });
  }

  cachedCodes = codes;
  return NextResponse.json({ codes, source: "remote" });
}
