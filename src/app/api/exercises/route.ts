import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { language, level, type, title, content, source } = await req.json()

  if (!language || !level || !title || !content) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Generate embedding from OpenAI
  const embeddingRes = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: `${title} ${content}`,
  })

  const embedding = embeddingRes.data[0].embedding

  const { data, error } = await supabase.from('exercises').insert({
    language,
    level,
    type: type || 'general',
    title,
    content,
    source: source || null,
    embedding,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, exercise: data })
}