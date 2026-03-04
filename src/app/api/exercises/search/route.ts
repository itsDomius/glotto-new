import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { query, language, level, limit = 3 } = await req.json()

  if (!query) return NextResponse.json({ error: 'Missing query' }, { status: 400 })

  // Embed the query
  const embeddingRes = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  })

  const embedding = embeddingRes.data[0].embedding

  // Search by cosine similarity
  const { data, error } = await supabase.rpc('search_exercises', {
    query_embedding: embedding,
    filter_language: language || null,
    filter_level: level || null,
    match_count: limit,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ exercises: data })
}