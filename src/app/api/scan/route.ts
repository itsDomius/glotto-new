// ════════════════════════════════════════════════════════════════════════════
// FILE: src/app/api/scan/route.ts
// ════════════════════════════════════════════════════════════════════════════
import OpenAI from 'openai'
import { NextResponse } from 'next/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = await req.json()

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1000,
      messages: [
        {
          role: 'system',
          content: `You are an expert expat document analyzer. A user has uploaded a photo of an official document they received in a foreign country. 
          
Your job is to analyze this document and return a structured JSON response ONLY — no markdown, no explanation, just raw JSON.

Return this exact structure:
{
  "document_type": "string (e.g. 'Tax Notice', 'Utility Bill', 'Government Letter', 'Rental Agreement', 'Bank Statement')",
  "summary": "string (1-2 sentences in plain English explaining what this document IS)",
  "urgency": "red" | "yellow" | "green",
  "urgency_reason": "string (why this urgency level)",
  "deadline": "string | null (specific date or 'No deadline' or null if unclear)",
  "next_actions": ["string", "string", "string"],
  "key_amounts": ["string"] (any monetary amounts or figures found, empty array if none),
  "language_detected": "string (e.g. 'Greek', 'German', 'French')"
}

Urgency levels:
- red: requires action within 7 days, legal/financial consequences, overdue
- yellow: requires action within 30 days, important but not critical
- green: informational, no immediate action needed

If the image is not a document (photo of something else), return:
{ "error": "Not a document" }`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
                detail: 'high',
              },
            },
            {
              type: 'text',
              text: 'Analyze this document and return the JSON response.',
            },
          ],
        },
      ],
    })

    const raw = response.choices[0]?.message?.content || '{}'
    
    let parsed
    try {
      // Strip any accidental markdown fences
      const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsed = JSON.parse(clean)
    } catch {
      return NextResponse.json({ error: 'Could not parse document' }, { status: 500 })
    }

    if (parsed.error) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('Scan API error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}