// ════════════════════════════════════════════════════════════════════════════
// FILE: src/app/api/emergency/route.ts
// (This may already exist — replace if so, or create if not)
// ════════════════════════════════════════════════════════════════════════════
import OpenAI from 'openai'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { location, targetLanguage = 'Greek' } = await req.json()

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const prompt = `You are an emergency phrase generator for expats in crisis.
The user is at: ${location || 'unknown location'}.
Target language: ${targetLanguage}.

Output ONLY the 5 most critical phrases needed RIGHT NOW.
Format each line exactly as:
PHRASE IN TARGET LANGUAGE [foh-NET-ik pronunciation] — English meaning

No intro. No explanations. No grammar notes. Pure survival output.
Make phrases immediately usable to show to a local clerk.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.2,
    })

    const script = response.choices[0]?.message?.content || ''
    return NextResponse.json({ script })
  } catch (error) {
    console.error('Emergency API error:', error)
    return NextResponse.json({ error: 'Failed to generate script' }, { status: 500 })
  }
}