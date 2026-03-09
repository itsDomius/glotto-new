'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Message = { role: 'user' | 'assistant'; content: string }

const EMERGENCY_SYSTEM_PROMPT = `You are an emergency translator and fixer. The user is in a high-stress situation in a foreign country right now. Provide extremely short, phonetically easy-to-read translations or direct instructions. NO conversational filler. NO formatting. Just the exact words they need to say to survive this moment.`

const QUICK_PHRASES = [
  { label: 'I need help', emoji: '🆘' },
  { label: 'Call the police', emoji: '🚔' },
  { label: 'I need a doctor', emoji: '🏥' },
  { label: 'I don\'t understand', emoji: '❓' },
  { label: 'Where is the exit?', emoji: '🚪' },
  { label: 'How much does this cost?', emoji: '💰' },
]

function TypingDots() {
  const [dot, setDot] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setDot(d => (d + 1) % 3), 300)
    return () => clearInterval(t)
  }, [])
  return (
    <span style={{ display: 'inline-flex', gap: '5px', alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: i === dot ? '#ff3b3b' : '#2a0a0a',
          transition: 'background 0.2s',
          display: 'inline-block',
        }} />
      ))}
    </span>
  )
}

export default function EmergencyPage() {
  const [activated, setActivated] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [language, setLanguage] = useState('spanish')
  const [buttonPulsing, setButtonPulsing] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data: profile } = await supabase
          .from('profiles')
          .select('target_language')
          .eq('user_id', user.id)
          .single()
        if (profile?.target_language) setLanguage(profile.target_language)
      }
    }
    getUser()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const activate = () => {
    setActivated(true)
    setButtonPulsing(false)
    setTimeout(() => inputRef.current?.focus(), 300)
  }

  const streamResponse = async (msgHistory: Message[]) => {
    const res = await fetch('/api/emergency', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: msgHistory, language }),
    })

    if (!res.ok) {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: 'Error. Try again.' }
        return updated
      })
      return
    }

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let full = ''

    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      full += decoder.decode(value)
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: full }
        return updated
      })
    }
  }

  const send = async (text?: string) => {
    const msg = (text || input).trim()
    if (!msg || loading) return

    setLoading(true)
    const newMessages: Message[] = [...messages, { role: 'user', content: msg }]
    setMessages(newMessages)
    setInput('')

    await streamResponse(newMessages)
    setLoading(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  // ── PRE-ACTIVATION: Panic Button screen ─────────────────────────────────────
  if (!activated) return (
    <div style={{
      minHeight: '100vh',
      background: '#050505',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"Courier New", Courier, monospace',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes pulseRed {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,59,59,0.6), 0 0 60px rgba(255,59,59,0.15); }
          50% { box-shadow: 0 0 0 24px rgba(255,59,59,0), 0 0 80px rgba(255,59,59,0.3); }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes flicker {
          0%, 97%, 100% { opacity: 1; }
          98% { opacity: 0.7; }
          99% { opacity: 0.9; }
        }
        .sos-btn {
          animation: pulseRed 1.8s ease-in-out infinite;
          transition: transform 0.1s ease, background 0.1s ease;
          cursor: pointer;
          border: none;
          font-family: "Courier New", Courier, monospace;
        }
        .sos-btn:hover { transform: scale(1.03); }
        .sos-btn:active { transform: scale(0.97); }
        .flicker { animation: flicker 8s ease infinite; }
        .scanline {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: rgba(255,59,59,0.08);
          animation: scanline 4s linear infinite;
          pointer-events: none;
        }
      `}</style>

      {/* Scanline effect */}
      <div className="scanline" />

      {/* Grid background */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,59,59,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,59,59,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      {/* Corner decorations */}
      {[
        { top: '24px', left: '24px', borderTop: '2px solid #ff3b3b', borderLeft: '2px solid #ff3b3b' },
        { top: '24px', right: '24px', borderTop: '2px solid #ff3b3b', borderRight: '2px solid #ff3b3b' },
        { bottom: '24px', left: '24px', borderBottom: '2px solid #ff3b3b', borderLeft: '2px solid #ff3b3b' },
        { bottom: '24px', right: '24px', borderBottom: '2px solid #ff3b3b', borderRight: '2px solid #ff3b3b' },
      ].map((style, i) => (
        <div key={i} style={{ position: 'absolute', width: '32px', height: '32px', ...style }} />
      ))}

      {/* Back */}
      <button
        onClick={() => router.push('/dashboard')}
        style={{ position: 'absolute', top: '32px', left: '50%', transform: 'translateX(-50%)', background: 'none', border: 'none', color: '#330000', fontSize: '11px', cursor: 'pointer', letterSpacing: '2px', fontFamily: 'inherit' }}
      >
        ← BACK
      </button>

      {/* Status */}
      <div className="flicker" style={{ marginBottom: '48px', textAlign: 'center' }}>
        <p style={{ color: '#ff3b3b', fontSize: '11px', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '8px', opacity: 0.6 }}>
          EMERGENCY TRANSLATOR
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <div style={{ width: '6px', height: '6px', background: '#ff3b3b', borderRadius: '50%', boxShadow: '0 0 8px #ff3b3b' }} />
          <span style={{ color: '#ff3b3b', fontSize: '10px', letterSpacing: '3px', opacity: 0.5 }}>STANDBY</span>
        </div>
      </div>

      {/* THE BUTTON */}
      <button
        className="sos-btn"
        onClick={activate}
        style={{
          width: '240px',
          height: '240px',
          borderRadius: '50%',
          background: '#ff3b3b',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '48px',
        }}
      >
        <span style={{ fontSize: '40px', lineHeight: 1 }}>🆘</span>
        <span style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '3px' }}>SOS</span>
        <span style={{ fontSize: '12px', letterSpacing: '2px', opacity: 0.85 }}>HELP ME SPEAK</span>
      </button>

      {/* Subtext */}
      <p style={{ color: '#1a0a0a', fontSize: '11px', letterSpacing: '2px', textAlign: 'center', maxWidth: '280px', lineHeight: 1.8 }}>
        INSTANT TRANSLATION<br />FOR REAL EMERGENCIES
      </p>
    </div>
  )

  // ── POST-ACTIVATION: Emergency chat ─────────────────────────────────────────
  return (
    <div style={{
      height: '100vh',
      background: '#050505',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '"Courier New", Courier, monospace',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .msg-in { animation: fadeIn 0.15s ease forwards; }
        .send-btn { transition: all 0.12s ease; cursor: pointer; border: none; font-family: "Courier New", Courier, monospace; }
        .send-btn:hover:not(:disabled) { background: #ff5555 !important; }
        .send-btn:active:not(:disabled) { transform: scale(0.97); }
        .quick-btn { transition: all 0.12s ease; cursor: pointer; border: none; font-family: "Courier New", Courier, monospace; }
        .quick-btn:hover { background: rgba(255,59,59,0.15) !important; border-color: rgba(255,59,59,0.4) !important; }
        .quick-btn:active { transform: scale(0.97); }
        input:focus { outline: none; border-color: #ff3b3b !important; box-shadow: 0 0 0 1px rgba(255,59,59,0.3); }
      `}</style>

      {/* Header */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid #1a0000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#080000',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '8px', height: '8px', background: '#ff3b3b', borderRadius: '50%', boxShadow: '0 0 10px #ff3b3b' }} />
          <span style={{ color: '#ff3b3b', fontSize: '12px', letterSpacing: '3px', fontWeight: '700' }}>EMERGENCY MODE</span>
        </div>
        <button
          onClick={() => { setActivated(false); setMessages([]) }}
          style={{ background: 'none', border: '1px solid #1a0000', color: '#330000', fontSize: '10px', cursor: 'pointer', padding: '5px 12px', letterSpacing: '2px', fontFamily: 'inherit' }}
        >
          EXIT
        </button>
      </div>

      {/* Quick phrases */}
      {messages.length === 0 && (
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #0f0000',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          background: '#050505',
          flexShrink: 0,
        }}>
          {QUICK_PHRASES.map(p => (
            <button
              key={p.label}
              className="quick-btn"
              onClick={() => send(p.label)}
              disabled={loading}
              style={{
                background: 'rgba(255,59,59,0.06)',
                border: '1px solid rgba(255,59,59,0.15)',
                color: '#ff6b6b',
                fontSize: '11px',
                padding: '7px 14px',
                borderRadius: '4px',
                letterSpacing: '1px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>{p.emoji}</span>
              <span>{p.label.toUpperCase()}</span>
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', opacity: 0.3 }}>
            <span style={{ fontSize: '48px' }}>🆘</span>
            <p style={{ color: '#ff3b3b', fontSize: '11px', letterSpacing: '3px', textAlign: 'center' }}>
              TYPE WHAT YOU NEED<br />OR TAP A QUICK PHRASE
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className="msg-in" style={{
            display: 'flex',
            justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            <div style={{
              maxWidth: '82%',
              padding: '12px 16px',
              borderRadius: m.role === 'user' ? '2px 2px 0 2px' : '2px 2px 2px 0',
              background: m.role === 'user' ? '#1a0000' : '#0a0000',
              border: m.role === 'user'
                ? '1px solid rgba(255,59,59,0.2)'
                : '1px solid rgba(255,59,59,0.4)',
              color: m.role === 'user' ? '#ff6b6b' : '#ff3b3b',
              fontSize: m.role === 'assistant' ? '18px' : '13px',
              lineHeight: m.role === 'assistant' ? 1.5 : 1.4,
              fontWeight: m.role === 'assistant' ? '700' : '400',
              letterSpacing: m.role === 'assistant' ? '0.5px' : '1px',
              boxShadow: m.role === 'assistant' ? '0 0 20px rgba(255,59,59,0.1)' : 'none',
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
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid #1a0000',
        display: 'flex',
        gap: '10px',
        background: '#080000',
        flexShrink: 0,
      }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="WHAT DO YOU NEED TO SAY?"
          disabled={loading}
          style={{
            flex: 1,
            background: '#0a0000',
            border: '1px solid #1a0000',
            borderRadius: '2px',
            padding: '14px 18px',
            color: '#ff6b6b',
            fontSize: '13px',
            letterSpacing: '1.5px',
            fontFamily: '"Courier New", Courier, monospace',
            textTransform: 'uppercase',
          }}
        />
        <button
          className="send-btn"
          onClick={() => send()}
          disabled={loading || !input.trim()}
          style={{
            background: loading || !input.trim() ? '#1a0000' : '#ff3b3b',
            color: loading || !input.trim() ? '#330000' : '#fff',
            borderRadius: '2px',
            padding: '14px 24px',
            fontWeight: '900',
            fontSize: '13px',
            letterSpacing: '2px',
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? '...' : 'SEND'}
        </button>
      </div>
    </div>
  )
}