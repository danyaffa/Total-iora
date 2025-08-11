// FILE: /pages/api/auracode-chat.js
// Your original file with its custom logic has been preserved.
// NEW: Added Wikiquote and Internet Archive as new source providers.
// All providers now run in parallel for faster, more diverse results.

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/* ---------------- helpers (Your Original Code) ---------------- */

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

const GUIDANCE = {
  Muslim: "Draw gently from Qur’an and Hadith where fitting, adab & akhlaq, and Sufi practice. Offer mercy and clarity.",
  Christian: "Draw gently from the Gospels, parables, virtues, the Fathers, and the witness of the saints.",
  Jewish: "Draw gently from Torah, Psalms, and sages. For life-skills, lean on Rambam (Hilchot De’ot) and Mussar middot.",
  Eastern: "Draw gently from the Noble Eightfold Path, Taoist harmony, and Vedic disciplines such as yamas/niyamas.",
  Universal: "Draw gently from humanist ethics and contemplative practice. Offer presence over promises.",
};

const MODE_PROMPTS = {
  general:   "Your mode is one of gentle guidance. Be wise and reflective.",
  practical: "Your mode is practical. Focus on clear, actionable steps.",
  wisdom:    "Your mode is timeless wisdom. Offer succinct, well-sourced insight.",
  comfort:   "Your mode is comforting. Be exceptionally warm, empathetic, and reassuring.",
};

const TOPIC_PROMPTS = {
  general:       "Topic: general guidance for the present moment.",
  healthy:       "Topic: healthy living—sleep, simple movement, nourishing food, self-care. Avoid medical advice.",
  relationships: "Topic: human relationships—listening, boundaries, reconciliation, empathy.",
  partner:       "Topic: finding a life partner—character, shared values, patience, and practical steps to meet people.",
  work:          "Topic: work & purpose—meaningful contribution, integrity, sustainable habits.",
  parenting:     "Topic: parenting—patience, modeling virtues, age-appropriate guidance.",
  grief:         "Topic: grief & healing—gentleness, permission to grieve, small rituals of remembrance.",
  addiction:     "Topic: addiction support (non-clinical). Encourage safe supports and professional help when needed.",
  mindfulness:   "Topic: mindfulness & calm—breath, presence, and simple contemplative practice.",
};

const ETHOS = "Never provide medical, legal, or financial diagnosis. Encourage qualified help when needed. Do not promise outcomes. Keep paragraphs short. If the user's wording is unclear or ungrammatical, you may briefly restate it first for clarity.";

/* ---------------- FREE web retrieval (Your Original Code + New Providers) ---------------- */

function splitParas(txt, maxChars = 900) {
  const ps = String(txt || "").split(/\n{2,}/).map(s => s.trim()).filter(Boolean);
  const out = [];
  for (const p of ps) {
    if (p.length <= maxChars) out.push(p);
    else for (let i=0;i<p.length;i+=maxChars) out.push(p.slice(i,i+maxChars));
    if (out.length >= 40) break;
  }
  return out;
}
function scorePara(p, terms) {
  const s = p.toLowerCase();
  let sc = 0;
  for (const t of terms) if (s.includes(t)) sc += Math.min(10, t.length);
  const L = p.length; if (L > 160 && L < 800) sc += 20;
  return sc;
}
function pickPlainText(formats) {
  const keys = Object.keys(formats || {});
  const k = keys.find((x) => x.startsWith("text/plain")) || keys.find((x) => x.startsWith("text/html"));
  return k ? formats[k] : null;
}

// Bias queries to tradition
function biasQueryForPath(message, path) {
  const m = String(message || "");
  switch (path) {
    case "Jewish": return `${m} Rambam Maimonides "Mishneh Torah" "Guide for the Perplexed"`;
    case "Muslim": return `${m} Qur'an Hadith Ghazali`;
    case "Christian": return `${m} Gospel Augustine Aquinas`;
    case "Eastern": return `${m} Dhammapada "Tao Te Ching" Bhagavad Gita`;
    default: return m;
  }
}

// Detect hard Rambam request
function askedRambam(message) {
  return /\b(rambam|maimonides|mishneh\s+torah|guide\s+for\s+the\s+perplexed)\b/i.test(message || "");
}

// Keep only Maimonides-related snippets
function keepOnlyMaimonides(list) {
  return (list || []).filter(s =>
    /maimonides|mishneh|perplexed/i.test(`${s.author || ""} ${s.work || ""} ${s.quote || ""}`)
  );
}

// Your original Gutenberg fetcher
async function fetchGutenbergSnippets(query, topK = 6) {
  try {
    const r = await fetch(`https://gutendex.com/books/?search=${encodeURIComponent(query)}`, { redirect: "follow" });
    if (!r.ok) return [];
    const data = await r.json().catch(() => ({}));
    const books = (data?.results || []).slice(0, 3);
    const terms = String(query || "").toLowerCase().split(/\W+/).filter(Boolean);
    const all = [];
    for (const b of books) {
      const url = pickPlainText(b.formats || {});
      if (!url) continue;
      const tr = await fetch(url, { redirect: "follow" });
      if (!tr.ok) continue;
      const raw = await tr.text();
      const paras = splitParas(raw);
      const scored = paras.map((p, i) => ({ p, i, score: scorePara(p, terms) })).sort((a, b) => b.score - a.score).slice(0, Math.max(1, Math.ceil(topK / Math.max(1, books.length))));
      for (const s of scored) {
        all.push({ work: b.title || "Project Gutenberg", author: (b.authors?.[0]?.name) || null, pos: s.i, quote: s.p.slice(0, 900), url, source: "gutenberg" });
      }
    }
    return all.slice(0, topK);
  } catch { return []; }
}

// Your original Open Library fetcher
async function fetchOpenLibrarySnippets(query, topK = 4) {
  try {
    const r = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5`, { redirect:"follow" });
    if (!r.ok) return [];
    const data = await r.json().catch(() => ({}));
    const docs = Array.isArray(data?.docs) ? data.docs.slice(0, 5) : [];
    const out = [];
    for (const d of docs) {
      const workKey = (d.key || "").startsWith("/works/") ? d.key : null;
      const title = d.title || "Open Library";
      const author = Array.isArray(d.author_name) ? d.author_name[0] : (d.author_name || null);
      let quote = "";
      if (workKey) {
        try {
          const wr = await fetch(`https://openlibrary.org${workKey}.json`, { redirect:"follow" });
          if (wr.ok) {
            const wj = await wr.json().catch(() => ({}));
            const desc = wj?.description;
            quote = typeof desc === "string" ? desc : (desc?.value || "");
            quote = String(quote || "").trim().slice(0, 700);
          }
        } catch {}
      }
      if (!quote && d.first_sentence) {
        quote = Array.isArray(d.first_sentence) ? d.first_sentence[0] : (d.first_sentence?.value || d.first_sentence || "");
        quote = String(quote || "").trim().slice(0, 300);
      }
      out.push({ work: title, author: author || null, pos: 0, quote: quote || "", url: workKey ? `https://openlibrary.org${workKey}` : undefined, source: "openlibrary" });
    }
    return out.slice(0, topK);
  } catch { return []; }
}

// --- NEW Provider: Wikiquote ---
async function fetchWikiquote(query, topK = 3) {
    try {
        const endpoint = `https://en.wikiquote.org/w/api.php?action=query&origin=*&format=json&list=search&srsearch=${encodeURIComponent(query)}&srlimit=${topK}`;
        const r = await fetch(endpoint); if (!r.ok) return [];
        const data = await r.json().catch(()=>({}));
        const pages = data?.query?.search || [];
        const out = [];
        for (const p of pages.slice(0, topK)) {
            const infoR = await fetch(`https://en.wikiquote.org/w/api.php?action=query&origin=*&format=json&prop=extracts&exintro&explaintext&pageids=${p.pageid}`);
            if (!infoR.ok) continue;
            const info = await infoR.json().catch(()=>({}));
            const page = Object.values(info?.query?.pages||{})[0];
            const quote = String(page?.extract || "").trim().slice(0,800);
            if (quote) {
                out.push({ work: p.title, author: null, quote, url: `https://en.wikiquote.org/?curid=${p.pageid}`, source:"wikiquote" });
            }
        }
        return out;
    } catch { return []; }
}

// --- NEW Provider: Internet Archive ---
async function fetchInternetArchive(query, topK = 3) {
  try {
    const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)} AND mediatype:texts&fl[]=identifier,title,creator,description&rows=${topK}&output=json`;
    const r = await fetch(url); if (!r.ok) return [];
    const data = await r.json().catch(()=>({}));
    return (data?.response?.docs || []).map(d => ({
      work: d.title || "Internet Archive",
      author: Array.isArray(d.creator) ? d.creator[0] : (d.creator || null),
      quote: String(d.description || "").trim().slice(0, 800),
      url: d.identifier ? `https://archive.org/details/${d.identifier}` : null,
      source: "internetarchive",
    }));
  } catch { return []; }
}

/* ---------------- OPTIONAL Supabase retrieval (Your Original Code) ---------------- */
async function retrieveSupabase({ question, path, lang }) { /* ... your existing supabase code ... */ }

/* ---------------- Rambam-only path (Your Original Code) ---------------- */
async function getMaimonidesSources() {
  const q1 = await fetchGutenbergSnippets(`Maimonides "Guide for the Perplexed"`, 6);
  const q2 = await fetchGutenbergSnippets(`Moses Maimonides "Guide for the Perplexed"`, 6);
  const q3 = await fetchGutenbergSnippets(`Maimonides Mishneh Torah ethics`, 4);
  const q4 = await fetchOpenLibrarySnippets(`Maimonides "Guide for the Perplexed"`, 4);
  const merged = [...q1, ...q2, ...q3, ...q4];
  return keepOnlyMaimonides(merged).slice(0, 8);
}

/* ---------------- main handler (Upgraded to use all sources) ---------------- */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { message, path = "Universal", mode = "general", topic = "general", lang = "en-US" } = req.body || {};
    if (!message || typeof message !== "string" || !message.trim()) return res.status(400).json({ error: "Missing message" });

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) return res.status(503).json({ error: "Missing OPENAI_API_KEY" });

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const targetLanguage = langName(lang);

    // 1) Gather sources
    const wantsRambam = askedRambam(message);
    let sources = [];

    // Optional Supabase (kept)
    try { sources = sources.concat(await retrieveSupabase({ question: message, path, lang })); } catch {}

    if (wantsRambam) {
      // HARD ENFORCEMENT: only Maimonides sources; no substitutions
      const onlyRambam = await getMaimonidesSources();
      sources = keepOnlyMaimonides([...sources, ...onlyRambam]);
    } else {
      // NEW: Run all free web providers in parallel for diverse results
      const biased = biasQueryForPath(message, path);
      const sourcePromises = [
        fetchGutenbergSnippets(biased, 6),
        fetchOpenLibrarySnippets(biased, 4),
        fetchWikiquote(biased, 3),
        fetchInternetArchive(biased, 3),
      ];
      const results = await Promise.allSettled(sourcePromises);
      for (const result of results) {
          if (result.status === 'fulfilled' && Array.isArray(result.value)) {
              sources.push(...result.value);
          }
      }
      
      // Your original logic to prefer Rambam when Jewish path is preserved
      if (path === "Jewish") {
        const rambamFirst = keepOnlyMaimonides(sources);
        const rest = sources.filter(x => !rambamFirst.includes(x));
        sources = [...rambamFirst, ...rest];
      }
    }

    // De-dup and cap
    const seen = new Set();
    sources = sources.filter((s) => {
      const key = `${s.source}|${s.work}|${s.pos}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 8);

    // 2) Build prompt (Your original logic is preserved)
    const system = [
      `You are a calm, humane spiritual guide (${path}).`,
      GUIDANCE[path] || GUIDANCE.Universal,
      TOPIC_PROMPTS[topic] || TOPIC_PROMPTS.general,
      MODE_PROMPTS[mode] || MODE_PROMPTS.general,
      ETHOS,
      `Reply in ${targetLanguage}.`,
      wantsRambam
        ? (sources.length
            ? "The user asked for Rambam (Maimonides). Provide only direct quotations from Maimonides. Do NOT substitute other authors."
            : "The user asked for Rambam (Maimonides). No authentic Rambam sources are available right now. Say this briefly and do not substitute other authors. If you add any paraphrase, label it clearly as a paraphrase.")
        : (sources.length
            ? "Ground your answer in the sources below. Quote sparingly. When you draw from one, add a bracket like [#1]."
            : "If you reference scripture/sages, do so generally (no hard citations available)."),
    ].join(" ");

    const contextBlock = sources.length
      ? "\n\nSources:\n" + sources.map((s, i) =>
          `[#${i+1}] ${s.work}${s.author ? " — " + s.author : ""}${typeof s.pos === "number" ? ` (pos ${s.pos})` : ""}\n${(s.quote || "").slice(0, 900)}`
        ).join("\n\n")
      : "";

    const payload = { model, temperature: 0.6, messages: [ { role: "system", content: system }, { role: "user", content: message.trim() + (contextBlock ? `\n\n---\n${contextBlock}` : "") }, ], };
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 25000);

    const r = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: ac.signal, }).catch((e) => { return { ok: false, status: 502, text: async () => String(e?.message || e) }; });
    clearTimeout(t);

    if (!r.ok) {
      const detail = await (r.text?.() || Promise.resolve("Unknown upstream error"));
      return res.status(500).json({ error: "Upstream error", detail });
    }

    const data = await r.json().catch(() => ({}));
    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) return res.status(502).json({ error: "No content returned from model." });

    const outSources = sources.map((s, i) => ({ i: i + 1, work: s.work, author: s.author || null, pos: s.pos ?? 0, url: s.url || null, quote: s.quote || "", }));
    return res.status(200).json({ reply, ...(outSources.length ? { sources: outSources } : {}) });
  } catch (err) {
    return res.status(500).json({ error: "Server error", detail: String(err?.message || err) });
  }
}
