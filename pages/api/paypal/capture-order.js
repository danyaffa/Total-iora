import { paypalRequest } from "../../../lib/paypal-server";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { orderId } = req.body || {};
  if (!orderId) {
    return res.status(400).json({ error: "Missing orderId" });
  }

  try {
    const capture = await paypalRequest(`/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      body: JSON.stringify({}),
    });

    return res.status(200).json({
      id: capture.id,
      status: capture.status,
      payer: capture.payer || null,
    });
  } catch (error) {
    console.error("capture-order error:", error);
    return res.status(500).json({ error: "Unable to capture PayPal order" });
  }
}
