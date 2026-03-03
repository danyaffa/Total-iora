import { paypalRequest } from "../../../lib/paypal-server";

const DEFAULT_AMOUNT = process.env.NEXT_PUBLIC_PAYPAL_AMOUNT || "5.00";
const DEFAULT_CURRENCY = process.env.NEXT_PUBLIC_PAYPAL_CURRENCY || "USD";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { amount = DEFAULT_AMOUNT, currency = DEFAULT_CURRENCY } = req.body || {};

  try {
    const order = await paypalRequest("/v2/checkout/orders", {
      method: "POST",
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: String(currency || DEFAULT_CURRENCY),
              value: String(amount || DEFAULT_AMOUNT),
            },
            description: "Total-iora Premium Access",
          },
        ],
      }),
    });

    return res.status(200).json({ id: order.id, status: order.status });
  } catch (error) {
    console.error("create-order error:", error);
    return res.status(500).json({ error: "Unable to create PayPal order" });
  }
}
