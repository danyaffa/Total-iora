// FILE: /pages/api/logout.js
export default function handler(req, res) {
  // expire any auth/registration/dev cookies
  const base = "Path=/; SameSite=Lax";
  const expired = (name) => `${name}=; Max-Age=0; ${base}`;

  res.setHeader("Set-Cookie", [
    expired("ac_session"),
    expired("ac_registered"),
    expired("ac_dev"),
  ]);

  // If called from <a href="/api/logout">, send the browser home.
  // Use 307 so method is preserved if someone POSTs.
  res.writeHead(307, { Location: "/?logged_out=1" });
  res.end();
}
