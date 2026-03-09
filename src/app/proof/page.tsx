import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ConfidenceChart, { ChartPoint } from '@/components/ConfidenceChart'

type ConfidenceScores = {
  overall?: number
  mission_score?: number
  fluency?: number
  accuracy?: number
  vocabulary?: number
  summary?: string
}

type Session = {
  created_at: string
  confidence_scores: ConfidenceScores | null
}

function extractScore(scores: ConfidenceScores | null): number {
  if (!scores) return 0
  if (typeof scores.overall === 'number') return Math.round(scores.overall)
  if (typeof scores.mission_score === 'number') return Math.round(scores.mission_score)
  if (typeof scores.fluency === 'number') {
    const avg = ((scores.fluency || 0) + (scores.accuracy || 0) + (scores.vocabulary || 0)) / 3
    return Math.min(100, Math.round(avg * 10))
  }
  return 0
}

function StatCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,.05)' }}
    >
      <p
        className="text-[10px] tracking-[2px] uppercase mb-2"
        style={{ color: accent, fontFamily: 'DM Mono, monospace' }}
      >
        {label}
      </p>
      <p className="text-white text-3xl font-black tracking-tighter">{value}</p>
    </div>
  )
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 75 ? '#4ade80' : score >= 50 ? '#60a5fa' : '#f97316'
  return (
    <div className="flex items-center gap-3">
      <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: '#1a1a1a' }}>
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
      <span
        className="text-sm font-bold w-8 text-right"
        style={{ color, fontFamily: 'DM Mono, monospace' }}
      >
        {score}
      </span>
    </div>
  )
}

export default async function ProofPage() {
  // Use service role key for server-side data fetching
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get user from cookie-based session
  const cookieStore = cookies()
  const accessToken = cookieStore.get('sb-access-token')?.value
    ?? cookieStore.getAll().find(c => c.name.includes('auth-token'))?.value

  const { data: { user } } = await supabase.auth.getUser(accessToken)
  if (!user) redirect('/auth/login')

  // Fetch sessions chronologically
  const { data: sessions } = await supabase
    .from('sessions')
    .select('created_at, confidence_scores')
    .eq('user_id', user.id)
    .not('confidence_scores', 'is', null)
    .order('created_at', { ascending: true })

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, target_language, current_level')
    .eq('user_id', user.id)
    .single()

  const name = profile?.full_name?.split(' ')[0] || 'Your'

  const chartData: ChartPoint[] = ((sessions as Session[]) || [])
    .map(s => ({
      date: new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: Math.max(0, extractScore(s.confidence_scores)),
    }))
    .filter(p => p.score > 0)

  const count = chartData.length
  const avg = count ? Math.round(chartData.reduce((s, p) => s + p.score, 0) / count) : 0
  const best = count ? Math.max(...chartData.map(p => p.score)) : 0
  const latest = count ? chartData[count - 1].score : 0
  const trend = count >= 2 ? latest - chartData[count - 2].score : 0

  return (
    <div
      className="min-h-screen bg-[#0a0a0a] text-white"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap');`}</style>

      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* Nav */}
        <Link
          href="/dashboard"
          className="inline-block mb-10 text-[#252525] text-xs tracking-[2px] hover:text-[#444] transition-colors"
          style={{ fontFamily: 'DM Mono, monospace' }}
        >
          ← DASHBOARD
        </Link>

        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p
              className="text-[11px] tracking-[3px] text-[#333] uppercase mb-3"
              style={{ fontFamily: 'DM Mono, monospace' }}
            >
              Confidence Tracker
            </p>
            <h1 className="text-5xl font-black tracking-[-3px] leading-none">
              {name}&apos;s{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg,#22d3ee,#4ade80)' }}
              >
                Proof
              </span>
            </h1>
          </div>
          {count > 0 && (
            <div className="text-right">
              <p
                className="text-[10px] tracking-[2px] text-[#333] uppercase mb-1"
                style={{ fontFamily: 'DM Mono, monospace' }}
              >
                Latest
              </p>
              <p className="text-5xl font-black tracking-tighter">{latest}</p>
              {trend !== 0 && (
                <p
                  className="text-xs mt-1"
                  style={{ color: trend > 0 ? '#4ade80' : '#f87171', fontFamily: 'DM Mono, monospace' }}
                >
                  {trend > 0 ? `+${trend}` : trend} vs last
                </p>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        {count > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <StatCard label="Sessions" value={String(count)} accent="#60a5fa" />
            <StatCard label="Avg score" value={String(avg)} accent="#8b5cf6" />
            <StatCard label="Best score" value={String(best)} accent="#4ade80" />
          </div>
        )}

        {/* Chart card */}
        <div
          className="rounded-2xl p-8 mb-6"
          style={{
            background: 'linear-gradient(160deg,#0a0a0a,#0d0d10)',
            border: '1px solid rgba(74,222,128,.08)',
            boxShadow: '0 0 60px rgba(34,211,238,.03)',
          }}
        >
          {count > 0 && (
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-white text-lg font-black tracking-tight mb-1">
                  Confidence over time
                </h2>
                <p
                  className="text-[11px] text-[#333] tracking-wider capitalize"
                  style={{ fontFamily: 'DM Mono, monospace' }}
                >
                  {profile?.target_language || 'Spanish'} · Level {profile?.current_level || 'A1'}
                </p>
              </div>
              <div
                className="text-[11px] px-3 py-1.5 rounded-full tracking-wider"
                style={{
                  background: 'rgba(74,222,128,.06)',
                  border: '1px solid rgba(74,222,128,.15)',
                  color: '#4ade80',
                  fontFamily: 'DM Mono, monospace',
                }}
              >
                {count} data points
              </div>
            </div>
          )}
          <ConfidenceChart data={chartData} />
        </div>

        {/* Session history */}
        {count > 0 && (
          <div
            className="rounded-2xl p-8"
            style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,.05)' }}
          >
            <h2 className="text-white text-lg font-black tracking-tight mb-6">
              Session history
            </h2>
            <div className="flex flex-col">
              {[...chartData].reverse().map((point, i) => {
                const session = sessions?.[count - 1 - i] as Session | undefined
                const summary = session?.confidence_scores?.summary
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between py-4 border-b border-white/[0.03] last:border-0"
                  >
                    <div>
                      <p className="text-white text-sm font-semibold">{point.date}</p>
                      {summary && (
                        <p
                          className="text-[11px] text-[#333] mt-0.5"
                          style={{ fontFamily: 'DM Mono, monospace' }}
                        >
                          {summary}
                        </p>
                      )}
                    </div>
                    <ScoreBadge score={point.score} />
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}