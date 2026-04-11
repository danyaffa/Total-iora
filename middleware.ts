// FILE: /middleware.ts
// Unified Next.js middleware for Total-iora:
//   1. Resolves faith (from ?faith, cookie, header, env, or domain map) and
//      passes it downstream via the x-faith header / cookie.
//   2. Gates privileged routes on a simple session cookie (ac_session=1).
//   3. Applies baseline security headers to every HTML response.
//
// IMPORTANT: Next.js supports only ONE middleware file at the project root.
// A previous middleware.js has been consolidated into this file.

import { NextResponse, NextRequest } from "next/server";
import { DOMAIN_TO_FAITH, DEFAULT_FAITH, VALID_FAITHS } from "./lib/faith-config";

const GATED_PREFIXES = [
  "/api/auracode-chat",
  "/sacred-space",
  "/oracle-universe-dna",
];

const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-DNS-Prefetch-Control": "on",
  "X-XSS-Protection": "1; mode=block",
  "Permissions-Policy": "camera=(), microphone=(self), geolocation=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};

function applySecurityHeaders(res: NextResponse) {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(k, v);
  }
}

export function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const host = (req.headers.get("host") || "").toLowerCase().replace(/:\d+$/, "");

  // --- 1. Faith resolution -------------------------------------------------
  const qFaith = url.searchParams.get("faith");
  const cFaith = req.cookies.get("faith")?.value;
  const envFaith = process.env.FAITH_OVERRIDE;
  const hostFaith = (DOMAIN_TO_FAITH as Record<string, string>)[host];

  const pick = (v?: string | null) =>
    v && VALID_FAITHS.has(v) ? v : null;
  const faith =
    pick(qFaith) ||
    pick(cFaith) ||
    pick(envFaith) ||
    pick(hostFaith) ||
    DEFAULT_FAITH;

  // --- 2. Route gating -----------------------------------------------------
  const pathname = url.pathname;
  const isGated = GATED_PREFIXES.some((p) => pathname.startsWith(p));
  const hasSession = req.cookies.get("ac_session")?.value === "1";

  if (isGated && !hasSession) {
    if (pathname.startsWith("/api/")) {
      const unauth = new NextResponse(
        JSON.stringify({ error: "login_required" }),
        {
          status: 401,
          headers: { "content-type": "application/json" },
        }
      );
      applySecurityHeaders(unauth);
      return unauth;
    }
    const redirect = NextResponse.redirect(new URL("/login", url.origin));
    applySecurityHeaders(redirect);
    return redirect;
  }

  // --- 3. Continue with faith header + security headers --------------------
  const res = NextResponse.next();
  res.headers.set("x-faith", faith);
  if (qFaith || envFaith) {
    res.cookies.set("faith", faith, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      secure: req.nextUrl.protocol === "https:",
    });
  }
  applySecurityHeaders(res);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|sw.js|manifest.json).*)"],
};
