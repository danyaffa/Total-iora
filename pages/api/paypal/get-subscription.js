import { paypalRequest } from "../../../lib/paypal-server";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { subscriptionId } = req.query;
  if (!subscriptionId) {
    return res.status(400).json({ error: "Missing subscriptionId" });
  }

  try {
    const subscription = await paypalRequest(`/v1/billing/subscriptions/${subscriptionId}`);
    return res.status(200).json(subscription);
  } catch (error) {
    console.error("get-subscription error:", error);
    return res.status(500).json({ error: "Unable to fetch PayPal subscription" });
  }
}
