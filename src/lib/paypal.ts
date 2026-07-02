// Server-side PayPal v2 Orders API helpers for Kojo Builds checkout.
// No SDK — direct REST calls to keep the bundle light and deps minimal.

const env = process.env.PAYPAL_ENV || "sandbox";
const API_BASE =
  env === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value;
  }
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) {
    throw new Error("PayPal credentials not configured");
  }
  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");
  const res = await fetch(`${API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PayPal auth failed: ${body}`);
  }
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return cachedToken.value;
}

export interface PayPalLineItem {
  name: string;
  description?: string;
  quantity: number;
  unitAmount: number; // GBP
}

export async function createPayPalOrder(items: PayPalLineItem[]) {
  const token = await getAccessToken();
  const total = items.reduce((sum, i) => sum + i.unitAmount * i.quantity, 0);
  const res = await fetch(`${API_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "GBP",
            value: total.toFixed(2),
            breakdown: {
              item_total: { currency_code: "GBP", value: total.toFixed(2) },
            },
          },
          items: items.map((i) => ({
            name: i.name.slice(0, 127),
            description: i.description?.slice(0, 127),
            quantity: String(i.quantity),
            unit_amount: { currency_code: "GBP", value: i.unitAmount.toFixed(2) },
          })),
        },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PayPal create order failed: ${body}`);
  }
  return res.json() as Promise<{ id: string; status: string }>;
}

export async function capturePayPalOrder(orderId: string) {
  const token = await getAccessToken();
  const res = await fetch(`${API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PayPal capture failed: ${body}`);
  }
  return res.json();
}

export async function getPayPalOrder(orderId: string) {
  const token = await getAccessToken();
  const res = await fetch(`${API_BASE}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PayPal get order failed: ${body}`);
  }
  return res.json();
}

// ── Subscriptions (annual recurring) ───────────────────────────────────────

async function ppFetch(path: string, method: string, body?: unknown) {
  const token = await getAccessToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`PayPal ${method} ${path} failed: ${await res.text()}`);
  return res.json();
}

/** Create the (single) catalog product all plans hang off. */
export async function createProduct(name: string, description: string) {
  return ppFetch("/v1/catalogs/products", "POST", {
    name,
    description,
    type: "SERVICE",
    category: "SOFTWARE",
  }) as Promise<{ id: string }>;
}

/** Create an ACTIVE plan that bills a fixed GBP price once per year, forever. */
export async function createYearlyPlan(productId: string, name: string, priceGBP: number) {
  return ppFetch("/v1/billing/plans", "POST", {
    product_id: productId,
    name,
    status: "ACTIVE",
    billing_cycles: [
      {
        frequency: { interval_unit: "YEAR", interval_count: 1 },
        tenure_type: "REGULAR",
        sequence: 1,
        total_cycles: 0, // 0 = repeat indefinitely
        pricing_scheme: { fixed_price: { value: priceGBP.toFixed(2), currency_code: "GBP" } },
      },
    ],
    payment_preferences: {
      auto_bill_outstanding: true,
      setup_fee_failure_action: "CANCEL",
      payment_failure_threshold: 1,
    },
  }) as Promise<{ id: string }>;
}

export interface PayPalSubscription {
  id: string;
  status: string;
  subscriber?: {
    name?: { given_name?: string; surname?: string };
    email_address?: string;
  };
}

export async function getSubscription(id: string): Promise<PayPalSubscription> {
  return ppFetch(`/v1/billing/subscriptions/${id}`, "GET");
}
