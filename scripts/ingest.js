// FILE: /scripts/ingest.js
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

function splitIntoChunks(text, maxChars = 1800) {
  const parts = [];
  let buf = [];
  let len = 0;
  for (const para of text.split(/\n{2,}/)) {
    const p = para.trim();
    if (!p) continue;
    if (len + p.length > maxChars && buf.length) {
      parts.push(buf.join("\n\n")); buf = [p]; len = p.length;
    } else { buf.push(p); len += p.length; }
  }
  if (buf.length) parts.push(buf.join("\n\n"));
  return parts;
}

async function embedBatch(chunks) {
  const { data } = await openai.embeddings.create({
    model: "text-embedding-3-large",
    input: chunks
  });
  return data.map(d => d.embedding);
}

async function ingestOne(filePath, pathLabel, workLabel, author, lang = "en", canonicalUrl="") {
  const raw = fs.readFileSync(filePath, "utf8");
  const chunks = splitIntoChunks(raw);
  // embed in batches
  const batchSize = 64;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const slice = chunks.slice(i, i + batchSize);
    const embs = await embedBatch(slice);
    const rows = slice.map((chunk, k) => ({
      path: pathLabel, work: workLabel, author, lang, url: canonicalUrl,
      pos: i + k, chunk, chunk_tsv: chunk, embedding: embs[k]
    }));
    const { error } = await supabase.from("wisdom_chunks").insert(rows);
    if (error) throw error;
    console.log(`Inserted ${i + slice.length}/${chunks.length} — ${workLabel}`);
  }
}

async function main() {
  // examples — add your own:
  await ingestOne("corpus/jewish/maimonides_guide_1904.txt", "Jewish", "Maimonides: Guide (1904)", "Maimonides");
  await ingestOne("corpus/muslim/quran_pickthall.txt", "Muslim", "Qur’an (Pickthall)", "—");
  await ingestOne("corpus/christian/kjv.txt", "Christian", "Bible (KJV)", "—");
  await ingestOne("corpus/eastern/tao_legge.txt", "Eastern", "Tao Te Ching (Legge)", "Laozi");
  await ingestOne("corpus/universal/meditations.txt", "Universal", "Meditations", "Marcus Aurelius");
}
main().catch((e) => { console.error(e); process.exit(1); });
