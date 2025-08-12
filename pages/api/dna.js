// FILE: /pages/api/dna.js
// Creates the "Oracle Universe DNA" write-up **with real sources**.
// Uses your sacred-sourcehub (if present) + optional Supabase knowledge,
// then asks OpenAI to produce a short report with STRICT-JSON citations.
//
// Env required: OPENAI_API_KEY
// Optional: SUPABASE_URL, SUPABASE_SERVICE_KEY (enables DB passages via /lib/knowledge)

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/* -------------------------- small helpers -------------------------- */
const clip = (s, n = 900) => String(s || "").trim().slice(0, n);
const isOK  = (s) => !!(s && String(s).trim());

async function withTimeout(run, ms = 12000) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try { return await run(ac.signal); }
  finally { clearTimeout(t); }
}
async function getJSON(url, ms = 12000) {
  return withTimeout(async (signal) => {
    const r = await fetch(url, { signal });
    if (!r.ok) return null;
    return await r.json().catch(() => null);
  }, ms);
}
async function getTEXT(url, ms = 12000) {
  return withTimeout(async (signal) => {
    const r = await fetch(url, { signal });
    if (!r.ok) return "";
    return await r.text().catch(() => "");
  }, ms);
}

/* ------------------- fallback sacred providers (safe) ------------------- */
const SRC_LINK = {
  sefaria: (ref) => `https://www.sefaria.org/${encodeURIComponent(ref)}?lang=bi`,
  quran:   (surah, ayah) => `https://quran.com/${surah}/${ayah}`,
  gutenberg: (bookId) => `https://www.gutenberg.org/ebooks/${bookId}`,
};

function isHTML(s){ return /<\s*html[\s>]/i.test(String(s||"")); }
function htmlToPlain(raw){
  let s = String(raw||"");
  s = s.replace(/<head[\s\S]*?<\/head>/gi," ")
       .replace(/<script[\s\S]*?<\/script>/gi," ")
       .replace(/<style[\s\S]*?<\/style>/gi," ")
       .replace(/<nav[\s\S]*?<\/nav>/gi," ")
       .replace(/<footer[\s\S]*?<\/footer>/gi," ");
  s = s.replace(/<\/(p|div|h[1-6]|li|section|br)>/gi,"\n\n")
       .replace(/<(p|div|h[1-6]|li|section|br)[^>]*>/gi,"\n");
  s = s.replace(/<[^>]+>/g," ");
  s = s.replace(/project\s+gutenberg[\s\S]*$/i," ");
  s = s.replace(/\r/g,"").replace(/[ \t]+\n/g,"\n").replace(/\n{3,}/g,"\n\n").replace(/[ \t]{2,}/g," ").trim();
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

async function fetchSefaria(query, topK = 6) {
  try {
    const data = await getJSON(`https://www.sefaria.org/api/search-wrap?q=${encodeURIComponent(query)}&size=${topK}&type=Text`);
    const hits = (data?.hits || []).slice(0, topK);
    const out = [];
    for (const h of hits) {
      const ref = h?._source?.ref || h?.ref; if (!ref) continue;
      const tx = await getJSON(`https://www.sefaria.org/api/texts/${encodeURIComponent(ref)}?context=0&commentary=0`);
      const en = Array.isArray(tx?.text) ? tx.text.join(" ") : (tx?.text || "");
      const quote = cleanPara(en) || clip(en, 800);
      if (!quote) continue;
      out.push({ work: ref, author: "Sefaria", url: SRC_LINK.sefaria(ref), text: quote, source: "sefaria" });
      if (out.length >= topK) break;
    }
    return out;
  } catch { return []; }
}

async function fetchQuran(query, topK = 6) {
  try {
    const js = await getJSON(`https://api.alquran.cloud/v1/search/${encodeURIComponent(query)}/all/en`);
    const matches = js?.data?.matches || [];
    return matches.slice(0, topK).map(m => ({
      work: `Qur'an ${m.surah?.englishName || m.surah?.name || "Surah"} ${m.surah?.number}:${m.numberInSurah}`,
      author: "Qur'an",
      url: SRC_LINK.quran(m.surah?.number || "", m.numberInSurah || ""),
      text: clip(m.text, 900),
      source: "quran",
    }));
  } catch { return []; }
}

async function fetchGutenbergTitle(title, topK = 4) {
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
    return paras.slice(0, topK).map((p)=>({ work: book.title || title, author: (book.authors?.[0]?.name)||null, url: landingURL, text: clip(p, 900), source:"gutenberg" }));
  } catch { return []; }
}

/* ------------------- gather sources via your hub (or fallback) ------------------- */
async function gatherSources({ query, path="Universal", max=12 }) {
  // 1) Try your hub first
  try {
    const mod = await import("../../lib/sacred-sourcehub.js").catch(()=>import("../../lib/sacred-sourcehub"));
    if (mod?.searchSacredFirst) {
      const { quotes=[] } = await mod.searchSacredFirst({ query, path, max });
      const mapped = quotes.map(q => ({
        work: q.work || q.title || q.ref,
        author: q.author || null,
        url: q.url || "",
        text: clip(q.text || q.quote || q.chunk || "", 900),
        source: q.source || "sacred"
      })).filter(q => q.work && q.text);
      if (mapped.length) return mapped.slice(0, max);
    }
  } catch(_) {}

  // 2) Fallback to built-ins (still sacred-first)
  let out = [];
  if (path === "Jewish") out = await fetchSefaria(query, max);
  else if (path === "Muslim") out = await fetchQuran(query, max);
  else if (path === "Christian") out = await fetchGutenbergTitle("King James Bible", max);
  else if (path === "Eastern") {
    const a = await fetchGutenbergTitle("Tao Te Ching", 4);
    const b = await fetchGutenbergTitle("Bhagavad Gita", 4);
    const c = await fetchGutenbergTitle("Dhammapada", 4);
    out = [...a, ...b, ...c];
  } else { // Universal: mix a bit of each
    const a = await fetchGutenbergTitle("Tao Te Ching", 3);
    const b = await fetchGutenbergTitle("Bhagavad Gita", 3);
    const c = await fetchGutenbergTitle("Dhammapada", 3);
    const d = await fetchSefaria(query, 2);
    const e = await fetchQuran(query, 2);
    out = [...a, ...b, ...c, ...d, ...e];
  }
  return out.slice(0, max);
}

/* ----------------------------- main handler ----------------------------- */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const {
      name = "",
      birth = "",
      place = "",
      path = "Universal",
      question = "",
      locale = "en"
    } = body;

    const query = String(question || "").trim();
    if (!isOK(query)) return res.status(400).json({ error: "Missing question" });

    // Sacred + optional DB passages (if you have /lib/knowledge configured)
    const sacred = await gatherSources({ query, path, max: 12 });

    let dbPassages = [];
    try {
      // Optional — only if the module + env exist
      const km = await import("../../lib/knowledge.js").catch(()=>null);
      if (km?.retrievePassages && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
        dbPassages = await km.retrievePassages({ question: query, path, lang: locale }).catch(()=>[]);
      }
    } catch(_) {}

    // Merge (sacred first), de-dupe by work+url+text prefix
    const seen = new Set();
    const pool = [...sacred, ...(dbPassages||[])]
      .map(q => ({
        work: q.work,
        author: q.author || null,
        url: q.url || "",
        text: clip(q.text || q.chunk || "", 900),
        source: q.source || "db"
      }))
      .filter(q => q.work && q.text)
      .filter((q) => {
        const key = `${q.work}|${q.url}|${q.text.slice(0,80)}`;
        if (seen.has(key)) return false; seen.add(key); return true;
      })
      .slice(0, 12);

    // Numbered excerpt block [n]
    const excerptBlock = pool.map((q, i) => {
      const head = `[${i + 1}] ${q.work}${q.author ? ` — ${q.author}` : ""}`;
      return `${head}\n${clip(q.text, 500)}`;
    }).join("\n\n");

    // Prompt (keeps your sections; adds strict-JSON + citation rules)
    const ethos =
      "Offer warm, grounded guidance. No promises of outcomes. Avoid medical/legal/financial advice. Encourage qualified help when needed.";

    const sections = [
      "- Snapshot (tone like a horoscope, but humble)",
      "- Strengths & Shadows",
      "- Practices for 7 Days (numbered, concrete, 5–8 lines total)",
      "- A Blessing (2–4 lines)",
    ].join("\n");

    const tradition = {
      Muslim: "Use Qur’anic imagery, adab & akhlaq, and Sufi practices like dhikr and muraqabah when appropriate.",
      Christian: "Use Gospel themes, virtues, Fathers and saints, examen-like reflection.",
      Jewish: "Use Psalms, Rambam (Hilchot De’ot), Mussar middot (e.g., patience, humility), and gentle halachic mindfulness.",
      Eastern: "Use the Eightfold Path, metta, Taoist balance, and simple yoga/ayurvedic habits when fitting.",
      Universal: "Use humanist compassion, breath, journaling, and service.",
    }[path] || "";

    const system = [
      `You are a gentle ${path} guide. ${tradition} ${ethos}`,
      `You are given SOURCE EXCERPTS, each numbered [n]. Use ONLY those excerpts if you quote lines.`,
      `Return STRICT JSON only (no markdown, no preface):`,
      `{"report":"<150–220 words with headings exactly as below>", "citations":[{"index": n, "quote":"<verbatim ≤120 words>", "why":"<≤16 words>"}]}`
    ].join(" ");

    const frame = [
      `User: ${name || "Friend"}. Path: ${path}. Birth: ${birth || "—"}. Place: ${place || "—"}.`,
      `Concern: ${query || "General guidance request."}`,
      "Write in clear, short paragraphs with gentle titles.",
      "Sections to include:",
      sections,
      "",
      pool.length ? `SOURCE EXCERPTS:\n${excerptBlock}` : "SOURCE EXCERPTS:\n(none)"
    ].join("\n");

    // Call OpenAI
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) return res.status(503).json({ error: "Missing OPENAI_API_KEY" });

    const ai = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.35,
        messages: [
          { role: "system", content: system },
          { role: "user", content: frame },
        ],
      }),
    });

    if (!ai.ok) {
      const t = await ai.text().catch(()=> "");
      return res.status(502).json({ error: "Upstream error", detail: t });
    }

    const data = await ai.json().catch(()=> ({}));
    const raw = data?.choices?.[0]?.message?.content || "{}";

    let parsed = {};
    try {
      parsed = JSON.parse((String(raw).match(/\{[\s\S]*\}$/) || [raw])[0]);
    } catch {
      parsed = { report: raw, citations: [] };
    }

    // Resolve citations indices -> full objects
    const citationsIn = Array.isArray(parsed?.citations) ? parsed.citations : [];
    const outCites = citationsIn.map((c) => {
      const idx = Number(c?.index);
      const item = Number.isInteger(idx) && idx >= 1 && idx <= pool.length ? pool[idx - 1] : null;
      if (!item) return null;
      return {
        index: idx,
        work: item.work,
        author: item.author || null,
        url: item.url || "",
        quote: String(c?.quote || item.text || "").trim(),
        reason: String(c?.why || "").trim()
      };
    }).filter(Boolean);

    return res.status(200).json({
      report: String(parsed?.report || "I’m here with you.").trim(),
      citations: outCites,
      offered: pool, // optional: shows which excerpts were available
    });
  } catch (e) {
    return res.status(500).json({ error: "DNA generation failed", detail: String(e?.message || e) });
  }
}
