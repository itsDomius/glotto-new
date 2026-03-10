// ════════════════════════════════════════════════════════════════════════════
// FILE: src/components/MissionChat.tsx
// ════════════════════════════════════════════════════════════════════════════
'use client'
import { useState, useRef, useEffect } from 'react'
import type { Mission } from '@/lib/data/missions'

declare global { interface Window { confetti: (o: Record<string, unknown>) => void } }

type Msg = { role: 'user' | 'assistant'; content: string }
type PassedData = {
  score: number
  processScore: number
  languageScore: number
  feedback: string
  day: number
  affiliateReward?: {
    partner: string
    offer_text: string
    cta_url: string
    cta_label: string
  } | null
}

export default function MissionChat({
  userId,
  mission,
  isPaidUser = true,
}: {
  userId: string
  mission: Mission
  isPaidUser?: boolean
}) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [passed, setPassed] = useState<PassedData | null>(null)
  const [showAffiliate, setShowAffiliate] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fireConfetti = () => {
    if (typeof window !== 'undefined' && window.confetti) {
      window.confetti({ particleCount: 150, spread: 80, origin: { x: 0, y: 0.6 } })
      setTimeout(() => window.confetti({ particleCount: 150, spread: 80, origin: { x: 1, y: 0.6 } }), 300)
    }
  }

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg: Msg = { role: 'user', content: input }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, userId, mode: 'mission', missionDay: mission.day }),
      })

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let full = ''
      let passedData: PassedData | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)

        if (chunk.startsWith('MISSION_PASSED:')) {
          try {
            passedData = JSON.parse(chunk.replace('MISSION_PASSED:', '').split('\n')[0])
          } catch { /* ignore */ }
          full += chunk.replace(/MISSION_PASSED:[^\n]+\n?/, '')
        } else {
          full += chunk
        }

        setMessages(prev => {
          const last = prev[prev.length - 1]
          if (last?.role === 'assistant') return [...prev.slice(0, -1), { role: 'assistant', content: full }]
          return [...prev, { role: 'assistant', content: full }]
        })
      }

      if (passedData) {
        setTimeout(() => {
          fireConfetti()
          setPassed(passedData!)
          if (passedData?.affiliateReward) setTimeout(() => setShowAffiliate(true), 1000)
        }, 700)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const diffColor: Record<string, string> = {
    Beginner: '#60a5fa', Easy: '#34d399', Medium: '#fbbf24', Hard: '#f97316', Expert: '#f87171',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '600px', background: '#0a0a0a', position: 'relative' }}>
      <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js" async />
      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)} }
        @keyframes fadeIn { from{opacity:0}to{opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
        @keyframes scaleIn { from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)} }
      `}</style>

      {/* ── Mission header ─────────────────────────────────────────────── */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '3px 10px', fontSize: '11px', fontWeight: '700', color: '#444' }}>
          DAY {mission.day}
        </div>
        <span style={{ color: '#fff', fontWeight: '700', fontSize: '14px', flex: 1 }}>{mission.title}</span>
        <div style={{ background: `${diffColor[mission.difficulty] || '#fff'}15`, border: `1px solid ${diffColor[mission.difficulty] || '#fff'}40`, borderRadius: '8px', padding: '3px 10px', color: diffColor[mission.difficulty] || '#fff', fontSize: '11px', fontWeight: '700' }}>
          {mission.difficulty}
        </div>
        <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '3px 10px', fontSize: '11px', color: '#333', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          🎭 {mission.npc_persona?.split('.')[0] || 'NPC'}
        </div>
      </div>

      {/* ── Messages ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ width: 48, height: 48, borderRadius: '14px', background: '#111', border: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', margin: '0 auto 16px' }}>✦</div>
            <p style={{ color: '#333', fontSize: '13px' }}>Type your first message to start the simulation</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '10px', animation: 'slideUp 0.25s ease both' }}>
            {msg.role === 'assistant' && (
              <div style={{ width: 32, height: 32, borderRadius: '10px', background: '#111', border: '1px solid #1f1f1f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>✦</div>
            )}
            <div style={{
              background: msg.role === 'user' ? '#0f2a1a' : '#111',
              border: `1px solid ${msg.role === 'user' ? '#1a3a1f' : '#1a1a1a'}`,
              borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
              padding: '12px 16px', maxWidth: '78%',
              fontSize: '14px', lineHeight: 1.65,
              color: msg.role === 'user' ? '#fff' : '#ccc',
              whiteSpace: 'pre-wrap',
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ width: 32, height: 32, borderRadius: '10px', background: '#111', border: '1px solid #1f1f1f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>✦</div>
            <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '4px 16px 16px 16px', padding: '14px 16px', display: 'flex', gap: '5px', alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#333', animation: `bounce 1s ease ${i * 0.15}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ─────────────────────────────────────────────────── */}
      {!passed && (
        <div style={{ padding: '14px 20px', borderTop: '1px solid #111', display: 'flex', gap: '10px', flexShrink: 0 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Reply in the target language..."
            disabled={loading}
            style={{ flex: 1, background: '#111', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '12px 16px', color: '#fff', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
          />
          <button
            onClick={send} disabled={!input.trim() || loading}
            style={{ background: input.trim() && !loading ? '#4ade80' : '#111', color: input.trim() && !loading ? '#050f06' : '#333', border: 'none', borderRadius: '12px', padding: '12px 20px', fontWeight: '800', fontSize: '14px', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}
          >
            →
          </button>
        </div>
      )}

      {/* ══ FEATURE 1: MISSION PASSED OVERLAY ══════════════════════════ */}
      {passed && !showAffiliate && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,5,5,0.97)', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', zIndex: 50, animation: 'fadeIn 0.4s ease both' }}>
          {/* Score ring */}
          <div style={{ width: 130, height: 130, borderRadius: '50%', background: `conic-gradient(#4ade80 ${passed.score * 3.6}deg, #1a1a1a 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <div style={{ width: 104, height: 104, borderRadius: '50%', background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#4ade80', fontSize: '30px', fontWeight: '800', lineHeight: 1 }}>{passed.score}</span>
              <span style={{ color: '#333', fontSize: '11px' }}>/100</span>
            </div>
          </div>

          <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: '800', marginBottom: '6px' }}>Mission Complete ✦</h2>
          <p style={{ color: '#555', fontSize: '13px', textAlign: 'center', maxWidth: '300px', lineHeight: 1.6, marginBottom: '20px' }}>{passed.feedback}</p>

          {/* Sub-scores */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '28px' }}>
            {[
              { label: 'Process', score: passed.processScore, color: '#60a5fa' },
              { label: 'Language', score: passed.languageScore, color: '#4ade80' },
            ].map(({ label, score, color }) => (
              <div key={label} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '12px 20px', textAlign: 'center' }}>
                <p style={{ color: '#444', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>{label}</p>
                <p style={{ color, fontSize: '24px', fontWeight: '800' }}>{score}</p>
              </div>
            ))}
          </div>

          {passed.affiliateReward ? (
            <button
              onClick={() => setShowAffiliate(true)}
              style={{ background: '#4ade80', color: '#050f06', border: 'none', borderRadius: '12px', padding: '14px 28px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', marginBottom: '10px', fontFamily: 'inherit' }}
            >
              Claim Your Reward →
            </button>
          ) : (
            <a href="/dashboard" style={{ background: '#4ade80', color: '#050f06', textDecoration: 'none', borderRadius: '12px', padding: '14px 28px', fontWeight: '800', fontSize: '15px' }}>
              Next Mission →
            </a>
          )}
        </div>
      )}

      {/* ══ FEATURE 4: AFFILIATE SUCCESS GATEWAY ═══════════════════════ */}
      {showAffiliate && passed?.affiliateReward && (
        <div style={{ position: 'absolute', inset: 0, background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', zIndex: 60, animation: 'scaleIn 0.4s ease both' }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>🏆</div>
          <div style={{ background: '#0f2a1a', border: '1px solid #1a3a1f', borderRadius: '8px', padding: '4px 14px', fontSize: '11px', color: '#4ade80', fontWeight: '700', marginBottom: '20px', letterSpacing: '0.1em' }}>
            MISSION ACCOMPLISHED
          </div>
          <h2 style={{ color: '#fff', fontSize: '26px', fontWeight: '800', letterSpacing: '-0.02em', textAlign: 'center', marginBottom: '10px' }}>
            You survived the {passed.affiliateReward.partner} mission.
          </h2>
          <p style={{ color: '#555', fontSize: '15px', textAlign: 'center', maxWidth: '360px', lineHeight: 1.7, marginBottom: '36px' }}>
            {passed.affiliateReward.offer_text}
          </p>

          {/* THE BIG AFFILIATE CTA */}
          <a
            href={passed.affiliateReward.cta_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              fetch('/api/affiliate/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ partner: passed.affiliateReward!.partner, cta_url: passed.affiliateReward!.cta_url, userId }),
              }).catch(() => {})
            }}
            style={{
              background: '#4ade80',
              color: '#050f06',
              textDecoration: 'none',
              borderRadius: '16px',
              padding: '20px 40px',
              fontWeight: '800',
              fontSize: '18px',
              display: 'block',
              textAlign: 'center',
              marginBottom: '14px',
              boxShadow: '0 0 0 1px #4ade8030, 0 8px 32px rgba(74,222,128,0.2)',
            }}
          >
            {passed.affiliateReward.cta_label}
          </a>
          <a href="/dashboard" style={{ color: '#333', fontSize: '13px', textDecoration: 'none' }}>
            Skip — go to next mission
          </a>
        </div>
      )}
    </div>
  )
}