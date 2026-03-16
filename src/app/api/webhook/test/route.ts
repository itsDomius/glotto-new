// ════════════════════════════════════════════════════════════════════════════
// FILE: src/app/api/webhook/test/route.ts   ← CREATE: src/app/api/webhook/test/route.ts
// ════════════════════════════════════════════════════════════════════════════
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { webhookUrl, webhookType } = await req.json()

    if (!webhookUrl) {
      return NextResponse.json({ error: 'No webhook URL' }, { status: 400 })
    }

    const payload = webhookType === 'teams'
      ? {
          '@type': 'MessageCard',
          '@context': 'http://schema.org/extensions',
          themeColor: '4ade80',
          summary: 'Glotto HR Integration Test',
          sections: [{
            activityTitle: '✅ Glotto HR Integration Connected',
            activitySubtitle: 'Your Glotto HR Command Center is now live.',
            activityText: 'You will receive automatic notifications when your expat employees complete integration milestones, fall behind, or achieve full integration.',
            facts: [
              { name: 'Status', value: 'Active ✓' },
              { name: 'Platform', value: 'Microsoft Teams' },
              { name: 'Powered by', value: 'Glotto Relocation OS' },
            ],
          }],
        }
      : {
          text: '✅ *Glotto HR Integration Connected*\n\nYour HR Command Center is live. You will receive automatic pings when your expat employees hit integration milestones.\n\n_Powered by Glotto Relocation OS_ 🌍',
          blocks: [
            {
              type: 'section',
              text: { type: 'mrkdwn', text: '✅ *Glotto HR Integration Connected*' },
            },
            {
              type: 'section',
              text: { type: 'mrkdwn', text: 'Your HR Command Center is now active. You\'ll receive automatic pings when your expat hires complete integration milestones.' },
            },
            {
              type: 'section',
              fields: [
                { type: 'mrkdwn', text: '*Status:*\nActive ✓' },
                { type: 'mrkdwn', text: '*Platform:*\nSlack' },
              ],
            },
            { type: 'divider' },
            {
              type: 'context',
              elements: [{ type: 'mrkdwn', text: 'Powered by Glotto Relocation OS 🌍' }],
            },
          ],
        }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      return NextResponse.json({ error: `Webhook returned ${response.status}` }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Webhook test error:', error)
    return NextResponse.json({ error: 'Failed to send test message' }, { status: 500 })
  }
}