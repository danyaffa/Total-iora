// FILE: /pages/api/auracode-chat.js
export const dynamic = "force-dynamic";
export const maxDuration = 30;

import { searchSacredFirst } from "../../lib/sacred-sourcehub.js";
import { searchGeneralFirst } from "../../lib/general-sourcehub.js";

/* ---------- tiny utils ---------- */
const clip = (s, n = 900) => String(s || "").trim().slice(0, n);
const asText = (v) => (typeof v === "string" ? v : JSON.stringify(v || ""));
const ok = (s) => !!(s && String(s).trim());

const SRC_LINK = {
  sefaria:  (ref) => `https://www.sefaria.org/${encodeURIComponent(ref)}?lang=bi`,
  quran:    (s, a) => `https://quran.com/${s}/${a}`,
  gutenberg:(id)   => `https://www.gutenberg.org/ebooks/${id}`,
};

function langName(lang) {
  const s = String(lang || "");
  if (!s || s === "auto") return "English";
  if (s.startsWith("ar")) return "Arabic";
  if (s.startsWith("he")) return "Hebrew";
  if (s.startsWith("en-GB")) return "English (UK)";
  if (s.startsWith("en-IN")) return "English (India)";
  if (s.startsWith("en")) return "English";
  return "English";
}

/* ---------- fetch helpers ---------- */
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

/* ---------- html → text ---------- */
function isHTML(s){ return /<\s*html[\s>]/i.test(String(s||"")); }
function htmlToPlain(raw){
  let s = String(raw||"");
  s = s.replace(/<head[\s\S]*?<\/head>/gi," ")
       .replace(/<script[\s\S]*?<\/script>/gi," ")
       .replace(/<style[\s\S]*?<\/style>/gi," ")
       .replace(/<nav[\s\S]*?<\/nav>/gi," ")
       .replace(/<footer[\s\S]*?<\/footer>/gi," ");
  s = s.replace(/<\/(p|div|h[1-6]|li|section|br)>/gi,"\n\n")
       .replace(/<(p|div|h[1-6]|li|section|br)[^>]*>/gi,"\n")
       .replace(/<[^>]+>/g," ")
       .replace(/project\s+gutenberg[\s\S]*$/i," ")
       .replace(/\r/g,"").replace(/[ \t]+\n/g,"\n").replace(/\n{3,}/g,"\n\n").replace(/[ \t]{2,}/g," ")
       .trim();
  return s;
}
function cleanPara(p) {
  const s = String(p || "").trim();
  if (s.length < 120) return "";
  if (/^\s*(contents|table of contents|chapter|book|part|section|introduction|foreword|preface|index|license)\b/i.test(s)) return "";
  if (/[A-Z\s]{18,}/.test(s) && !/[a-z]/.test(s)) return "";
  if (/project\s+gutenberg/i.test(s)) return "";
  return s;
}

/* ---------- sacred fallbacks ---------- */
async function fetchSefaria(q, k=6){
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
      out.push({ work: ref, author:"Sefaria", url:SRC_LINK.sefaria(ref), quote, source:"sefaria" });
      if (out.length >= k) break;
    }
    return out;
  } catch { return []; }
}
async function fetchQuran(q, k=6){
  try {
    const js = await getJSON(`https://api.alquran.cloud/v1/search/${encodeURIComponent(q)}/all/en`);
    const matches = js?.data?.matches || [];
    return matches.slice(0, k).map(m => ({
      work: `Qur'an ${m.surah?.englishName || m.surah?.name || "Surah"} ${m.surah?.number}:${m.numberInSurah}`,
      author: "Qur'an",
      url: SRC_LINK.quran(m.surah?.number || "", m.numberInSurah || ""),
      quote: clip(m.text, 900),
      source: "quran",
    }));
  } catch { return []; }
}
async function fetchGutenbergTitle(title, k=4){
  try {
    const js = await getJSON(`https://gutendex.com/books/?languages=en&search=${encodeURIComponent(title)}`);
    const results = js?.results || []; if (!results.length) return [];
    const want = new RegExp(title.replace(/\s+/g,".*"),"i");
    results.sort((a,b)=>(want.test(a.title||"")?0:1)-(want.test(b.title||"")?0:1));
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
    return paras.slice(0, k).map(p=>({ work: book.title||title, author:(book.authors?.[0]?.name)||null, url:landingURL, quote:clip(p,900), source:"gutenberg" }));
  } catch { return []; }
}

/* ---------- main ---------- */
export default async function handler(req, res){
  if (req.method !== "POST") return res.status(405).json({ error:"Method not allowed" });
  try {
    const { message, path="Universal", mode="gentle", topic="general", lang="en-US", maxSources=8 } = req.body || {};
    if (!ok(message)) return res.status(400).json({ error:"Missing message" });

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) return res.status(503).json({ error:"Missing OPENAI_API_KEY" });

    const targetLanguage = langName(lang);
    const cap = Math.max(1, Number(maxSources) || 8);

    // 1) YOUR curated sources first
    let manifest = [];
    try {
      const resHub = await searchSacredFirst({ query: message, path, max: cap });
      const quotes = Array.isArray(resHub?.quotes) ? resHub.quotes : [];
      manifest = quotes.map(q => ({
        work: q.work || q.title || q.ref,
        author: q.author || null,
        url: q.url || "",
        quote: clip(q.text || q.quote || q.chunk || "", 900),
        source: q.source || "sacred"
      })).filter(x => x.work && x.quote);
    } catch { /* ignore hub errors – continue */ }

    // 1b) Top-up from GENERAL sources if sacred pool is thin
    if (manifest.length < Math.max(2, Math.floor(cap/2))) {
      try {
        const general = await searchGeneralFirst({ query: message, max: cap - manifest.length });
        if (Array.isArray(general) && general.length) {
          const seen = new Set(manifest.map(s => `${s.source}|${s.work}|${(s.quote||"").slice(0,60)}`));
          for (const g of general) {
            const key = `${g.source}|${g.work}|${(g.quote||"").slice(0,60)}`;
            if (!seen.has(key)) { manifest.push(g); seen.add(key); }
            if (manifest.length >= cap) break;
          }
        }
      } catch { /* ignore */ }
    }

    // 2) Sacred public fallbacks only if we still have nothing
    if (!manifest.length) {
      let pool = [];
      if (path === "Jewish") pool = await fetchSefaria(message, cap);
      else if (path === "Muslim") pool = await fetchQuran(message, cap);
      else if (path === "Christian") pool = await fetchGutenbergTitle("King James Bible", cap);
      else if (path === "Eastern") {
        const a = await fetchGutenbergTitle("Tao Te Ching", 4);
        const b = await fetchGutenbergTitle("Bhagavad Gita", 4);
        const c = await fetchGutenbergTitle("Dhammapada", 4);
        pool = [...a, ...b, ...c];
      } else {
        const a = await fetchGutenbergTitle("Tao Te Ching", 2);
        const b = await fetchGutenbergTitle("Bhagavad Gita", 2);
        const c = await fetchGutenbergTitle("Dhammapada", 2);
        const d = await fetchSefaria(message, 2);
        const e = await fetchQuran(message, 2);
        pool = [...a, ...b, ...c, ...d, ...e];
      }
      const seen = new Set();
      manifest = pool.filter(s => {
        const key = `${s.source||"x"}|${s.work}|${s.url}|${(s.quote||"").slice(0,80)}`;
        if (seen.has(key)) return false; seen.add(key);
        return s.work && s.quote;
      }).slice(0, cap);
    }

    const sourceBlock = manifest.map((s, i) => {
      const head = `[${i + 1}] ${s.work}${s.author ? ` — ${s.author}` : ""}`;
      return `${head}\n${clip(s.quote, 500)}`;
    }).join("\n\n");

    const system = [
      `You are the Total-iora Guide for the "${path}" room. Be kind and clear.`,
      `Answer in ${targetLanguage}.`,
      `Use ONLY the numbered SOURCE EXCERPTS when quoting.`,
      `Return STRICT JSON only: {"answer":"<120–180 words>","citations":[{"index":n,"exact_quote":"<≤120w>","reason":"<≤20w>"}]}`
    ].join(" ");

    const userMsg = [
      `USER QUESTION: ${asText(message)}`,
      `STYLE: ${mode} | TOPIC: ${topic}`,
      manifest.length ? `\n\nSOURCE EXCERPTS:\n${sourceBlock}` : "\n\nSOURCE EXCERPTS:\n(none)"
    ].join("");

    const ai = await fetch("https://api.openai.com/v1/chat/completions", {
      method:"POST",
      headers:{ Authorization:`Bearer ${OPENAI_API_KEY}`, "Content-Type":"application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.25,
        messages: [
          { role:"system", content: system },
          { role:"user", content: userMsg }
        ]
      })
    });

    if (!ai.ok) {
      const detail = await ai.text().catch(()=> "");
      return res.status(502).json({ error:"OpenAI error", detail, sources: manifest });
    }

    const data = await ai.json().catch(()=> ({}));
    const raw  = data?.choices?.[0]?.message?.content || "{}";

    // tolerate if model wraps JSON in prose
    let parsed;
    try {
      const m = String(raw).match(/\{[\s\S]*\}$/);
      parsed = JSON.parse(m ? m[0] : raw);
    } catch { parsed = { answer: raw, citations: [] }; }

    const answer = String(parsed?.answer || raw || "—").trim();

    const citations = Array.isArray(parsed?.citations) ? parsed.citations.map((c) => {
      const idx = Number(c?.index);
      const it = Number.isInteger(idx) && idx>=1 && idx<=manifest.length ? manifest[idx-1] : null;
      if (!it) return null;
      return {
        index: idx,
        work: it.work,
        author: it.author || null,
        url: it.url || "",
        quote: String(c?.exact_quote || it.quote || "").trim(),
        reason: String(c?.reason || "").trim(),
        source: it.source || null
      };
    }).filter(Boolean) : [];

    return res.status(200).json({ reply: answer, citations, sources: manifest });
  } catch (e) {
    return res.status(500).json({ error:"Server error", detail:String(e?.message || e) });
  }
}
