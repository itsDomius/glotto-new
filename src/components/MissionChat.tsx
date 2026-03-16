// ════════════════════════════════════════════════════════════════════════════
// FILE: src/components/MissionChat.tsx
// FEATURES: AI initiates, 3 RPG preset buttons, unlock animation, badge modal
// ════════════════════════════════════════════════════════════════════════════
'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import type { Mission } from '@/lib/data/missions'

declare global {
  interface Window { confetti: (o: Record<string, unknown>) => void }
}

type Msg = { role: 'user' | 'assistant'; content: string; suggestions?: string[] }
type PassedData = {
  score: number; processScore: number; languageScore: number
  feedback: string; day: number
  affiliateReward?: { partner: string; offer_text: string; cta_url: string; cta_label: string } | null
}

const DIFF_COLOR: Record<string, string> = {
  Beginner: '#60a5fa', Easy: '#34d399', Medium: '#fbbf24', Hard: '#f97316', Expert: '#f87171',
}

// ── Badge level based on score ───────────────────────────────────────────────
function getBadge(score: number) {
  if (score >= 90) return { icon: '🥇', label: 'Survival Expert',    color: '#fbbf24' }
  if (score >= 75) return { icon: '🥈', label: 'Confidence Badge',   color: '#60a5fa' }
  if (score >= 60) return { icon: '🥉', label: 'Field Ready',        color: '#fb923c' }
  return              { icon: '🎖',  label: 'First Attempt',         color: '#888'    }
}

export default function MissionChat({
  userId, mission, isPaidUser = true, targetLanguage = 'greek',
}: {
  userId: string; mission: Mission; isPaidUser?: boolean; targetLanguage?: string
}) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [passed, setPassed] = useState<PassedData | null>(null)
  const [showAffiliate, setShowAffiliate] = useState(false)
  const [showBadge, setShowBadge] = useState(false)
  const [justUnlocked, setJustUnlocked] = useState(false)
  const [initiated, setInitiated] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const fireConfetti = () => {
    if (typeof window !== 'undefined' && window.confetti) {
      window.confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } })
      setTimeout(() => window.confetti({ particleCount: 150, spread: 80, origin: { x: 0, y: 0.6 } }), 250)
      setTimeout(() => window.confetti({ particleCount: 150, spread: 80, origin: { x: 1, y: 0.6 } }), 500)
    }
  }

  // ── AI INITIATES the conversation on mount ────────────────────────────────
  const initConversation = useCallback(async () => {
    if (initiated) return
    setInitiated(true)
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [],
          userId,
          mode: 'mission',
          missionDay: mission.day,
          targetLanguage,
          initiate: true, // ← tells API to speak first
        }),
      })
      const data = await res.json()
      if (data.reply) {
        setMessages([{ role: 'assistant', content: data.reply, suggestions: data.suggestions || [] }])
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false); setTimeout(() => inputRef.current?.focus(), 100) }
  }, [initiated, userId, mission.day, targetLanguage])

  useEffect(() => { initConversation() }, [initConversation])

  // ── Send message (text or preset) ─────────────────────────────────────────
  const send = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim()
    if (!text || loading) return
    const userMsg: Msg = { role: 'user', content: text }
    const chatHistory = messages.map(m => ({ role: m.role, content: m.content }))
    const next = [...chatHistory, { role: 'user' as const, content: text }]
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next, userId, mode: 'mission',
          missionDay: mission.day, targetLanguage,
        }),
      })

      // Check if streaming or JSON
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const data = await res.json()
        if (data.passed) {
          handlePassed(data.passedData)
          setMessages(prev => [...prev, { role: 'assistant', content: data.reply, suggestions: [] }])
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: data.reply, suggestions: data.suggestions || [] }])
        }
      } else {
        // streaming fallback
        const reader = res.body!.getReader()
        const decoder = new TextDecoder()
        let full = ''; let passedData: PassedData | null = null
        setMessages(prev => [...prev, { role: 'assistant', content: '' }])
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          if (chunk.startsWith('MISSION_PASSED:')) {
            try { passedData = JSON.parse(chunk.replace('MISSION_PASSED:', '').split('\n')[0]) } catch { /**/ }
            full += chunk.replace(/MISSION_PASSED:[^\n]+\n?/, '')
          } else { full += chunk }
          setMessages(prev => {
            const last = prev[prev.length - 1]
            if (last?.role === 'assistant') return [...prev.slice(0, -1), { role: 'assistant', content: full }]
            return [...prev, { role: 'assistant', content: full }]
          })
        }
        if (passedData) handlePassed(passedData)
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false); setTimeout(() => inputRef.current?.focus(), 50) }
  }

  const handlePassed = (data: PassedData) => {
    setTimeout(() => {
      fireConfetti()
      setJustUnlocked(true)
      setTimeout(() => {
        setPassed(data)
        setShowBadge(true)
      }, 800)
    }, 400)
  }

  const langDisplay = targetLanguage.charAt(0).toUpperCase() + targetLanguage.slice(1)
  const lastMsg = messages[messages.length - 1]
  const suggestions = (!loading && lastMsg?.role === 'assistant') ? (lastMsg.suggestions || []) : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '640px', background: '#0a0a0a', position: 'relative', overflow: 'hidden' }}>
      <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js" async />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUpFast{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes scaleIn{from{opacity:0;transform:scale(0.88)}to{opacity:1;transform:scale(1)}}
        @keyframes unlockPulse{0%{box-shadow:0 0 0 0 rgba(74,222,128,.8)}70%{box-shadow:0 0 0 20px rgba(74,222,128,0)}100%{box-shadow:0 0 0 0 rgba(74,222,128,0)}}
        @keyframes badgeReveal{0%{opacity:0;transform:scale(0.5) rotate(-10deg)}60%{transform:scale(1.15) rotate(3deg)}100%{opacity:1;transform:scale(1) rotate(0deg)}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes presetIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .preset-btn{transition:all .15s;cursor:pointer;font-family:'DM Sans',sans-serif;border:none}
        .preset-btn:hover{transform:translateY(-2px)!important;border-color:#4ade80!important;color:#fff!important}
        .preset-btn:active{transform:translateY(0)!important}
        .send-btn{transition:all .15s;border:none;cursor:pointer;font-family:'DM Sans',sans-serif}
        .send-btn:hover{transform:scale(1.05)}
        input:focus{outline:none}
        .msg-scroll::-webkit-scrollbar{width:4px}
        .msg-scroll::-webkit-scrollbar-thumb{background:#1a1a1a;border-radius:4px}
        .unlock-glow{animation:unlockPulse .6s ease-out}
      `}</style>

      {/* ── Header ── */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, background: '#070707' }}>
        <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '4px 11px', fontSize: '12px', fontWeight: '700', color: '#444', fontFamily: '"DM Mono", monospace' }}>DAY {mission.day}</div>
        <span style={{ color: '#fff', fontWeight: '700', fontSize: '15px', flex: 1 }}>{mission.title}</span>
        <div style={{ background: `${DIFF_COLOR[mission.difficulty] || '#fff'}15`, border: `1px solid ${DIFF_COLOR[mission.difficulty] || '#fff'}40`, borderRadius: '8px', padding: '4px 11px', color: DIFF_COLOR[mission.difficulty] || '#fff', fontSize: '12px', fontWeight: '700' }}>
          {mission.difficulty}
        </div>
        <div style={{ background: '#0f2a1a', border: '1px solid #1a3a1f', borderRadius: '8px', padding: '4px 11px', fontSize: '12px', fontWeight: '700', color: '#4ade80', fontFamily: '"DM Mono", monospace' }}>
          🗣 {langDisplay}
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="msg-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Initial loading state */}
        {messages.length === 0 && loading && (
          <div style={{ display: 'flex', gap: '12px', animation: 'slideUp .3s ease' }}>
            <div style={{ width: 36, height: 36, borderRadius: '11px', background: '#111', border: '1px solid #1f1f1f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🎭</div>
            <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '4px 16px 16px 16px', padding: '14px 18px', display: 'flex', gap: '5px', alignItems: 'center' }}>
              <span style={{ color: '#333', fontSize: '12px', fontFamily: '"DM Mono", monospace', marginRight: 8 }}>Setting the scene...</span>
              {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', animation: `bounce 1s ease ${i*0.2}s infinite` }} />)}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '12px', animation: 'slideUp 0.25s ease both' }}>
            {msg.role === 'assistant' && (
              <div style={{ width: 36, height: 36, borderRadius: '11px', background: '#111', border: '1px solid #1f1f1f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, marginTop: 2 }}>🎭</div>
            )}
            <div style={{
              background: msg.role === 'user' ? '#0f2a1a' : '#111',
              border: `1px solid ${msg.role === 'user' ? '#1a3a1f' : '#1a1a1a'}`,
              borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
              padding: '13px 17px', maxWidth: '78%', fontSize: '15px', lineHeight: 1.7,
              color: msg.role === 'user' ? '#e8fef0' : '#d0d0d0', whiteSpace: 'pre-wrap',
              fontFamily: '"DM Sans", sans-serif',
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && messages.length > 0 && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ width: 36, height: 36, borderRadius: '11px', background: '#111', border: '1px solid #1f1f1f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🎭</div>
            <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '4px 16px 16px 16px', padding: '15px 18px', display: 'flex', gap: '6px', alignItems: 'center' }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#333', animation: `bounce 1s ease ${i*0.15}s infinite` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── RPG Preset Buttons ── */}
      {!passed && suggestions.length > 0 && (
        <div style={{ padding: '10px 22px 0', display: 'flex', gap: '8px', flexWrap: 'wrap', flexShrink: 0 }}>
          {suggestions.map((s, i) => (
            <button
              key={i}
              className="preset-btn"
              onClick={() => send(s)}
              disabled={loading}
              style={{
                background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: '20px',
                padding: '8px 16px', fontSize: '13px', fontWeight: '600', color: '#888',
                animation: `presetIn .2s ease ${i * 0.06}s both`,
                opacity: loading ? 0.4 : 1,
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* ── Input bar ── */}
      {!passed && (
        <div style={{ padding: '12px 22px 16px', display: 'flex', gap: '10px', flexShrink: 0, borderTop: suggestions.length === 0 ? '1px solid #111' : 'none', marginTop: suggestions.length > 0 ? 10 : 0 }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder={`Reply in ${langDisplay}... (or pick an option above)`}
            disabled={loading}
            style={{ flex: 1, background: '#111', border: '1px solid #1a1a1a', borderRadius: '13px', padding: '13px 17px', color: '#fff', fontSize: '15px', fontFamily: '"DM Sans", sans-serif', transition: 'border-color .15s' }}
          />
          <button className="send-btn" onClick={() => send()} disabled={!input.trim() || loading}
            style={{ background: input.trim() && !loading ? '#4ade80' : '#111', color: input.trim() && !loading ? '#050f06' : '#333', borderRadius: '13px', padding: '13px 22px', fontWeight: '800', fontSize: '16px' }}>
            →
          </button>
        </div>
      )}

      {/* ── UNLOCK FLASH (between missions) ── */}
      {justUnlocked && !showBadge && (
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, rgba(74,222,128,.15), transparent 70%)', pointerEvents: 'none', animation: 'fadeIn .3s ease', zIndex: 40 }} />
      )}

      {/* ── SURVIVAL BADGE MODAL ── */}
      {showBadge && passed && !showAffiliate && (() => {
        const badge = getBadge(passed.score)
        return (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(4,4,4,.96)', backdropFilter: 'blur(16px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', zIndex: 50, animation: 'fadeIn 0.35s ease both' }}>

            {/* Badge icon */}
            <div style={{ fontSize: '80px', marginBottom: '8px', animation: 'badgeReveal .6s cubic-bezier(.16,1,.3,1) .1s both', filter: 'drop-shadow(0 0 24px rgba(74,222,128,.4))' }}>
              {badge.icon}
            </div>

            {/* Badge label */}
            <div style={{ background: `${badge.color}15`, border: `1px solid ${badge.color}40`, borderRadius: '100px', padding: '5px 16px', fontSize: '11px', fontWeight: '800', color: badge.color, letterSpacing: '0.12em', fontFamily: '"DM Mono", monospace', marginBottom: '20px', animation: 'slideUpFast .4s ease .3s both' }}>
              {badge.label.toUpperCase()}
            </div>

            {/* Score ring */}
            <div style={{ width: 120, height: 120, borderRadius: '50%', background: `conic-gradient(#4ade80 ${passed.score * 3.6}deg, #1a1a1a 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '22px', animation: 'scaleIn .5s cubic-bezier(.16,1,.3,1) .2s both' }}>
              <div style={{ width: 96, height: 96, borderRadius: '50%', background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                <span style={{ color: '#4ade80', fontSize: '28px', fontWeight: '900', lineHeight: 1, fontFamily: '"DM Mono", monospace' }}>{passed.score}</span>
                <span style={{ color: '#333', fontSize: '11px', fontFamily: '"DM Mono", monospace' }}>/ 100</span>
              </div>
            </div>

            <h2 style={{ color: '#fff', fontSize: '26px', fontWeight: '900', letterSpacing: '-0.5px', marginBottom: '8px', animation: 'slideUpFast .4s ease .35s both' }}>
              Mission Complete
            </h2>
            <p style={{ color: '#555', fontSize: '14px', textAlign: 'center', maxWidth: '320px', lineHeight: 1.6, marginBottom: '28px', animation: 'slideUpFast .4s ease .4s both' }}>
              {passed.feedback}
            </p>

            {/* Sub-scores */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', animation: 'slideUpFast .4s ease .45s both' }}>
              {[{ label: 'Process', score: passed.processScore, color: '#60a5fa', icon: '📋' }, { label: 'Language', score: passed.languageScore, color: '#4ade80', icon: '🗣' }].map(({ label, score, color, icon }) => (
                <div key={label} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: '14px', padding: '16px 24px', textAlign: 'center', minWidth: 100 }}>
                  <p style={{ fontSize: '18px', marginBottom: '6px' }}>{icon}</p>
                  <p style={{ color: '#444', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: '"DM Mono", monospace', marginBottom: '5px' }}>{label}</p>
                  <p style={{ color, fontSize: '28px', fontWeight: '900', fontFamily: '"DM Mono", monospace', lineHeight: 1 }}>{score}</p>
                </div>
              ))}
            </div>

            {/* Readiness statement */}
            <div style={{ background: '#0f2a1a', border: '1px solid #1a3a1f', borderRadius: '12px', padding: '12px 20px', marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '10px', animation: 'slideUpFast .4s ease .5s both' }}>
              <span style={{ fontSize: '16px' }}>✅</span>
              <p style={{ color: '#4ade80', fontSize: '14px', fontWeight: '700' }}>
                You are ready for the real {mission.category} office
              </p>
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '10px', animation: 'slideUpFast .4s ease .55s both' }}>
              {passed.affiliateReward ? (
                <button onClick={() => { setShowBadge(false); setShowAffiliate(true) }} style={{ background: '#4ade80', color: '#050f06', border: 'none', borderRadius: '13px', padding: '14px 28px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Claim Your Reward →
                </button>
              ) : (
                <a href="/dashboard" style={{ background: '#4ade80', color: '#050f06', textDecoration: 'none', borderRadius: '13px', padding: '14px 28px', fontWeight: '800', fontSize: '15px' }}>
                  Next Mission →
                </a>
              )}
              <a href="/dashboard" style={{ background: '#111', color: '#555', border: '1px solid #1a1a1a', textDecoration: 'none', borderRadius: '13px', padding: '14px 24px', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center' }}>
                Dashboard
              </a>
            </div>
          </div>
        )
      })()}

      {/* ── Affiliate gateway ── */}
      {showAffiliate && passed?.affiliateReward && (
        <div style={{ position: 'absolute', inset: 0, background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', zIndex: 60, animation: 'scaleIn 0.4s ease both' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🏆</div>
          <div style={{ background: '#0f2a1a', border: '1px solid #1a3a1f', borderRadius: '8px', padding: '5px 15px', fontSize: '12px', color: '#4ade80', fontWeight: '700', marginBottom: '20px', letterSpacing: '0.1em', fontFamily: '"DM Mono", monospace' }}>MISSION ACCOMPLISHED</div>
          <h2 style={{ color: '#fff', fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em', textAlign: 'center', marginBottom: '12px' }}>You survived the {passed.affiliateReward.partner} mission.</h2>
          <p style={{ color: '#555', fontSize: '16px', textAlign: 'center', maxWidth: '380px', lineHeight: 1.7, marginBottom: '38px' }}>{passed.affiliateReward.offer_text}</p>
          <a href={passed.affiliateReward.cta_url} target="_blank" rel="noopener noreferrer"
            onClick={() => fetch('/api/affiliate/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ partner: passed.affiliateReward!.partner, cta_url: passed.affiliateReward!.cta_url, userId }) }).catch(() => {})}
            style={{ background: '#4ade80', color: '#050f06', textDecoration: 'none', borderRadius: '16px', padding: '20px 42px', fontWeight: '800', fontSize: '19px', display: 'block', textAlign: 'center', marginBottom: '14px', boxShadow: '0 0 0 1px #4ade8030, 0 8px 32px rgba(74,222,128,0.2)' }}>
            {passed.affiliateReward.cta_label}
          </a>
          <a href="/dashboard" style={{ color: '#333', fontSize: '14px', textDecoration: 'none' }}>Skip — go to next mission</a>
        </div>
      )}
    </div>
  )
}