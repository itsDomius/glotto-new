import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { buildLexSystemPrompt } from '@/lib/lex-prompts'
import { getDailyMission } from '@/lib/curriculum'
import { NextResponse } from 'next/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  try {
    const { messages, userId } = await req.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    )

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Get session count safely
    let sessionCount = 0
    try {
      const { count } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
      sessionCount = count || 0
    } catch {
      sessionCount = 0
    }

    // Get daily mission from curriculum engine
    const mission = getDailyMission(
      (profile?.current_level || 'A1') as any,
      (profile?.dream_goal || 'travel') as any
    )

    const systemPrompt = buildLexSystemPrompt({
      userName: profile?.full_name?.split(' ')[0] || 'there',
      targetLanguage: profile?.target_language || 'Spanish',
      currentLevel: profile?.current_level || 'A1',
      nativeLanguage: profile?.native_language || 'English',
      dreamGoal: profile?.dream_goal || 'travel',
      sessionNumber: sessionCount,
      safeMode: sessionCount < 10,
      dailyMission: mission
    })

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      stream: true,
      max_tokens: 300,
      temperature: 0.8
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || ''
          if (text) controller.enqueue(encoder.encode(text))
        }
        controller.close()
      }
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}