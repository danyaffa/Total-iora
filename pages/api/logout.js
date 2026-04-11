// FILE: /pages/api/logout.js
import { withApi } from "../../lib/apiSecurity";

async function handler(req, res) {
  const isProd =
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production";

  const host = req.headers.host || "";
  const domain = host.endsWith("totaliora.com") ? ".totaliora.com" : undefined;

  const names = ["ac_session", "ac_email"];
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

export default withApi(handler, {
  name: "api.logout",
  methods: ["POST", "GET"],
  rate: { max: 30, windowMs: 60_000 },
});
