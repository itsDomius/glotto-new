import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// This tells Next.js not to cache this page
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // 1. We check for our secret keys INSIDE the function
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  // If we are missing keys, we send a clean error instead of crashing the whole app
  if (!supabaseUrl || !supabaseKey || !openAiKey) {
    console.error("Missing environment variables. Check .env.local!");
    return NextResponse.json(
      { error: 'Server is missing secret keys. Check terminal.' }, 
      { status: 500 }
    );
  }

  // 2. Turn on the AI and Database machines ONLY when someone visits this route
  const openai = new OpenAI({ apiKey: openAiKey });
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 3. The rest of your logic stays the same
  try {
    const { language, level, type, title, content, source } = await req.json();

    if (!language || !level || !title || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate embedding from OpenAI
    const embeddingRes = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: `${title} ${content}`,
    });

    const embedding = embeddingRes.data[0].embedding;

    // Save to Supabase
    const { data, error } = await supabase.from('exercises').insert({
      language,
      level,
      type: type || 'general',
      title,
      content,
      source: source || null,
      embedding,
    }).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, exercise: data });

  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}