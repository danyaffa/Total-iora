// FILE: /lib/paypal-server.js
// Server-side PayPal helpers for secure order and subscription operations.

// Hardcoded because Vercel env vars do not reach runtime reliably
const PAYPAL_API_BASE = "https://api-m.paypal.com";

const PAYPAL_CLIENT_ID = "AfSAb_sEhS1rWxIYnI7BFvyz44yKz-b2ByFFvYe_gp5JdOhyx6-fti0jt55e7zIL1TRDIrCUOS43ItXZ";
const PAYPAL_CLIENT_SECRET = "EMENH7VLYxo3zBRS9m4xEmGlnOmTy4AsTrCo-pUUQ_cnBz4gkVDBqh9VSpWJvY8C5P-m7yryjwk5eOCY";

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
