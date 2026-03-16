// ════════════════════════════════════════════════════════════════════════════
// FILE: src/app/dependency-map/page.tsx
// ════════════════════════════════════════════════════════════════════════════
'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type NodeState = 'locked' | 'actionable' | 'completed'

type MapNode = {
  id: string
  day: number
  title: string
  category: string
  icon: string
  prereqs: string[]
  state: NodeState
  x: number
  y: number
}

const NODES_TEMPLATE: Omit<MapNode, 'state'>[] = [
  { id: 'arrive',      day: 0, title: 'Land in Athens',       category: 'Start',        icon: '✈️',  prereqs: [],              x: 50,  y: 60  },
  { id: 'metro',       day: 1, title: 'Buy Metro Ticket',      category: 'Transport',    icon: '🚇',  prereqs: ['arrive'],       x: 50,  y: 180 },
  { id: 'apartment',   day: 2, title: 'Find an Apartment',     category: 'Housing',      icon: '🏠',  prereqs: ['metro'],        x: 50,  y: 300 },
  { id: 'tax',         day: 3, title: 'Get Your Tax ID',       category: 'Bureaucracy',  icon: '🪪',  prereqs: ['apartment'],    x: 50,  y: 420 },
  { id: 'bank',        day: 4, title: 'Open a Bank Account',   category: 'Finance',      icon: '🏦',  prereqs: ['tax'],          x: 200, y: 480 },
  { id: 'contract',    day: 5, title: 'Sign Rental Contract',  category: 'Housing',      icon: '📝',  prereqs: ['tax'],          x: -100, y: 480 },
  { id: 'health',      day: 6, title: 'Navigate Health System',category: 'Health',       icon: '🏥',  prereqs: ['bank'],         x: 200, y: 600 },
  { id: 'sim',         day: 7, title: 'Get a Local SIM Card',  category: 'Daily Life',   icon: '📱',  prereqs: ['contract'],     x: -100, y: 600 },
]

const CATEGORY_COLOR: Record<string, string> = {
  Start:       '#4ade80',
  Transport:   '#60a5fa',
  Housing:     '#a78bfa',
  Bureaucracy: '#fbbf24',
  Finance:     '#4ade80',
  Health:      '#f87171',
  'Daily Life':'#fb923c',
}

const G = '#4ade80'

function getNodeBg(state: NodeState, color: string) {
  if (state === 'completed') return '#0f2a1a'
  if (state === 'actionable') return `${color}18`
  return '#0e0e0e'
}
function getNodeBorder(state: NodeState, color: string) {
  if (state === 'completed') return '#1a3a1f'
  if (state === 'actionable') return `${color}80`
  return '#1a1a1a'
}

export default function DependencyMapPage() {
  const router = useRouter()
  const [nodes, setNodes] = useState<MapNode[]>([])
  const [missionDay, setMissionDay] = useState(1)
  const [selected, setSelected] = useState<MapNode | null>(null)
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: p } = await supabase.from('profiles').select('mission_day').eq('user_id', user.id).single()
      const day = p?.mission_day || 1
      setMissionDay(day)

      const hydrated: MapNode[] = NODES_TEMPLATE.map(n => {
        let state: NodeState = 'locked'
        if (n.day === 0) state = 'completed'
        else if (n.day < day) state = 'completed'
        else if (n.day === day) state = 'actionable'
        else {
          const prereqsMet = n.prereqs.every(pid => {
            const prereq = NODES_TEMPLATE.find(t => t.id === pid)
            return prereq && (prereq.day === 0 || prereq.day < day)
          })
          state = prereqsMet ? 'actionable' : 'locked'
        }
        return { ...n, state }
      })
      setNodes(hydrated)
      setLoading(false)
    }
    load()
  }, [router])

  // center the canvas
  const CX = 420
  const CY = 100

  const getAbsPos = (n: MapNode) => ({ x: CX + n.x, y: CY + n.y + offset.y })

  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.node-card')) return
    setDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY - offset.y })
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return
    setOffset({ x: 0, y: e.clientY - dragStart.y })
  }
  const onMouseUp = () => setDragging(false)

  if (loading) return (
    <main style={{ minHeight: '100vh', background: '#070707', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid #1a1a1a', borderTopColor: G, animation: 'spin .8s linear infinite' }} />
    </main>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#070707', fontFamily: '"DM Sans", -apple-system, sans-serif', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.5} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
        .node-card { transition: all .15s; cursor: pointer; }
        .node-card:hover { transform: scale(1.04); }
        .actionable-ring { animation: pulse 2s ease infinite; }
      `}</style>

      {/* Header */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(7,7,7,.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #111', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: '#444', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
            ← Dashboard
          </button>
          <div style={{ width: 1, height: 16, background: '#1a1a1a' }} />
          <span style={{ color: G, fontWeight: 800, fontSize: 20 }}>Glotto</span>
          <span style={{ color: '#333', fontSize: 12, fontFamily: '"DM Mono", monospace' }}>Relocation Map</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['completed', 'actionable', 'locked'] as NodeState[]).map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: 20, padding: '4px 12px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s === 'completed' ? G : s === 'actionable' ? '#fbbf24' : '#333' }} />
              <span style={{ color: '#444', fontSize: 11, fontFamily: '"DM Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div
        style={{ position: 'relative', width: '100%', height: '100vh', cursor: dragging ? 'grabbing' : 'grab', userSelect: 'none' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {nodes.map(node =>
            node.prereqs.map(pid => {
              const parent = nodes.find(n => n.id === pid)
              if (!parent) return null
              const from = getAbsPos(parent)
              const to = getAbsPos(node)
              const isActive = node.state !== 'locked'
              return (
                <line
                  key={`${pid}-${node.id}`}
                  x1={from.x} y1={from.y + 36}
                  x2={to.x} y2={to.y - 36}
                  stroke={isActive ? `${CATEGORY_COLOR[node.category]}40` : '#1a1a1a'}
                  strokeWidth={isActive ? 2 : 1}
                  strokeDasharray={node.state === 'locked' ? '4 4' : '0'}
                />
              )
            })
          )}
        </svg>

        {nodes.map((node, idx) => {
          const pos = getAbsPos(node)
          const color = CATEGORY_COLOR[node.category] || G
          const isActionable = node.state === 'actionable'
          const isCompleted = node.state === 'completed'
          const isLocked = node.state === 'locked'

          return (
            <div
              key={node.id}
              className="node-card"
              onClick={() => !isLocked && setSelected(node)}
              style={{
                position: 'absolute',
                left: pos.x,
                top: pos.y + 60,
                transform: 'translate(-50%, -50%)',
                width: 160,
                background: getNodeBg(node.state, color),
                border: `2px solid ${getNodeBorder(node.state, color)}`,
                borderRadius: 16,
                padding: '14px 16px',
                opacity: isLocked ? 0.4 : 1,
                animation: `fadeIn 0.4s ease ${idx * 0.05}s both`,
                cursor: isLocked ? 'not-allowed' : 'pointer',
                boxShadow: isActionable ? `0 0 24px ${color}20` : 'none',
              }}
            >
              {/* Pulse ring for actionable */}
              {isActionable && (
                <div className="actionable-ring" style={{ position: 'absolute', inset: -4, borderRadius: 20, border: `2px solid ${color}50` }} />
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 20 }}>{node.icon}</span>
                {isCompleted && <span style={{ color: G, fontSize: 12 }}>✓</span>}
                {isLocked && <span style={{ color: '#333', fontSize: 12 }}>🔒</span>}
                {isActionable && <span style={{ background: color, color: '#050f06', borderRadius: 6, fontSize: 9, fontWeight: 800, padding: '2px 6px', fontFamily: '"DM Mono", monospace' }}>NOW</span>}
              </div>

              <p style={{ color: isCompleted ? '#4ade80' : isActionable ? '#fff' : '#555', fontWeight: 700, fontSize: 12, lineHeight: 1.3, marginBottom: 4 }}>{node.title}</p>
              <p style={{ color: isCompleted ? '#1a3a1f' : '#333', fontSize: 10, fontFamily: '"DM Mono", monospace' }}>{node.category}</p>

              {node.day > 0 && (
                <div style={{ marginTop: 8, background: '#0a0a0a', borderRadius: 6, padding: '3px 8px', display: 'inline-block' }}>
                  <span style={{ color: '#2a2a2a', fontSize: 9, fontFamily: '"DM Mono", monospace' }}>DAY {node.day}</span>
                </div>
              )}
            </div>
          )
        })}

        {/* Drag hint */}
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: 20, padding: '6px 16px', pointerEvents: 'none' }}>
          <span style={{ color: '#333', fontSize: 11, fontFamily: '"DM Mono", monospace' }}>drag to scroll · click actionable nodes to enter mission</span>
        </div>
      </div>

      {/* Side panel */}
      {selected && (
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 360, background: '#070707', borderLeft: '1px solid #111', padding: 32, overflowY: 'auto', zIndex: 100, animation: 'fadeIn .2s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
            <span style={{ color: '#444', fontSize: 13, fontFamily: '"DM Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Mission Details</span>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 20 }}>×</button>
          </div>

          <div style={{ fontSize: 40, marginBottom: 16 }}>{selected.icon}</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{ background: `${CATEGORY_COLOR[selected.category]}15`, color: CATEGORY_COLOR[selected.category], fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8, fontFamily: '"DM Mono", monospace' }}>{selected.category}</span>
            {selected.state === 'completed' && <span style={{ background: '#0f2a1a', color: G, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8, fontFamily: '"DM Mono", monospace' }}>✓ COMPLETED</span>}
            {selected.state === 'actionable' && <span style={{ background: '#fbbf2415', color: '#fbbf24', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8, fontFamily: '"DM Mono", monospace' }}>YOUR NEXT STEP</span>}
          </div>

          <h2 style={{ color: '#fff', fontSize: 26, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 8 }}>{selected.title}</h2>
          {selected.day > 0 && <p style={{ color: '#444', fontSize: 13, fontFamily: '"DM Mono", monospace', marginBottom: 24 }}>Day {selected.day} of 7</p>}

          {/* Prerequisites */}
          {selected.prereqs.length > 0 && (
            <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <p style={{ color: '#444', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: '"DM Mono", monospace', marginBottom: 10 }}>Prerequisites</p>
              {selected.prereqs.map(pid => {
                const p = nodes.find(n => n.id === pid)
                if (!p) return null
                return (
                  <div key={pid} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #111' }}>
                    <span style={{ fontSize: 14 }}>{p.icon}</span>
                    <span style={{ color: p.state === 'completed' ? G : '#666', fontSize: 13, fontWeight: 600 }}>{p.title}</span>
                    {p.state === 'completed' && <span style={{ marginLeft: 'auto', color: G, fontSize: 12 }}>✓</span>}
                  </div>
                )
              })}
            </div>
          )}

          {/* Unlocks */}
          {(() => {
            const unlocks = nodes.filter(n => n.prereqs.includes(selected.id))
            if (!unlocks.length) return null
            return (
              <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: 12, padding: 16, marginBottom: 24 }}>
                <p style={{ color: '#444', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: '"DM Mono", monospace', marginBottom: 10 }}>Unlocks Next</p>
                {unlocks.map(u => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #111' }}>
                    <span style={{ fontSize: 14 }}>{u.icon}</span>
                    <span style={{ color: '#666', fontSize: 13, fontWeight: 600 }}>{u.title}</span>
                    <span style={{ marginLeft: 'auto', color: '#333', fontSize: 10, fontFamily: '"DM Mono", monospace' }}>Day {u.day}</span>
                  </div>
                ))}
              </div>
            )
          })()}

          {selected.state === 'actionable' && selected.day > 0 && (
            <button
              onClick={() => router.push(`/mission?day=${selected.day}`)}
              style={{ width: '100%', background: G, color: '#050f06', border: 'none', borderRadius: 12, padding: '14px 20px', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Enter Mission →
            </button>
          )}
          {selected.state === 'completed' && (
            <div style={{ background: '#0f2a1a', border: '1px solid #1a3a1f', borderRadius: 12, padding: 14, textAlign: 'center' }}>
              <span style={{ color: G, fontSize: 13, fontWeight: 700 }}>✓ Mission Complete</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}