// FILE: /pages/api/logout.js
export default function handler(req, res) {
  res.setHeader("Set-Cookie", [
    "ac_session=; Max-Age=0; Path=/; SameSite=Lax; HttpOnly; Secure",
    "ac_registered=; Max-Age=0; Path=/; SameSite=Lax; Secure",
    "ac_dev=; Max-Age=0; Path=/; SameSite=Lax; Secure",
  ]);
  res.status(200).json({ ok: true });
}
