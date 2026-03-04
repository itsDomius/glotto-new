'use client'
import React from 'react'

type Message = { role: string; content: string }

export default function LexChat({ userId }: { userId: string }) {
  const [messages, setMessages] = React.useState<Message[]>([])
  const [input, setInput] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [sessionStarted] = React.useState(Date.now())
  const [ended, setEnded] = React.useState(false)
  const [xpEarned, setXpEarned] = React.useState(0)
  const bottomRef = React.useRef<HTMLDivElement>(null)

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
      body: JSON.stringify({ messages: initMessages, userId })
    })

    await streamResponse(res)
    setLoading(false)
  }

  const streamResponse = async (res: Response) => {
    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let fullResponse = ''

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
      body: JSON.stringify({ messages: newMessages, userId })
    })

    await streamResponse(res)
    setLoading(false)
  }

  const endSession = async () => {
    const durationSeconds = Math.floor((Date.now() - sessionStarted) / 1000)

    const res = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        messages,
        durationSeconds,
        language: 'spanish',
        level: 'A1'
      })
    })

    const data = await res.json()
    setXpEarned(data.xpEarned || 0)
    setEnded(true)
  }

  if (ended) return (
    <div style={{
      height: '65vh', background: '#0a0a0a', borderRadius: '16px',
      border: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '16px'
    }}>
      <div style={{ fontSize: '48px' }}>✦</div>
      <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '800', margin: 0 }}>Session complete</h2>
      <div style={{ background: '#0f2a1a', border: '1px solid #1a3a1f', borderRadius: '12px', padding: '12px 24px' }}>
        <span style={{ color: '#4ade80', fontWeight: '800', fontSize: '18px' }}>+{xpEarned} XP earned</span>
      </div>
      <p style={{ color: '#555', fontSize: '14px', margin: 0 }}>{messages.filter(m => m.role === 'user').length} messages · {Math.floor((Date.now() - sessionStarted) / 60000)} min</p>
      <button
        onClick={() => window.location.href = '/dashboard'}
        style={{
          background: '#4ade80', color: '#050f06', border: 'none',
          borderRadius: '12px', padding: '12px 28px', fontWeight: '800',
          fontSize: '15px', cursor: 'pointer', marginTop: '8px'
        }}
      >Back to dashboard →</button>
    </div>
  )

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '65vh',
      background: '#0a0a0a', borderRadius: '16px', border: '1px solid #1a1a1a'
    }}>
      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '24px',
        display: 'flex', flexDirection: 'column', gap: '16px'
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#333', marginTop: '40px' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>✦</div>
            <div style={{ color: '#444', fontSize: '15px' }}>Lex is warming up...</div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start'
          }}>
            {m.role === 'assistant' && (
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: '#1a1a1a', border: '1px solid #2a2a2a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', marginRight: '10px', flexShrink: 0, marginTop: '2px'
              }}>✦</div>
            )}
            <div style={{
              maxWidth: '72%', padding: '12px 16px',
              borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: m.role === 'user' ? '#4ade80' : '#141414',
              color: m.role === 'user' ? '#050f06' : '#e5e5e5',
              fontSize: '15px', lineHeight: 1.65,
              border: m.role === 'assistant' ? '1px solid #1f1f1f' : 'none'
            }}>
              {m.content || <span style={{ color: '#444' }}>● ● ●</span>}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '16px', borderTop: '1px solid #1a1a1a',
        display: 'flex', gap: '10px', alignItems: 'center'
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder='Type in any language...'
          style={{
            flex: 1, background: '#111', border: '1px solid #222',
            borderRadius: '12px', padding: '14px 18px', color: '#fff',
            fontSize: '15px', outline: 'none', fontFamily: 'inherit'
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          style={{
            background: loading ? '#1a3a2a' : '#4ade80',
            color: loading ? '#2a5a3a' : '#050f06',
            borderRadius: '12px', padding: '14px 22px',
            fontWeight: '800', fontSize: '14px',
            border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s', whiteSpace: 'nowrap'
          }}
        >
          {loading ? '...' : 'Send →'}
        </button>
        <button
          onClick={endSession}
          style={{
            background: 'none', border: '1px solid #1f1f1f',
            borderRadius: '12px', padding: '14px 18px',
            color: '#444', fontSize: '14px',
            cursor: 'pointer', whiteSpace: 'nowrap'
          }}
        >
          End
        </button>
      </div>
    </div>
  )
}