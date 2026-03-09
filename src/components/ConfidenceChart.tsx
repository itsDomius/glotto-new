'use client'

import {
  AreaChart, Area, XAxis, YAxis,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import Link from 'next/link'

export type ChartPoint = {
  date: string
  score: number
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#111',
      border: '1px solid rgba(74,222,128,.2)',
      borderRadius: '10px',
      padding: '12px 16px',
    }}>
      <p style={{ color: '#555', fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'DM Mono, monospace' }}>
        {label}
      </p>
      <p style={{ color: '#fff', fontSize: '24px', fontWeight: '900', letterSpacing: '-1px', margin: 0 }}>
        {payload[0].value}
        <span style={{ color: '#4ade80', fontSize: '13px', fontWeight: '400', marginLeft: '4px' }}>/100</span>
      </p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-6xl mb-6">📈</div>
      <h3 className="text-white text-xl font-black tracking-tight mb-3">
        Nothing here yet
      </h3>
      <p
        className="text-[#333] text-sm leading-relaxed max-w-[280px] mb-8"
        style={{ fontFamily: 'DM Mono, monospace' }}
      >
        Complete your first Survival Mission to unlock your progress chart.
      </p>
      <Link
        href="/dashboard"
        className="bg-[#4ade80] text-[#050f06] px-6 py-3 rounded-xl text-sm font-black tracking-tight transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(74,222,128,.35)]"
      >
        Go to Dashboard →
      </Link>
    </div>
  )
}

export default function ConfidenceChart({ data }: { data: ChartPoint[] }) {
  if (!data.length) return <EmptyState />

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 4, left: -24, bottom: 0 }}>
        <defs>
          <linearGradient id="strokeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#4ade80" />
          </linearGradient>
          <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4ade80" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#4ade80" stopOpacity={0.01} />
          </linearGradient>
        </defs>

        <XAxis
          dataKey="date"
          tick={{ fill: '#333', fontSize: 11, fontFamily: 'DM Mono, monospace' }}
          axisLine={false}
          tickLine={false}
          dy={8}
        />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tick={{ fill: '#333', fontSize: 11, fontFamily: 'DM Mono, monospace' }}
          axisLine={false}
          tickLine={false}
        />

        <Tooltip
          content={<CustomTooltip />}
          cursor={{ stroke: 'rgba(74,222,128,.15)', strokeWidth: 1 }}
        />

        <Area
          type="monotone"
          dataKey="score"
          stroke="url(#strokeGrad)"
          strokeWidth={2.5}
          fill="url(#fillGrad)"
          dot={false}
          activeDot={{ r: 5, fill: '#4ade80', stroke: '#fff', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}