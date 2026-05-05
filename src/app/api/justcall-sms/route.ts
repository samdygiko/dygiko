import { NextRequest, NextResponse } from "next/server";

function normalize(num: string): string {
  return num.replace(/[^\d]/g, "").replace(/^0/, "44");
}

export async function POST(req: NextRequest) {
  try {
    const { to, body } = await req.json();
    if (!to || !body) {
      return NextResponse.json({ error: "Missing 'to' or 'body'" }, { status: 400 });
    }

    const key = process.env.JUSTCALL_API_KEY;
    const secret = process.env.JUSTCALL_API_SECRET;
    const from = process.env.JUSTCALL_FROM_NUMBER;
    if (!key || !secret || !from) {
      return NextResponse.json({ error: "JustCall not configured" }, { status: 500 });
    }

    const res = await fetch("https://api.justcall.io/v2.1/texts/new", {
      method: "POST",
      headers: {
        Authorization: `${key}:${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        justcall_number: normalize(from),
        contact_number: normalize(to),
        body,
      }),
    });

    const data = await res.json();
    if (!res.ok || data.status === "error") {
      const message = data?.message || data?.error || `JustCall ${res.status}`;
      console.error("justcall-sms error:", message, data);
      return NextResponse.json({ error: message }, { status: 502 });
    }

    return NextResponse.json({ success: true, id: data?.data?.id ?? null });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("justcall-sms exception:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
