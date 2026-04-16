import { NextRequest, NextResponse } from "next/server";

export interface PlaceResult {
  businessName: string;
  address: string;
  phone: string;
  rating?: number;
  googleMapsUrl: string;
  placeId: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isMobileUK(formatted?: string, international?: string): boolean {
  if (formatted) {
    const c = formatted.replace(/[\s\-().]/g, "");
    if (c.startsWith("07")) return true;
  }
  if (international) {
    const c = international.replace(/[\s\-().]/g, "");
    if (c.startsWith("+447") || c.startsWith("00447")) return true;
  }
  return false;
}

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

// ── Old Places API types ──────────────────────────────────────────────────────

type TextSearchPlace = {
  place_id: string;
  name: string;
  formatted_address?: string;
  rating?: number;
};

type TextSearchResponse = {
  results: TextSearchPlace[];
  next_page_token?: string;
  status: string;
  error_message?: string;
};

type DetailsResponse = {
  result?: {
    formatted_phone_number?: string;
    international_phone_number?: string;
    website?: string;
  };
  status: string;
};

// ── API fetchers ──────────────────────────────────────────────────────────────

async function textSearchPage(
  query: string,
  apiKey: string,
  pageToken?: string
): Promise<TextSearchResponse> {
  const params = new URLSearchParams({ query, key: apiKey, language: "en", region: "gb" });
  if (pageToken) params.set("pagetoken", pageToken);
  const res = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`);
  if (!res.ok) throw new Error(`Text Search HTTP ${res.status}`);
  return res.json() as Promise<TextSearchResponse>;
}

async function getPlaceDetails(
  placeId: string,
  apiKey: string
): Promise<{ formatted?: string; international?: string; website?: string }> {
  try {
    const params = new URLSearchParams({
      place_id: placeId,
      fields: "formatted_phone_number,international_phone_number,website",
      key: apiKey,
    });
    const res = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?${params}`);
    if (!res.ok) return {};
    const data = await res.json() as DetailsResponse;
    return {
      formatted: data.result?.formatted_phone_number,
      international: data.result?.international_phone_number,
      website: data.result?.website,
    };
  } catch {
    return {};
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────
// POST /api/places-search
// Body: { keyword: string, location: string, excludeIds: string[] }
// Returns: { results: PlaceResult[] }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { keyword?: string; location?: string; excludeIds?: string[] };
    const { keyword, location = "UK", excludeIds = [] } = body;

    if (!keyword?.trim()) {
      return NextResponse.json({ error: "keyword is required" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GOOGLE_PLACES_API_KEY not configured" }, { status: 500 });
    }

    const excluded = new Set(excludeIds);
    const query = `${keyword.trim()} in ${location}`;
    const allPlaces: TextSearchPlace[] = [];

    // Fetch up to 3 pages (up to 60 results)
    let pageToken: string | undefined;
    for (let page = 0; page < 3; page++) {
      if (page > 0) {
        if (!pageToken) break;
        // next_page_token requires a short delay before it becomes valid
        await delay(2000);
      }

      const data = await textSearchPage(query, apiKey, pageToken);

      if (data.status === "ZERO_RESULTS") break;
      if (data.status !== "OK") {
        if (page === 0) {
          return NextResponse.json(
            { error: `Places API: ${data.status}${data.error_message ? " — " + data.error_message : ""}` },
            { status: 502 }
          );
        }
        break;
      }

      allPlaces.push(...data.results);
      pageToken = data.next_page_token;
      if (!pageToken) break;
    }

    // Fetch Place Details for all results in parallel (need phone + website to filter)
    const details = await Promise.all(allPlaces.map((p) => getPlaceDetails(p.place_id, apiKey)));

    // Apply filters in order: 1. phone  2. CRM dupe  3. website
    const results: PlaceResult[] = [];
    for (let i = 0; i < allPlaces.length; i++) {
      const place = allPlaces[i];
      const { formatted, international, website } = details[i];

      // 1. Must have a UK mobile number
      if (!isMobileUK(formatted, international)) continue;

      // 2. Must not already be in callList or leads (excludeIds contains both)
      if (excluded.has(place.place_id)) continue;

      // 3. Must not have a website (old API returns "website", new API returns "websiteUri")
      if (website) continue;

      const phone = formatted ?? international ?? "";
      results.push({
        businessName: place.name,
        address: place.formatted_address ?? "",
        phone,
        rating: place.rating,
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + " " + (place.formatted_address ?? ""))}&query_place_id=${place.place_id}`,
        placeId: place.place_id,
      });
    }

    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("places-search error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
