import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { buildLexSystemPrompt } from '@/lib/lex-prompts'
import { getDailyMission } from '@/lib/curriculum'
import { getCurrentMission } from '@/lib/data/missions'
import { NextResponse } from 'next/server'

// ─── Model Router ─────────────────────────────────────────────────────────────
const MODEL_MAP: Record<string, string> = {
  tutor: 'gpt-4o',
  mission: 'gpt-4o-mini',
  panic: 'gpt-4o-mini',
}

// ─── Mission evaluation tool (function calling) ───────────────────────────────
const MISSION_EVAL_TOOL: OpenAI.Chat.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'evaluate_mission',
    description: 'Silently evaluate whether the user has passed the mission based on their performance in the conversation.',
    parameters: {
      type: 'object',
      properties: {
        confidence_score: {
          type: 'number',
          description: 'Score from 0 to 100 representing how well the user performed. 0 = completely failed, 100 = perfect.',
        },
        mission_passed: {
          type: 'boolean',
          description: 'True if the user has met the success criteria for this mission.',
        },
        feedback: {
          type: 'string',
          description: 'One short sentence of encouragement or constructive feedback for the user.',
        },
      },
      required: ['confidence_score', 'mission_passed', 'feedback'],
    },
  },
}

export async function POST(req: Request) {
  try {
    const { messages, userId, mode = 'tutor', missionDay } = await req.json()

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ─── User profile ─────────────────────────────────────────────────────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    const model = MODEL_MAP[mode] || 'gpt-4o'

    // ══════════════════════════════════════════════════════════════════════════
    // MISSION MODE
    // ══════════════════════════════════════════════════════════════════════════
    if (mode === 'mission') {
      const day = missionDay || Math.max(1, (profile?.mission_day || 1))
      const mission = getCurrentMission(day)

      const userMessageCount = messages.filter((m: any) => m.role === 'user').length
      const shouldEvaluate = userMessageCount >= 4

      // ── Step 1: Check if AI wants to call evaluate_mission ──────────────────
      if (shouldEvaluate) {
        const evalMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
          {
            role: 'system',
            content: `${mission.system_prompt}

SUCCESS CRITERIA: ${mission.success_criteria}

You are also equipped with the evaluate_mission tool. After every assistant message (once there are 4+ user messages), silently decide whether the user has passed based on the success criteria. Call evaluate_mission with your honest assessment. This call is invisible to the user.`,
          },
          ...messages,
        ]

        // Non-streaming eval call to check for tool use
        const evalResponse = await openai.chat.completions.create({
          model,
          messages: evalMessages,
          tools: [MISSION_EVAL_TOOL],
          tool_choice: 'auto',
          max_tokens: 500,
          temperature: 0.7,
        })

        const choice = evalResponse.choices[0]

        // ── Tool was called → mission evaluation ──────────────────────────────
        if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls) {
          const toolCall = choice.message.tool_calls[0]
          let evalResult = { confidence_score: 0, mission_passed: false, feedback: '' }

          try {
            evalResult = JSON.parse(toolCall.function.arguments)
          } catch {
            // parse failed — treat as not passed
          }

          // Save to Supabase if passed
          if (evalResult.mission_passed) {
            try {
              // Save session record
              await supabase.from('sessions').insert({
                user_id: userId,
                messages,
                duration_seconds: 0,
                language: profile?.target_language || 'spanish',
                level: profile?.current_level || 'A1',
                xp_earned: 50,
                confidence_scores: {
                  mission_score: evalResult.confidence_score,
                  mission_day: day,
                  feedback: evalResult.feedback,
                },
                summary: `Mission ${day}: ${mission.title} — passed with ${evalResult.confidence_score}/100`,
              })

              // Advance user's mission day
              await supabase
                .from('profiles')
                .update({ mission_day: day + 1 })
                .eq('user_id', userId)
            } catch {
              // DB write failed — still send confetti to user
            }
          }

          // Now get the actual chat reply from the AI (after the tool call)
          const followUpMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            ...evalMessages,
            choice.message,
            {
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(evalResult),
            },
          ]

          const replyStream = await openai.chat.completions.create({
            model,
            messages: followUpMessages,
            stream: true,
            max_tokens: 250,
            temperature: 0.7,
          })

          const encoder = new TextEncoder()
          let missionPassedSignalSent = false

          const readable = new ReadableStream({
            async start(controller) {
              // If mission passed, send a special signal FIRST
              // Frontend watches for this exact string to trigger confetti
              if (evalResult.mission_passed && !missionPassedSignalSent) {
                controller.enqueue(encoder.encode(`MISSION_PASSED:${JSON.stringify({
                  score: evalResult.confidence_score,
                  feedback: evalResult.feedback,
                  day,
                })}\n`))
                missionPassedSignalSent = true
              }

              for await (const chunk of replyStream) {
                const text = chunk.choices[0]?.delta?.content || ''
                if (text) controller.enqueue(encoder.encode(text))
              }
              controller.close()
            },
          })

          return new Response(readable, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          })
        }

        // ── No tool call → just stream the reply ──────────────────────────────
        // (AI decided not to evaluate yet — stream the existing response text)
        const replyText = choice.message.content || ''
        const encoder = new TextEncoder()
        const readable = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(replyText))
            controller.close()
          },
        })
        return new Response(readable, {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        })
      }

      // ── Under 4 messages → just stream normally with mission system prompt ──
      const stream = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: mission.system_prompt },
          ...messages,
        ],
        stream: true,
        max_tokens: 250,
        temperature: 0.7,
      })

      const encoder = new TextEncoder()
      const readable = new ReadableStream({
        async start(controller) {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || ''
            if (text) controller.enqueue(encoder.encode(text))
          }
          controller.close()
        },
      })

      return new Response(readable, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }

    // ══════════════════════════════════════════════════════════════════════════
    // TUTOR MODE (default) — unchanged from previous version
    // ══════════════════════════════════════════════════════════════════════════

    let sessionCount = 0
    try {
      const { count } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
      sessionCount = count || 0
    } catch { sessionCount = 0 }

    // Memory: last 3 sessions
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
          if (s.confidence_scores?.struggles) struggles.push(...s.confidence_scores.struggles)
          if (s.summary) summaries.push(s.summary)
        })
        if (struggles.length > 0) memoryContext += `\nRecent struggles: ${[...new Set(struggles)].slice(0, 5).join(', ')}.`
        if (summaries.length > 0) memoryContext += `\nLast session: ${summaries[0]}`
      }
    } catch { /* memory is enhancement only */ }

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
      dailyMission: mission,
    }) + memoryContext

    const userMessageCount = messages.filter((m: any) => m.role === 'user').length
    const shouldScore = mode === 'tutor' && userMessageCount >= 4

    const scoringInstruction = shouldScore
      ? `\n\nAfter your response, on a new line add exactly this JSON (no markdown):
SCORE:{"fluency":0-10,"accuracy":0-10,"vocabulary":0-10,"struggles":["..."],"summary":"one sentence"}`
      : ''

    const stream = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt + scoringInstruction },
        ...messages,
      ],
      stream: true,
      max_tokens: 400,
      temperature: 0.8,
    })

    const encoder = new TextEncoder()
    let fullResponse = ''

    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || ''
          fullResponse += text
          const visibleText = text.includes('SCORE:') ? '' : text
          if (visibleText) controller.enqueue(encoder.encode(visibleText))
        }

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
          } catch { /* scoring is enhancement only */ }
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