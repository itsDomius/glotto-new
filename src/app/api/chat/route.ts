import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { buildLexSystemPrompt } from '@/lib/lex-prompts'
import { getDailyMission } from '@/lib/curriculum'
import { NextResponse } from 'next/server'

// ─── Model Router ────────────────────────────────────────────────────────────
// tutor   → GPT-4o       (deep pedagogy, Safe Mode, full context)
// mission → GPT-4o-mini  (fast, cheap, roleplay & quick exchanges)
// panic   → GPT-4o-mini  (low latency, location-aware responses)
const MODEL_MAP: Record<string, string> = {
  tutor: 'gpt-4o',
  mission: 'gpt-4o-mini',
  panic: 'gpt-4o-mini',
}

export async function POST(req: Request) {
  try {
    const { messages, userId, mode = 'tutor' } = await req.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ─── User Profile ─────────────────────────────────────────────────────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    // ─── Session Count ────────────────────────────────────────────────────────
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

    // ─── Memory: Recent struggles + last session summary ─────────────────────
    let memoryContext = ''
    try {
      const { data: recentSessions } = await supabase
        .from('sessions')
        .select('confidence_scores, summary, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3)

      if (recentSessions && recentSessions.length > 0) {
        const struggles: string[] = []
        const summaries: string[] = []

        recentSessions.forEach((s: any) => {
          if (s.confidence_scores?.struggles) {
            struggles.push(...s.confidence_scores.struggles)
          }
          if (s.summary) summaries.push(s.summary)
        })

        if (struggles.length > 0) {
          memoryContext += `\nRecent struggles to address: ${[...new Set(struggles)].slice(0, 5).join(', ')}.`
        }
        if (summaries.length > 0) {
          memoryContext += `\nLast session: ${summaries[0]}`
        }
      }
    } catch {
      // Memory is enhancement only — never block the conversation
    }

    // ─── Mission ──────────────────────────────────────────────────────────────
    const mission = getDailyMission(
      (profile?.current_level || 'A1') as any,
      (profile?.dream_goal || 'travel') as any
    )

    // ─── System Prompt ────────────────────────────────────────────────────────
    const systemPrompt = buildLexSystemPrompt({
      userName: profile?.full_name?.split(' ')[0] || 'there',
      targetLanguage: profile?.target_language || 'Spanish',
      currentLevel: profile?.current_level || 'A1',
      nativeLanguage: profile?.native_language || 'English',
      dreamGoal: profile?.dream_goal || 'travel',
      sessionNumber: sessionCount,
      safeMode: sessionCount < 10,
      dailyMission: mission,
    }) + memoryContext

    // ─── Model Selection ──────────────────────────────────────────────────────
    const model = MODEL_MAP[mode] || 'gpt-4o'

    // ─── Confidence Scoring (silent, appended to last message) ───────────────
    // Only score on tutor mode after 4+ user messages (enough data)
    const userMessageCount = messages.filter((m: any) => m.role === 'user').length
    const shouldScore = mode === 'tutor' && userMessageCount >= 4

    const scoringInstruction = shouldScore
      ? `\n\nAfter your response, on a new line add exactly this JSON (no markdown, no explanation):
SCORE:{"fluency":0-10,"accuracy":0-10,"vocabulary":0-10,"struggles":["..."],"summary":"one sentence"}`
      : ''

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const stream = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt + scoringInstruction },
        ...messages,
      ],
      stream: true,
      max_tokens: mode === 'tutor' ? 400 : 200,
      temperature: mode === 'panic' ? 0.6 : 0.8,
    })

    // ─── Stream + silently extract score ─────────────────────────────────────
    const encoder = new TextEncoder()
    let fullResponse = ''

    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || ''
          fullResponse += text

          // Strip the SCORE: line from what the user sees
          const visibleText = text.includes('SCORE:') ? '' : text
          if (visibleText) controller.enqueue(encoder.encode(visibleText))
        }

        // Save confidence score silently after stream ends
        if (shouldScore && fullResponse.includes('SCORE:')) {
          try {
            const scoreLine = fullResponse.split('SCORE:')[1]?.split('\n')[0]
            const scores = JSON.parse(scoreLine)

            await supabase
              .from('sessions')
              .update({ confidence_scores: scores, summary: scores.summary })
              .eq('user_id', userId)
              .order('created_at', { ascending: false })
              .limit(1)
          } catch {
            // Scoring is enhancement only — never crash
          }
        }

        controller.close()
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}