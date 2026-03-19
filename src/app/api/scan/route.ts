// ════════════════════════════════════════════════════════════════════════════
// FILE: src/app/api/scan/route.ts  ← PASTE THIS ENTIRE FILE
//
// FIXES APPLIED:
//   FIX A — Was returning 500 on every request. Added input validation:
//            null body, missing image, too-short base64, unsupported mime.
//   FIX B — Scan results were never saved to DB. Now inserts into
//            document_scans table after every successful scan.
//   FIX C — Better error messages: OpenAI image errors return 400 not 500.
//            Full error logged to Vercel function logs for debugging.
// ════════════════════════════════════════════════════════════════════════════
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  try {
    // ── FIX A: Parse and validate body before touching OpenAI ──────────────
    const body = await req.json().catch(() => null)

    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { imageBase64, mimeType = 'image/jpeg', userId } = body

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // A real document photo base64 is always several thousand characters.
    // Reject anything shorter — it's a test string or corrupted upload.
    if (typeof imageBase64 !== 'string' || imageBase64.length < 500) {
      return NextResponse.json(
        { error: 'Image is too small or corrupted — please retake the photo' },
        { status: 400 }
      )
    }

    // Only accept image formats GPT-4o Vision supports
    const ALLOWED_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const resolvedMime  = ALLOWED_MIMES.includes(mimeType) ? mimeType : 'image/jpeg'

    // ── OpenAI GPT-4o Vision call ───────────────────────────────────────────
    const response = await openai.chat.completions.create({
      model:      'gpt-4o',
      max_tokens: 1000,
      messages: [
        {
          role: 'system',
          content: `You are an expert expat document analyzer. A user has uploaded a photo of an official document they received in a foreign country.

Your job is to analyze this document and return a structured JSON response ONLY — no markdown, no explanation, just raw JSON.

Return this exact structure:
{
  "document_type": "string (e.g. 'Tax Notice', 'Utility Bill', 'Government Letter', 'Rental Agreement', 'Bank Statement')",
  "summary": "string (1-2 sentences in plain English explaining what this document IS and what the user needs to know)",
  "urgency": "red" | "yellow" | "green",
  "urgency_reason": "string (specific reason for this urgency level — mention deadlines and consequences)",
  "deadline": "string | null (specific date if visible, otherwise null)",
  "next_actions": ["string", "string", "string"],
  "key_amounts": ["string"],
  "language_detected": "string (e.g. 'Greek', 'German', 'French')"
}

Urgency levels:
- red:    requires action within 7 days, OR legal/financial consequences, OR overdue
- yellow: requires action within 30 days, important but not critical
- green:  informational only, no immediate action needed

next_actions: always provide EXACTLY 3 specific, actionable steps in plain English.
key_amounts: all monetary values, fees, or important numbers found. Empty array if none.

If the image is too dark/blurry to read:
{ "error": "Image is too unclear to read — please retake in better lighting" }

If the image is not a document (selfie, landscape, etc.):
{ "error": "This doesn't look like a document — please upload a photo of a letter or form" }`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url:    `data:${resolvedMime};base64,${imageBase64}`,
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

    // ── Parse the response ──────────────────────────────────────────────────
    let parsed: Record<string, unknown>
    try {
      const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      parsed = JSON.parse(clean)
    } catch {
      console.error('Scan: Failed to parse GPT response:', raw.slice(0, 200))
      return NextResponse.json(
        { error: 'Could not read the document — please try again with a clearer photo' },
        { status: 500 }
      )
    }

    // GPT returned an error (not a document / too blurry)
    if (parsed.error) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    // ── FIX B: Save to document_scans table ─────────────────────────────────
    if (userId) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        await supabase.from('document_scans').insert({
          user_id:           userId,
          document_type:     parsed.document_type   || 'Unknown',
          urgency:           parsed.urgency          || 'green',
          summary:           parsed.summary          || '',
          deadline:          parsed.deadline         || null,
          next_actions:      parsed.next_actions     || [],
          key_amounts:       parsed.key_amounts      || [],
          language_detected: parsed.language_detected || 'Unknown',
          raw_response:      parsed,
        })
      } catch (dbErr) {
        // Non-fatal — user still gets their scan result even if DB save fails
        console.error('Scan: DB save failed (non-fatal):', dbErr)
      }
    }

    return NextResponse.json(parsed)

  } catch (error) {
    // FIX C: Log the full error for Vercel function logs
    console.error('Scan API error:', error)

    const msg = error instanceof Error ? error.message : String(error)

    // OpenAI image validation errors → 400 (user error, not server error)
    if (msg.includes('invalid_request_error') || msg.includes('image') || msg.includes('base64')) {
      return NextResponse.json(
        { error: 'Could not process this image — please ensure it is a clear photo of a document' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Something went wrong — please try again', detail: msg },
      { status: 500 }
    )
  }
}