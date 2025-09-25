// FILE: /pages/api/logout.js

export default function handler(req, res) {
  const isProd =
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production";

  const host = req.headers.host || "";
  const domain = host.endsWith("totaliora.com") ? ".totaliora.com" : undefined;

  // Add/adjust names if your app sets more cookies
  const names = ["ac_session"]; // e.g., ["ac_session", "token", "refreshToken", "ac_dev"]

  const attrs = [
    "Path=/",
    "SameSite=Lax",
    "HttpOnly",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
  ];

  if (isProd) attrs.push("Secure");
  if (domain) attrs.push(`Domain=${domain}`);

  const setCookies = names.map(
    (n) => `${encodeURIComponent(n)}=; ${attrs.join("; ")}`
  );

  res.setHeader("Set-Cookie", setCookies);
  res.status(200).json({ ok: true });
}
