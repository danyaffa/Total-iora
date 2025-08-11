// FILE: /lib/local-rag.js
// Client-side, zero-cost retrieval. No DB. No server.
// Dependencies: @xenova/transformers (add to package.json)

let encoder = null;
let works = [];         // [{ id, path, title, author, file, chunks: [{pos, text, emb}] }]
let modelLoading = null;

async function loadEncoder() {
  if (encoder) return encoder;
  if (modelLoading) return modelLoading;
  modelLoading = (async () => {
    const { pipeline } = await import('@xenova/transformers');
    // Lightweight sentence-transformer that runs in-browser (WASM/WebGPU if available)
    encoder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    return encoder;
  })();
  return modelLoading;
}

function splitIntoChunks(txt, maxChars = 1200) {
  const out = [];
  let buf = [];
  let n = 0;
  for (const p of txt.split(/\n{1,}/)) {
    const s = p.trim();
    if (!s) continue;
    if (n + s.length > maxChars && buf.length) {
      out.push(buf.join('\n'));
      buf = [s]; n = s.length;
    } else {
      buf.push(s); n += s.length;
    }
  }
  if (buf.length) out.push(buf.join('\n'));
  return out.map((t, i) => ({ pos: i, text: t }));
}

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-9);
}

async function embedText(encoder, textArray) {
  // encoder returns a tensor; we average pool across tokens
  const embs = [];
  for (const t of textArray) {
    const out = await encoder(t, { pooling: 'mean', normalize: true });
    embs.push(Array.from(out.data));
  }
  return embs;
}

async function loadWork(manifestItem) {
  // fetch the text file (served statically from /public/corpus/*.txt)
  const r = await fetch(manifestItem.file);
  if (!r.ok) throw new Error(`Failed to fetch ${manifestItem.file}`);
  const raw = await r.text();
  const chunks = splitIntoChunks(raw);
  const enc = await loadEncoder();
  const embs = await embedText(enc, chunks.map(c => c.text));
  chunks.forEach((c, i) => (c.emb = embs[i]));
  return { ...manifestItem, chunks };
}

export async function ensureLocalRag() {
  if (works.length) return;
  await loadEncoder();
  const r = await fetch('/corpus/manifest.json');
  if (!r.ok) throw new Error('Missing /public/corpus/manifest.json');
  const manifest = await r.json();
  // Load only on-demand per path later to reduce initial cost if you want.
  // For simplicity, load all now (still OK for a small set).
  works = [];
  for (const item of manifest) {
    try { works.push(await loadWork(item)); } catch (e) { console.warn('[local-rag] skip', item.file, e); }
  }
}

export async function searchLocal({ question, path = 'Universal', topK = 6 }) {
  await ensureLocalRag();
  const enc = await loadEncoder();
  const [qemb] = await embedText(enc, [question]);
  const pool = works.filter(w => !path || w.path === path);

  const scored = [];
  for (const w of pool) {
    for (const ch of w.chunks) {
      const score = cosine(qemb, ch.emb);
      scored.push({ score, work: w.title, author: w.author || null, pos: ch.pos, text: ch.text });
    }
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}
