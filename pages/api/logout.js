// FILE: /pages/api/logout.js
import { serialize } from "cookie";

export default function handler(req, res) {
  const isProd = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
  const host = req.headers.host || "";
  const domain = host.endsWith("totaliora.com") ? ".totaliora.com" : undefined;

  // Clear the cookie by setting its maxAge to 0
  const cookie = serialize("ac_session", "", {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    domain,
    maxAge: 0,
  });

  res.setHeader("Set-Cookie", cookie);
  res.status(200).json({ ok: true });
}
