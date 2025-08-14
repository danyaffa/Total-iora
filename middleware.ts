import { NextResponse, NextRequest } from "next/server";
import { DOMAIN_TO_FAITH, DEFAULT_FAITH, VALID_FAITHS } from "./lib/faith-config";

export function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const host = (req.headers.get("host") || "").toLowerCase().replace(/:\d+$/, "");

  const qFaith = url.searchParams.get("faith");                 // e.g. ?faith=Jewish  (for testing)
  const cFaith = req.cookies.get("faith")?.value;               // sticky while browsing
  const envFaith = process.env.FAITH_OVERRIDE;                  // set per deployment on Vercel
  const hostFaith = (DOMAIN_TO_FAITH as any)[host];

  const pick = (v?: string) => (v && VALID_FAITHS.has(v) ? v : null);
  const faith = pick(qFaith || "") || pick(cFaith || "") || pick(envFaith || "") || pick(hostFaith || "") || DEFAULT_FAITH;

  const res = NextResponse.next();
  res.headers.set("x-faith", faith);
  if (qFaith || envFaith) {
    res.cookies.set("faith", faith, { path: "/", httpOnly: false });
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|robots.txt|sitemap.xml).*)"]
};
