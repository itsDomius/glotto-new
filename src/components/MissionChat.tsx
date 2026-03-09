'use client'
import React from 'react'
import { useRouter } from 'next/navigation'

// Install: npm install canvas-confetti
// Types: npm install --save-dev @types/canvas-confetti
declare const confetti: any

const GREEN = '#4ade80'

const DIFFICULTY_COLOR: Record<string, string> = {
  Beginner: '#60a5fa',
  Easy: '#34d399',
  Medium: '#fbbf24',
  Hard: '#f97316',
  Expert: '#f87171',
}

type Message = { role: string; content: string }

type MissionResult = {
  score: number
  feedback: string
  day: number
}

// ─── Typing dots ──────────────────────────────────────────────────────────────
function TypingDots() {
  const [dot, setDot] = React.useState(0)
  React.useEffect(() => {
    const t = setInterval(() => setDot(d => (d + 1) % 3), 400)
    return () => clearInterval(t)
  }, [])
  return (
    <span style={{ display: 'inline-flex', gap: '4px', alignItems: 'center', padding: '4px 0' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: i === dot ? GREEN : '#2a2a2a',
          transition: 'background 0.3s', display: 'inline-block',
        }} />
      ))}
    </span>
  )
}

// ─── Mission passed screen ────────────────────────────────────────────────────
function MissionPassedScreen({ result, onNext }: { result: MissionResult; onNext: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)',
      backdropFilter: 'blur(12px)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{
        background: 'linear-gradient(160deg, #060f07, #091a0c)',
        border: '1px solid rgba(74,222,128,.3)',
        borderRadius: '24px', padding: '56px 64px',
        textAlign: 'center', maxWidth: '480px', width: '90%',
        boxShadow: '0 0 80px rgba(74,222,128,.15)',
      }}>
        <div style={{ fontSize: '56px', marginBottom: '20px' }}>✦</div>

        <p style={{ color: GREEN, fontSize: '11px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '16px', fontFamily: 'monospace' }}>
          Mission Complete
        </p>

        <h2 style={{ color: '#fff', fontSize: '40px', fontWeight: '900', letterSpacing: '-2px', lineHeight: 1, marginBottom: '20px' }}>
          Day {result.day} Passed
        </h2>

        {/* Score ring */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '100px', height: '100px', borderRadius: '50%',
            background: `conic-gradient(${GREEN} ${result.score}%, #111 0%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            <div style={{
              width: '76px', height: '76px', borderRadius: '50%',
              background: '#060f07',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column',
            }}>
              <span style={{ color: '#fff', fontSize: '24px', fontWeight: '900', lineHeight: 1 }}>{result.score}</span>
              <span style={{ color: GREEN, fontSize: '10px', fontFamily: 'monospace' }}>/100</span>
            </div>
          </div>
        </div>

        <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '15px', lineHeight: 1.6, marginBottom: '36px', maxWidth: '360px', margin: '0 auto 36px' }}>
          {result.feedback}
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={onNext}
            style={{
              background: GREEN, color: '#050f06',
              border: 'none', borderRadius: '12px',
              padding: '14px 32px', fontSize: '15px',
              fontWeight: '800', cursor: 'pointer',
              letterSpacing: '-0.3px',
            }}
          >
            Next Mission →
          </button>
        </div>

        <p style={{ color: '#1a3a1f', fontSize: '11px', marginTop: '20px', fontFamily: 'monospace' }}>+50 XP added to your account</p>
      </div>
    </div>
  )
}

// ─── Main MissionChat component ───────────────────────────────────────────────
export default function MissionChat({
  userId,
  mission,
}: {
  userId: string
  mission: {
    day: number
    title: string
    difficulty: string
    objective: string
    system_prompt: string
    success_criteria: string
  }
}) {
  const [messages, setMessages] = React.useState<Message[]>([])
  const [input, setInput] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [missionResult, setMissionResult] = React.useState<MissionResult | null>(null)
  const bottomRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const router = useRouter()
  const diffColor = DIFFICULTY_COLOR[mission.difficulty] || GREEN

  // Load confetti script once
  React.useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).confetti) {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js'
      document.head.appendChild(script)
    }
  }, [])

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  React.useEffect(() => {
    startMission()
  }, [])

  const fireConfetti = () => {
    if (typeof (window as any).confetti === 'undefined') return
    const c = (window as any).confetti

    // First burst
    c({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#4ade80', '#22d3ee', '#fff', '#fbbf24'] })

    // Side cannons
    setTimeout(() => {
      c({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#4ade80', '#fff'] })
      c({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#4ade80', '#fff'] })
    }, 300)
  }

  const startMission = async () => {
    setLoading(true)
    const initMessages = [{ role: 'user', content: 'I am ready. Let\'s start.' }]
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: initMessages, userId, mode: 'mission', missionDay: mission.day }),
    })
    await streamResponse(res, initMessages)
    setLoading(false)
    inputRef.current?.focus()
  }

  const streamResponse = async (res: Response, currentMessages: Message[]) => {
    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let fullResponse = ''
    let missionSignalHandled = false

    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      fullResponse += chunk

      // ── Detect MISSION_PASSED signal ────────────────────────────────────────
      if (!missionSignalHandled && fullResponse.includes('MISSION_PASSED:')) {
        missionSignalHandled = true
        try {
          const signalStart = fullResponse.indexOf('MISSION_PASSED:') + 'MISSION_PASSED:'.length
          const signalEnd = fullResponse.indexOf('\n', signalStart)
          const signalJson = fullResponse.substring(signalStart, signalEnd === -1 ? undefined : signalEnd)
          const result: MissionResult = JSON.parse(signalJson)

          // Strip the signal line from visible text
          fullResponse = fullResponse.replace(/MISSION_PASSED:.*\n?/, '')

          // Fire confetti + show result screen after a short delay
          setTimeout(() => {
            fireConfetti()
            setMissionResult(result)
          }, 800)
        } catch {
          fullResponse = fullResponse.replace(/MISSION_PASSED:.*\n?/, '')
        }
      }

      // Update visible message (always strip signal if present)
      const visibleText = fullResponse.replace(/MISSION_PASSED:.*\n?/, '')
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: visibleText }
        return updated
      })
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading || missionResult) return
    setLoading(true)
    const newMessages = [...messages, { role: 'user', content: input }]
    setMessages(newMessages)
    setInput('')

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: newMessages, userId, mode: 'mission', missionDay: mission.day }),
    })
    await streamResponse(res, newMessages)
    setLoading(false)
    inputRef.current?.focus()
  }

  return (
    <>
      {/* Mission passed overlay */}
      {missionResult && (
        <MissionPassedScreen
          result={missionResult}
          onNext={() => router.push('/dashboard')}
        />
      )}

      <div style={{
        display: 'flex', flexDirection: 'column', height: '65vh',
        background: '#0a0a0a', borderRadius: '16px',
        border: `1px solid rgba(74,222,128,.1)`,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}>

        {/* Mission header */}
        <div style={{
          padding: '16px 24px', borderBottom: '1px solid #141414',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(74,222,128,.08)', border: '1px solid rgba(74,222,128,.2)', borderRadius: '20px', padding: '4px 12px' }}>
              <span style={{ color: GREEN, fontSize: '11px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                Day {mission.day}
              </span>
            </div>
            <span style={{ color: '#fff', fontSize: '15px', fontWeight: '700' }}>{mission.title}</span>
          </div>
          <div style={{ background: `${diffColor}15`, border: `1px solid ${diffColor}30`, borderRadius: '20px', padding: '4px 12px' }}>
            <span style={{ color: diffColor, fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: 'monospace' }}>
              {mission.difficulty}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎯</div>
              <div style={{ color: '#333', fontSize: '14px' }}>Starting simulation...</div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-start', gap: '10px' }}>
              {m.role === 'assistant' && (
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: '#141414', border: '1px solid #1f1f1f',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', flexShrink: 0, marginTop: '2px', color: GREEN,
                }}>✦</div>
              )}
              <div style={{
                maxWidth: '72%', padding: '12px 16px',
                borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: m.role === 'user' ? GREEN : '#141414',
                color: m.role === 'user' ? '#050f06' : '#e5e5e5',
                fontSize: '15px', lineHeight: 1.65,
                border: m.role === 'assistant' ? '1px solid #1f1f1f' : 'none',
              }}>
                {!m.content && loading && i === messages.length - 1 && m.role === 'assistant'
                  ? <TypingDots />
                  : m.content}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '16px', borderTop: '1px solid #1a1a1a', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Reply in the target language..."
            disabled={loading || !!missionResult}
            style={{
              flex: 1, background: '#111', border: '1px solid #222',
              borderRadius: '12px', padding: '14px 18px', color: '#fff',
              fontSize: '15px', outline: 'none', fontFamily: 'inherit',
              opacity: loading ? 0.6 : 1,
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim() || !!missionResult}
            style={{
              background: loading || !input.trim() ? '#1a3a2a' : GREEN,
              color: loading || !input.trim() ? '#2a5a3a' : '#050f06',
              borderRadius: '12px', padding: '14px 22px',
              fontWeight: '800', fontSize: '14px', border: 'none',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}
          >
            {loading ? '...' : 'Send →'}
          </button>
        </div>
      </div>
    </>
  )
}