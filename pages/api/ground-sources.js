// FILE: /pages/api/ground-sources.js
// Grounded quotes for Oracle — with strong fallbacks for generic prompts like “Who is God?”
// - Strict allowlist (Sefaria, Quran.com/alQuran, Gutenberg)
// - Room-specific curated fallbacks so Sources never comes back empty
// - Randomized paragraph sampling + de-dup

export const dynamic = "force-dynamic";
export const maxDuration = 28;

/* ---------------- utils ---------------- */

const ok = (s) => !!(s && String(s).trim());
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const norm = (s) => String(s || "").trim().replace(/\s+/g, " ");
const BAN = /(central intelligence agency|cia|foia|world factbook|\.gov\b|whitehouse|nsa|fbi)/i;

const ALLOWED = new Set([
  "sefaria.org","www.sefaria.org",
  "api.alquran.cloud","quran.com","www.quran.com",
  "gutendex.com","www.gutendex.com",
  "gutenberg.org","www.gutenberg.org",
]);

const pickPlainText = (fmts={}) => {
  const k = Object.keys(fmts);
  return k.find(x=>x.startsWith("text/plain")) ?
    fmts[k.find(x=>x.startsWith("text/plain"))] :
    (k.find(x=>x.startsWith("text/html")) ? fmts[k.find(x=>x.startsWith("text/html"))] : null);
};

const MIN = 180, MAX = 700;

const host = (u) => { try { return new URL(u).host.toLowerCase(); } catch { return ""; } };
const allow = (q, strict=true) => {
  const all = `${q.work||""} ${q.author||""} ${q.url||""} ${q.text||q.quote||""}`.toLowerCase();
  if (BAN.test(all)) return false;
  if (!strict || !q.url) return true;
  return ALLOWED.has(host(q.url));
};

const looksLicense = (t="")=>{
  t=t.toLowerCase();
  return t.includes("project gutenberg") || t.includes("*** start of this");
};

const splitParas = (raw,{minChars=MIN,maxChars=MAX}={})=>{
  const minC = clamp(Number(minChars)||MIN,80,1200);
  const maxC = Math.max(minC+40, clamp(Number(maxChars)||MAX,160,1400));
  return String(raw||"").replace(/\r/g,"").split(/\n{2,}/g)
    .map(norm).filter(p=>p.length>=minC && p.length<=maxC && !looksLicense(p));
};

const sample = (arr,k=6)=> {
  if (!Array.isArray(arr)||!arr.length) return [];
  const n=arr.length, want=clamp(k,1,12);
  if (n<=want) return arr.slice(0,want);
  const step=Math.max(1,Math.floor(n/want));
  const out=[]; let i=Math.floor((Date.now()%step));
  while(out.length<want && i<n){ out.push(arr[i]); i+=step; }
  return out.slice(0,want);
};

const dedupe = (list)=> {
  const seen=new Set(); const out=[];
  for (const x of list) {
    const key = `${x.source||"x"}|${x.work}|${(x.pos??0)}|${(x.text||x.quote||"").toLowerCase().slice(0,80)}`;
    if (seen.has(key)) continue; seen.add(key); out.push(x);
  }
  return out;
};

const isGeneric = (q="")=>{
  const t = q.toLowerCase().trim();
  if (!t) return true;
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length <= 3) return true;
  return /(who|what)\s+is\s+(god|allah)\b/.test(t);
};

/* --------------- providers --------------- */

// Sefaria by search
async function sefariaSearch(query, take=6, opts={}) {
  try {
    const r = await fetch(`https://www.sefaria.org/api/search-wrap?q=${encodeURIComponent(query)}&size=${take}&type=Text`);
    if (!r.ok) return [];
    const js = await r.json().catch(()=>({}));
    const hits=(js?.hits||[]).slice(0,take);
    const out=[];
    for (const h of hits) {
      const ref = h?._source?.ref || h?.ref; if (!ref) continue;
      const tr = await fetch(`https://www.sefaria.org/api/texts/${encodeURIComponent(ref)}?context=0&commentary=0`);
      if (!tr.ok) continue;
      const tx = await tr.json().catch(()=>({}));
      const en = Array.isArray(tx?.text) ? tx.text.join(" ") : tx?.text || "";
      const paras = splitParas(en, opts);
      const picks = sample(paras, 2);
      picks.forEach((p,i)=> out.push({work:ref,author:"Sefaria",text:p,pos:i,url:`https://www.sefaria.org/${encodeURIComponent(ref)}`,source:"sefaria"}));
    }
    return out;
  } catch { return []; }
}

// Sefaria curated refs (fallback)
async function sefariaRefs(refs=[], opts={}) {
  const out=[];
  for (const ref of refs) {
    try {
      const tr = await fetch(`https://www.sefaria.org/api/texts/${encodeURIComponent(ref)}?context=0&commentary=0`);
      if (!tr.ok) continue;
      const tx = await tr.json().catch(()=>({}));
      const en = Array.isArray(tx?.text) ? tx.text.join(" ") : tx?.text || "";
      const paras = splitParas(en, opts); const pick = paras[0] || norm(en).slice(0,700);
      if (!pick) continue;
      out.push({work:ref,author:"Sefaria",text:pick,pos:0,url:`https://www.sefaria.org/${encodeURIComponent(ref)}`,source:"sefaria"});
    } catch {}
  }
  return out;
}

// Qur’an search
async function quranSearch(query, take=6, opts={}) {
  try {
    const r = await fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(query)}/all/en`);
    if (!r.ok) return [];
    const js = await r.json().catch(()=>({}));
    const matches = js?.data?.matches || [];
    return sample(matches, take).map((m,i)=>({
      work: `Qur'an ${m.surah?.englishName || m.surah?.name || "Surah"} ${m.surah?.number}:${m.numberInSurah}`,
      author: "Qur'an",
      text: norm(m.text||"").slice(0, clamp(opts.maxChars||MAX, 140, 1200)),
      pos: i,
      url: `https://quran.com/${m.surah?.number || ""}/${m.numberInSurah || ""}`,
      source:"quran",
    }));
  } catch { return []; }
}

// Qur’an curated (fallback: Al-Ikhlāṣ etc.)
async function quranFallback() {
  try {
    const r = await fetch(`https://api.alquran.cloud/v1/surah/112/en.sahih`);
    if (!r.ok) return [];
    const js = await r.json().catch(()=>({}));
    const ayat = js?.data?.ayahs || [];
    return ayat.slice(0,4).map((a,i)=>({
      work:`Qur'an ${js?.data?.englishName || "Al-Ikhlas"} 112:${a.numberInSurah}`,
      author:"Qur'an",
      text:norm(a.text||""),
      pos:i,
      url:`https://quran.com/112/${a.numberInSurah}`,
      source:"quran",
    }));
  } catch { return []; }
}

// Gutenberg by title
async function gutenbergTitle(title, take=6, opts={}) {
  try {
    const r = await fetch(`https://gutendex.com/books/?search=${encodeURIComponent(title)}`);
    if (!r.ok) return [];
    const js = await r.json().catch(()=>({}));
    const book=(js?.results||[])[0]; if (!book) return [];
    const url = pickPlainText(book.formats||{}); if (!url) return [];
    const tr = await fetch(url); if (!tr.ok) return [];
    const raw = await tr.text();
    const paras = splitParas(raw, opts);
    return sample(paras,take).map((p,i)=>({work:book.title||title,author:(book.authors?.[0]?.name)||null,text:p,pos:i,url,source:"gutenberg"}));
  } catch { return []; }
}

/* --------------- handler --------------- */

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const {
      query = "",
      path = "Universal",
      max = 6,
      lang = "en",
      strict = true,
      minChars = MIN,
      maxChars = MAX,
    } = req.body || {};

    const limit = clamp(Number(max)||6,1,12);
    const opts  = { minChars, maxChars };

    // Build tasks
    const tasks = [];
    const generic = isGeneric(query);

    if (path === "Jewish") {
      if (ok(query) && !generic) tasks.push(sefariaSearch(query, 6, opts));
      // curate classic “Who is God?” refs
      tasks.push(sefariaRefs(["Genesis 1:1","Exodus 3:14","Psalms 23:1"], opts));
    } else if (path === "Muslim") {
      if (ok(query) && !generic) tasks.push(quranSearch(query.replace(/\bgod\b/gi,"Allah"), 6, opts));
      tasks.push(quranFallback()); // Al-Ikhlāṣ
    } else if (path === "Christian") {
      tasks.push(gutenbergTitle("King James Bible", 6, opts));
      tasks.push(gutenbergTitle("The Imitation of Christ", 2, opts));
      tasks.push(gutenbergTitle("Confessions of Saint Augustine", 2, opts));
    } else if (path === "Eastern") {
      tasks.push(gutenbergTitle("Tao Te Ching", 4, opts));
      tasks.push(gutenbergTitle("Bhagavad Gita", 4, opts));
      tasks.push(gutenbergTitle("Dhammapada", 4, opts));
    } else { // Universal — blend, plus curated fallbacks
      if (ok(query) && !generic) {
        tasks.push(sefariaSearch(query, 2, opts));
        tasks.push(quranSearch(query.replace(/\bgod\b/gi,"Allah"), 2, opts));
      }
      tasks.push(sefariaRefs(["Genesis 1:1","Exodus 3:14"], opts));
      tasks.push(quranFallback());
      tasks.push(gutenbergTitle("King James Bible", 2, opts));
      tasks.push(gutenbergTitle("Tao Te Ching", 2, opts));
      tasks.push(gutenbergTitle("Bhagavad Gita", 2, opts));
      tasks.push(gutenbergTitle("Dhammapada", 2, opts));
    }

    // Run + collect
    const settled = await Promise.allSettled(tasks);
    let results = [];
    for (const s of settled) if (s.status==="fulfilled" && Array.isArray(s.value)) results = results.concat(s.value);

    // Filter + dedupe + cap
    results = dedupe(results)
      .filter((q)=> allow(q, !!strict) && ok(q.text||q.quote))
      .map((q)=>({ work:q.work, author:q.author||null, text:norm(q.text||q.quote).slice(0, maxChars), url:q.url||null, pos:q.pos ?? 0 }));

    // Mild shuffle for variety
    for (let i = results.length - 1; i > 0; i--) {
      const j = (i + (Date.now()>>6)) % (i+1);
      [results[i], results[j]] = [results[j], results[i]];
    }

    res.status(200).json({ quotes: results.slice(0, limit) });
  } catch (e) {
    res.status(200).json({ quotes: [] });
  }
}
