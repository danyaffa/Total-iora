// FILE: /lib/knowledge.js
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function retrievePassages({ question, path, lang }) {
  // embed question
  const { data: ed } = await openai.embeddings.create({
    model: "text-embedding-3-large",
    input: question
  });
  const qVec = ed[0].embedding;

  // semantic + lexical
  const { data: sem, error: e1 } = await supabase.rpc("match_wisdom", {
    query_embedding: qVec,
    match_count: 12,
    filter_path: path,
    filter_lang: lang || "en"
  });
  if (e1) throw e1;

  // optional: crude lexical fallback
  const { data: lex } = await supabase
    .from("wisdom_chunks")
    .select("work,author,chunk,url,pos")
    .textSearch("chunk_tsv", question)
    .eq("path", path)
    .limit(8);

  // merge & dedupe
  const merged = [...(sem || []), ...(lex || [])]
    .filter(Boolean)
    .slice(0, 12);

  return merged.map((r) => ({
    work: r.work, author: r.author, url: r.url, pos: r.pos, text: r.chunk
  }));
}
