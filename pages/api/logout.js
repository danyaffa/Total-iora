// FILE: /pages/api/logout.js
export default function handler(req,res){
  const SECURE = req.headers["x-forwarded-proto"] === "https";
  res.setHeader("Set-Cookie", `ac_session=; Max-Age=0; Path=/; SameSite=Lax${SECURE?"; Secure":""}`);
  return res.status(200).json({ ok:true });
}

