import OpenAI from 'openai'
import { NextResponse } from 'next/server'

const EMERGENCY_SYSTEM_PROMPT = `You are an emergency translator and fixer. The user is in a high-stress situation in a foreign country right now. Provide extremely short, phonetically easy-to-read translations or direct instructions. NO conversational filler. NO formatting. Just the exact words they need to say to survive this moment.`

export async function POST(req: Request) {
  try {
    const { messages, language } = await req.json()

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const systemPrompt = `${EMERGENCY_SYSTEM_PROMPT}\n\nTarget language: ${language || 'Spanish'}. Always include the phonetic pronunciation in brackets after the translation. Keep every response under 3 lines.`

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',   // fast + cheap — perfect for emergency mode
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      stream: true,
      max_tokens: 120,        // force short responses
      temperature: 0.3,       // low temp = deterministic, no hallucinating
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

  } catch (error) {
    console.error('Emergency API error:', error)
    return NextResponse.json({ error: 'Emergency service unavailable' }, { status: 500 })
  }
}