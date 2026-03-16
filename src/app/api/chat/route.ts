// ════════════════════════════════════════════════════════════════════════════
// FILE: src/app/api/chat/route.ts — FULL REPLACEMENT
// KEY CHANGES:
//   1. `initiate: true` → AI speaks first, returns JSON {reply, suggestions[3]}
//   2. Normal messages → returns JSON {reply, suggestions[3], passed?, passedData?}
//   3. Language injection preserved
// ════════════════════════════════════════════════════════════════════════════
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { buildLexSystemPrompt } from '@/lib/lex-prompts'
import { getDailyMission } from '@/lib/curriculum'
import { getCurrentMission } from '@/lib/data/missions'
import { NextResponse } from 'next/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const MODEL_MAP: Record<string, string> = {
  tutor: 'gpt-4o', mission: 'gpt-4o', panic: 'gpt-4o-mini', rehearsal: 'gpt-4o',
}

// ── Language injection into system prompts ───────────────────────────────────
function injectLanguage(prompt: string, language: string): string {
  const lang = language.charAt(0).toUpperCase() + language.slice(1)
  return prompt
    .replace(/the target language/gi, lang)
    .replace(/your target language/gi, lang)
    .replace(/the local language/gi, lang)
    .replace(/only in the local language/gi, `only in ${lang}`)
    .replace(/only in the target language/gi, `only in ${lang}`)
    + `\n\nCRITICAL: You MUST respond ONLY in ${lang}. After your ${lang} response, add a blank line, then the English translation in italics format like: *(English: your translation)*. This helps the learner follow along. NEVER respond in English only.`
}

// ── Build RPG suggestions prompt addon ──────────────────────────────────────
function suggestionsAddon(lang: string): string {
  return `

RESPONSE FORMAT — you MUST respond with valid JSON exactly like this:
{
  "reply": "Your response in ${lang} (with English translation on new line)",
  "suggestions": [
    "Short English action 1 (what user could say/do next)",
    "Short English action 2",
    "Short English action 3"
  ],
  "mission_passed": false,
  "confidence_score": 0,
  "feedback": ""
}

Rules for suggestions:
- Always 3 suggestions
- In plain English (not ${lang})
- Short (max 8 words each)
- Actionable phrases the user could say or do next
- Contextually relevant to the current step in the process
- Examples: "I need a tax ID", "Here is my passport", "How long does it take?"

Set mission_passed to true ONLY when the user has completed ALL required steps.
Set confidence_score to 0-100 reflecting how well they're doing.
Set feedback to one encouraging sentence.
`
}

const EVAL_TOOL: OpenAI.Chat.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'evaluate_mission',
    description: 'Evaluate whether the user has passed the mission.',
    parameters: {
      type: 'object',
      properties: {
        confidence_score: { type: 'number' },
        mission_passed: { type: 'boolean' },
        feedback: { type: 'string' },
      },
      required: ['confidence_score', 'mission_passed', 'feedback'],
    },
  },
}

export async function POST(req: Request) {
  try {
    const {
      messages = [],
      userId,
      mode = 'tutor',
      missionDay,
      targetLanguage = 'greek',
      initiate = false,
      rehearsalScenario,
    } = await req.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', userId).single()
    const resolvedLang = targetLanguage || profile?.target_language || 'greek'
    const langCap = resolvedLang.charAt(0).toUpperCase() + resolvedLang.slice(1)
    const model = MODEL_MAP[mode] || 'gpt-4o'

    // ══════════════════════════════════════════════════════════════════════
    // MISSION MODE — JSON response with RPG suggestions
    // ══════════════════════════════════════════════════════════════════════
    if (mode === 'mission') {
      const day = missionDay || Math.max(1, profile?.mission_day || 1)
      const mission = getCurrentMission(day)
      const basePrompt = injectLanguage(mission.system_prompt, resolvedLang)
      const fullPrompt = basePrompt + suggestionsAddon(langCap)

      // ── AI speaks first ──────────────────────────────────────────────
      if (initiate) {
        const initMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
          { role: 'system', content: fullPrompt },
          { role: 'user', content: `[Scene starts. You are the NPC. The user has just walked in / arrived. Greet them in character in ${langCap}, open the interaction naturally. Set the scene with 1-2 sentences.]` },
        ]
        const res = await openai.chat.completions.create({ model, messages: initMessages, max_tokens: 600, temperature: 0.85 })
        const raw = res.choices[0]?.message?.content || ''
        try {
          const clean = raw.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim()
          const parsed = JSON.parse(clean)
          return NextResponse.json({ reply: parsed.reply, suggestions: parsed.suggestions || [] })
        } catch {
          return NextResponse.json({ reply: raw, suggestions: [`I need help`, `What do I need?`, `I have my documents`] })
        }
      }

      // ── Normal reply with evaluation ─────────────────────────────────
      const userMsgCount = messages.filter((m: {role:string}) => m.role === 'user').length
      const shouldEval = userMsgCount >= 3

      const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: fullPrompt + (shouldEval ? `\n\nAlso evaluate: has the user completed ALL required steps? SUCCESS CRITERIA: ${mission.success_criteria}` : '') },
        ...messages,
      ]

      const res = await openai.chat.completions.create({ model, messages: chatMessages, max_tokens: 700, temperature: 0.8 })
      const raw = res.choices[0]?.message?.content || ''

      let parsed: { reply: string; suggestions: string[]; mission_passed: boolean; confidence_score: number; feedback: string }
      try {
        const clean = raw.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim()
        parsed = JSON.parse(clean)
      } catch {
        parsed = { reply: raw, suggestions: [`Continue`, `Ask a question`, `Provide document`], mission_passed: false, confidence_score: 0, feedback: '' }
      }

      if (parsed.mission_passed && parsed.confidence_score >= 60) {
        // Save session + increment mission day
        try {
          await supabase.from('sessions').insert({
            user_id: userId, messages, duration_seconds: 0,
            language: resolvedLang, level: profile?.current_level || 'A1', xp_earned: 50,
            confidence_scores: { mission_score: parsed.confidence_score, mission_day: day, feedback: parsed.feedback },
            summary: `Mission ${day}: ${mission.title} — passed with ${parsed.confidence_score}/100`,
          })
          await supabase.from('profiles').update({ mission_day: day + 1 }).eq('user_id', userId)

          // HR webhook
          try {
            const { data: p2 } = await supabase.from('profiles').select('full_name,company_id').eq('user_id', userId).single()
            if (p2?.company_id) {
              const { data: co } = await supabase.from('companies').select('webhook_url').eq('id', p2.company_id).single()
              if (co?.webhook_url) {
                await fetch(co.webhook_url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: `✅ *${p2.full_name}* completed *Mission ${day}: ${mission.title}*. Now *${Math.round((day/7)*100)}% integrated*.` }) }).catch(()=>{})
              }
            }
          } catch { /**/ }
        } catch { /**/ }

        return NextResponse.json({
          reply: parsed.reply,
          suggestions: [],
          passed: true,
          passedData: {
            score: parsed.confidence_score,
            processScore: Math.round(parsed.confidence_score * 0.6),
            languageScore: Math.round(parsed.confidence_score * 0.4),
            feedback: parsed.feedback,
            day,
            affiliateReward: mission.affiliate_reward || null,
          },
        })
      }

      return NextResponse.json({ reply: parsed.reply, suggestions: parsed.suggestions || [], passed: false })
    }

    // ══════════════════════════════════════════════════════════════════════
    // REHEARSAL MODE
    // ══════════════════════════════════════════════════════════════════════
    if (mode === 'rehearsal') {
      if (!rehearsalScenario) return NextResponse.json({ error: 'No scenario' }, { status: 400 })
      const isFirst = messages.length === 0
      const rehearsalMsgs: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: `${rehearsalScenario.systemPrompt}\n\nOnly add REHEARSAL_PASSED when ALL success criteria met: ${rehearsalScenario.successCriteria}` },
        ...(isFirst ? [{ role: 'user' as const, content: '[Start the scenario.]' }] : messages),
      ]
      const res = await openai.chat.completions.create({ model, messages: rehearsalMsgs, max_tokens: 400, temperature: 0.85 })
      const text = res.choices[0]?.message?.content || ''
      const encoder = new TextEncoder()
      const readable = new ReadableStream({ start(c) { c.enqueue(encoder.encode(text)); c.close() } })
      return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
    }

    // ══════════════════════════════════════════════════════════════════════
    // PANIC MODE
    // ══════════════════════════════════════════════════════════════════════
    if (mode === 'panic') {
      const { location = 'unknown' } = messages[messages.length - 1] || {}
      const prompt = `Emergency phrase generator. User is at: ${location}. Target language: ${langCap}.\nOutput ONLY 5 critical phrases:\nPHRASE IN ${langCap.toUpperCase()} [phonetic] — English meaning\nNo intro. Pure survival output.`
      const res = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 300, temperature: 0.2 })
      const text = res.choices[0]?.message?.content || ''
      const encoder = new TextEncoder()
      const readable = new ReadableStream({ start(c) { c.enqueue(encoder.encode(text)); c.close() } })
      return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
    }

    // ══════════════════════════════════════════════════════════════════════
    // TUTOR MODE (streaming)
    // ══════════════════════════════════════════════════════════════════════
    let sessionCount = 0
    try { const { count } = await supabase.from('sessions').select('*',{count:'exact',head:true}).eq('user_id',userId); sessionCount = count||0 } catch { /**/ }

    let memoryContext = ''
    try {
      const { data: s } = await supabase.from('sessions').select('confidence_scores,summary').eq('user_id',userId).order('created_at',{ascending:false}).limit(3)
      if (s?.length) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const struggles = s.flatMap((x:any) => x.confidence_scores?.struggles || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const summaries = s.map((x:any) => x.summary).filter(Boolean)
        if (struggles.length) memoryContext += `\nRecent struggles: ${[...new Set(struggles)].slice(0,5).join(', ')}.`
        if (summaries.length) memoryContext += `\nLast session: ${summaries[0]}`
      }
    } catch { /**/ }

    const dm = getDailyMission((profile?.current_level||'A1') as Parameters<typeof getDailyMission>[0], (profile?.dream_goal||'travel') as Parameters<typeof getDailyMission>[1])
    const sysPrompt = buildLexSystemPrompt({ userName: profile?.full_name?.split(' ')[0]||'there', targetLanguage: resolvedLang, currentLevel: profile?.current_level||'A1', nativeLanguage: profile?.native_language||'English', dreamGoal: profile?.dream_goal||'travel', sessionNumber: sessionCount, safeMode: sessionCount<10, dailyMission: dm }) + memoryContext

    const userMsgCount = messages.filter((m:{role:string})=>m.role==='user').length
    const shouldScore = userMsgCount >= 4
    const scoreSuffix = shouldScore ? `\n\nAfter your response add: SCORE:{"fluency":0-10,"accuracy":0-10,"vocabulary":0-10,"struggles":["..."],"summary":"one sentence"}` : ''

    const stream = await openai.chat.completions.create({ model, messages: [{role:'system',content:sysPrompt+scoreSuffix},...messages], stream:true, max_tokens:400, temperature:0.8 })
    const encoder = new TextEncoder()
    let fullResp = ''
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content||''
          fullResp += text
          const visible = text.includes('SCORE:') ? '' : text
          if (visible) controller.enqueue(encoder.encode(visible))
        }
        if (shouldScore && fullResp.includes('SCORE:')) {
          try {
            const line = fullResp.split('SCORE:')[1]?.split('\n')[0]
            const sc = JSON.parse(line)
            await supabase.from('sessions').update({confidence_scores:sc,summary:sc.summary}).eq('user_id',userId).order('created_at',{ascending:false}).limit(1)
          } catch { /**/ }
        }
        controller.close()
      }
    })
    return new Response(readable, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })

  } catch (err) {
    console.error('Chat API error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}