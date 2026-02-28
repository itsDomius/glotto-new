'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Message = {
  role: 'tutor' | 'user'
  content: string
  timestamp: Date
}

const MOCK_RESPONSES = [
  "That's a great attempt! In Spanish, we'd say it slightly differently. Let me show you how a native speaker would express that naturally.",
  "Excellent! You're using the present simple perfectly here. Notice how the verb changes depending on the subject — this is one of the key patterns at your level.",
  "I love your confidence! One small thing — the word order in Spanish is a bit different from English. Try putting the adjective after the noun.",
  "Perfect! That's exactly how a native speaker would say it. You're making great progress today.",
  "Good effort! Let me give you a more natural way to express that. Native speakers tend to use this construction instead.",
  "You're getting really close. The only thing to watch is the accent mark — it changes the meaning completely in Spanish!",
]

const INITIAL_MESSAGES: Message[] = [
  {
    role: 'tutor',
    content: "¡Hola! I'm Lex, your personal language coach. Before we start today's session — how are you feeling right now? Tired, energized, or somewhere in between? This helps me tailor today's lesson perfectly for you. 😊",
    timestamp: new Date(),
  }
]

export default function TutorPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionMinutes, setSessionMinutes] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionMinutes(prev => prev + 1)
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    await new Promise(resolve => setTimeout(resolve, 1200))

    const randomResponse = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)]

    const tutorMessage: Message = {
      role: 'tutor',
      content: randomResponse,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, tutorMessage])
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const userMessages = messages.filter(m => m.role === 'user').length

  return (
    <div className="flex h-screen bg-[#111111]">

      {/* Sidebar */}
      <div className="w-64 bg-[#111111] border-r border-[#1f1f1f] flex flex-col px-4 py-6 shrink-0">
        <div className="flex items-center gap-3 px-3 mb-10">
          <img src="/logo.png" alt="Glotto" className="w-7 h-7 object-contain brightness-0 invert" />
          <span className="text-white font-bold text-lg tracking-tight">Glotto</span>
        </div>

        <div className="bg-white bg-opacity-5 rounded-2xl p-4 mb-6">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">Current Session</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-xs">Duration</span>
              <span className="text-white text-xs font-medium">{sessionMinutes} min</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-xs">Messages</span>
              <span className="text-white text-xs font-medium">{userMessages}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-xs">XP earned</span>
              <span className="text-yellow-400 text-xs font-medium">+{userMessages * 5} XP</span>
            </div>
          </div>
        </div>

        <div className="bg-green-900 bg-opacity-30 border border-green-900 rounded-2xl p-4 mb-6">
          <p className="text-green-400 text-xs uppercase tracking-wider mb-2">Today's Mission</p>
          <p className="text-white text-sm font-medium">Order a coffee in Spanish ☕</p>
          <div className="w-full bg-black bg-opacity-30 rounded-full h-1 mt-3">
            <div className="h-1 rounded-full bg-green-400" style={{width: `${Math.min(userMessages * 10, 100)}%`}} />
          </div>
          <p className="text-green-400 text-xs mt-1">{userMessages}/10 exchanges</p>
        </div>

        <div className="flex-1">
          <p className="text-gray-600 text-xs uppercase tracking-wider mb-3 px-1">Quick phrases</p>
          <div className="flex flex-col gap-2">
            {[
              "I don't understand",
              "Can you repeat that?",
              "How do you say...?",
              "Give me an example",
            ].map((phrase) => (
              <button
                key={phrase}
                onClick={() => setInput(phrase)}
                className="text-left px-3 py-2 rounded-xl text-gray-500 text-xs hover:bg-white hover:bg-opacity-5 hover:text-gray-300 transition-all"
              >
                {phrase}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-gray-600 text-sm hover:text-gray-400 transition-colors"
        >
          ← Back to dashboard
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-[#f5f4f0]">

        <div className="border-b border-gray-200 px-8 py-4 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
              style={{background: 'linear-gradient(135deg, #4c1d95, #7c3aed)'}}>
              🤖
            </div>
            <div>
              <h2 className="text-[#111111] font-bold">Lex — AI Tutor</h2>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                <p className="text-gray-400 text-xs">Online · Adapting to your level</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-yellow-50 border border-yellow-200 rounded-full px-3 py-1.5 flex items-center gap-1.5">
              <span className="text-sm">⚡</span>
              <span className="text-yellow-700 text-xs font-semibold">+{userMessages * 5} XP today</span>
            </div>
            <div className="bg-gray-100 rounded-full px-3 py-1.5 flex items-center gap-1.5">
              <span className="text-sm">⏱</span>
              <span className="text-gray-600 text-xs font-semibold">{sessionMinutes} min</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm ${
                message.role === 'tutor'
                  ? 'bg-gradient-to-br from-purple-700 to-purple-500 text-white'
                  : 'bg-green-700 text-white font-bold'
              }`}>
                {message.role === 'tutor' ? '🤖' : 'D'}
              </div>
              <div className={`max-w-lg rounded-3xl px-5 py-3.5 ${
                message.role === 'tutor'
                  ? 'bg-white text-[#111111] shadow-sm rounded-tl-sm'
                  : 'bg-[#111111] text-white rounded-tr-sm'
              }`}>
                <p className="text-sm leading-relaxed">{message.content}</p>
                <p className={`text-xs mt-1.5 ${message.role === 'tutor' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-700 to-purple-500 flex items-center justify-center text-sm shrink-0">
                🤖
              </div>
              <div className="bg-white rounded-3xl rounded-tl-sm px-5 py-4 shadow-sm">
                <div className="flex gap-1.5 items-center">
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-200 px-8 py-5 bg-white">
          <div className="flex gap-3 items-end">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-gray-400 transition-colors">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message... (Press Enter to send)"
                className="w-full bg-transparent text-[#111111] text-sm resize-none outline-none placeholder-gray-400 max-h-32"
                rows={1}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="w-12 h-12 rounded-2xl bg-[#111111] text-white flex items-center justify-center hover:bg-[#222222] transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
            >
              →
            </button>
          </div>
          <p className="text-gray-400 text-xs mt-2 text-center">
            Powered by Glotto AI · Your responses are helping train your personal model
          </p>
        </div>

      </div>
    </div>
  )
}