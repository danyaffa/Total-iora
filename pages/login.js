// FILE: /pages/api/login.js
import { serialize } from "cookie";

export default async function handler(req, res) {
  // --- IMPORTANT: Replace with your actual user validation logic ---
  // This is a placeholder. You should check the email and password
  // against your database.
  const { email, password } = req.body;
  if (!email || !password || password.length < 8) {
    return res.status(400).json({ ok: false, error: "Invalid credentials" });
  }
  // --- End of placeholder logic ---

  const isProd = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
  const host = req.headers.host || "";
  // Set domain to .totaliora.com for production to share across subdomains
  const domain = host.endsWith("totaliora.com") ? ".totaliora.com" : undefined;

  // Replace "<session-token-or-id>" with your actual secure session token
  const cookie = serialize("ac_session", "<session-token-or-id>", {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    domain,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  res.setHeader("Set-Cookie", cookie);
  return res.status(200).json({ ok: true });
}
