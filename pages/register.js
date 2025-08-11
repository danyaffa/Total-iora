// FILE: /pages/api/register.js
import { serialize } from "cookie";

export default async function handler(req, res) {
  // --- IMPORTANT: Replace with your actual user creation logic ---
  // This is a placeholder. You should hash the password and save
  // the new user to your database.
  const { username, email, phone, password } = req.body;
  if (!username || !email || !phone || !password || password.length < 8) {
    return res.status(400).json({ ok: false, error: "Invalid registration data" });
  }
  // --- End of placeholder logic ---

  const isProd = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
  const host = req.headers.host || "";
  const domain = host.endsWith("totaliora.com") ? ".totaliora.com" : undefined;

  // Replace "<session-token-or-id>" with your new user's session token
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
