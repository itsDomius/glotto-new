// ════════════════════════════════════════════════════════════════════════════
// FILE: src/components/PanicButton.tsx   ← CREATE THIS FILE (new)
// ════════════════════════════════════════════════════════════════════════════
'use client'
import { useState, useEffect } from 'react'

const LOCATIONS = [
  { id: 'pharmacy',    label: 'Pharmacy',          icon: '💊', color: '#4ade80' },
  { id: 'police',      label: 'Police Station',     icon: '🚔', color: '#60a5fa' },
  { id: 'bank',        label: 'Bank',               icon: '🏦', color: '#fbbf24' },
  { id: 'hospital',    label: 'Hospital / ER',      icon: '🏥', color: '#f87171' },
  { id: 'landlord',    label: 'Landlord / Housing', icon: '🏠', color: '#a78bfa' },
  { id: 'immigration', label: 'Immigration Office', icon: '📋', color: '#fb923c' },
]

export default function PanicButton() {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [script, setScript] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleClose = () => {
    setOpen(false); setSelected(null); setScript(''); setCopied(false)
  }

  const generateScript = async (locationId: string) => {
    setSelected(locationId); setScript(''); setLoading(true)
    const location = LOCATIONS.find(l => l.id === locationId)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `Emergency: I need survival phrases for ${location?.label}` }],
          userId: 'guest',
          mode: 'panic',
          location: location?.label,
        }),
      })
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let full = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value)
        setScript(full)
      }
    } catch {
      setScript('Unable to generate script. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(script).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  const locationData = LOCATIONS.find(l => l.id === selected)

  return (
    <>
      {/* ── The FAB ──────────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Emergency Panic Button"
        title="Emergency survival phrases"
        style={{
          position: 'fixed', bottom: '28px', right: '28px', zIndex: 500,
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #ff5555, #cc0000)',
          border: '3px solid rgba(255,60,60,0.6)',
          color: '#fff', fontSize: '26px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'panic-pulse 2.5s ease infinite',
          transition: 'transform 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        🆘
      </button>

      <style>{`
        @keyframes panic-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(255,0,0,0.5); }
          70%  { box-shadow: 0 0 0 18px rgba(255,0,0,0); }
          100% { box-shadow: 0 0 0 0 rgba(255,0,0,0); }
        }
        @keyframes modal-in {
          from { opacity:0; transform: scale(0.94) translateY(20px); }
          to   { opacity:1; transform: scale(1) translateY(0); }
        }
        @keyframes script-in {
          from { opacity:0; transform: translateY(10px); }
          to   { opacity:1; transform: translateY(0); }
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>

      {/* ── Modal ─────────────────────────────────────────────────────── */}
      {open && (
        <div
          onClick={e => { if (e.target === e.currentTarget) handleClose() }}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(5,5,5,0.9)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
          }}
        >
          <div style={{
            background: '#080808', border: '1px solid #280000',
            borderRadius: '20px', width: '100%', maxWidth: '520px',
            maxHeight: '90vh', overflowY: 'auto',
            animation: 'modal-in 0.3s cubic-bezier(0.16,1,0.3,1) both',
          }}>

            {/* Header */}
            <div style={{ padding: '24px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff3333', animation: 'blink 1s ease infinite' }} />
                  <span style={{ color: '#ff3333', fontSize: '11px', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'monospace' }}>EMERGENCY MODE</span>
                </div>
                <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: '800', letterSpacing: '-0.01em' }}>
                  Where are you right now?
                </h2>
              </div>
              <button onClick={handleClose} style={{ background: 'none', border: 'none', color: '#444', fontSize: '22px', cursor: 'pointer', paddingLeft: '8px' }}>✕</button>
            </div>
            <p style={{ color: '#444', fontSize: '13px', padding: '8px 24px 20px' }}>
              Select your location — we'll generate the exact phrases to say right now.
            </p>

            {/* Location grid */}
            {!script && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '0 24px 24px' }}>
                {LOCATIONS.map(loc => (
                  <button
                    key={loc.id}
                    onClick={() => generateScript(loc.id)}
                    disabled={loading}
                    style={{
                      background: selected === loc.id ? `${loc.color}15` : '#0e0e0e',
                      border: `2px solid ${selected === loc.id ? loc.color : '#1a1a1a'}`,
                      borderRadius: '14px', padding: '18px 16px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      textAlign: 'left', transition: 'all 0.15s',
                      opacity: loading && selected !== loc.id ? 0.4 : 1,
                    }}
                  >
                    <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>{loc.icon}</span>
                    <span style={{ color: '#fff', fontWeight: '700', fontSize: '14px' }}>{loc.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div style={{ padding: '16px 24px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff3333', animation: 'blink 0.7s ease infinite' }} />
                <span style={{ color: '#555', fontSize: '14px' }}>Generating your survival script...</span>
              </div>
            )}

            {/* Script output */}
            {script && !loading && (
              <div style={{ padding: '0 24px 24px', animation: 'script-in 0.3s ease both' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <span style={{ fontSize: '18px' }}>{locationData?.icon}</span>
                  <span style={{ color: locationData?.color, fontWeight: '700', fontSize: '14px' }}>{locationData?.label}</span>
                  <span style={{ color: '#2a2a2a', fontSize: '12px', marginLeft: 'auto' }}>Show this screen to a local →</span>
                </div>
                <div style={{
                  background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: '14px',
                  padding: '20px', fontFamily: '"DM Mono", "Courier New", monospace',
                  fontSize: '13px', lineHeight: 2.0, color: '#ccc',
                  whiteSpace: 'pre-wrap', marginBottom: '14px',
                }}>
                  {script}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={copyToClipboard}
                    style={{
                      flex: 1, padding: '13px',
                      background: copied ? '#0f2a1a' : '#cc2200',
                      color: copied ? '#4ade80' : '#fff',
                      border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700',
                      cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                    }}
                  >
                    {copied ? '✓ Copied to clipboard!' : '📋 Copy to show clerk'}
                  </button>
                  <button
                    onClick={() => { setScript(''); setSelected(null) }}
                    style={{ padding: '13px 16px', background: '#111', border: '1px solid #1a1a1a', color: '#555', borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    ← Back
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}