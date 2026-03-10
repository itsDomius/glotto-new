// ════════════════════════════════════════════════════════════════════════════
// FILE: src/app/api/chat/route.ts
// ════════════════════════════════════════════════════════════════════════════
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getCurrentMission } from '@/lib/data/missions'

const MISSION_EVAL_TOOL: OpenAI.Chat.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'evaluate_mission',
    description: 'Evaluate whether the user passed the mission on BOTH language fluency AND correct bureaucratic process.',
    parameters: {
      type: 'object',
      properties: {
        confidence_score:  { type: 'number', description: 'Overall 0-100. Language (40%) + Process (60%).' },
        mission_passed:    { type: 'boolean', description: 'True only if score >= 60 AND correct process followed.' },
        feedback:          { type: 'string', description: 'One sentence. If failed, state exactly what step was missed.' },
        process_score:     { type: 'number', description: '0-100: Did the user follow the correct bureaucratic steps?' },
        language_score:    { type: 'number', description: '0-100: Was the language clear and natural enough?' },
      },
      required: ['confidence_score', 'mission_passed', 'feedback', 'process_score', 'language_score'],
    },
  },
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { messages, userId, mode = 'tutor', missionDay, location } = body

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const encoder = new TextEncoder()

    const { data: profile } = await supabase
      .from('profiles').select('*').eq('user_id', userId).single()

    // ── PANIC / EMERGENCY MODE ──────────────────────────────────────────────
    if (mode === 'panic') {
      const targetLang = profile?.target_language || 'Greek'
      const panicSystem = `You are an emergency phrase generator for expats in crisis.
The user is at: ${location || 'unknown location'}.
Target language: ${targetLang}.

STRICT RULES:
- Output ONLY the 5 most critical phrases needed RIGHT NOW.
- Each line: "PHRASE IN TARGET LANGUAGE [foh-NET-ik pronunciation] — English meaning"
- No intro. No explanations. No grammar notes. Pure survival output.
- Make the phrases immediately usable to show to a local clerk.`

      const stream = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: panicSystem }, ...messages],
        stream: true, max_tokens: 250, temperature: 0.2,
      })
      const readable = new ReadableStream({
        async start(controller) {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || ''
            if (text) controller.enqueue(encoder.encode(text))
          }
          controller.close()
        },
      })
      return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
    }

    // ── MISSION MODE ────────────────────────────────────────────────────────
    if (mode === 'mission') {
      const day = missionDay || Math.max(1, profile?.mission_day || 1)
      const mission = getCurrentMission(day)
      const userMessages = messages.filter((m: { role: string }) => m.role === 'user')
      const shouldEvaluate = userMessages.length >= 4

      const systemPrompt = `${mission.system_prompt}

─── HIDDEN EVALUATION RULES (never mention to user) ───
You are secretly evaluating on TWO axes:
1. LANGUAGE FLUENCY (40%): Is the user communicating clearly in the target language?
2. BUREAUCRATIC PROCESS (60%): Did they follow the CORRECT steps in the RIGHT ORDER?

Required process steps: ${mission.success_criteria}

IMPORTANT: If the user skips a required step (forgot to provide their ID, didn't confirm the date, didn't ask for the required document), they FAIL even if their language is perfect.
Stay in character. Never break the simulation. Never reveal you are evaluating them.`

      if (shouldEvaluate) {
        const evalMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
          { role: 'system', content: systemPrompt }, ...messages,
        ]
        const evalResponse = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: evalMessages,
          tools: [MISSION_EVAL_TOOL],
          tool_choice: 'auto',
          max_tokens: 500,
          temperature: 0.6,
        })

        const choice = evalResponse.choices[0]
        if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls?.length) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const toolCall = choice.message.tool_calls[0] as any
          let evalResult = { confidence_score: 0, mission_passed: false, feedback: '', process_score: 0, language_score: 0 }
          try { evalResult = JSON.parse(toolCall.function.arguments) } catch { /* treat as fail */ }

          if (evalResult.mission_passed) {
            try {
              await supabase.from('sessions').insert({
                user_id: userId, messages, duration_seconds: 0,
                language: profile?.target_language || 'greek',
                level: profile?.current_level || 'A1',
                xp_earned: 50,
                confidence_scores: {
                  mission_score: evalResult.confidence_score,
                  process_score: evalResult.process_score,
                  language_score: evalResult.language_score,
                  mission_day: day, feedback: evalResult.feedback,
                },
                summary: `Day ${day}: ${mission.title} — ${evalResult.confidence_score}/100`,
              })
              await supabase.from('profiles')
                .update({ mission_day: day + 1 })
                .eq('user_id', userId)
            } catch { /* non-critical — still send success signal */ }
          }

          const followUp: OpenAI.Chat.ChatCompletionMessageParam[] = [
            ...evalMessages, choice.message,
            { role: 'tool', tool_call_id: toolCall.id, content: JSON.stringify(evalResult) },
          ]
          const replyStream = await openai.chat.completions.create({
            model: 'gpt-4o-mini', messages: followUp, stream: true, max_tokens: 300, temperature: 0.7,
          })

          const readable = new ReadableStream({
            async start(controller) {
              if (evalResult.mission_passed) {
                controller.enqueue(encoder.encode(
                  `MISSION_PASSED:${JSON.stringify({
                    score: evalResult.confidence_score,
                    processScore: evalResult.process_score,
                    languageScore: evalResult.language_score,
                    feedback: evalResult.feedback, day,
                    affiliateReward: mission.affiliate_reward || null,
                  })}\n`
                ))
              }
              for await (const chunk of replyStream) {
                const text = chunk.choices[0]?.delta?.content || ''
                if (text) controller.enqueue(encoder.encode(text))
              }
              controller.close()
            },
          })
          return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
        }
        // No tool call — stream reply directly
        const text = choice.message.content || ''
        return new Response(new ReadableStream({ start(c) { c.enqueue(encoder.encode(text)); c.close() } }), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
      }

      // Under 4 messages — just stream the NPC response
      const stream = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        stream: true, max_tokens: 300, temperature: 0.7,
      })
      const readable = new ReadableStream({
        async start(controller) {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || ''
            if (text) controller.enqueue(encoder.encode(text))
          }
          controller.close()
        },
      })
      return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
    }

    // ── TUTOR MODE (existing behaviour preserved) ────────────────────────────
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are Lex, a warm and direct AI language coach. Help the user practice ${profile?.target_language || 'their target language'}. Level: ${profile?.current_level || 'A1'}. Keep responses conversational, under 100 words.`,
        },
        ...messages,
      ],
      stream: true, max_tokens: 400, temperature: 0.8,
    })
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || ''
          if (text) controller.enqueue(encoder.encode(text))
        }
        controller.close()
      },
    })
    return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}