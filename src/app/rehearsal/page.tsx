// ════════════════════════════════════════════════════════════════════════════
// FILE: src/app/rehearsal/page.tsx
// ════════════════════════════════════════════════════════════════════════════
'use client'
import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Scenario = {
  id: string
  title: string
  icon: string
  location: string
  difficulty: string
  diffColor: string
  description: string
  systemPrompt: string
  successCriteria: string
  documents: string[]
}

const SCENARIOS: Scenario[] = [
  {
    id: 'tax-office',
    title: 'Tax Office Visit',
    icon: '🪪',
    location: 'Eforia (Tax Office)',
    difficulty: 'Medium',
    diffColor: '#fbbf24',
    description: "You need your AFM (Tax ID). Practice getting through the queue, presenting documents, and leaving with a number.",
    successCriteria: "User stated purpose, presented passport AND proof of address, gave personal details, confirmed Form A-1 and 5-day processing time",
    documents: ['Passport', 'Rental Contract or Utility Bill'],
    systemPrompt: `You are a Greek government clerk at the tax office (Eforia). You are polite but strictly procedural — you follow the book exactly, no exceptions. You speak formal English with a slightly bureaucratic tone.

The user needs a Tax ID (AFM). Required documents: passport + proof of address.

MANDATORY PROCESS (you enforce this order):
1. Ask what they need
2. Request passport — examine it carefully, confirm it's valid
3. Request proof of address — if they don't have one, tell them to come back
4. Ask for full name and date of birth — type it slowly
5. Explain they need to fill Form A-1 and processing takes 5 business days
6. Give them a receipt number

Roleplay behavior:
- If they forget a document, stop the interaction: "I'm sorry, without [document] I cannot process your application."
- If they skip a step, say "Please wait — we need to do this in order."
- Speak formally. Don't rush. This is a Greek government office.
- Add small bureaucratic details: "Queue number 47", "My colleague will call you shortly", "Please take a seat"

When ALL 5 steps are completed successfully, end your message with: REHEARSAL_PASSED`,
  },
  {
    id: 'landlord-signing',
    title: 'Signing the Lease',
    icon: '📝',
    location: 'Apartment Viewing',
    difficulty: 'Hard',
    diffColor: '#f97316',
    description: "Your landlord wants you to sign today. Practice asking the right questions before putting pen to paper.",
    successCriteria: "User asked about deposit return timeline, notice period, utilities, rent increases, and correctly summarised terms",
    documents: ['Passport', 'Proof of Employment/Income'],
    systemPrompt: `You are a Greek landlord presenting a rental contract to a new tenant. You're friendly, a bit impatient ("I have other viewings today"), and you will NOT volunteer information — the tenant must ask.

The contract terms (only reveal if asked):
- Rent: €800/month, due 1st of each month
- Deposit: 2 months (€1,600) — returned within 30 days after leaving
- Notice period: 60 days written notice to terminate
- Pets: not allowed
- Subletting: not allowed
- Utilities: tenant pays all (estimate €120/month)
- Annual increase: up to 3% with 30 days notice
- Contract length: 12 months, renewable

Roleplay behavior:
- If they try to sign immediately: "Of course! Just sign here—" (let them, then later reveal they missed key terms)
- If they haven't asked about deposit return: "Ready to sign?" Push them to sign before they ask
- Be friendly but vague: "Oh the standard terms, nothing unusual"
- If they ask a good question, answer honestly but briefly

When user has asked about ALL of: deposit timeline, notice period, utilities, rent increases AND summarised the terms correctly, end with: REHEARSAL_PASSED`,
  },
  {
    id: 'bank-visit',
    title: 'Opening a Bank Account',
    icon: '🏦',
    location: 'Bank Branch',
    difficulty: 'Medium',
    diffColor: '#fbbf24',
    description: "Practice walking into a Greek bank branch and opening a current account with all the right documents.",
    successCriteria: "User presented all 4 documents, chose current account, confirmed €0 fee with salary deposit",
    documents: ['Passport', 'Proof of Address', 'Tax ID (AFM)', 'Employment Letter'],
    systemPrompt: `You are a bank advisor at a Greek bank branch (like Piraeus or Alpha Bank). You are professional, formal, and speak excellent English. You genuinely want to help but you cannot open an account without the correct documentation — it's a legal requirement.

To open a current account you MUST have:
1. Passport (valid)
2. Proof of address (utility bill or rental contract)
3. Tax ID (AFM number)
4. Employment letter (or student enrollment, or pension statement)

Account types:
- Current account: €0 fee if salary is deposited, €5/month otherwise — RECOMMEND THIS
- Savings account: €0 fee, limited transactions

Roleplay behavior:
- Go through each document methodically: "May I see your passport please?" — then the next
- If they don't have their AFM: "I'm afraid we cannot proceed without a tax ID. Greek law requires it for bank accounts."
- Be helpful: explain WHY each document is needed
- If they ask about online banking, mention the app
- Explain: "The account will be active in 2-3 business days and your card arrives in 5-7 days"

When ALL 4 documents presented, account type chosen, and fee confirmed: REHEARSAL_PASSED`,
  },
  {
    id: 'doctors-visit',
    title: 'GP Registration',
    icon: '🏥',
    location: 'Local Clinic',
    difficulty: 'Hard',
    diffColor: '#f97316',
    description: "Register with a local doctor, explain your symptoms, and book an appointment over the phone.",
    successCriteria: "User gave all registration details, described symptoms clearly with duration and severity, chose appointment type, confirmed attendance details",
    documents: ['AMKA Number', 'Insurance Card or EHIC'],
    systemPrompt: `You are a GP receptionist at a busy Athens clinic. You answer the phone quickly, are efficient but kind, and work through a checklist to register new patients.

REGISTRATION CHECKLIST (go through this):
1. Full name
2. Date of birth
3. Address
4. AMKA number (Greek social security — if they don't have it, advise they get it first)
5. Insurance card or EHIC number

APPOINTMENT BOOKING:
- They must describe symptoms: ask about main complaint, how long, severity (1-10)
- RED FLAGS: chest pain, difficulty breathing → "Please go to A&E immediately, do not wait"
- Offer: same-day urgent (limited slots) or next available routine (2-3 days)
- Confirm date, time, doctor's name
- Remind them to bring ID and insurance card

Roleplay behavior:
- If they don't have AMKA: "I'm afraid without your AMKA we can't register you in our system. You'll need to visit the KEP office first."
- Be compassionate — they're sick and in a foreign country
- Speak at a normal pace, not too fast
- At the end: "Is there anything else I can help you with?"

When all registration details gathered AND appointment confirmed: REHEARSAL_PASSED`,
  },
]

type Message = {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const G = '#4ade80'

export default function RehearsalPage() {
  const router = useRouter()
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [passed, setPassed] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [confidence, setConfidence] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const startScenario = async (scenario: Scenario) => {
    setSelectedScenario(scenario)
    setPassed(false)
    setConfidence(0)
    setLoading(true)

    const opening: Message = { role: 'assistant', content: '', timestamp: new Date() }
    setMessages([opening])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [],
          userId,
          mode: 'rehearsal',
          rehearsalScenario: scenario,
        }),
      })

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let full = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          full += chunk
          setMessages([{ role: 'assistant', content: full, timestamp: new Date() }])
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading || !selectedScenario) return

    const userMsg: Message = { role: 'user', content: input.trim(), timestamp: new Date() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    const assistantMsg: Message = { role: 'assistant', content: '', timestamp: new Date() }
    setMessages([...newMessages, assistantMsg])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          userId,
          mode: 'rehearsal',
          rehearsalScenario: selectedScenario,
        }),
      })

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let full = ''
      let msgPassed = false

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          full += chunk

          if (full.includes('REHEARSAL_PASSED')) {
            msgPassed = true
          }

          const visible = full.replace('REHEARSAL_PASSED', '').trim()
          setMessages([...newMessages, { role: 'assistant', content: visible, timestamp: new Date() }])
        }
      }

      if (msgPassed) {
        setPassed(true)
        setConfidence(Math.floor(Math.random() * 15) + 85) // 85-100
      } else {
        // estimate progress
        const userCount = newMessages.filter(m => m.role === 'user').length
        setConfidence(Math.min(80, userCount * 15))
      }

    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const exit = () => {
    setSelectedScenario(null)
    setMessages([])
    setPassed(false)
    setConfidence(0)
  }

  if (!selectedScenario) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: '"DM Sans", -apple-system, sans-serif' }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');*{box-sizing:border-box;margin:0;padding:0}@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}.card{animation:fadeUp .3s ease both;transition:all .15s}.card:hover{border-color:#2a2a2a!important;transform:translateY(-2px)}`}</style>

        <div style={{ borderBottom: '1px solid #111', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#070707' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: '#444', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>← Dashboard</button>
            <div style={{ width: 1, height: 16, background: '#1a1a1a' }} />
            <span style={{ color: G, fontWeight: 800, fontSize: 20 }}>Glotto</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: 20, padding: '6px 14px' }}>
            <span style={{ fontSize: 14 }}>🎭</span>
            <span style={{ color: '#888', fontSize: 12, fontWeight: 600 }}>Rehearsal Mode</span>
          </div>
        </div>

        <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px 24px' }}>
          <div style={{ marginBottom: 48 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#0f2a1a', border: '1px solid #1a3a1f', borderRadius: 100, padding: '4px 12px', fontSize: 11, color: G, fontWeight: 700, marginBottom: 16, letterSpacing: '0.08em', fontFamily: '"DM Mono", monospace' }}>
              🎭 AI REHEARSAL
            </div>
            <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 10 }}>Practice before you go</h1>
            <p style={{ color: '#555', fontSize: 16, lineHeight: 1.6, maxWidth: 560 }}>
              Simulate real bureaucratic interactions with an AI that plays a strict local official. Walk in prepared. Walk out with a Confidence Badge.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {SCENARIOS.map((s, i) => (
              <div key={s.id} className="card" onClick={() => startScenario(s)} style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: 18, padding: 24, cursor: 'pointer', animationDelay: `${i * 0.06}s` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontSize: 32 }}>{s.icon}</span>
                  <span style={{ background: `${s.diffColor}15`, color: s.diffColor, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 8, fontFamily: '"DM Mono", monospace' }}>{s.difficulty}</span>
                </div>
                <h3 style={{ color: '#fff', fontWeight: 800, fontSize: 17, marginBottom: 4, letterSpacing: '-0.3px' }}>{s.title}</h3>
                <p style={{ color: '#555', fontSize: 12, fontFamily: '"DM Mono", monospace', marginBottom: 10 }}>📍 {s.location}</p>
                <p style={{ color: '#444', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>{s.description}</p>
                <div style={{ borderTop: '1px solid #111', paddingTop: 14 }}>
                  <p style={{ color: '#333', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: '"DM Mono", monospace', marginBottom: 8 }}>Bring with you</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {s.documents.map(d => (
                      <span key={d} style={{ background: '#111', border: '1px solid #1a1a1a', color: '#888', fontSize: 11, padding: '3px 8px', borderRadius: 6 }}>{d}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', background: '#070707', display: 'flex', flexDirection: 'column', fontFamily: '"DM Sans", -apple-system, sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');*{box-sizing:border-box;margin:0;padding:0}@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}.msg{animation:fadeUp .2s ease both}.dot{animation:pulse 1.2s ease infinite}.dot:nth-child(2){animation-delay:.2s}.dot:nth-child(3){animation-delay:.4s}textarea:focus{outline:none}`}</style>

      {/* Chat header */}
      <div style={{ background: '#050505', borderBottom: '1px solid #0d0d0d', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={exit} style={{ background: 'none', border: 'none', color: '#444', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>← Scenarios</button>
          <div style={{ width: 1, height: 16, background: '#1a1a1a' }} />
          <span style={{ fontSize: 20 }}>{selectedScenario.icon}</span>
          <div>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{selectedScenario.title}</p>
            <p style={{ color: '#444', fontSize: 11, fontFamily: '"DM Mono", monospace' }}>📍 {selectedScenario.location}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Confidence meter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: 20, padding: '6px 14px' }}>
            <span style={{ color: '#444', fontSize: 11, fontFamily: '"DM Mono", monospace' }}>Confidence</span>
            <div style={{ width: 60, height: 4, background: '#111', borderRadius: 4 }}>
              <div style={{ height: 4, background: confidence >= 85 ? G : '#fbbf24', borderRadius: 4, width: `${confidence}%`, transition: 'width .5s ease' }} />
            </div>
            <span style={{ color: confidence >= 85 ? G : '#fbbf24', fontWeight: 700, fontSize: 12, fontFamily: '"DM Mono", monospace' }}>{confidence}%</span>
          </div>
          <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: 12, padding: '6px 12px' }}>
            <span style={{ color: '#888', fontSize: 12 }}>🎭 AI Roleplay</span>
          </div>
        </div>
      </div>

      {/* Documents checklist */}
      <div style={{ background: '#0a0a0a', borderBottom: '1px solid #0d0d0d', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, overflowX: 'auto' }}>
        <span style={{ color: '#333', fontSize: 11, fontFamily: '"DM Mono", monospace', flexShrink: 0 }}>BRING:</span>
        {selectedScenario.documents.map(d => (
          <span key={d} style={{ background: '#111', border: '1px solid #1a1a1a', color: '#888', fontSize: 11, padding: '3px 10px', borderRadius: 8, flexShrink: 0 }}>📄 {d}</span>
        ))}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 16px' }}>
        {passed && (
          <div style={{ background: '#0f2a1a', border: '1px solid #1a3a1f', borderRadius: 16, padding: '20px 24px', marginBottom: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{ fontSize: 32 }}>🏅</span>
            <div>
              <p style={{ color: G, fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Confidence Badge Earned!</p>
              <p style={{ color: '#888', fontSize: 13 }}>You successfully navigated {selectedScenario.title}. You're ready for the real thing.</p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className="msg" style={{ display: 'flex', gap: 12, marginBottom: 20, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, background: msg.role === 'user' ? '#0f2a1a' : '#111', border: `1px solid ${msg.role === 'user' ? '#1a3a1f' : '#1a1a1a'}` }}>
              {msg.role === 'user' ? '👤' : selectedScenario.icon}
            </div>
            <div style={{ maxWidth: '75%' }}>
              <p style={{ color: msg.role === 'user' ? '#4ade80' : '#888', fontSize: 10, fontFamily: '"DM Mono", monospace', marginBottom: 5, textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                {msg.role === 'user' ? 'You' : selectedScenario.location}
              </p>
              <div style={{ background: msg.role === 'user' ? '#0f2a1a' : '#0e0e0e', border: `1px solid ${msg.role === 'user' ? '#1a3a1f' : '#1a1a1a'}`, borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', padding: '12px 16px' }}>
                <p style={{ color: '#ddd', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{msg.content || (loading && i === messages.length - 1 ? '' : '')}</p>
                {loading && i === messages.length - 1 && msg.role === 'assistant' && !msg.content && (
                  <div style={{ display: 'flex', gap: 4, padding: '4px 0' }}>
                    {[0, 1, 2].map(j => (
                      <div key={j} className="dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#444', animationDelay: `${j * 0.15}s` }} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {!passed ? (
        <div style={{ background: '#050505', borderTop: '1px solid #0d0d0d', padding: '16px 24px', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder="Type your response... (Press Enter to send)"
              rows={2}
              disabled={loading}
              style={{ flex: 1, background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: 14, padding: '12px 16px', color: '#fff', fontSize: 14, fontFamily: '"DM Sans", sans-serif', resize: 'none', lineHeight: 1.5 }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{ background: loading || !input.trim() ? '#111' : G, color: loading || !input.trim() ? '#333' : '#050f06', border: 'none', borderRadius: 12, padding: '12px 20px', fontWeight: 800, fontSize: 14, cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit', flexShrink: 0, height: 48 }}
            >
              {loading ? <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #333', borderTopColor: '#888', animation: 'spin .6s linear infinite' }} /> : '→'}
            </button>
          </div>
          <p style={{ color: '#1a1a1a', fontSize: 11, marginTop: 8, fontFamily: '"DM Mono", monospace' }}>Shift+Enter for new line · The AI is roleplaying a strict official</p>
        </div>
      ) : (
        <div style={{ background: '#050505', borderTop: '1px solid #0d0d0d', padding: '16px 24px', display: 'flex', gap: 12, flexShrink: 0 }}>
          <button onClick={exit} style={{ flex: 1, background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: 12, padding: 14, color: '#888', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>← Try Another Scenario</button>
          <button onClick={() => router.push('/mission?day=1')} style={{ flex: 1, background: G, border: 'none', borderRadius: 12, padding: 14, color: '#050f06', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Do the Real Mission →</button>
        </div>
      )}
    </div>
  )
}