// FILE: /pages/api/ground-sources.js
// Dedicated quotes endpoint — exact book/author matching + wide libraries (Fix #4 & #5)
export const dynamic = "force-dynamic";
export const maxDuration = 28;

const ok = (s) => !!(s && String(s).trim());
const trim = (s, n=800) => String(s||"").trim().slice(0,n);
const uniq = (arr, key=(x)=>JSON.stringify(x)) => { const seen=new Set(); const out=[]; for (const x of arr){ const k=key(x); if(seen.has(k)) continue; seen.add(k); out.push(x);} return out; };

function parseIntent(q) {
  const s = String(q||"");
  const m = s.match(/\b(?:quote|quotes?)\s+(?:from|of)\s+["“”']?([^"”']+)["“”']?/i);
  const exact = m ? m[1].trim() : null;
  const hints = [];
  if (/rambam|maimonides|mishneh\s*torah/i.test(s)) hints.push("Maimonides");
  if (/pirkei\s+avot|ethics\s+of\s+the\s+fathers/i.test(s)) hints.push("Pirkei Avot");
  if (/psalms|tehillim/i.test(s)) hints.push("Psalms");
  if (/\b(qur'?an|koran)\b/i.test(s)) hints.push("Quran");
  if (/\bbible\b/i.test(s)) hints.push("Bible");
  if (/tao\s*te\s*ching/i.test(s)) hints.push("Tao Te Ching");
  if (/bhagavad\s*gita/i.test(s)) hints.push("Bhagavad Gita");
  if (/dhammapada/i.test(s)) hints.push("Dhammapada");
  return { exact, hints };
}

function pickPlainText(formats){ const k = Object.keys(formats||{}); const t = k.find(x=>x.startsWith("text/plain")) || k.find(x=>x.startsWith("text/html")); return t ? formats[t] : null; }

/* Jewish */
async function fetchSefaria(query, max=6) {
  try {
    const sr = await fetch(`https://www.sefaria.org/api/search-wrap?q=${encodeURIComponent(query)}&size=${max}&type=Text`);
    if (!sr.ok) return [];
    const data = await sr.json().catch(()=>({}));
    const hits = (data?.hits || []).slice(0, max);
    const out = [];
    for (const h of hits) {
      const ref = h?._source?.ref || h?.ref; if (!ref) continue;
      const tr = await fetch(`https://www.sefaria.org/api/texts/${encodeURIComponent(ref)}?context=0&commentary=0`);
      if (!tr.ok) continue;
      const tx = await tr.json().catch(()=>({}));
      const en = Array.isArray(tx?.text) ? tx.text.join(" ") : (tx?.text || "");
      if (!ok(en)) continue;
      out.push({ work: ref, author: "Sefaria", text: trim(en, 700), url: `https://www.sefaria.org/${encodeURIComponent(ref)}` });
    }
    return out;
  } catch { return []; }
}

/* Muslim */
async function fetchQuran(query, max=6) {
  try {
    const r = await fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(query)}/all/en`);
    if (!r.ok) return [];
    const js = await r.json().catch(()=>({}));
    const matches = js?.data?.matches || [];
    return matches.slice(0, max).map(m => ({
      work: `Qur'an ${m.surah?.englishName || m.surah?.name || "Surah"} ${m.surah?.number}:${m.numberInSurah}`,
      author: "Qur'an",
      text: trim(m.text, 700),
      url: `https://quran.com/${m.surah?.number || ""}/${m.numberInSurah || ""}`,
    }));
  } catch { return []; }
}

/* Christian + Eastern via Gutenberg */
async function fetchGutenbergTitle(title, max=4){
  try {
    const r = await fetch(`https://gutendex.com/books/?search=${encodeURIComponent(title)}`);
    if (!r.ok) return [];
    const js = await r.json().catch(()=>({}));
    const book = (js?.results || [])[0]; if (!book) return [];
    const url = pickPlainText(book.formats || {}); if (!url) return [];
    const tr = await fetch(url); if (!tr.ok) return [];
    const raw = await tr.text();
    const paras = String(raw||"").split(/\n{2,}/).map(s=>s.trim()).filter(Boolean).slice(0, max);
    return paras.map((p)=>({ work: book.title || title, author: (book.authors?.[0]?.name)||null, text: trim(p,700), url }));
  } catch { return []; }
}

/* General libraries */
async function fetchWikiquote(q, max=3){
  try {
    const endpoint = `https://en.wikiquote.org/w/api.php?action=query&origin=*&format=json&list=search&srsearch=${encodeURIComponent(q)}&srlimit=${max}`;
    const r = await fetch(endpoint); if (!r.ok) return [];
    const data = await r.json().catch(()=>({}));
    const pages = data?.query?.search || [];
    const out=[];
    for (const p of pages.slice(0,max)) {
      const infoR = await fetch(`https://en.wikiquote.org/w/api.php?action=query&origin=*&format=json&prop=extracts&exintro&explaintext&pageids=${p.pageid}`);
      if (!infoR.ok) continue;
      const info = await infoR.json().catch(()=>({}));
      const page = Object.values(info?.query?.pages||{})[0];
      const text = trim(page?.extract, 700); if (!ok(text)) continue;
      out.push({ work: p.title, author: null, text, url: `https://en.wikiquote.org/?curid=${p.pageid}` });
    }
    return out;
  } catch { return []; }
}
async function fetchGutenbergSearch(q, max=3){
  try {
    const r = await fetch(`https://gutendex.com/books/?search=${encodeURIComponent(q)}`);
    if (!r.ok) return [];
    const js = await r.json().catch(()=>({}));
    const books = (js?.results || []).slice(0, Math.max(1, Math.min(3,max)));
    const out=[];
    for (const b of books) {
      const url = pickPlainText(b.formats || {}); if (!url) continue;
      const tr = await fetch(url); if (!tr.ok) continue;
      const raw = await tr.text();
      const para = String(raw||"").split(/\n{2,}/).map(s=>s.trim()).filter(Boolean)[0] || "";
      if (!ok(para)) continue;
      out.push({ work: b.title || "Project Gutenberg", author: (b.authors?.[0]?.name)||null, text: trim(para, 700), url });
    }
    return out;
  } catch { return []; }
}
async function fetchInternetArchive(q, max=3){
  try {
    const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)} AND mediatype:texts&fl[]=identifier,title,creator,description&rows=${max}&output=json`;
    const r = await fetch(url); if (!r.ok) return [];
    const data = await r.json().catch(()=>({}));
    return (data?.response?.docs || []).map(d => ({
      work: d.title || "Internet Archive",
      author: Array.isArray(d.creator) ? d.creator[0] : (d.creator || null),
      text: trim(d.description, 700),
      url: d.identifier ? `https://archive.org/details/${d.identifier}` : null,
    }));
  } catch { return []; }
}
async function fetchOpenLibrary(q, max=3){
  try {
    const r = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=${max}`);
    if (!r.ok) return [];
    const js = await r.json().catch(()=>({}));
    const docs = Array.isArray(js?.docs) ? js.docs.slice(0, max) : [];
    return docs.map(d => ({
      work: d.title || "Open Library",
      author: Array.isArray(d.author_name) ? d.author_name[0] : (d.author_name || null),
      text: trim(d.first_sentence?.value || d.first_sentence || ""),
      url: (d.key ? `https://openlibrary.org${d.key}` : null),
    }));
  } catch { return []; }
}

/* handler */
export default async function handler(req, res){
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { query, path = "Universal", max = 6 } = req.body || {};
    if (!ok(query)) return res.status(200).json({ quotes: [] });

    const { exact, hints } = parseIntent(query);
    const qList = [];
    if (exact) qList.push(exact);
    if (hints.length) qList.push(...hints);
    qList.push(query);

    const tasks = [];
    if (path === "Jewish" || /rambam|pirkei|psalms|talmud|mishna|tehillim/i.test(query)) for (const q of qList.slice(0,2)) tasks.push(fetchSefaria(q, 6));
    if (path === "Muslim" || /\b(qur'?an|koran)\b/i.test(query)) for (const q of qList.slice(0,2)) tasks.push(fetchQuran(q, 6));
    if (path === "Christian" || /\bbible\b/i.test(query)) tasks.push(fetchGutenbergTitle("King James Bible", 6));
    if (path === "Eastern" || /tao\s*te\s*ching|bhagavad\s*gita|dhammapada/i.test(query)) {
      tasks.push(fetchGutenbergTitle("Tao Te Ching", 4));
      tasks.push(fetchGutenbergTitle("Bhagavad Gita", 4));
      tasks.push(fetchGutenbergTitle("Dhammapada", 4));
    }
    for (const q of qList.slice(0,2)) tasks.push(fetchWikiquote(q, 3), fetchGutenbergSearch(q, 3), fetchInternetArchive(q, 3), fetchOpenLibrary(q, 3));

    const results = await Promise.allSettled(tasks);
    let merged = [];
    for (const r of results) if (r.status === "fulfilled" && Array.isArray(r.value)) merged = merged.concat(r.value);

    // Strict if "quote from X" (Fix #4)
    if (exact) {
      const ex = exact.toLowerCase();
      const strict = merged.filter(s =>
        (s.work && String(s.work).toLowerCase().includes(ex)) ||
        (s.author && String(s.author).toLowerCase().includes(ex))
      );
      if (strict.length) merged = strict;
    }

    // Kill repetitive “meditation book” spam unless explicitly asked (Fix #4)
    const wantMeditation = /meditation/i.test(query) || (exact && /meditation/i.test(exact));
    if (!wantMeditation) merged = merged.filter(s => !/meditation\s+book|daily\s+meditations?/i.test(`${s.work} ${s.author} ${s.text}`));

    merged = uniq(merged, s => `${(s.work||"").toLowerCase()}|${(s.author||"").toLowerCase()}|${trim(s.text,120)}`).slice(0, Math.max(1, Number(max)||6));
    return res.status(200).json({ quotes: merged });
  } catch {
    return res.status(200).json({ quotes: [] });
  }
}
