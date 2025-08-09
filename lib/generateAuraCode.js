export function generateAuraCode(name, dob) {
  const clean = (name || "").trim().toUpperCase();
  const seed = (dob || "").replace(/[^0-9]/g, "");
  let sum = 0;
  for (let i = 0; i < clean.length; i++) sum += clean.charCodeAt(i);
  for (let i = 0; i < seed.length; i++) sum += parseInt(seed[i], 10);
  const colors = ["Violet","Indigo","Blue","Green","Gold","Amber","Crimson","Rose","Silver","White"];
  const color = colors[sum % colors.length];
  const shard = (sum % 97).toString().padStart(2, "0");
  return { code: `AC-${clean[0] || "X"}${shard}-${color}`, color };
}
