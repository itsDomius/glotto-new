// ════════════════════════════════════════════════════════════════════════════
// FILE: src/app/api/chat/route.ts  — REPLACE ENTIRELY
// KEY FIX: receives targetLanguage and injects it into every mission prompt
// ════════════════════════════════════════════════════════════════════════════
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { buildLexSystemPrompt } from '@/lib/lex-prompts'
import { getDailyMission } from '@/lib/curriculum'
import { getCurrentMission } from '@/lib/data/missions'
import { NextResponse } from 'next/server'

const MODEL_MAP: Record<string, string> = {
  tutor: 'gpt-4o',
  mission: 'gpt-4o-mini',
  panic: 'gpt-4o-mini',
  rehearsal: 'gpt-4o',
}

const MISSION_EVAL_TOOL: OpenAI.Chat.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'evaluate_mission',
    description: 'Silently evaluate whether the user has passed the mission.',
    parameters: {
      type: 'object',
      properties: {
        confidence_score: { type: 'number', description: 'Score 0-100.' },
        mission_passed: { type: 'boolean' },
        feedback: { type: 'string', description: 'One short sentence of feedback.' },
      },
      required: ['confidence_score', 'mission_passed', 'feedback'],
    },
  },
}

// ── Inject real language into mission system prompts ─────────────────────────
function injectLanguage(systemPrompt: string, language: string): string {
  const lang = language.charAt(0).toUpperCase() + language.slice(1)
  // Replace all generic "target language" / "local language" references
  return (
    systemPrompt
      .replace(/the target language/gi, lang)
      .replace(/your target language/gi, lang)
      .replace(/the local language/gi, lang)
      .replace(/only in the local language/gi, `only in ${lang}`)
      .replace(/only in the target language/gi, `only in ${lang}`)
      .replace(/Speak only in the/gi, `Speak only in ${lang}. The`)
      // Prepend a hard instruction at the very top
      + `\n\nCRITICAL LANGUAGE INSTRUCTION: You MUST speak and respond ONLY in ${lang} throughout this entire simulation. Do NOT use English under any circumstances, even if the user writes in English. If the user writes in English, respond in ${lang} and gently redirect them to use ${lang}.`
  )
}

export async function POST(req: Request) {
  try {
    const {
      messages,
      userId,
      mode = 'tutor',
      missionDay,
      targetLanguage = 'greek',  // ← received from MissionChat
      rehearsalScenario,
    } = await req.json()

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Use target_language from profile as fallback if not passed explicitly
    const resolvedLanguage = targetLanguage || profile?.target_language || 'greek'

    const model = MODEL_MAP[mode] || 'gpt-4o'
    const encoder = new TextEncoder()

    // ══════════════════════════════════════════════════════════════════════
    // REHEARSAL MODE
    // ══════════════════════════════════════════════════════════════════════
    if (mode === 'rehearsal') {
      if (!rehearsalScenario) return NextResponse.json({ error: 'No scenario provided' }, { status: 400 })
      const isFirstMessage = messages.length === 0
      const rehearsalMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: `${rehearsalScenario.systemPrompt}\n\nIMPORTANT: Stay completely in character. Only add REHEARSAL_PASSED when ALL success criteria are fully met: ${rehearsalScenario.successCriteria}. Append REHEARSAL_PASSED at the very end of your message on a new line.`,
        },
        ...(isFirstMessage
          ? [{ role: 'user' as const, content: '[The user walks in / calls. Start the scenario.]' }]
          : (messages as OpenAI.Chat.ChatCompletionMessageParam[])),
      ]
      const stream = await openai.chat.completions.create({ model, messages: rehearsalMessages, stream: true, max_tokens: 400, temperature: 0.85 })
      const readable = new ReadableStream({ async start(controller) { for await (const chunk of stream) { const text = chunk.choices[0]?.delta?.content || ''; if (text) controller.enqueue(encoder.encode(text)) } controller.close() } })
      return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
    }

    // ══════════════════════════════════════════════════════════════════════
    // PANIC MODE
    // ══════════════════════════════════════════════════════════════════════
    if (mode === 'panic') {
      const location = 'unknown location'
      const targetLang = resolvedLanguage
      const panicPrompt = `You are an emergency phrase generator for expats in crisis. The user is at: ${location}. Target language: ${targetLang}.\nOutput ONLY the 5 most critical phrases needed RIGHT NOW.\nFormat each line exactly as:\nPHRASE IN ${targetLang.toUpperCase()} [foh-NET-ik pronunciation] — English meaning\nNo intro. No explanations. Pure survival output.`
      const panicStream = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: panicPrompt }], stream: true, max_tokens: 300, temperature: 0.2 })
      const readable = new ReadableStream({ async start(controller) { for await (const chunk of panicStream) { const text = chunk.choices[0]?.delta?.content || ''; if (text) controller.enqueue(encoder.encode(text)) } controller.close() } })
      return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
    }

    // ══════════════════════════════════════════════════════════════════════
    // MISSION MODE — with language injection
    // ══════════════════════════════════════════════════════════════════════
    if (mode === 'mission') {
      const day = missionDay || Math.max(1, (profile?.mission_day || 1))
      const mission = getCurrentMission(day)

      // ← CRITICAL: inject the real language into the system prompt
      const systemPromptWithLanguage = injectLanguage(mission.system_prompt, resolvedLanguage)

      const userMessageCount = messages.filter((m: { role: string }) => m.role === 'user').length
      const shouldEvaluate = userMessageCount >= 4

      if (shouldEvaluate) {
        const evalMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
          {
            role: 'system',
            content: `${systemPromptWithLanguage}\nSUCCESS CRITERIA: ${mission.success_criteria}\nYou are also equipped with the evaluate_mission tool. Once there are 4+ user messages, silently decide whether the user has passed. Call evaluate_mission with your honest assessment.`,
          },
          ...messages,
        ]

        const evalResponse = await openai.chat.completions.create({
          model, messages: evalMessages, tools: [MISSION_EVAL_TOOL], tool_choice: 'auto', max_tokens: 500, temperature: 0.7,
        })

        const choice = evalResponse.choices[0]

        if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls?.length) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const toolCall = choice.message.tool_calls[0] as any
          let evalResult = { confidence_score: 0, mission_passed: false, feedback: '' }
          try { evalResult = JSON.parse(toolCall.function.arguments) } catch { /* parse failed */ }

          if (evalResult.mission_passed) {
            try {
              await supabase.from('sessions').insert({
                user_id: userId, messages, duration_seconds: 0,
                language: resolvedLanguage, level: profile?.current_level || 'A1',
                xp_earned: 50,
                confidence_scores: { mission_score: evalResult.confidence_score, mission_day: day, feedback: evalResult.feedback },
                summary: `Mission ${day}: ${mission.title} — passed with ${evalResult.confidence_score}/100`,
              })
              await supabase.from('profiles').update({ mission_day: day + 1 }).eq('user_id', userId)

              // HR webhook fire
              try {
                const { data: profileData } = await supabase.from('profiles').select('full_name, company_id').eq('user_id', userId).single()
                if (profileData?.company_id) {
                  const { data: company } = await supabase.from('companies').select('webhook_url').eq('id', profileData.company_id).single()
                  if (company?.webhook_url) {
                    const integrationPct = Math.round((day / 7) * 100)
                    await fetch(company.webhook_url, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ text: `✅ *${profileData.full_name}* just completed *Mission ${day}: ${mission.title}*. They are now *${integrationPct}% integrated*.` }),
                    }).catch(() => {})
                  }
                }
              } catch { /* webhook is non-critical */ }
            } catch { /* DB write failed */ }
          }

          const followUpMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
            ...evalMessages, choice.message,
            { role: 'tool', tool_call_id: toolCall.id, content: JSON.stringify(evalResult) },
          ]
          const replyStream = await openai.chat.completions.create({ model, messages: followUpMessages, stream: true, max_tokens: 250, temperature: 0.7 })
          const readable = new ReadableStream({
            async start(controller) {
              if (evalResult.mission_passed) {
                controller.enqueue(encoder.encode(`MISSION_PASSED:${JSON.stringify({ score: evalResult.confidence_score, processScore: Math.round(evalResult.confidence_score * 0.6), languageScore: Math.round(evalResult.confidence_score * 0.4), feedback: evalResult.feedback, day, affiliateReward: mission.affiliate_reward || null })}\n`))
              }
              for await (const chunk of replyStream) { const text = chunk.choices[0]?.delta?.content || ''; if (text) controller.enqueue(encoder.encode(text)) }
              controller.close()
            },
          })
          return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
        }

        const replyText = choice.message.content || ''
        const readable = new ReadableStream({ start(controller) { controller.enqueue(encoder.encode(replyText)); controller.close() } })
        return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
      }

      // Under 4 messages — stream normally with language-injected prompt
      const stream = await openai.chat.completions.create({
        model,
        messages: [{ role: 'system', content: systemPromptWithLanguage }, ...messages],
        stream: true, max_tokens: 250, temperature: 0.7,
      })
      const readable = new ReadableStream({ async start(controller) { for await (const chunk of stream) { const text = chunk.choices[0]?.delta?.content || ''; if (text) controller.enqueue(encoder.encode(text)) } controller.close() } })
      return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
    }

    // ══════════════════════════════════════════════════════════════════════
    // TUTOR MODE
    // ══════════════════════════════════════════════════════════════════════
    let sessionCount = 0
    try { const { count } = await supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('user_id', userId); sessionCount = count || 0 } catch { sessionCount = 0 }

    let memoryContext = ''
    try {
      const { data: recentSessions } = await supabase.from('sessions').select('confidence_scores, summary, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(3)
      if (recentSessions?.length) {
        const struggles: string[] = []
        const summaries: string[] = []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recentSessions.forEach((s: any) => { if (s.confidence_scores?.struggles) struggles.push(...s.confidence_scores.struggles); if (s.summary) summaries.push(s.summary) })
        if (struggles.length) memoryContext += `\nRecent struggles: ${[...new Set(struggles)].slice(0, 5).join(', ')}.`
        if (summaries.length) memoryContext += `\nLast session: ${summaries[0]}`
      }
    } catch { /* memory is enhancement only */ }

    const mission = getDailyMission((profile?.current_level || 'A1') as Parameters<typeof getDailyMission>[0], (profile?.dream_goal || 'travel') as Parameters<typeof getDailyMission>[1])
    const systemPrompt = buildLexSystemPrompt({
      userName: profile?.full_name?.split(' ')[0] || 'there',
      targetLanguage: resolvedLanguage,
      currentLevel: profile?.current_level || 'A1',
      nativeLanguage: profile?.native_language || 'English',
      dreamGoal: profile?.dream_goal || 'travel',
      sessionNumber: sessionCount,
      safeMode: sessionCount < 10,
      dailyMission: mission,
    }) + memoryContext

    const userMessageCount = messages.filter((m: { role: string }) => m.role === 'user').length
    const shouldScore = mode === 'tutor' && userMessageCount >= 4
    const scoringInstruction = shouldScore ? `\n\nAfter your response, on a new line add exactly this JSON (no markdown):\nSCORE:{"fluency":0-10,"accuracy":0-10,"vocabulary":0-10,"struggles":["..."],"summary":"one sentence"}` : ''

    const stream = await openai.chat.completions.create({
      model,
      messages: [{ role: 'system', content: systemPrompt + scoringInstruction }, ...messages],
      stream: true, max_tokens: 400, temperature: 0.8,
    })

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
            await supabase.from('sessions').update({ confidence_scores: scores, summary: scores.summary }).eq('user_id', userId).order('created_at', { ascending: false }).limit(1)
          } catch { /* scoring is enhancement only */ }
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