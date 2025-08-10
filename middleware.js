// FILE: /middleware.js
import { NextResponse } from "next/server";

export function middleware(req) {
  const c = req.cookies;
  const hasSession = c.get("ac_session")?.value === "1";
  const url = req.nextUrl;

  // Block API and gated pages without a session
  const gated = ["/api/auracode-chat", "/sacred-space", "/oracle-universe-dna"];
  if (gated.some(p => url.pathname.startsWith(p)) && !hasSession) {
    if (url.pathname.startsWith("/api/")) {
      return new NextResponse(JSON.stringify({ error: "login_required" }), { status: 401, headers: { "content-type":"application/json" }});
    }
    const to = new URL("/login", url.origin);
    return NextResponse.redirect(to);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/api/auracode-chat", "/sacred-space", "/oracle-universe-dna"] };
