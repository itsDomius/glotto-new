// ════════════════════════════════════════════════════════════════════════════
// FILE: src/app/proof/page.tsx
// ════════════════════════════════════════════════════════════════════════════
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Recording = {
  id: string
  created_at: string
  duration_seconds: number
  summary: string
  confidence_scores: {
    fluency?: number
    accuracy?: number
    vocabulary?: number
    mission_score?: number
    feedback?: string
  } | null
}

export default function ProofPage() {
  const router = useRouter()
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data } = await supabase
        .from('sessions')
        .select('id, created_at, duration_seconds, summary, confidence_scores')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      setRecordings(data || [])
      setLoading(false)
    }
    load()
  }, [router])

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const getScore = (r: Recording) => {
    const cs = r.confidence_scores
    if (!cs) return null
    if (cs.mission_score != null) return cs.mission_score
    if (cs.fluency != null && cs.accuracy != null && cs.vocabulary != null) {
      return Math.round(((cs.fluency + cs.accuracy + cs.vocabulary) / 30) * 100)
    }
    return null
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a', color: '#fff',
      fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
      padding: '40px 24px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }
        .card:hover { border-color: #2a2a2a !important; }
        .card { transition: border-color 0.15s; animation: fadeUp 0.35s ease both; }
      `}</style>

      <div style={{ maxWidth: '720px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
          <div>
            <button
              onClick={() => router.push('/dashboard')}
              style={{ background: 'none', border: 'none', color: '#333', fontSize: '13px', cursor: 'pointer', padding: 0, fontFamily: '"DM Mono", monospace', marginBottom: '12px', display: 'block' }}
            >
              ← Dashboard
            </button>
            <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.02em' }}>The Proof</h1>
            <p style={{ color: '#444', fontSize: '14px', marginTop: '6px' }}>
              Every session you've completed. Your progress, in black and white.
            </p>
          </div>
        </div>

        {/* Empty */}
        {!loading && recordings.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 24px', background: '#0e0e0e', border: '1px solid #111', borderRadius: '20px' }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>📭</div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>No sessions yet</h2>
            <p style={{ color: '#444', fontSize: '14px', marginBottom: '24px' }}>Complete your first Survival Mission to see your progress here.</p>
            <button
              onClick={() => router.push('/mission')}
              style={{ background: '#4ade80', border: 'none', borderRadius: '12px', color: '#050f06', fontSize: '14px', fontWeight: '700', padding: '12px 24px', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Start Mission 1 →
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: '#0e0e0e', border: '1px solid #111', borderRadius: '16px', height: '100px', opacity: 0.4 }} />
            ))}
          </div>
        )}

        {/* Session list */}
        {!loading && recordings.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recordings.map((r, idx) => {
              const score = getScore(r)
              const scoreColor = score == null ? '#444'
                : score >= 80 ? '#4ade80'
                : score >= 50 ? '#fbbf24'
                : '#f87171'

              return (
                <div
                  key={r.id}
                  className="card"
                  style={{
                    background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: '16px',
                    padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '20px',
                    animationDelay: `${idx * 0.04}s`,
                  }}
                >
                  {/* Score circle */}
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                    background: score != null ? `conic-gradient(${scoreColor} ${score * 3.6}deg, #1a1a1a 0deg)` : '#111',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#0e0e0e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: scoreColor, fontSize: '13px', fontWeight: '800', fontFamily: '"DM Mono", monospace' }}>
                        {score != null ? score : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#fff', fontWeight: '700', fontSize: '14px', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.summary || 'Conversation session'}
                    </p>
                    {r.confidence_scores?.feedback && (
                      <p style={{ color: '#444', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.confidence_scores.feedback}
                      </p>
                    )}
                  </div>

                  {/* Date */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ color: '#333', fontSize: '12px', fontFamily: '"DM Mono", monospace' }}>{formatDate(r.created_at)}</p>
                    {r.duration_seconds > 0 && (
                      <p style={{ color: '#222', fontSize: '11px', marginTop: '3px' }}>
                        {Math.round(r.duration_seconds / 60)}m
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Tip */}
        {!loading && recordings.length > 0 && (
          <div style={{ marginTop: '24px', background: '#0f2a1a', border: '1px solid #1a3a1f', borderRadius: '14px', padding: '16px 20px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '18px' }}>💡</span>
            <p style={{ color: '#888', fontSize: '13px', lineHeight: 1.6 }}>
              <strong style={{ color: '#4ade80' }}>Tip:</strong> Do a mission every day. Come back in 30 days and compare your first session score to your latest. That gap is the proof.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}