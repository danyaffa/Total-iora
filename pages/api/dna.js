// FILE: /pages/api/dna.js
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/* small helpers */
const clip = (s, n = 900) => String(s || "").trim().slice(0, n);
const ok = (s) => !!(s && String(s).trim());

async function withTimeout(run, ms = 12000) {
  const ac = new AbortController(); const t = setTimeout(() => ac.abort(), ms);
  try { return await run(ac.signal); } finally { clearTimeout(t); }
}
async function getJSON(url, ms = 12000) {
  return withTimeout(async (signal) => {
    const r = await fetch(url, { signal }); if (!r.ok) return null;
    return await r.json().catch(() => null);
  }, ms);
}
async function getTEXT(url, ms = 12000) {
  return withTimeout(async (signal) => {
    const r = await fetch(url, { signal }); if (!r.ok) return "";
    return await r.text().catch(() => "");
  }, ms);
}

const SRC_LINK = {
  sefaria: (ref) => `https://www.sefaria.org/${encodeURIComponent(ref)}?lang=bi`,
  quran:   (surah, ayah) => `https://quran.com/${surah}/${ayah}`,
  gutenberg: (bookId) => `https://www.gutenberg.org/ebooks/${bookId}`,
};

function isHTML(s){ return /<\s*html[\s>]/i.test(String(s||"")); }
function htmlToPlain(raw){
  let s = String(raw||"");
  s = s.replace(/<head[\s\S]*?<\/head>/gi," ").replace(/<script[\s\S]*?<\/script>/gi," ")
       .replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<nav[\s\S]*?<\/nav>/gi," ")
       .replace(/<footer[\s\S]*?<\/footer>/gi," ")
       .replace(/<\/(p|div|h[1-6]|li|section|br)>/gi,"\n\n")
       .replace(/<(p|div|h[1-6]|li|section|br)[^>]*>/gi,"\n")
       .replace(/<[^>]+>/g," ").replace(/project\s+gutenberg[\s\S]*$/i," ")
       .replace(/\r/g,"").replace(/[ \t]+\n/g,"\n").replace(/\n{3,}/g,"\n\n").replace(/[ \t]{2,}/g," ")
       .trim();
  return s;
}
function cleanPara(p) {
  const s = String(p || "").trim();
  if (s.length < 100) return "";
  if (/^\s*(contents|table of contents|chapter|book|part|section|introduction|foreword|preface|index|license)\b/i.test(s)) return "";
  if (/[A-Z\s]{18,}/.test(s) && !/[a-z]/.test(s)) return "";
  if (/project\s+gutenberg/i.test(s)) return "";
  return s;
}

/* sacred fetchers */
async function fetchSefaria(q, k = 6){
  try {
    const data = await getJSON(`https://www.sefaria.org/api/search-wrap?q=${encodeURIComponent(q)}&size=${k}&type=Text`);
    const hits = (data?.hits || []).slice(0, k);
    const out = [];
    for (const h of hits){
      const ref = h?._source?.ref || h?.ref; if (!ref) continue;
      const tx = await getJSON(`https://www.sefaria.org/api/texts/${encodeURIComponent(ref)}?context=0&commentary=0`);
      const en = Array.isArray(tx?.text) ? tx.text.join(" ") : (tx?.text || "");
      const quote = cleanPara(en) || clip(en, 800);
      if (!quote) continue;
      out.push({ work: ref, author: "Sefaria", url: SRC_LINK.sefaria(ref), text: quote, source:"sefaria" });
      if (out.length >= k) break;
    }
    return out;
  } catch { return []; }
}
async function fetchQuran(q, k = 6){
  try {
    const js = await getJSON(`https://api.alquran.cloud/v1/search/${encodeURIComponent(q)}/all/en`);
    const matches = js?.data?.matches || [];
    return matches.slice(0, k).map(m => ({
      work: `Qur'an ${m.surah?.englishName || m.surah?.name || "Surah"} ${m.surah?.number}:${m.numberInSurah}`,
      author: "Qur'an",
      url: SRC_LINK.quran(m.surah?.number || "", m.numberInSurah || ""),
      text: clip(m.text, 900),
      source:"quran"
    }));
  } catch { return []; }
}
async function fetchGutenbergTitle(title, k = 4){
  try {
    const js = await getJSON(`https://gutendex.com/books/?languages=en&search=${encodeURIComponent(title)}`);
    const results = js?.results || [];
    if (!results.length) return [];
    const want = new RegExp(title.replace(/\s+/g, ".*"), "i");
    results.sort((a,b) => (want.test(a.title||"")?0:1) - (want.test(b.title||"")?0:1));
    const book = results[0]; if (!book) return [];
    const fmts = book.formats || {};
    const rawURL =
      (fmts["text/plain; charset=utf-8"] && !/\.zip$/i.test(fmts["text/plain; charset=utf-8"])) ? fmts["text/plain; charset=utf-8"] :
      (fmts["text/plain"] && !/\.zip$/i.test(fmts["text/plain"])) ? fmts["text/plain"] :
      (fmts["text/html; charset=utf-8"] && !/\.zip$/i.test(fmts["text/html; charset=utf-8"])) ? fmts["text/html; charset=utf-8"] :
      (fmts["text/html"] && !/\.zip$/i.test(fmts["text/html"])) ? fmts["text/html"] : null;
    if (!rawURL) return [];
    const landingURL = SRC_LINK.gutenberg(book.id);
    const raw = await getTEXT(rawURL);
    const plain = isHTML(raw) ? htmlToPlain(raw) : raw;
    const paras = String(plain||"").split(/\n{2,}/).map(s=>s.trim()).filter(Boolean).map(cleanPara).filter(Boolean);
    return paras.slice(0, k).map(p => ({ work: book.title || title, author: (book.authors?.[0]?.name)||null, url: landingURL, text: clip(p, 900), source:"gutenberg" }));
  } catch { return []; }
}

/* main */
export default async function handler(req, res){
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { name="", birth="", place="", path="Universal", question="", locale="en" } =
      typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    if (!ok(question)) return res.status(400).json({ error: "Missing question" });

    let pool = [];
    if (path === "Jewish") pool = await fetchSefaria(question, 12);
    else if (path === "Muslim") pool = await fetchQuran(question, 12);
    else if (path === "Christian") pool = await fetchGutenbergTitle("King James Bible", 12);
    else if (path === "Eastern") {
      const a = await fetchGutenbergTitle("Tao Te Ching", 4);
      const b = await fetchGutenbergTitle("Bhagavad Gita", 4);
      const c = await fetchGutenbergTitle("Dhammapada", 4);
      pool = [...a, ...b, ...c];
    } else { // Universal
      const a = await fetchGutenbergTitle("Tao Te Ching", 3);
      const b = await fetchGutenbergTitle("Bhagavad Gita", 3);
      const c = await fetchGutenbergTitle("Dhammapada", 3);
      const d = await fetchSefaria(question, 2);
      const e = await fetchQuran(question, 2);
      pool = [...a, ...b, ...c, ...d, ...e];
    }

    // dedupe
    const seen = new Set();
    pool = pool.filter(q=>{
      const key = `${q.work}|${q.url}|${q.text.slice(0,80)}`;
      if (seen.has(key)) return false; seen.add(key); return true;
    }).slice(0,12);

    const excerptBlock = pool.map((q,i)=>`[${i+1}] ${q.work}${q.author?` — ${q.author}`:""}\n${clip(q.text,500)}`).join("\n\n");

    const ethos = "Offer warm, grounded guidance. No promises. Avoid medical/legal/financial advice.";
    const tradition = {
      Muslim: "Use Qur’anic imagery, adab & akhlaq, Sufi practices when fitting.",
      Christian: "Use Gospel themes, virtues, Fathers/saints, examen-like reflection.",
      Jewish: "Use Psalms, Rambam (Hilchot De’ot), Mussar middot and gentle halachic mindfulness.",
      Eastern: "Use Eightfold Path, metta, Taoist balance, simple yoga/ayurvedic habits.",
      Universal: "Use humanist compassion, breath, journaling, and service.",
    }[path] || "";

    const system = [
      `You are a gentle ${path} guide. ${tradition} ${ethos}`,
      `You are given SOURCE EXCERPTS numbered [n]. Only quote from them.`,
      `Return STRICT JSON only:`,
      `{"report":"<150–220 words with headings: Snapshot; Strengths & Shadows; Practices for 7 Days; A Blessing>", "citations":[{"index":n,"quote":"<verbatim ≤120w>","why":"<≤16w>"}]}`
    ].join(" ");

    const frame = [
      `User: ${name || "Friend"}. Path: ${path}. Birth: ${birth || "—"}. Place: ${place || "—"}.`,
      `Concern: ${question || "General guidance request."}`,
      "Write in clear, short paragraphs with gentle titles.",
      "Sections to include:",
      "- Snapshot (tone like a horoscope, but humble)",
      "- Strengths & Shadows",
      "- Practices for 7 Days (numbered, concrete, 5–8 lines total)",
      "- A Blessing (2–4 lines)",
      "",
      pool.length ? `SOURCE EXCERPTS:\n${excerptBlock}` : "SOURCE EXCERPTS:\n(none)"
    ].join("\n");

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) return res.status(503).json({ error: "Missing OPENAI_API_KEY" });

    const ai = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization:`Bearer ${OPENAI_API_KEY}`, "Content-Type":"application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.35,
        messages: [{ role:"system", content: system }, { role:"user", content: frame }]
      })
    });
    if (!ai.ok) { const t = await ai.text().catch(()=> ""); return res.status(502).json({ error:"Upstream error", detail:t }); }

    const data = await ai.json().catch(()=> ({}));
    const raw = data?.choices?.[0]?.message?.content || "{}";
    let parsed = {};
    try { parsed = JSON.parse((String(raw).match(/\{[\s\S]*\}$/) || [raw])[0]); } catch { parsed = { report: raw, citations: [] }; }

    const citations = (Array.isArray(parsed.citations) ? parsed.citations : []).map(c=>{
      const idx = Number(c?.index);
      const it = Number.isInteger(idx) && idx>=1 && idx<=pool.length ? pool[idx-1] : null;
      if (!it) return null;
      return { index: idx, work: it.work, author: it.author || null, url: it.url || "", quote: String(c?.quote || it.text || "").trim(), reason: String(c?.why || "").trim() };
    }).filter(Boolean);

    return res.status(200).json({ report: String(parsed?.report || "I’m here with you.").trim(), citations, offered: pool });
  } catch (e) {
    return res.status(500).json({ error: "DNA generation failed", detail: String(e?.message || e) });
  }
}
