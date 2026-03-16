// ════════════════════════════════════════════════════════════════════════════
// FILE: src/app/scan/page.tsx
// ════════════════════════════════════════════════════════════════════════════
'use client'
import React, { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type ScanResult = {
  document_type: string
  summary: string
  urgency: 'red' | 'yellow' | 'green'
  urgency_reason: string
  deadline: string | null
  next_actions: string[]
  key_amounts: string[]
  language_detected: string
}

const URGENCY_CONFIG = {
  red:    { label: 'URGENT',      bg: '#1a0505', border: '#3a0f0f', color: '#f87171', icon: '🔴' },
  yellow: { label: 'ACTION NEEDED', bg: '#1a1305', border: '#3a2a0f', color: '#fbbf24', icon: '🟡' },
  green:  { label: 'INFORMATIONAL', bg: '#0f2a1a', border: '#1a3a1f', color: '#4ade80', icon: '🟢' },
}

export default function ScanPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const processFile = useCallback(async (file: File) => {
    setError(null)
    setResult(null)

    const reader = new FileReader()
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string
      setPreview(dataUrl)
      setScanning(true)

      try {
        const base64 = dataUrl.split(',')[1]
        const mimeType = file.type || 'image/jpeg'

        const res = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mimeType }),
        })

        const data = await res.json()
        if (data.error) {
          setError(data.error)
        } else {
          setResult(data)
        }
      } catch {
        setError('Failed to analyze document. Try again.')
      } finally {
        setScanning(false)
      }
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) processFile(file)
  }, [processFile])

  const reset = () => {
    setPreview(null)
    setResult(null)
    setError(null)
    setScanning(false)
  }

  const urg = result ? URGENCY_CONFIG[result.urgency] : null

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: '"DM Sans", -apple-system, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
        @keyframes scanline { 0%{top:0%}50%{top:90%}100%{top:0%} }
        .fade-up { animation: fadeUp .35s ease both; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: '1px solid #111', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#070707' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: '#444', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>← Dashboard</button>
          <div style={{ width: 1, height: 16, background: '#1a1a1a' }} />
          <span style={{ color: '#4ade80', fontWeight: 800, fontSize: 20 }}>Glotto</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: 20, padding: '6px 14px' }}>
          <span style={{ fontSize: 14 }}>🔍</span>
          <span style={{ color: '#888', fontSize: 12, fontWeight: 600 }}>Document Scanner</span>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>

        {/* Title */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#0f2a1a', border: '1px solid #1a3a1f', borderRadius: 100, padding: '4px 12px', fontSize: 11, color: '#4ade80', fontWeight: 700, marginBottom: 16, letterSpacing: '0.08em', fontFamily: '"DM Mono", monospace' }}>
            🔍 AI DOCUMENT SCANNER
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 10 }}>Got a scary letter?</h1>
          <p style={{ color: '#555', fontSize: 16, lineHeight: 1.6 }}>Snap a photo or upload any official document. Our AI translates it into plain English and tells you exactly what to do next.</p>
        </div>

        {/* Upload zone */}
        {!preview && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? '#4ade80' : '#1a1a1a'}`,
              borderRadius: 20,
              padding: '60px 40px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragging ? '#0f2a1a' : '#0e0e0e',
              transition: 'all .15s',
              marginBottom: 20,
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
            <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Drop your document here</h3>
            <p style={{ color: '#444', fontSize: 14, marginBottom: 24 }}>PNG, JPG, WEBP — any official letter, form, or notice</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <div style={{ background: '#4ade80', color: '#050f06', borderRadius: 12, padding: '10px 20px', fontSize: 14, fontWeight: 800 }}>
                📂 Choose File
              </div>
              <div
                onClick={(e) => { e.stopPropagation(); cameraRef.current?.click() }}
                style={{ background: '#0f2a1a', border: '1px solid #1a3a1f', color: '#4ade80', borderRadius: 12, padding: '10px 20px', fontSize: 14, fontWeight: 800 }}>
                📷 Take Photo
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && processFile(e.target.files[0])} />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && processFile(e.target.files[0])} />
          </div>
        )}

        {/* Examples */}
        {!preview && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {[
              { icon: '🏛️', label: 'Tax Notices', desc: 'AFM letters, AADE docs' },
              { icon: '🏠', label: 'Rental Docs', desc: 'Contracts, eviction notices' },
              { icon: '🏥', label: 'Health Forms', desc: 'AMKA, insurance letters' },
              { icon: '🏦', label: 'Bank Letters', desc: 'Account notices, statements' },
              { icon: '⚡', label: 'Utility Bills', desc: 'DEI, water, gas bills' },
              { icon: '📮', label: 'Any Letter', desc: 'If it came from the government' },
            ].map(ex => (
              <div key={ex.label} style={{ background: '#0e0e0e', border: '1px solid #111', borderRadius: 12, padding: '14px 16px' }}>
                <span style={{ fontSize: 20, display: 'block', marginBottom: 6 }}>{ex.icon}</span>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: 12, marginBottom: 3 }}>{ex.label}</p>
                <p style={{ color: '#333', fontSize: 11 }}>{ex.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* Preview + scanning state */}
        {preview && (
          <div className="fade-up">
            <div style={{ position: 'relative', background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: 20, overflow: 'hidden', marginBottom: 24 }}>
              <img src={preview} alt="Document" style={{ width: '100%', maxHeight: 400, objectFit: 'contain', display: 'block' }} />

              {scanning && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                  <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #4ade80, transparent)', animation: 'scanline 1.5s ease infinite', top: '50%' }} />
                  <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid #1a1a1a', borderTopColor: '#4ade80', animation: 'spin .8s linear infinite' }} />
                  <p style={{ color: '#4ade80', fontWeight: 700, fontSize: 14, fontFamily: '"DM Mono", monospace' }}>Analyzing document...</p>
                </div>
              )}

              <button onClick={reset} style={{ position: 'absolute', top: 12, right: 12, background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: 8, color: '#888', cursor: 'pointer', padding: '4px 10px', fontSize: 12, fontFamily: 'inherit' }}>
                ✕ Reset
              </button>
            </div>

            {error && (
              <div style={{ background: '#1a0505', border: '1px solid #3a0f0f', borderRadius: 14, padding: '16px 20px', marginBottom: 20 }}>
                <p style={{ color: '#f87171', fontWeight: 700, fontSize: 14 }}>⚠️ {error}</p>
              </div>
            )}

            {result && urg && (
              <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Urgency Banner */}
                <div style={{ background: urg.bg, border: `1px solid ${urg.border}`, borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: 32 }}>{urg.icon}</span>
                  <div>
                    <span style={{ color: urg.color, fontWeight: 800, fontSize: 11, letterSpacing: '0.1em', fontFamily: '"DM Mono", monospace' }}>{urg.label}</span>
                    <p style={{ color: '#fff', fontWeight: 700, fontSize: 18, marginTop: 2 }}>{result.document_type}</p>
                    <p style={{ color: '#888', fontSize: 13, marginTop: 4 }}>{result.urgency_reason}</p>
                  </div>
                </div>

                {/* Summary */}
                <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: 16, padding: '20px 24px' }}>
                  <p style={{ color: '#444', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: '"DM Mono", monospace', marginBottom: 10 }}>What is this?</p>
                  <p style={{ color: '#ddd', fontSize: 15, lineHeight: 1.7 }}>{result.summary}</p>
                  <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ background: '#111', border: '1px solid #1a1a1a', color: '#444', fontSize: 11, padding: '3px 10px', borderRadius: 8, fontFamily: '"DM Mono", monospace' }}>
                      🌐 {result.language_detected}
                    </span>
                    {result.deadline && (
                      <span style={{ background: result.urgency === 'red' ? '#1a0505' : '#111', border: `1px solid ${result.urgency === 'red' ? '#3a0f0f' : '#1a1a1a'}`, color: result.urgency === 'red' ? '#f87171' : '#888', fontSize: 11, padding: '3px 10px', borderRadius: 8, fontFamily: '"DM Mono", monospace' }}>
                        📅 Deadline: {result.deadline}
                      </span>
                    )}
                  </div>
                </div>

                {/* Key amounts */}
                {result.key_amounts.length > 0 && (
                  <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: 16, padding: '20px 24px' }}>
                    <p style={{ color: '#444', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: '"DM Mono", monospace', marginBottom: 10 }}>Key Figures</p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {result.key_amounts.map((amt, i) => (
                        <span key={i} style={{ background: '#111', border: '1px solid #1a1a1a', color: '#fbbf24', fontWeight: 700, fontSize: 14, padding: '6px 14px', borderRadius: 10, fontFamily: '"DM Mono", monospace' }}>{amt}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Next Actions */}
                <div style={{ background: '#0f2a1a', border: '1px solid #1a3a1f', borderRadius: 16, padding: '20px 24px' }}>
                  <p style={{ color: '#4ade80', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: '"DM Mono", monospace', marginBottom: 14 }}>What you need to do</p>
                  {result.next_actions.map((action, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 800, color: '#050f06' }}>{i + 1}</div>
                      <p style={{ color: '#ddd', fontSize: 14, lineHeight: 1.6, paddingTop: 3 }}>{action}</p>
                    </div>
                  ))}
                </div>

                {/* Scan another */}
                <button onClick={reset} style={{ width: '100%', background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: 14, padding: '14px 20px', fontSize: 14, fontWeight: 700, color: '#888', cursor: 'pointer', fontFamily: 'inherit' }}>
                  📄 Scan Another Document
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}