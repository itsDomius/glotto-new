// ════════════════════════════════════════════════════════════════════════════
// FILE: src/app/page.tsx
// ════════════════════════════════════════════════════════════════════════════
'use client'
import InstallButton from '@/components/InstallButton'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// ── Animated counter ──────────────────────────────────────────────────────
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

// ── Intersection observer ─────────────────────────────────────────────────
function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true) },
      { threshold }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [threshold])
  return { ref, inView }
}

// ── Demo messages — Relocation OS scenarios ───────────────────────────────
const DEMO_MESSAGES = [
  {
    role: 'lex',
    text: "Day 3 mission: You're at the Athens tax office. You need an AFM number to sign your rental contract. The clerk only speaks Greek. Go.",
  },
  {
    role: 'user',
    text: 'Γεια σας. Θέλω να κάνω αίτηση για AFM παρακαλώ... I need the tax number for my contract?',
  },
  {
    role: 'lex',
    text: "Solid start — mixing languages is exactly what real expats do. The clerk replies: 'Έχετε διαβατήριο και αποδεικτικό κατοικίας;' — they're asking for your passport and proof of address. Do you have them?",
  },
  {
    role: 'user',
    text: 'Ναι, έχω το διαβατήριό μου. Για την κατοικία — έχω τη σύμβαση ενοικίασης. Is that enough?',
  },
  {
    role: 'lex',
    text: "Perfect process. Correct documents, correct order. The clerk says: 'Εντάξει. Θα σας δώσω αριθμό σειράς.' — you're getting a ticket number. Mission passed. +50 XP 🎉 You just navigated Greek bureaucracy. Real expats can't do this on day 3.",
  },
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
    }, 16)
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
    <div ref={ref} style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: '20px', overflow: 'hidden', maxWidth: '600px', margin: '0 auto', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}>
      {/* Window chrome */}
      <div style={{ background: '#0a0a0a', borderBottom: '1px solid #1a1a1a', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['#ff5f56', '#ffbd2e', '#27c93f'].map(c => (
            <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
          ))}
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
          <span style={{ color: '#444', fontSize: '13px' }}>Lex · Survival Mission 3 · Athens Tax Office</span>
        </div>
      </div>
      {/* Messages */}
      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '340px' }}>
        {messages.map((msg, i) => {
          const isLex = msg.role === 'lex'
          const isLast = i === messages.length - 1
          return (
            <div key={i} style={{ display: 'flex', justifyContent: isLex ? 'flex-start' : 'flex-end', gap: '10px', alignItems: 'flex-start' }}>
              {isLex && (
                <div style={{ width: 32, height: 32, borderRadius: '10px', background: '#111', border: '1px solid #1f1f1f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>✦</div>
              )}
              <div style={{
                background: isLex ? '#111' : '#0f2a1a',
                border: `1px solid ${isLex ? '#1a1a1a' : '#1a3a1f'}`,
                borderRadius: isLex ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                padding: '12px 16px', maxWidth: '82%',
                fontSize: '14px', lineHeight: 1.65,
                color: isLex ? '#ccc' : '#fff',
              }}>
                {isLast && running
                  ? <TypewriterMessage text={msg.text} onDone={handleDone} />
                  : msg.text
                }
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter()
  const statsRef = useInView(0.3)
  const expats    = useCounter(281,  1600, statsRef.inView)  // 281M expats worldwide
  const churn     = useCounter(38,   1400, statsRef.inView)  // 38% quit within 1 year
  const rehire    = useCounter(15000, 2200, statsRef.inView) // €15k to rehire a relocated employee
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div style={{ background: '#0a0a0a', color: '#fff', fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,300;0,400;0,500;0,700;0,800;1,400&family=DM+Serif+Display:ital@0;1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp   { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn   { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse    { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes grain    { 0%, 100% { transform: translate(0, 0); } 10% { transform: translate(-2%, -3%); } 30% { transform: translate(3%, -1%); } 50% { transform: translate(-1%, 3%); } 70% { transform: translate(2%, 1%); } 90% { transform: translate(-3%, 2%); } }
        .hero-word { display: inline-block; animation: fadeUp 0.7s ease both; }
        .hero-word:nth-child(1) { animation-delay: 0.05s; }
        .hero-word:nth-child(2) { animation-delay: 0.15s; }
        .hero-word:nth-child(3) { animation-delay: 0.25s; }
        .hero-sub  { animation: fadeUp 0.7s ease 0.45s both; }
        .hero-cta  { animation: fadeUp 0.7s ease 0.6s both; }
        .card:hover { transform: translateY(-4px); border-color: #2a2a2a !important; }
        .card { transition: transform 0.2s, border-color 0.2s; }
        .cta-btn:hover { transform: scale(1.03); box-shadow: 0 8px 32px rgba(74,222,128,0.3); }
        .cta-btn { transition: transform 0.15s, box-shadow 0.15s; }
        .grain::after { content: ''; position: fixed; inset: -200%; width: 400%; height: 400%; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E"); opacity: 0.025; pointer-events: none; animation: grain 8s steps(10) infinite; z-index: 999; }
      `}</style>

      {/* Grain */}
      <div className="grain" />

      {/* ── Nav ────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 40px', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(10,10,10,0.9)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid #111' : '1px solid transparent',
        transition: 'all 0.3s',
      }}>
        <span style={{ fontFamily: '"DM Serif Display", serif', fontSize: '22px', color: '#4ade80', letterSpacing: '-0.02em' }}>Glotto</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => router.push('/b2b-dashboard')} style={{ background: 'none', border: 'none', color: '#555', fontSize: '14px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit' }}>For Companies</button>
          <button onClick={() => router.push('/pricing')} style={{ background: 'none', border: 'none', color: '#555', fontSize: '14px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit' }}>Pricing</button>
          <button onClick={() => router.push('/auth/login')} style={{ background: 'none', border: '1px solid #1f1f1f', borderRadius: '10px', color: '#888', fontSize: '14px', padding: '8px 18px', cursor: 'pointer', fontFamily: 'inherit' }}>Log in</button>
          <button className="cta-btn" onClick={() => router.push('/auth/signup')} style={{ background: '#4ade80', border: 'none', borderRadius: '10px', color: '#050f06', fontSize: '14px', fontWeight: '700', padding: '9px 20px', cursor: 'pointer', fontFamily: 'inherit' }}>
            Start free →
          </button>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 80px', textAlign: 'center', position: 'relative' }}>
        {/* Radial glow */}
        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', width: '700px', height: '500px', background: 'radial-gradient(ellipse, rgba(74,222,128,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Banner */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#0f2a1a', border: '1px solid #1a3a1f', borderRadius: '100px', padding: '6px 14px 6px 8px', fontSize: '13px', color: '#4ade80', fontWeight: '500', marginBottom: '36px', animation: 'fadeIn 0.5s ease both' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', animation: 'pulse 2s ease infinite' }} />
          🚨 Lex is live. Try your first Survival Mission today.
        </div>

        {/* H1 */}
        <h1 style={{ fontFamily: '"DM Serif Display", serif', fontSize: 'clamp(52px, 8vw, 96px)', lineHeight: 1.0, letterSpacing: '-0.03em', marginBottom: '28px', maxWidth: '820px' }}>
          <span className="hero-word">Master&nbsp;</span>
          <span className="hero-word">your&nbsp;</span>
          <br />
          <span className="hero-word" style={{ color: '#4ade80', fontStyle: 'italic' }}>relocation.</span>
        </h1>

        {/* Sub */}
        <p className="hero-sub" style={{ color: '#666', fontSize: 'clamp(16px, 2vw, 20px)', maxWidth: '540px', lineHeight: 1.7, marginBottom: '44px' }}>
          The AI-driven Relocation OS that guides you through local bureaucracy, housing, and daily friction — not grammar drills, not streaks.
          <br />
          <span style={{ color: '#888' }}>Actual integration. From day one, guaranteed.</span>
        </p>

        {/* CTAs */}
        <div className="hero-cta" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
          <button className="cta-btn" onClick={() => router.push('/auth/signup')} style={{ background: '#4ade80', border: 'none', borderRadius: '14px', color: '#050f06', fontSize: '16px', fontWeight: '800', padding: '16px 32px', cursor: 'pointer', fontFamily: 'inherit' }}>
            Try a Survival Mission →
          </button>
          <InstallButton />
          <button onClick={() => router.push('/pricing')} style={{ background: 'transparent', border: '1px solid #222', borderRadius: '14px', color: '#888', fontSize: '16px', padding: '16px 28px', cursor: 'pointer', fontFamily: 'inherit' }}>
            See pricing
          </button>
        </div>

        {/* Micro-copy */}
        <p style={{ color: '#333', fontSize: '13px', marginTop: '16px', animation: 'fadeIn 0.5s ease 0.9s both', opacity: 0 }}>
          No credit card required · Try 2 Missions free
        </p>

        {/* Scroll hint */}
        <div style={{ position: 'absolute', bottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: '#2a2a2a', fontSize: '12px', animation: 'fadeIn 1s ease 1.2s both', opacity: 0 }}>
          <span>scroll</span>
          <div style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, #2a2a2a, transparent)' }} />
        </div>
      </section>

      {/* ── The problem — Relocation stats ─────────────────────────────── */}
      <section ref={statsRef.ref} style={{ padding: '80px 24px', borderTop: '1px solid #111' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: '#333', fontSize: '13px', fontWeight: '600', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '60px' }}>
            The relocation industry is failing expats
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
            {[
              { value: `${expats}M`,      label: 'expats worldwide with no structured integration support',  color: '#fff' },
              { value: `${churn}%`,       label: 'of relocated employees quit within 12 months of arrival',  color: '#ff6b6b' },
              { value: `€${rehire.toLocaleString()}`, label: 'average cost to rehire and re-relocate a senior employee', color: '#fbbf24' },
            ].map(({ value, label, color }, i) => (
              <div key={i} style={{ padding: '40px 32px', background: i === 1 ? '#0e0e0e' : 'transparent', borderRadius: i === 1 ? '16px' : '0', border: i === 1 ? '1px solid #1a1a1a' : 'none' }}>
                <div style={{ fontFamily: '"DM Serif Display", serif', fontSize: 'clamp(40px, 5vw, 64px)', color, lineHeight: 1, marginBottom: '12px' }}>{value}</div>
                <p style={{ color: '#444', fontSize: '15px', lineHeight: 1.5 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────── */}
      <section style={{ padding: '100px 24px', borderTop: '1px solid #111' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '72px' }}>
            <p style={{ color: '#333', fontSize: '13px', fontWeight: '600', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>How it works</p>
            <h2 style={{ fontFamily: '"DM Serif Display", serif', fontSize: 'clamp(36px, 5vw, 56px)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              From airport to integrated<br />
              <span style={{ color: '#4ade80', fontStyle: 'italic' }}>in 7 days.</span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              {
                num: '01', icon: '📍', title: 'Tell us your city',
                desc: 'Pick where you landed. Berlin, Athens, Lisbon — Glotto adapts to your exact local bureaucracy, language, and survival priorities.',
              },
              {
                num: '02', icon: '🎭', title: 'Survive daily missions',
                desc: 'Each mission is a real scenario: get your tax ID, open a bank account, negotiate your lease. You talk to an AI NPC. Fail the process — even with perfect language — and you do it again.',
              },
              {
                num: '03', icon: '🏆', title: 'Unlock real rewards',
                desc: 'Pass the bank mission → get a real N26 offer. Pass the SIM mission → get Airalo. Our affiliate partners turn your success into money back in your pocket.',
              },
            ].map(({ num, title, desc, icon }, i) => (
              <div key={i} className="card" style={{ background: '#0e0e0e', border: '1px solid #181818', borderRadius: '20px', padding: '32px 28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                  <span style={{ fontSize: '32px' }}>{icon}</span>
                  <span style={{ fontFamily: '"DM Serif Display", serif', fontSize: '48px', color: '#1a1a1a', lineHeight: 1, fontStyle: 'italic' }}>{num}</span>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px', lineHeight: 1.3 }}>{title}</h3>
                <p style={{ color: '#555', fontSize: '14px', lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live demo ──────────────────────────────────────────────────── */}
      <section style={{ padding: '100px 24px', borderTop: '1px solid #111' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <p style={{ color: '#333', fontSize: '13px', fontWeight: '600', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>Live simulation</p>
            <h2 style={{ fontFamily: '"DM Serif Display", serif', fontSize: 'clamp(32px, 4vw, 48px)', lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: '16px' }}>
              This is what Mission 3<br />
              <span style={{ color: '#4ade80', fontStyle: 'italic' }}>actually looks like.</span>
            </h2>
            <p style={{ color: '#555', fontSize: '16px' }}>Real scenario. AI NPC. Graded on process — not just language.</p>
          </div>
          <LiveDemo />
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────── */}
      <section style={{ padding: '100px 24px', borderTop: '1px solid #111' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '72px' }}>
            <h2 style={{ fontFamily: '"DM Serif Display", serif', fontSize: 'clamp(36px, 5vw, 56px)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              Built for survival.<br />
              <span style={{ color: '#4ade80', fontStyle: 'italic' }}>Not vocabulary.</span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {[
              { icon: '🎭', accent: '#4ade80',  title: 'AI NPC Simulations', desc: '7 survival missions per city. Graded on bureaucratic process (60%) AND language (40%). Perfect Greek but wrong documents? You fail. That\'s by design.' },
              { icon: '🆘', accent: '#f87171',  title: 'Emergency Panic Button', desc: 'Every page has a red FAB. Click it, select your location (Pharmacy, Police, Bank, Hospital) and get an instant survival script with phonetic pronunciation to show a local clerk.' },
              { icon: '⚡', accent: '#c084fc',  title: 'Commitment Mode',       desc: 'Stake €30 in escrow. Complete 5 missions in 7 days — get it all back. Fail — we keep it. Loss aversion psychology baked in. Stakers complete 90% of missions vs 23% standard.' },
              { icon: '🏦', accent: '#fbbf24',  title: 'Affiliate Rewards',     desc: 'Pass the bank mission → N26 offer. Pass the SIM mission → Airalo eSIM. Pass health → SafetyWing. Our partners pay us when you succeed. Negative CAC model.' },
              { icon: '📊', accent: '#60a5fa',  title: 'Confidence Tracker',    desc: 'Every session scored. Process score vs language score visualised over time. You can see exactly where you are in your integration journey — not a vague progress bar.' },
              { icon: '🏢', accent: '#fb923c',  title: 'HR Shield for Companies', desc: 'B2B dashboard for HR directors. Employee table with confidence sparklines, churn risk flags, and ROI calculator. €15k to rehire vs €1.2k Glotto. The math is obvious.' },
            ].map(({ icon, title, desc, accent }, i) => (
              <div key={i} className="card" style={{ background: '#0e0e0e', border: '1px solid #181818', borderRadius: '20px', padding: '28px', display: 'flex', gap: '20px' }}>
                <div style={{ width: 44, height: 44, borderRadius: '12px', background: `${accent}12`, border: `1px solid ${accent}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>{icon}</div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px' }}>{title}</h3>
                  <p style={{ color: '#555', fontSize: '14px', lineHeight: 1.7 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison ─────────────────────────────────────────────────── */}
      <section style={{ padding: '100px 24px', borderTop: '1px solid #111' }}>
        <div style={{ maxWidth: '840px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontFamily: '"DM Serif Display", serif', fontSize: 'clamp(36px, 5vw, 52px)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              The current "solution"<br />
              <span style={{ color: '#f87171', fontStyle: 'italic' }}>is a Wikipedia article.</span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              {
                label: 'How expats relocate today',
                items: [
                  'Google "how to get AFM in Greece"',
                  'Read a 3-year-old Reddit thread',
                  'Show up with the wrong documents',
                  'Come back 4 times to the same office',
                  'Quit and move home within 12 months',
                ],
                color: '#ff4444', bg: '#0e0a0a', border: '#2a1010',
              },
              {
                label: 'With Glotto',
                items: [
                  'Simulate the exact office conversation before you go',
                  'Know exactly which documents to bring',
                  'Practice the right bureaucratic phrases',
                  'Pass missions = build real integration confidence',
                  'Get rewarded by our partners when you succeed',
                ],
                color: '#4ade80', bg: '#0a140a', border: '#1a3a1a',
              },
            ].map(({ label, items, color, bg, border }) => (
              <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: '20px', padding: '32px' }}>
                <p style={{ color: '#555', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px' }}>{label}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <span style={{ color, fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>{color === '#4ade80' ? '✓' : '✕'}</span>
                      <span style={{ color: color === '#4ade80' ? '#bbb' : '#555', fontSize: '14px', lineHeight: 1.5 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For companies strip ─────────────────────────────────────────── */}
      <section style={{ padding: '60px 24px', borderTop: '1px solid #111' }}>
        <div style={{ maxWidth: '840px', margin: '0 auto' }}>
          <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: '20px', padding: '36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
            <div>
              <p style={{ color: '#fbbf24', fontSize: '11px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>For HR Directors</p>
              <h3 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '8px' }}>Relocating employees?</h3>
              <p style={{ color: '#555', fontSize: '15px', lineHeight: 1.6, maxWidth: '400px' }}>
                Track your team's integration confidence. Catch at-risk employees before they quit. Prevention costs €1,200. Rehiring costs €15,000.
              </p>
            </div>
            <button
              className="cta-btn"
              onClick={() => router.push('/b2b-dashboard')}
              style={{ background: '#fbbf2415', border: '1px solid #fbbf2440', color: '#fbbf24', borderRadius: '14px', padding: '14px 24px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
            >
              View HR Dashboard Demo →
            </button>
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────── */}
      <section style={{ padding: '120px 24px', borderTop: '1px solid #111', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '800px', height: '400px', background: 'radial-gradient(ellipse, rgba(74,222,128,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <p style={{ color: '#333', fontSize: '13px', fontWeight: '600', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '24px' }}>
          281 million expats. One OS.
        </p>
        <h2 style={{ fontFamily: '"DM Serif Display", serif', fontSize: 'clamp(44px, 7vw, 80px)', lineHeight: 1.0, letterSpacing: '-0.03em', marginBottom: '28px' }}>
          Your city.<br />
          <span style={{ color: '#4ade80', fontStyle: 'italic' }}>Your survival.</span>
        </h2>
        <p style={{ color: '#555', fontSize: '18px', maxWidth: '420px', margin: '0 auto 44px', lineHeight: 1.6 }}>
          The bureaucracy you've been dreading starts with one simulation.
        </p>
        <button
          className="cta-btn"
          onClick={() => router.push('/auth/signup')}
          style={{ background: '#4ade80', border: 'none', borderRadius: '16px', color: '#050f06', fontSize: '18px', fontWeight: '800', padding: '20px 44px', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-block' }}
        >
          Start your first mission free →
        </button>
        <p style={{ color: '#2a2a2a', fontSize: '13px', marginTop: '16px' }}>
          No credit card · 2 missions free · Cancel anytime
        </p>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid #111', padding: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <span style={{ fontFamily: '"DM Serif Display", serif', fontSize: '18px', color: '#4ade80' }}>Glotto</span>
        <div style={{ display: 'flex', gap: '24px' }}>
          {([['Pricing', '/pricing'], ['For Companies', '/b2b-dashboard'], ['Log in', '/auth/login'], ['Sign up', '/auth/signup']] as const).map(([label, href]) => (
            <button key={label} onClick={() => router.push(href)} style={{ background: 'none', border: 'none', color: '#333', fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit' }}>{label}</button>
          ))}
        </div>
        <p style={{ color: '#222', fontSize: '13px' }}>© 2026 Glotto. Survive your relocation.</p>
      </footer>
    </div>
  )
}