// FILE: /lib/paypal-server.js
// Server-side PayPal helpers for secure order and subscription operations.

const MODE = process.env.PAYPAL_MODE || process.env.NEXT_PUBLIC_PAYPAL_MODE || "sandbox";
const PAYPAL_API_BASE =
  MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

const PAYPAL_CLIENT_ID =
  process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || "";

function assertPaypalCredentials() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error("Missing PayPal API credentials");
  }
}

export async function getAccessToken() {
  assertPaypalCredentials();

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to fetch PayPal access token: ${response.status} ${body}`);
  }

  const payload = await response.json();
  return payload.access_token;
}

export async function paypalRequest(path, options = {}) {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let body = {};
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text };
    }
  }

  if (!response.ok) {
    throw new Error(`PayPal API error (${response.status}): ${JSON.stringify(body)}`);
  }

  return body;
}

export async function verifyWebhookSignature({
  transmissionId,
  transmissionTime,
  certUrl,
  authAlgo,
  transmissionSig,
  webhookId,
  eventBody,
}) {
  const accessToken = await getAccessToken();

  const response = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: transmissionSig,
      transmission_time: transmissionTime,
      webhook_id: webhookId,
      webhook_event: eventBody,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`PayPal webhook verification failed: ${response.status} ${body}`);
  }

  const payload = await response.json();
  return payload.verification_status === "SUCCESS";
}
