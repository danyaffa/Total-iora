// FILE: /pages/api/auth/whoami.js
export default function handler(req, res) {
  // Replace with your actual session validation (e.g., check a JWT or session store)
  const hasSession = Boolean(req.cookies?.ac_session); 

  if (!hasSession) {
    return res.status(401).json({ ok: false });
  }

  return res.status(200).json({ ok: true, userId: "..." }); // Send back user info if needed
}
