'use client'

import InstallButton from '@/components/InstallButton'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// Animated counter hook
function useCounter(target: number, duration = 1800, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime: number
    const step = (ts: number) => {
      if (!startTime) startTime = ts
      const progress = Math.min((ts - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, start])
  return count
}

// Intersection observer hook
function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setInView(true)
    }, { threshold })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [threshold])
  return { ref, inView }
}

// Fake typewriter demo
const DEMO_MESSAGES = [
  { role: 'lex', text: "Buenos días! Today's mission: you just landed in Madrid. Order a coffee and ask where the nearest metro is. Ready?" },
  { role: 'user', text: "Hola! Quiero un café, por favor... and, um, ¿dónde está el metro?" },
  { role: 'lex', text: "Perfect instinct mixing both — that's exactly how real conversations start. ¡Muy bien! One small tweak: try \"¿Podría decirme dónde está el metro más cercano?\" — sounds more natural. Want to try the full exchange?" },
  { role: 'user', text: "Sí! ¿Podría decirme dónde está el metro más cercano?" },
  { role: 'lex', text: "That's fluent. Seriously. You just navigated a foreign city. That's the mission — done. +25 XP 🎉" },
]

function TypewriterMessage({ text, onDone }: { text: string; onDone: () => void }) {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    setDisplayed('')
    let i = 0
    const interval = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(interval)
        setTimeout(onDone, 600)
      }
    }, 18)
    return () => clearInterval(interval)
  }, [text])
  return <span>{displayed}</span>
}

function LiveDemo() {
  const [msgIndex, setMsgIndex] = useState(0)
  const [messages, setMessages] = useState<typeof DEMO_MESSAGES>([])
  const [running, setRunning] = useState(false)
  const { ref, inView } = useInView(0.4)

  useEffect(() => {
    if (inView && !running) {
      setRunning(true)
      setMessages([DEMO_MESSAGES[0]])
      setMsgIndex(0)
    }
  }, [inView])

  const handleDone = () => {
    const next = msgIndex + 1
    if (next < DEMO_MESSAGES.length) {
      setTimeout(() => {
        setMessages(prev => [...prev, DEMO_MESSAGES[next]])
        setMsgIndex(next)
      }, 400)
    }
  }

  return (
    <div ref={ref} style={{
      background: '#0e0e0e',
      border: '1px solid #1a1a1a',
      borderRadius: '20px',
      overflow: 'hidden',
      maxWidth: '600px',
      margin: '0 auto',
      boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px #111',
    }}>
      {/* Window chrome */}
      <div style={{
        background: '#0a0a0a',
        borderBottom: '1px solid #1a1a1a',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['#ff5f56', '#ffbd2e', '#27c93f'].map(c => (
            <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
          ))}
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
          <span style={{ color: '#444', fontSize: '13px' }}>Lex · Online · Adapting to your level</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '320px' }}>
        {messages.map((msg, i) => {
          const isLex = msg.role === 'lex'
          const isLast = i === messages.length - 1
          return (
            <div key={i} style={{
              display: 'flex',
              justifyContent: isLex ? 'flex-start' : 'flex-end',
              gap: '10px',
              alignItems: 'flex-start',
            }}>
              {isLex && (
                <div style={{
                  width: 32, height: 32, borderRadius: '10px',
                  background: '#111', border: '1px solid #1f1f1f',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', flexShrink: 0,
                }}>✦</div>
              )}
              <div style={{
                background: isLex ? '#111' : '#0f2a1a',
                border: `1px solid ${isLex ? '#1a1a1a' : '#1a3a1f'}`,
                borderRadius: isLex ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                padding: '12px 16px',
                maxWidth: '80%',
                fontSize: '14px',
                lineHeight: 1.6,
                color: isLex ? '#ccc' : '#fff',
              }}>
                {isLast && running ? (
                  <TypewriterMessage text={msg.text} onDone={handleDone} />
                ) : (
                  msg.text
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const statsRef = useInView(0.3)
  const users = useCounter(1500000000, 2000, statsRef.inView)
  const dropout = useCounter(95, 1400, statsRef.inView)
  const cost = useCounter(6500, 2200, statsRef.inView)

  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div style={{
      background: '#0a0a0a',
      color: '#fff',
      fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
      overflowX: 'hidden',
    }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700;0,800;1,400&family=DM+Serif+Display:ital@0;1&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes grain {
          0%, 100% { transform: translate(0, 0); }
          10%       { transform: translate(-2%, -3%); }
          30%       { transform: translate(3%, -1%); }
          50%       { transform: translate(-1%, 3%); }
          70%       { transform: translate(2%, 1%); }
          90%       { transform: translate(-3%, 2%); }
        }

        .hero-word { display: inline-block; animation: fadeUp 0.7s ease both; }
        .hero-word:nth-child(1) { animation-delay: 0.05s; }
        .hero-word:nth-child(2) { animation-delay: 0.15s; }
        .hero-word:nth-child(3) { animation-delay: 0.25s; }
        .hero-word:nth-child(4) { animation-delay: 0.35s; }
        .hero-word:nth-child(5) { animation-delay: 0.45s; }
        .hero-sub  { animation: fadeUp 0.7s ease 0.55s both; }
        .hero-cta  { animation: fadeUp 0.7s ease 0.7s both; }

        .feature-card:hover { transform: translateY(-4px); border-color: #2a2a2a !important; }
        .feature-card { transition: transform 0.2s, border-color 0.2s; }

        .cta-btn:hover { transform: scale(1.03); box-shadow: 0 8px 32px rgba(74,222,128,0.3); }
        .cta-btn { transition: transform 0.15s, box-shadow 0.15s; }

        .grain::after {
          content: '';
          position: fixed;
          inset: -200%;
          width: 400%;
          height: 400%;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          opacity: 0.025;
          pointer-events: none;
          animation: grain 8s steps(10) infinite;
          z-index: 999;
        }

        .scroll-fade { opacity: 0; transform: translateY(32px); transition: opacity 0.7s ease, transform 0.7s ease; }
        .scroll-fade.visible { opacity: 1; transform: translateY(0); }
      `}</style>

      {/* Grain overlay */}
      <div className="grain" />

      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 40px',
        height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(10,10,10,0.9)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid #111' : '1px solid transparent',
        transition: 'all 0.3s',
      }}>
        <span style={{ fontFamily: '"DM Serif Display", serif', fontSize: '22px', color: '#4ade80', letterSpacing: '-0.02em' }}>
          Glotto
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => router.push('/pricing')} style={{
            background: 'none', border: 'none', color: '#555', fontSize: '14px',
            padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Pricing
          </button>
          <button onClick={() => router.push('/auth/login')} style={{
            background: 'none', border: '1px solid #1f1f1f', borderRadius: '10px',
            color: '#888', fontSize: '14px', padding: '8px 18px', cursor: 'pointer',
            fontFamily: 'inherit',
          }}>
            Log in
          </button>
          <button className="cta-btn" onClick={() => router.push('/auth/signup')} style={{
            background: '#4ade80', border: 'none', borderRadius: '10px',
            color: '#050f06', fontSize: '14px', fontWeight: '700',
            padding: '9px 20px', cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Start free →
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '120px 24px 80px',
        textAlign: 'center',
        position: 'relative',
      }}>
        {/* Radial glow */}
        <div style={{
          position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '600px', height: '600px',
          background: 'radial-gradient(ellipse, rgba(74,222,128,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: '#0f2a1a', border: '1px solid #1a3a1f',
          borderRadius: '100px', padding: '6px 14px 6px 8px',
          fontSize: '13px', color: '#4ade80', fontWeight: '500',
          marginBottom: '36px',
          animation: 'fadeIn 0.5s ease both',
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', animation: 'pulse 2s ease infinite' }} />
          Lex is live. Start your first conversation today.
        </div>

        <h1 style={{
          fontFamily: '"DM Serif Display", serif',
          fontSize: 'clamp(52px, 8vw, 96px)',
          lineHeight: 1.0,
          letterSpacing: '-0.03em',
          marginBottom: '28px',
          maxWidth: '820px',
        }}>
          <span className="hero-word">Speak&nbsp;</span>
          <span className="hero-word">the&nbsp;</span>
          <span className="hero-word">life&nbsp;</span>
          <br />
          <span className="hero-word" style={{ color: '#4ade80', fontStyle: 'italic' }}>you&nbsp;</span>
          <span className="hero-word" style={{ color: '#4ade80', fontStyle: 'italic' }}>want.</span>
        </h1>

        <p className="hero-sub" style={{
          color: '#666', fontSize: 'clamp(16px, 2vw, 20px)',
          maxWidth: '520px', lineHeight: 1.7, marginBottom: '44px',
        }}>
          An AI language tutor that teaches through real conversations —
          not grammar drills, not streaks, not badges.
          <br />
          <span style={{ color: '#888' }}>Actual fluency. In 7 days, guaranteed.</span>
        </p>

        <div className="hero-cta" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
          <button className="cta-btn" onClick={() => router.push('/auth/signup')} style={{
            background: '#4ade80', border: 'none', borderRadius: '14px',
            color: '#050f06', fontSize: '16px', fontWeight: '800',
            padding: '16px 32px', cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Start speaking free →
          </button>
          
          {/* THE VIP ENTRANCE: Injected right here */}
          <InstallButton />
          
          <button onClick={() => router.push('/pricing')} style={{
            background: 'transparent', border: '1px solid #222', borderRadius: '14px',
            color: '#888', fontSize: '16px', padding: '16px 28px',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            See pricing
          </button>
        </div>

        <p style={{ color: '#333', fontSize: '13px', marginTop: '16px', animation: 'fadeIn 0.5s ease 0.9s both', opacity: 0 }}>
          No credit card required · 7-day money-back guarantee
        </p>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute', bottom: '40px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
          color: '#2a2a2a', fontSize: '12px',
          animation: 'fadeIn 1s ease 1.2s both',
          opacity: 0,
        }}>
          <span>scroll</span>
          <div style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, #2a2a2a, transparent)' }} />
        </div>
      </section>

      {/* Problem stats */}
      <section ref={statsRef.ref} style={{ padding: '80px 24px', borderTop: '1px solid #111' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: '#333', fontSize: '13px', fontWeight: '600', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '60px' }}>
            The language learning industry is broken
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
            {[
              { value: `${(users / 1e9).toFixed(1)}B`, label: 'people blocked by a language barrier', color: '#fff' },
              { value: `${dropout}%`, label: 'of Duolingo users quit before fluency', color: '#ff6b6b' },
              { value: `€${cost.toLocaleString()}`, label: 'average cost of a language school to B2', color: '#fbbf24' },
            ].map(({ value, label, color }, i) => (
              <div key={i} style={{
                padding: '40px 32px',
                background: i === 1 ? '#0e0e0e' : 'transparent',
                borderRadius: i === 1 ? '16px' : '0',
                border: i === 1 ? '1px solid #1a1a1a' : 'none',
              }}>
                <div style={{
                  fontFamily: '"DM Serif Display", serif',
                  fontSize: 'clamp(40px, 5vw, 64px)',
                  color, lineHeight: 1, marginBottom: '12px',
                }}>
                  {value}
                </div>
                <p style={{ color: '#444', fontSize: '15px', lineHeight: 1.5 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '100px 24px', borderTop: '1px solid #111' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '72px' }}>
            <p style={{ color: '#333', fontSize: '13px', fontWeight: '600', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>How it works</p>
            <h2 style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: 'clamp(36px, 5vw, 56px)',
              lineHeight: 1.1, letterSpacing: '-0.02em',
            }}>
              Three steps to<br />
              <span style={{ color: '#4ade80', fontStyle: 'italic' }}>actually speaking.</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              {
                num: '01',
                title: 'Tell us your goal',
                desc: 'Pick your language, your level (A1–C2), and the life outcome you want. Travel, career, connection — Glotto builds your curriculum around it.',
                icon: '🎯',
              },
              {
                num: '02',
                title: 'Talk to Lex every day',
                desc: 'Your AI tutor gives you a real mission each session. Order coffee in Madrid. Handle a job interview in Paris. Navigate Tokyo. 15 minutes a day.',
                icon: '🧠',
              },
              {
                num: '03',
                title: 'Hear yourself improve',
                desc: 'The Proof records a short conversation monthly. In 90 days, you\'ll listen back to who you were on day one. That moment is why people stay.',
                icon: '🏆',
              },
            ].map(({ num, title, desc, icon }, i) => (
              <div key={i} className="feature-card" style={{
                background: '#0e0e0e',
                border: '1px solid #181818',
                borderRadius: '20px',
                padding: '32px 28px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                  <span style={{ fontSize: '32px' }}>{icon}</span>
                  <span style={{
                    fontFamily: '"DM Serif Display", serif',
                    fontSize: '48px', color: '#1a1a1a', lineHeight: 1,
                    fontStyle: 'italic',
                  }}>{num}</span>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px', lineHeight: 1.3 }}>{title}</h3>
                <p style={{ color: '#555', fontSize: '14px', lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live demo */}
      <section style={{ padding: '100px 24px', borderTop: '1px solid #111' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <p style={{ color: '#333', fontSize: '13px', fontWeight: '600', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>Live demo</p>
            <h2 style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: 'clamp(32px, 4vw, 48px)',
              lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: '16px',
            }}>
              This is what a session<br />
              <span style={{ color: '#4ade80', fontStyle: 'italic' }}>actually looks like.</span>
            </h2>
            <p style={{ color: '#555', fontSize: '16px' }}>
              Scroll down to watch a real conversation with Lex unfold.
            </p>
          </div>
          <LiveDemo />
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '100px 24px', borderTop: '1px solid #111' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '72px' }}>
            <h2 style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: 'clamp(36px, 5vw, 56px)',
              lineHeight: 1.1, letterSpacing: '-0.02em',
            }}>
              Built different.<br />
              <span style={{ color: '#4ade80', fontStyle: 'italic' }}>By design.</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {[
              {
                icon: '🔒',
                title: 'Safe Mode',
                desc: 'For your first 30 sessions, Lex never corrects you directly. It models correct language naturally. Because the fear of being wrong is why most people never speak.',
                accent: '#60a5fa',
              },
              {
                icon: '🎯',
                title: 'Mission-Based Learning',
                desc: '200+ real-world missions across 6 CEFR levels and 8 life goals. Not vocabulary lists — actual situations: job interviews, ordering food, navigating airports.',
                accent: '#4ade80',
              },
              {
                icon: '🔥',
                title: 'Streak Architecture',
                desc: 'Daily practice tracked and visualised. XP earned every session. The system makes showing up feel like winning — because it is.',
                accent: '#fb923c',
              },
              {
                icon: '🏆',
                title: 'The Proof',
                desc: 'Monthly recordings of your actual conversations. Listen back 3 months later. Progress you can hear — not just trust a dashboard to tell you.',
                accent: '#fbbf24',
              },
              {
                icon: '🧠',
                title: 'Neuroscience-Backed',
                desc: 'Built on Krashen\'s Input Hypothesis and Affective Filter theory. The same principles behind how children acquire language — not how schools teach it.',
                accent: '#c084fc',
              },
              {
                icon: '🛡',
                title: '7-Day Guarantee',
                desc: 'Have a real conversation in 7 days, or we refund you. No forms. No questions. Not a bet — a reflection of how confident we are in what we built.',
                accent: '#34d399',
              },
            ].map(({ icon, title, desc, accent }, i) => (
              <div key={i} className="feature-card" style={{
                background: '#0e0e0e',
                border: '1px solid #181818',
                borderRadius: '20px',
                padding: '28px',
                display: 'flex', gap: '20px',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '12px',
                  background: `${accent}12`,
                  border: `1px solid ${accent}28`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px', flexShrink: 0,
                }}>
                  {icon}
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px', color: '#fff' }}>{title}</h3>
                  <p style={{ color: '#555', fontSize: '14px', lineHeight: 1.7 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section style={{ padding: '100px 24px', borderTop: '1px solid #111' }}>
        <div style={{ maxWidth: '840px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: 'clamp(36px, 5vw, 52px)',
              lineHeight: 1.1, letterSpacing: '-0.02em',
            }}>
              The math is<br />
              <span style={{ color: '#4ade80', fontStyle: 'italic' }}>embarrassingly simple.</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              {
                label: 'Language School',
                items: ['€6,500 over 6 years', '3 hours/week in a classroom', 'Group lessons at someone else\'s pace', '95% of students plateau at B1', 'Zero guarantee of outcome'],
                color: '#ff4444', bg: '#0e0a0a', border: '#2a1010',
              },
              {
                label: 'Glotto Pro',
                items: ['€55/month — cancel anytime', '15 min/day at your pace', 'AI tutor personalized to your goal', 'Real conversations from session 1', '7-day fluency guarantee'],
                color: '#4ade80', bg: '#0a140a', border: '#1a3a1a',
              },
            ].map(({ label, items, color, bg, border }) => (
              <div key={label} style={{
                background: bg, border: `1px solid ${border}`,
                borderRadius: '20px', padding: '32px',
              }}>
                <p style={{ color: '#555', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px' }}>{label}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <span style={{ color, fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>
                        {color === '#4ade80' ? '✓' : '✕'}
                      </span>
                      <span style={{ color: color === '#4ade80' ? '#bbb' : '#555', fontSize: '14px', lineHeight: 1.5 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{
        padding: '120px 24px',
        borderTop: '1px solid #111',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '800px', height: '400px',
          background: 'radial-gradient(ellipse, rgba(74,222,128,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <p style={{ color: '#333', fontSize: '13px', fontWeight: '600', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '24px' }}>
          1.5 billion people. One solution.
        </p>
        <h2 style={{
          fontFamily: '"DM Serif Display", serif',
          fontSize: 'clamp(44px, 7vw, 80px)',
          lineHeight: 1.0, letterSpacing: '-0.03em',
          marginBottom: '28px',
        }}>
          Your language.<br />
          <span style={{ color: '#4ade80', fontStyle: 'italic' }}>Your life.</span>
        </h2>
        <p style={{ color: '#555', fontSize: '18px', maxWidth: '400px', margin: '0 auto 44px', lineHeight: 1.6 }}>
          The conversation you've been putting off starts today.
        </p>
        <button className="cta-btn" onClick={() => router.push('/auth/signup')} style={{
          background: '#4ade80', border: 'none', borderRadius: '16px',
          color: '#050f06', fontSize: '18px', fontWeight: '800',
          padding: '20px 44px', cursor: 'pointer', fontFamily: 'inherit',
          display: 'inline-block',
        }}>
          Start speaking free →
        </button>
        <p style={{ color: '#2a2a2a', fontSize: '13px', marginTop: '16px' }}>
          No credit card · 7-day guarantee · Cancel anytime
        </p>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #111',
        padding: '40px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '16px',
      }}>
        <span style={{ fontFamily: '"DM Serif Display", serif', fontSize: '18px', color: '#4ade80' }}>Glotto</span>
        <div style={{ display: 'flex', gap: '24px' }}>
          {[['Pricing', '/pricing'], ['Log in', '/auth/login'], ['Sign up', '/auth/signup']].map(([label, href]) => (
            <button key={label} onClick={() => router.push(href)} style={{
              background: 'none', border: 'none', color: '#333',
              fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {label}
            </button>
          ))}
        </div>
        <p style={{ color: '#222', fontSize: '13px' }}>© 2026 Glotto. Speak the life you want.</p>
      </footer>

    </div>
  )
}