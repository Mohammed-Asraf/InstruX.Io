import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Create fresh instances using a getter so env vars are always current
export function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
}

// Keep these for backward compatibility
export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Takes any text and converts it to a vector (1536 numbers)
export async function embedText(text) {
  const response = await getOpenAI().embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

// Searches your knowledge base for the most relevant chunks
export async function retrieveKnowledge(query, matchCount = 5) {
  const queryEmbedding = await embedText(query);

  const { data, error } = await getSupabase().rpc('match_knowledge', {
    query_embedding: queryEmbedding,
    match_count: matchCount,
  });

  if (error) {
    console.error('Knowledge retrieval error:', error);
    return [];
  }

  // Return just the text chunks joined together
  return data.map(row => row.content).join('\n\n');
}
