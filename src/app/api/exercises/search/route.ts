import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// 1. The Sticky Note: Tell Next.js to skip this during the build
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // 2. Bring the keys inside the function
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  // 3. Safety check so it doesn't crash the whole app if a key is missing
  if (!supabaseUrl || !supabaseKey || !openAiKey) {
    console.error("Missing environment variables in search route. Check .env.local!");
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  // 4. Turn on the machines ONLY when a user actually searches for something
  const openai = new OpenAI({ apiKey: openAiKey });
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { query, language, level, limit = 3 } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Missing query' }, { status: 400 });
    }

    // Embed the query
    const embeddingRes = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });

    const embedding = embeddingRes.data[0].embedding;

    // Search by cosine similarity
    const { data, error } = await supabase.rpc('search_exercises', {
      query_embedding: embedding,
      filter_language: language || null,
      filter_level: level || null,
      match_count: limit,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ exercises: data });
    
  } catch (err) {
    console.error("Search API Error:", err);
    return NextResponse.json({ error: 'Something went wrong during search' }, { status: 500 });
  }
}