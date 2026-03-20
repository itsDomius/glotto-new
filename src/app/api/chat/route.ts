// ════════════════════════════════════════════════════════════════════════════
// FILE: src/app/api/chat/route.ts  ← PASTE THIS ENTIRE FILE
//
// CHANGE IN THIS VERSION (Action 3):
//   FIX PANIC MODE — replaced free-text GPT generation with exact translation.
//   Previously: GPT was asked to "generate useful phrases" and ignored the
//   location context, always defaulting to generic emergency phrases.
//   Now: LOCATION_SCRIPTS contains the exact English phrases for each location.
//   GPT is instructed to TRANSLATE these specific phrases — not invent new ones.
//   Temperature dropped to 0.1 (pure translation, no creativity).
//   This guarantees:
//     Hospital  → ambulance, pain, allergies, emergency room
//     Pharmacy  → medication request, symptoms, prescription, dosage
//     Police    → theft report, passport stolen, official report, interpreter
//     Bank      → block card, fraud, manager, card not working
//     Landlord  → broken heating/water, urgent repair, when fixed
//     Immigration → appointment, documents, extend visa, queue number
//
//   All other modes (mission, rehearsal, tutor) unchanged.
// ════════════════════════════════════════════════════════════════════════════
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { buildLexSystemPrompt } from '@/lib/lex-prompts'
import { getDailyMission } from '@/lib/curriculum'
import { getCurrentMission } from '@/lib/data/missions'
import { getVerifiedContext } from '@/lib/verified-procedures'
import { NextResponse } from 'next/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const MODEL_MAP: Record<string, string> = {
  tutor:     'gpt-4o',
  mission:   'gpt-4o',
  panic:     'gpt-4o-mini',
  rehearsal: 'gpt-4o',
}

// ── In-memory rate limiter ────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_RPM = 20
const RATE_WINDOW_MS  = 60_000

function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now   = Date.now()
  const entry = rateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return { allowed: true, remaining: RATE_LIMIT_RPM - 1 }
  }
  if (entry.count >= RATE_LIMIT_RPM) return { allowed: false, remaining: 0 }
  entry.count++
  return { allowed: true, remaining: RATE_LIMIT_RPM - entry.count }
}

// ── Language injection ────────────────────────────────────────────────────
function injectLanguage(prompt: string, language: string): string {
  const lang = language.charAt(0).toUpperCase() + language.slice(1)
  return prompt
    .replace(/the target language/gi, lang)
    .replace(/your target language/gi, lang)
    .replace(/the local language/gi, lang)
    .replace(/only in the local language/gi, `only in ${lang}`)
    .replace(/only in the target language/gi, `only in ${lang}`)
    + `\n\nCRITICAL: You MUST respond ONLY in ${lang}. After your ${lang} response, add a blank line, then the English translation in italics format like: *(English: your translation)*. NEVER respond in English only.`
}

// ── RPG suggestions JSON format ───────────────────────────────────────────
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

Rules:
- Always exactly 3 suggestions in plain English
- Max 8 words each, actionable, contextually relevant
- mission_passed = true ONLY when user completed ALL required steps
- confidence_score 0-100
- feedback = one encouraging sentence
`
}

// ── FIX: Exact English phrases per location — GPT translates, not invents ─
// Each array contains the precise phrases an expat needs at that location.
// GPT is instructed to translate THESE specific phrases, not generate new ones.
const LOCATION_SCRIPTS: Record<string, string[]> = {
  'Hospital / ER': [
    'Call an ambulance immediately',
    'I have severe chest pain / I cannot breathe',
    'I need a doctor urgently',
    'I am allergic to [medication — show label]',
    'Do you speak English?',
  ],
  'Pharmacy': [
    'I need this medication — can you help me? [show box or photo]',
    'Do I need a prescription for this?',
    'I have a headache / fever / stomach pain',
    'I am allergic to penicillin',
    'What is the correct dosage?',
  ],
  'Police Station': [
    'I want to report a theft',
    'My passport / wallet was stolen',
    'I need an official police report for insurance',
    'I need an interpreter or translator',
    'I am a foreign national — I do not speak the language',
  ],
  'Bank': [
    'I need to block my card immediately — it was stolen',
    'I want to report fraud on my account',
    'I need to speak with a manager',
    'My card is not working — can you help?',
    'I have an appointment — my name is [your name]',
  ],
  'Landlord / Housing': [
    'There is no hot water / the heating is broken',
    'There is a water leak — it is urgent',
    'I need an emergency repair today',
    'When will this be fixed?',
    'This is an emergency — please come now',
  ],
  'Immigration Office': [
    'I have an appointment at [time] — my name is [your name]',
    'Here are my documents',
    'I need to extend my visa / residence permit',
    'I need a translator or interpreter',
    'Which queue number should I take?',
  ],
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

    // ── Rate limiting ────────────────────────────────────────────────────
    const rateLimitKey = userId || req.headers.get('x-forwarded-for') || 'anonymous'
    const { allowed, remaining } = checkRateLimit(rateLimitKey)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: profile } = userId
      ? await supabase.from('profiles').select('*').eq('user_id', userId).single()
      : { data: null }

    const resolvedLang = targetLanguage || profile?.target_language || 'greek'
    const langCap      = resolvedLang.charAt(0).toUpperCase() + resolvedLang.slice(1)
    const model        = MODEL_MAP[mode] || 'gpt-4o'

    // ════════════════════════════════════════════════════════════════════
    // MISSION MODE
    // ════════════════════════════════════════════════════════════════════
    if (mode === 'mission') {
      const day          = missionDay || Math.max(1, profile?.mission_day || 1)
      const mission      = getCurrentMission(day)
      const verifiedContext = getVerifiedContext(day)
      const basePrompt   = injectLanguage(mission.system_prompt, resolvedLang)
      const fullPrompt   = verifiedContext + basePrompt + suggestionsAddon(langCap)

      // AI speaks first
      if (initiate) {
        const res = await openai.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: fullPrompt },
            { role: 'user',   content: `[Scene starts. You are the NPC. The user has just walked in. Greet them in character in ${langCap}, open the interaction naturally. 1-2 sentences.]` },
          ],
          max_tokens: 600,
          temperature: 0.85,
        })
        const raw = res.choices[0]?.message?.content || ''
        try {
          const parsed = JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())
          return NextResponse.json({ reply: parsed.reply, suggestions: parsed.suggestions || [] })
        } catch {
          return NextResponse.json({ reply: raw, suggestions: ['I need help', 'What do I need?', 'I have my documents'] })
        }
      }

      // Normal turn
      const userMsgCount = messages.filter((m: { role: string }) => m.role === 'user').length
      const shouldEval   = userMsgCount >= 3
      const res = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: fullPrompt + (shouldEval ? `\n\nEvaluate: has user completed ALL required steps? SUCCESS CRITERIA: ${mission.success_criteria}` : ''),
          },
          ...messages,
        ],
        max_tokens: 700,
        temperature: 0.8,
      })
      const raw = res.choices[0]?.message?.content || ''

      let parsed: { reply: string; suggestions: string[]; mission_passed: boolean; confidence_score: number; feedback: string }
      try {
        parsed = JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())
      } catch {
        parsed = { reply: raw, suggestions: ['Continue', 'Ask a question', 'Provide document'], mission_passed: false, confidence_score: 0, feedback: '' }
      }

      if (parsed.mission_passed && parsed.confidence_score >= 60 && userId) {
        try {
          await supabase.from('sessions').insert({
            user_id:           userId,
            messages,
            duration_seconds:  0,
            language:          resolvedLang,
            level:             profile?.current_level || 'A1',
            xp_earned:         50,
            confidence_scores: { mission_score: parsed.confidence_score, mission_day: day, feedback: parsed.feedback },
            summary:           `Mission ${day}: ${mission.title} — passed with ${parsed.confidence_score}/100`,
          })
          await supabase.from('profiles').update({ mission_day: day + 1 }).eq('user_id', userId)

          // HR webhook — non-fatal
          try {
            const { data: p2 } = await supabase.from('profiles').select('full_name,company_id').eq('user_id', userId).single()
            if (p2?.company_id) {
              const { data: co } = await supabase.from('companies').select('webhook_url').eq('id', p2.company_id).single()
              if (co?.webhook_url) {
                await fetch(co.webhook_url, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ text: `✅ *${p2.full_name}* completed *Mission ${day}: ${mission.title}*. Now *${Math.round((day / 7) * 100)}% integrated*.` }),
                }).catch(() => {})
              }
            }
          } catch { /* non-fatal */ }
        } catch (dbErr) {
          console.error('Mission DB save error:', dbErr)
        }

        return NextResponse.json({
          reply:       parsed.reply,
          suggestions: [],
          passed:      true,
          passedData: {
            score:          parsed.confidence_score,
            processScore:   Math.round(parsed.confidence_score * 0.6),
            languageScore:  Math.round(parsed.confidence_score * 0.4),
            feedback:       parsed.feedback,
            day,
            affiliateReward: mission.affiliate_reward || null,
          },
        })
      }

      return NextResponse.json({ reply: parsed.reply, suggestions: parsed.suggestions || [], passed: false })
    }

    // ════════════════════════════════════════════════════════════════════
    // REHEARSAL MODE
    // ════════════════════════════════════════════════════════════════════
    if (mode === 'rehearsal') {
      if (!rehearsalScenario) return NextResponse.json({ error: 'No scenario' }, { status: 400 })

      const isFirst = messages.length === 0
      const res = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: `${rehearsalScenario.systemPrompt}\n\nOnly add REHEARSAL_PASSED when ALL criteria met: ${rehearsalScenario.successCriteria}` },
          ...(isFirst ? [{ role: 'user' as const, content: '[Start the scenario.]' }] : messages),
        ],
        max_tokens: 400,
        temperature: 0.85,
      })
      const text = res.choices[0]?.message?.content || ''
      try {
        const parsed = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())
        return NextResponse.json({
          reply:            parsed.ai_message || text,
          suggestions:      parsed.suggested_replies || [],
          rehearsal_passed: parsed.rehearsal_passed || text.includes('REHEARSAL_PASSED'),
        })
      } catch {
        const encoder = new TextEncoder()
        return new Response(
          new ReadableStream({ start(c) { c.enqueue(encoder.encode(text)); c.close() } }),
          { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
        )
      }
    }

    // ════════════════════════════════════════════════════════════════════
    // PANIC MODE — exact translation approach (Action 3 fix)
    // ════════════════════════════════════════════════════════════════════
    if (mode === 'panic') {
      const { location = 'unknown' } = messages[messages.length - 1] || {}

      const scripts = LOCATION_SCRIPTS[location]

      let prompt: string

      if (scripts) {
        // Translate THESE exact phrases — do not invent alternatives
        prompt = `You are a professional translator. An expat is at ${location} and cannot speak the local language.
Translate EXACTLY the following ${scripts.length} English phrases into ${langCap}.
Do NOT change the meaning. Do NOT replace any phrase with something different.
Translate ONLY these phrases, in this exact order:

${scripts.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Output format — ONLY these ${scripts.length} numbered lines, nothing else before or after:
1. ${langCap.toUpperCase()} TRANSLATION [phonetic pronunciation] — English original
2. ${langCap.toUpperCase()} TRANSLATION [phonetic pronunciation] — English original
3. ${langCap.toUpperCase()} TRANSLATION [phonetic pronunciation] — English original
4. ${langCap.toUpperCase()} TRANSLATION [phonetic pronunciation] — English original
5. ${langCap.toUpperCase()} TRANSLATION [phonetic pronunciation] — English original`
      } else {
        // Unknown location — safe generic fallback
        prompt = `Translate these 5 emergency phrases into ${langCap}.
Format each line as: TRANSLATION [phonetic] — English meaning

1. Help! I need assistance.
2. Please call an ambulance.
3. I do not speak the language — do you speak English?
4. Where is the nearest hospital?
5. Please call the police.`
      }

      const res = await openai.chat.completions.create({
        model:    'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.1, // near-zero — pure translation, no creativity
      })
      const text    = res.choices[0]?.message?.content || ''
      const encoder = new TextEncoder()
      return new Response(
        new ReadableStream({ start(c) { c.enqueue(encoder.encode(text)); c.close() } }),
        { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
      )
    }

    // ════════════════════════════════════════════════════════════════════
    // TUTOR MODE (streaming)
    // ════════════════════════════════════════════════════════════════════
    let sessionCount    = 0
    let latestSessionId: string | null = null

    if (userId) {
      try {
        const { count } = await supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('user_id', userId)
        sessionCount = count || 0
      } catch { /* ignore */ }
      try {
        const { data: recent } = await supabase.from('sessions').select('id').eq('user_id', userId).order('created_at', { ascending: false }).limit(1)
        if (recent?.length) latestSessionId = recent[0].id
      } catch { /* ignore */ }
    }

    let memoryContext = ''
    if (userId) {
      try {
        const { data: s } = await supabase
          .from('sessions')
          .select('confidence_scores,summary')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(3)
        if (s?.length) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const struggles = s.flatMap((x: any) => x.confidence_scores?.struggles || [])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const summaries = s.map((x: any) => x.summary).filter(Boolean)
          if (struggles.length) memoryContext += `\nRecent struggles: ${[...new Set(struggles)].slice(0, 5).join(', ')}.`
          if (summaries.length) memoryContext += `\nLast session: ${summaries[0]}`
        }
      } catch { /* ignore */ }
    }

    const dm = getDailyMission(
      (profile?.current_level || 'A1') as Parameters<typeof getDailyMission>[0],
      (profile?.dream_goal    || 'travel') as Parameters<typeof getDailyMission>[1]
    )

    const sysPrompt = buildLexSystemPrompt({
      userName:       profile?.full_name?.split(' ')[0] || 'there',
      targetLanguage: resolvedLang,
      currentLevel:   profile?.current_level  || 'A1',
      nativeLanguage: profile?.native_language || 'English',
      dreamGoal:      profile?.dream_goal      || 'travel',
      sessionNumber:  sessionCount,
      safeMode:       sessionCount < 10,
      dailyMission:   dm,
    }) + memoryContext

    const userMsgCount = messages.filter((m: { role: string }) => m.role === 'user').length
    const shouldScore  = userMsgCount >= 4
    const scoreSuffix  = shouldScore
      ? `\n\nAfter your response add: SCORE:{"fluency":0-10,"accuracy":0-10,"vocabulary":0-10,"struggles":["..."],"summary":"one sentence"}`
      : ''

    const stream = await openai.chat.completions.create({
      model,
      messages:    [{ role: 'system', content: sysPrompt + scoreSuffix }, ...messages],
      stream:      true,
      max_tokens:  400,
      temperature: 0.8,
    })

    const encoder = new TextEncoder()
    let fullResp  = ''

    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text    = chunk.choices[0]?.delta?.content || ''
          fullResp     += text
          const visible = text.includes('SCORE:') ? '' : text
          if (visible) controller.enqueue(encoder.encode(visible))
        }

        if (shouldScore && fullResp.includes('SCORE:') && userId) {
          try {
            const sc = JSON.parse(fullResp.split('SCORE:')[1]?.split('\n')[0])
            if (latestSessionId) {
              await supabase.from('sessions').update({ confidence_scores: sc, summary: sc.summary }).eq('id', latestSessionId)
            } else {
              await supabase.from('sessions').insert({
                user_id:           userId,
                messages,
                duration_seconds:  0,
                language:          resolvedLang,
                level:             profile?.current_level || 'A1',
                xp_earned:         10,
                confidence_scores: sc,
                summary:           sc.summary || '',
              })
            }
          } catch (e) {
            console.error('Tutor score save error:', e)
          }
        }

        controller.close()
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type':        'text/plain; charset=utf-8',
        'X-RateLimit-Remaining': String(remaining),
      },
    })

  } catch (err) {
    console.error('Chat API error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}