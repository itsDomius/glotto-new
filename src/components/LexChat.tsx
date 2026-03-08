'use client'
import React from 'react'

const GREEN = '#4ade80'
const GREEN_DIM = '#0f2a1a'
const GREEN_BORDER = '#1a3a1f'

type Message = { role: string; content: string }

// ─── Animated typing dots ─────────────────────────────────────────────────────
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
          transition: 'background 0.3s',
          display: 'inline-block',
        }} />
      ))}
    </span>
  )
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ message, isStreaming }: { message: Message; isStreaming: boolean }) {
  const isUser = message.role === 'user'
  const isEmpty = !message.content

  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', alignItems: 'flex-start', gap: '10px' }}>
      {!isUser && (
        <div style={{
          width: '28px', height: '28px', borderRadius: '50%',
          background: '#141414', border: '1px solid #1f1f1f',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', flexShrink: 0, marginTop: '2px',
          color: GREEN,
        }}>✦</div>
      )}
      <div style={{
        maxWidth: '72%', padding: '12px 16px',
        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        background: isUser ? GREEN : '#141414',
        color: isUser ? '#050f06' : '#e5e5e5',
        fontSize: '15px', lineHeight: 1.65,
        border: !isUser ? '1px solid #1f1f1f' : 'none',
      }}>
        {isEmpty && isStreaming ? <TypingDots /> : message.content}
      </div>
    </div>
  )
}

// ─── Main LexChat component ───────────────────────────────────────────────────
export default function LexChat({ userId, mode = 'tutor' }: { userId: string; mode?: string }) {
  const [messages, setMessages] = React.useState<Message[]>([])
  const [input, setInput] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [sessionStarted] = React.useState(Date.now())
  const [ended, setEnded] = React.useState(false)
  const [xpEarned, setXpEarned] = React.useState(0)
  const bottomRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  React.useEffect(() => {
    startConversation()
  }, [])

  const startConversation = async () => {
    setLoading(true)
    const initMessages = [{ role: 'user', content: 'Hi Lex, I am ready to practice.' }]
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: initMessages, userId, mode }),
    })
    await streamResponse(res)
    setLoading(false)
    inputRef.current?.focus()
  }

  const streamResponse = async (res: Response) => {
    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let fullResponse = ''

    // Add empty assistant message — shows typing dots until first chunk arrives
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      fullResponse += chunk
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: fullResponse }
        return updated
      })
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading || ended) return
    setLoading(true)
    const newMessages = [...messages, { role: 'user', content: input }]
    setMessages(newMessages)
    setInput('')
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: newMessages, userId, mode }),
    })
    await streamResponse(res)
    setLoading(false)
    inputRef.current?.focus()
  }

  const endSession = async () => {
    const durationSeconds = Math.floor((Date.now() - sessionStarted) / 1000)
    const res = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId, messages, durationSeconds,
        language: 'spanish', level: 'A1',
      }),
    })
    const data = await res.json()
    setXpEarned(data.xpEarned || 0)
    setEnded(true)
  }

  // ─── Session end screen ─────────────────────────────────────────────────────
  if (ended) return (
    <div style={{
      height: '65vh', background: '#0a0a0a', borderRadius: '16px',
      border: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '16px',
    }}>
      <div style={{ fontSize: '48px' }}>✦</div>
      <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '800', margin: 0 }}>Session complete</h2>
      <div style={{ background: GREEN_DIM, border: `1px solid ${GREEN_BORDER}`, borderRadius: '12px', padding: '12px 24px' }}>
        <span style={{ color: GREEN, fontWeight: '800', fontSize: '18px' }}>+{xpEarned} XP earned</span>
      </div>
      <p style={{ color: '#555', fontSize: '14px', margin: 0 }}>
        {messages.filter(m => m.role === 'user').length} messages · {Math.floor((Date.now() - sessionStarted) / 60000)} min
      </p>
      <button
        onClick={() => window.location.href = '/dashboard'}
        style={{
          background: GREEN, color: '#050f06', border: 'none',
          borderRadius: '12px', padding: '12px 28px',
          fontWeight: '800', fontSize: '15px', cursor: 'pointer', marginTop: '8px',
        }}
      >
        Back to dashboard →
      </button>
    </div>
  )

  // ─── Chat UI ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '65vh',
      background: '#0a0a0a', borderRadius: '16px', border: '1px solid #1a1a1a',
    }}>
      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '24px',
        display: 'flex', flexDirection: 'column', gap: '16px',
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#333', marginTop: '40px' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px', color: GREEN }}>✦</div>
            <div style={{ color: '#444', fontSize: '15px' }}>Lex is warming up...</div>
          </div>
        )}
        {messages.map((m, i) => (
          <MessageBubble
            key={i}
            message={m}
            isStreaming={loading && i === messages.length - 1 && m.role === 'assistant'}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{
        padding: '16px', borderTop: '1px solid #1a1a1a',
        display: 'flex', gap: '10px', alignItems: 'center',
      }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Type in any language..."
          disabled={loading || ended}
          style={{
            flex: 1, background: '#111', border: '1px solid #222',
            borderRadius: '12px', padding: '14px 18px', color: '#fff',
            fontSize: '15px', outline: 'none', fontFamily: 'inherit',
            opacity: loading ? 0.6 : 1,
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
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
        <button
          onClick={endSession}
          disabled={loading}
          style={{
            background: 'none', border: '1px solid #1f1f1f',
            borderRadius: '12px', padding: '14px 18px',
            color: '#444', fontSize: '14px', cursor: 'pointer',
            whiteSpace: 'nowrap', opacity: loading ? 0.5 : 1,
          }}
        >
          End
        </button>
      </div>
    </div>
  )
}