import { NextResponse } from 'next/server';
import { openai, supabase } from '../../../lib/ai';

// This route is called ONCE to load your ID knowledge base into Supabase
// After that, it sits in the database and gets searched automatically

export async function POST(request) {
  try {
    const { chunks, adminKey } = await request.json();

    // Simple admin protection — only you can call this route
    if (adminKey !== process.env.ADMIN_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!chunks || !Array.isArray(chunks)) {
      return NextResponse.json({ error: 'chunks array is required' }, { status: 400 });
    }

    const results = [];

    for (const chunk of chunks) {
      // Convert each chunk of text into a vector
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: chunk.content,
      });

      const embedding = embeddingResponse.data[0].embedding;

      // Store the text + its vector in Supabase
      const { data, error } = await supabase
        .from('id_knowledge')
        .insert({
          content: chunk.content,
          source: chunk.source || 'unknown',
          embedding,
        })
        .select('id');

      if (error) {
        console.error('Insert error:', error);
        results.push({ source: chunk.source, status: 'error', error: error.message });
      } else {
        results.push({ source: chunk.source, status: 'success', id: data[0].id });
      }
    }

    return NextResponse.json({
      message: `Embedded ${results.filter(r => r.status === 'success').length} of ${chunks.length} chunks`,
      results
    });

  } catch (error) {
    console.error('embed-knowledge error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
