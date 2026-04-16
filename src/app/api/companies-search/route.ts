import { NextRequest } from "next/server";

// Words stripped when building compact name key
const STRIP_WORDS = new Set([
  "ltd", "limited", "llp", "plc", "co", "company", "companies",
  "and", "the", "of", "a", "an",
]);

// Generic words excluded from the significant-words check
const GENERIC_WORDS = new Set([
  "services", "solutions", "group", "management", "consulting", "consultancy",
  "enterprises", "associates", "partnership", "uk", "ltd", "co", "and", "the",
  "of", "a", "an", "limited", "llp", "plc",
]);

function cleanCompanyName(name: string): string {
  return name
    .replace(/\b(ltd\.?|limited|llp\.?|plc\.?|l\.l\.p\.?|p\.l\.c\.?|& co\.?|and co\.?)\b/gi, "")
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildNameKey(name: string): string {
  return name
    .toLowerCase()
    .split(/\s+/)
    .map(w => w.replace(/[^a-z0-9]/g, ""))
    .filter(w => w.length > 0 && !STRIP_WORDS.has(w))
    .join("");
}

function buildAbbreviation(name: string): string {
  const cleaned = name
    .replace(/\b(ltd\.?|limited|llp\.?|plc\.?|l\.l\.p\.?|p\.l\.c\.?|& co\.?|and co\.?)\b/gi, "")
    .trim();
  return cleaned
    .split(/\s+/)
    .filter(w => w.length > 0)
    .map(w => w[0].toLowerCase())
    .join("");
}

function buildSignificantWords(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map(w => w.replace(/[^a-z0-9]/g, ""))
    .filter(w => w.length >= 4 && !GENERIC_WORDS.has(w));
}

function buildDomainKey(domain: string): string {
  return domain
    .toLowerCase()
    .replace(/^(https?:\/\/)?(www\.)?/, "")
    .replace(/\.(co\.uk|org\.uk|me\.uk|gov\.uk|net\.uk|com|co|org|net|uk|io|biz|info|online|store|shop)(\/.*)?$/, "")
    .replace(/[^a-z0-9]/g, "");
}

function charOverlapRatio(a: string, b: string): number {
  if (!a || !b) return 0;
  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];
  const freq: Record<string, number> = {};
  for (const c of longer) freq[c] = (freq[c] ?? 0) + 1;
  const used: Record<string, number> = {};
  let matches = 0;
  for (const c of shorter) {
    const avail = (freq[c] ?? 0) - (used[c] ?? 0);
    if (avail > 0) { matches++; used[c] = (used[c] ?? 0) + 1; }
  }
  return matches / longer.length;
}

function domainMatchesCompany(domain: string, companyName: string): boolean {
  const dk = buildDomainKey(domain);
  const nk = buildNameKey(companyName);
  const abbrev = buildAbbreviation(companyName);
  const sigWords = buildSignificantWords(companyName);

  if (!dk || !nk) return false;

  if (nk.length >= 3 && dk.includes(nk)) return true;
  if (dk.length >= 3 && nk.includes(dk)) return true;
  if (abbrev.length >= 3 && dk.includes(abbrev)) return true;
  if (dk.length >= 3 && abbrev.includes(dk)) return true;
  if (nk.length >= 4 && dk.length >= 4 && charOverlapRatio(nk, dk) > 0.6) return true;
  for (const word of sigWords) {
    if (dk.includes(word)) return true;
  }

  return false;
}

function formatOfficerName(raw: string): string {
  // CH format: "SMITH, JOHN DAVID" → "John David Smith"
  const parts = raw.split(",").map(p => p.trim());
  const fullName = parts.length >= 2
    ? `${parts.slice(1).join(" ")} ${parts[0]}`.trim()
    : raw.trim();
  return fullName.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

async function fetchDirectorName(
  companyNumber: string,
  authHeader: string
): Promise<{ name: string; label: string }> {
  try {
    const res = await fetch(
      `https://api.company-information.service.gov.uk/company/${companyNumber}/officers`,
      { headers: { Authorization: authHeader, Accept: "application/json" } }
    );
    if (!res.ok) return { name: "", label: "Director" };
    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: any[] = data.items ?? [];

    // Try active director first, then managing-officer, then secretary
    for (const role of ["director", "managing-officer", "secretary"]) {
      const officer = items.find(o => o.officer_role === role && !o.resigned_on);
      if (officer?.name) {
        return {
          name: formatOfficerName(officer.name as string),
          label: role === "director" ? "Director" : role === "secretary" ? "Secretary" : "Director",
        };
      }
    }

    // Fall back to PSC
    try {
      const pscRes = await fetch(
        `https://api.company-information.service.gov.uk/company/${companyNumber}/persons-with-significant-control`,
        { headers: { Authorization: authHeader, Accept: "application/json" } }
      );
      if (pscRes.ok) {
        const pscData = await pscRes.json();
        const pscName = (pscData.items?.[0]?.name as string) ?? "";
        if (pscName) return { name: formatOfficerName(pscName), label: "PSC" };
      }
    } catch { /* ignore */ }

    return { name: "", label: "Director" };
  } catch {
    return { name: "", label: "Director" };
  }
}

// Step 1: Check Companies House company profile for a website field — free, no Serper credit
async function fetchCompanyWebsite(companyNumber: string, authHeader: string): Promise<string> {
  try {
    const res = await fetch(
      `https://api.company-information.service.gov.uk/company/${companyNumber}`,
      { headers: { Authorization: authHeader, Accept: "application/json" } }
    );
    if (!res.ok) return "";
    const data = await res.json();
    return (data.website as string) ?? "";
  } catch {
    return "";
  }
}

type WebsiteCheckResult = { hasWebsite: boolean; uncertain: boolean };

// Step 2: Serper check — only called when CH profile has no website field
async function checkHasWebsite(cleanName: string, serperKey: string): Promise<WebsiteCheckResult> {
  if (!cleanName || cleanName.length < 3) return { hasWebsite: false, uncertain: false };
  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": serperKey, "Content-Type": "application/json" },
      body: JSON.stringify({ q: cleanName, num: 5, gl: "uk", hl: "en" }),
    });
    if (!res.ok) return { hasWebsite: false, uncertain: false };
    let data: Record<string, unknown>;
    try {
      data = await res.json();
    } catch {
      return { hasWebsite: false, uncertain: false };
    }
    // Only check organic — never ads or sponsored
    const organic: { link: string }[] = (data.organic as { link: string }[]) ?? [];
    // No organic results means we can't verify — mark uncertain so Sam can review
    if (organic.length === 0) return { hasWebsite: false, uncertain: true };
    for (const result of organic.slice(0, 5)) {
      try {
        const domain = new URL(result.link).hostname;
        if (domainMatchesCompany(domain, cleanName)) return { hasWebsite: true, uncertain: false };
      } catch {
        // Skip malformed URLs
      }
    }
    return { hasWebsite: false, uncertain: false };
  } catch {
    return { hasWebsite: false, uncertain: false };
  }
}

type PlacesInfo = {
  phone: string;
  tradingAddress: string;
  tradingPostcode: string;
};

async function fetchPlacesInfo(cleanName: string, apiKey: string): Promise<PlacesInfo> {
  const empty: PlacesInfo = { phone: "", tradingAddress: "", tradingPostcode: "" };
  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "places.nationalPhoneNumber,places.internationalPhoneNumber,places.displayName,places.formattedAddress",
      },
      body: JSON.stringify({ textQuery: `${cleanName} UK`, maxResultCount: 1 }),
    });
    if (!res.ok) return empty;
    const data = await res.json();
    const place = data.places?.[0];
    if (!place) return empty;

    // Verify by name similarity only — registered postcode often differs from trading address
    const placeName = ((place.displayName?.text as string) ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    const companyKey = cleanName.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (charOverlapRatio(placeName, companyKey) < 0.6) return empty;

    const phone =
      (place.nationalPhoneNumber as string) ||
      (place.internationalPhoneNumber as string) ||
      "";
    const tradingAddress = (place.formattedAddress as string) ?? "";

    // Extract UK postcode from the trading address
    const postcodeMatch = tradingAddress.match(/[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}/i);
    const tradingPostcode = postcodeMatch ? postcodeMatch[0].toUpperCase() : "";

    return { phone, tradingAddress, tradingPostcode };
  } catch {
    return empty;
  }
}

const CH_PAGE_SIZE = 100;
const SERPER_BATCH_SIZE = 5;
const SERPER_DELAY_MS = 200;
const CH_PAGE_DELAY_MS = 1000;
const CH_MAX_RETRIES = 10;
const CH_RETRY_BASE_MS = 5000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchCHPageWithRetry(
  url: string,
  authHeader: string,
  onRetry: (attempt: number, waitSecs: number) => void,
  attempt = 0
): Promise<Response> {
  const res = await fetch(url, {
    headers: { Authorization: authHeader, Accept: "application/json" },
  });
  if (res.status === 429 && attempt < CH_MAX_RETRIES) {
    const waitSecs = (attempt + 1) * (CH_RETRY_BASE_MS / 1000);
    onRetry(attempt, waitSecs);
    await delay(waitSecs * 1000);
    return fetchCHPageWithRetry(url, authHeader, onRetry, attempt + 1);
  }
  return res;
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  function sse(controller: ReadableStreamDefaultController, data: object) {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const { sicCode, limit = 100, excludedCompanyNumbers = [] } = await req.json();

        if (!sicCode) {
          sse(controller, { type: "error", message: "sicCode is required" });
          controller.close();
          return;
        }

        const chApiKey = process.env.COMPANIES_HOUSE_API_KEY;
        if (!chApiKey) {
          sse(controller, { type: "error", message: "COMPANIES_HOUSE_API_KEY not configured" });
          controller.close();
          return;
        }

        const serperKey = process.env.SERPER_API_KEY;
        const placesKey = process.env.GOOGLE_PLACES_API_KEY;
        const useSerper = !!serperKey;
        const usePlaces = !!placesKey;

        const totalRequested = Math.max(Number(limit) || 100, 1);

        // Excluded: already in CRM (passed from client)
        const excludedSet = new Set<string>(
          Array.isArray(excludedCompanyNumbers) ? excludedCompanyNumbers : []
        );

        // Deduplication across the entire search session
        const seenNumbers = new Set<string>();
        const seenPhones = new Set<string>();

        const authHeader = "Basic " + Buffer.from(`${chApiKey}:`).toString("base64");

        let totalFetched = 0;
        let websiteChecked = 0;
        let found = 0;
        let startIndex = 0;
        let hasMore = true;
        let pageNum = 0;
        let totalPages: number | null = null;

        while (totalFetched < totalRequested && hasMore) {
          if (pageNum > 0) await delay(CH_PAGE_DELAY_MS);
          pageNum++;

          sse(controller, {
            type: "progress",
            phase: "fetching",
            page: pageNum,
            totalPages: totalPages ?? 0,
            checked: websiteChecked,
            total: totalFetched,
            found,
          });

          const pageSize = Math.min(CH_PAGE_SIZE, totalRequested - totalFetched);
          const chUrl = `https://api.company-information.service.gov.uk/advanced-search/companies?sic_codes=${encodeURIComponent(sicCode)}&company_status=active&size=${pageSize}&start_index=${startIndex}`;

          const chRes = await fetchCHPageWithRetry(chUrl, authHeader, (attempt, waitSecs) => {
            sse(controller, {
              type: "progress",
              phase: "ratelimited",
              waitSecs,
              attempt,
              page: pageNum,
              totalPages: totalPages ?? 0,
              checked: websiteChecked,
              total: totalFetched,
              found,
            });
          });

          if (!chRes.ok) {
            if (chRes.status === 429) {
              console.warn(`CH rate limit: page ${pageNum} skipped after ${CH_MAX_RETRIES} retries`);
              startIndex += pageSize;
              continue;
            } else {
              const errText = await chRes.text().catch(() => "");
              console.error(`CH error ${chRes.status}:`, errText.slice(0, 200));
              sse(controller, { type: "error", message: `Companies House returned an error (${chRes.status}). Results so far are shown below.` });
              break;
            }
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let chData: any;
          try {
            chData = await chRes.json();
          } catch {
            console.error(`CH page ${pageNum}: non-JSON response, skipping`);
            startIndex += pageSize;
            continue;
          }

          const pageItems: Record<string, unknown>[] = (chData.items ?? []).filter(
            (c: Record<string, unknown>) => c.company_status === "active"
          );

          if (pageItems.length === 0) break;

          const totalAvailable = (chData.hits as number) ?? pageItems.length;
          if (totalPages === null) {
            totalPages = Math.ceil(Math.min(totalRequested, totalAvailable) / CH_PAGE_SIZE);
          }

          hasMore = startIndex + pageItems.length < totalAvailable && pageItems.length === pageSize;
          startIndex += pageItems.length;
          totalFetched += pageItems.length;

          // Fetch director names in parallel for this page
          const directorInfo = await Promise.all(
            pageItems.map((c) =>
              fetchDirectorName((c.company_number as string) ?? "", authHeader)
            )
          );

          // Website check results: null = skip (CRM/duplicate), { hasWebsite, uncertain } = checked
          const websiteResults: (WebsiteCheckResult | null)[] = new Array(pageItems.length).fill(null);

          for (let i = 0; i < pageItems.length; i += SERPER_BATCH_SIZE) {
            const batchSlice = pageItems.slice(i, i + SERPER_BATCH_SIZE);

            const batchResults = await Promise.all(
              batchSlice.map(async (c, j) => {
                const companyNumber = (c.company_number as string) ?? "";

                // Skip if already in CRM
                if (excludedSet.has(companyNumber)) return null;

                // Skip duplicates within this search session
                if (seenNumbers.has(companyNumber)) return null;

                // Step 1: Check CH company profile for website (free — no Serper credit)
                const chWebsite = await fetchCompanyWebsite(companyNumber, authHeader);
                if (chWebsite) return { hasWebsite: true, uncertain: false };

                // Step 2: Serper check
                const cleanName = cleanCompanyName((c.company_name as string) ?? "");
                if (useSerper) {
                  return checkHasWebsite(cleanName, serperKey!);
                }
                return { hasWebsite: false, uncertain: false };
              })
            );

            batchResults.forEach((r, j) => {
              websiteResults[i + j] = r;
            });
            websiteChecked += batchSlice.filter((_, j) => websiteResults[i + j] !== null).length;

            sse(controller, {
              type: "progress",
              phase: "checking",
              page: pageNum,
              totalPages,
              checked: websiteChecked,
              total: totalFetched,
              found,
            });

            if (i + SERPER_BATCH_SIZE < pageItems.length) {
              await delay(SERPER_DELAY_MS);
            }
          }

          // Stream results for companies that passed the website check
          for (let i = 0; i < pageItems.length; i++) {
            const checkResult = websiteResults[i];
            // null = skipped (CRM/duplicate); hasWebsite = true → skip
            if (checkResult === null || checkResult.hasWebsite) continue;

            const company = pageItems[i];
            const name = (company.company_name as string) ?? "";
            if (!name) continue;

            const companyNumber = (company.company_number as string) ?? "";

            // Mark as seen (dedup for rest of search)
            seenNumbers.add(companyNumber);

            const cleanName = cleanCompanyName(name);
            const { name: directorName, label: directorLabel } = directorInfo[i];

            const addr = company.registered_office_address as Record<string, string> | undefined;
            const registeredAddress = [
              addr?.address_line_1,
              addr?.address_line_2,
              addr?.locality,
              addr?.postal_code,
            ].filter(Boolean).join(", ");
            const registeredPostcode = (addr?.postal_code as string) ?? "";

            const placesInfo = usePlaces
              ? await fetchPlacesInfo(cleanName, placesKey!)
              : { phone: "", tradingAddress: "", tradingPostcode: "" };

            const { phone, tradingAddress, tradingPostcode } = placesInfo;

            // Dedup by phone number
            if (phone) {
              const normalizedPhone = phone.replace(/\s/g, "");
              if (seenPhones.has(normalizedPhone)) continue;
              seenPhones.add(normalizedPhone);
            }

            const sicCodes = company.sic_codes as string[] | undefined;

            found++;
            sse(controller, {
              type: "result",
              company: {
                companyName: name,
                companyNumber,
                sicDescription: sicCodes?.[0] ?? sicCode,
                address: registeredAddress,
                registeredPostcode,
                tradingAddress,
                tradingPostcode,
                incorporationDate: (company.date_of_creation as string) ?? "",
                status: (company.company_status as string) ?? "",
                pscName: directorName,
                pscLabel: directorLabel,
                phone,
                uncertain: checkResult.uncertain,
              },
            });
          }

          sse(controller, {
            type: "progress",
            phase: "checking",
            page: pageNum,
            totalPages,
            checked: websiteChecked,
            total: totalFetched,
            found,
          });
        }

        sse(controller, { type: "done" });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("companies-search error:", message);
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", message })}\n\n`)
          );
        } catch {
          // Controller may already be closed
        }
      } finally {
        try { controller.close(); } catch { /* already closed */ }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
