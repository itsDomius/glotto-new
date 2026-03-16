// ════════════════════════════════════════════════════════════════════════════
// FILE: src/app/dependency-map/page.tsx
// FEATURES: Locked/Actionable/Completed nodes, unlock animation, dopamine UX
// ════════════════════════════════════════════════════════════════════════════
'use client'
import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type NodeState = 'locked' | 'actionable' | 'completed'

type MapNode = {
  id: string; day: number; title: string; category: string
  icon: string; prereqs: string[]; state: NodeState; x: number; y: number
}

const NODES_BASE: Omit<MapNode, 'state'>[] = [
  { id: 'arrive',    day: 0, title: 'Land in Athens',        category: 'Start',       icon: '✈️',  prereqs: [],             x: 400, y: 80  },
  { id: 'metro',     day: 1, title: 'Buy Metro Ticket',       category: 'Transport',   icon: '🚇',  prereqs: ['arrive'],      x: 400, y: 200 },
  { id: 'apartment', day: 2, title: 'Find an Apartment',      category: 'Housing',     icon: '🏠',  prereqs: ['metro'],       x: 400, y: 320 },
  { id: 'tax',       day: 3, title: 'Get Your Tax ID',        category: 'Bureaucracy', icon: '🪪',  prereqs: ['apartment'],   x: 400, y: 440 },
  { id: 'bank',      day: 4, title: 'Open a Bank Account',    category: 'Finance',     icon: '🏦',  prereqs: ['tax'],         x: 560, y: 540 },
  { id: 'contract',  day: 5, title: 'Sign Rental Contract',   category: 'Housing',     icon: '📝',  prereqs: ['tax'],         x: 240, y: 540 },
  { id: 'health',    day: 6, title: 'Navigate Health System', category: 'Health',      icon: '🏥',  prereqs: ['bank'],        x: 560, y: 640 },
  { id: 'sim',       day: 7, title: 'Get a Local SIM Card',   category: 'Daily Life',  icon: '📱',  prereqs: ['contract'],    x: 240, y: 640 },
]

const CAT_COLOR: Record<string, string> = {
  Start: '#4ade80', Transport: '#60a5fa', Housing: '#a78bfa',
  Bureaucracy: '#fbbf24', Finance: '#4ade80', Health: '#f87171', 'Daily Life': '#fb923c',
}

const G = '#4ade80'

export default function DependencyMapPage() {
  const router = useRouter()
  const [nodes, setNodes] = useState<MapNode[]>([])
  const [missionDay, setMissionDay] = useState(1)
  const [selected, setSelected] = useState<MapNode | null>(null)
  const [loading, setLoading] = useState(true)
  const [justCompleted, setJustCompleted] = useState<string | null>(null)
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([])
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: p } = await supabase.from('profiles').select('mission_day').eq('user_id', user.id).single()
      const day = p?.mission_day || 1
      setMissionDay(day)
      setNodes(buildNodes(day))
      setLoading(false)
    }
    load()
  }, [router])

  function buildNodes(day: number): MapNode[] {
    return NODES_BASE.map(n => {
      let state: NodeState = 'locked'
      if (n.day === 0 || n.day < day) state = 'completed'
      else if (n.day === day) state = 'actionable'
      else {
        const prereqsMet = n.prereqs.every(pid => {
          const p = NODES_BASE.find(t => t.id === pid)
          return p && (p.day === 0 || p.day < day)
        })
        if (prereqsMet) state = 'actionable'
      }
      return { ...n, state }
    })
  }

  // Simulate completing the current mission (for demo)
  const simulateComplete = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    if (!node || node.state !== 'actionable') return
    setJustCompleted(nodeId)

    setTimeout(() => {
      const newDay = node.day + 1
      const newNodes = buildNodes(newDay)
      // Find newly unlocked nodes
      const prevActionable = nodes.filter(n => n.state === 'actionable').map(n => n.id)
      const nextActionable = newNodes.filter(n => n.state === 'actionable').map(n => n.id)
      const unlocked = nextActionable.filter(id => !prevActionable.includes(id))
      setNewlyUnlocked(unlocked)
      setNodes(newNodes)
      setMissionDay(newDay)
      setJustCompleted(null)
      setTimeout(() => setNewlyUnlocked([]), 2000)
    }, 1200)
  }

  const pct = Math.round(((missionDay - 1) / 7) * 100)

  if (loading) return (
    <main style={{ minHeight: '100vh', background: '#070707', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #1a1a1a', borderTopColor: G, animation: 'spin .8s linear infinite' }} />
    </main>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#070707', fontFamily: '"DM Sans", -apple-system, sans-serif', overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Animations ── */
        @keyframes pulse      { 0%,100%{opacity:1;transform:scale(1)}   50%{opacity:.7;transform:scale(1.04)} }
        @keyframes ring       { 0%{box-shadow:0 0 0 0 rgba(74,222,128,.8)} 100%{box-shadow:0 0 0 28px rgba(74,222,128,0)} }
        @keyframes fadeIn     { from{opacity:0}                           to{opacity:1} }
        @keyframes slideUp    { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes unlockBoom { 0%{transform:scale(.8);opacity:0}  50%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
        @keyframes checkPop   { 0%{transform:scale(0) rotate(-45deg)} 60%{transform:scale(1.3) rotate(5deg)} 100%{transform:scale(1) rotate(0)} }
        @keyframes shimmer    { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes spin       { to{transform:rotate(360deg)} }
        @keyframes completePulse { 0%{box-shadow:0 0 0 0 rgba(74,222,128,.9)} 100%{box-shadow:0 0 0 32px rgba(74,222,128,0)} }

        .node { transition: transform .15s, filter .15s; cursor: pointer; }
        .node:hover:not(.locked) { transform: scale(1.06); filter: brightness(1.1); }
        .node.locked { cursor: not-allowed; }
        .node.actionable { animation: pulse 2.5s ease infinite; }
        .node.just-completed { animation: completePulse .8s ease-out; }
        .node.newly-unlocked { animation: unlockBoom .5s cubic-bezier(.16,1,.3,1) both; }

        .check-icon { animation: checkPop .4s cubic-bezier(.16,1,.3,1) both; }

        .shimmer-bar {
          background: linear-gradient(90deg, #1a3a1f 0%, #4ade80 40%, #4ade80 60%, #1a3a1f 100%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }

        .panel { animation: slideUp .2s ease; }
        .sidebar::-webkit-scrollbar { width: 4px; }
        .sidebar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 4px; }
      `}</style>

      {/* ── Top header ── */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(7,7,7,.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #111', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: '#444', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>← Dashboard</button>
          <div style={{ width: 1, height: 16, background: '#1a1a1a' }} />
          <span style={{ color: G, fontWeight: 800, fontSize: 22 }}>Glotto</span>
          <span style={{ color: '#2a2a2a', fontSize: 13, fontFamily: '"DM Mono", monospace' }}>Relocation Map</span>
        </div>

        {/* Integration progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: '#444', fontSize: 11, fontFamily: '"DM Mono", monospace' }}>INTEGRATION</span>
              <span style={{ color: G, fontSize: 11, fontWeight: 700, fontFamily: '"DM Mono", monospace' }}>{pct}%</span>
            </div>
            <div style={{ height: 4, background: '#111', borderRadius: 4, overflow: 'hidden' }}>
              {pct > 0 && <div className="shimmer-bar" style={{ height: '100%', width: `${pct}%`, borderRadius: 4 }} />}
            </div>
          </div>

          {/* Legend */}
          {([['completed','#4ade80'],['actionable','#fbbf24'],['locked','#333']] as const).map(([s, c]) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
              <span style={{ color: '#333', fontSize: 11, fontFamily: '"DM Mono", monospace', textTransform: 'uppercase' }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Canvas ── */}
      <div style={{ paddingTop: 60, display: 'flex', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: 800, minHeight: '100vh' }}>

          {/* SVG edges */}
          <svg ref={svgRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
            <defs>
              <marker id="arrow-active" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                <circle cx="4" cy="4" r="2" fill={G} />
              </marker>
              <marker id="arrow-locked" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                <circle cx="4" cy="4" r="2" fill="#222" />
              </marker>
            </defs>
            {nodes.map(node =>
              node.prereqs.map(pid => {
                const parent = nodes.find(n => n.id === pid)
                if (!parent) return null
                const isActive = parent.state === 'completed' || parent.state === 'actionable'
                const color = isActive ? (node.state === 'locked' ? '#1a3a1f' : G) : '#111'
                const dashArray = node.state === 'locked' ? '5 5' : '0'
                return (
                  <line key={`${pid}-${node.id}`}
                    x1={parent.x} y1={parent.y + 44}
                    x2={node.x}   y2={node.y - 44}
                    stroke={color} strokeWidth={node.state === 'locked' ? 1 : 2}
                    strokeDasharray={dashArray}
                    markerEnd={isActive ? `url(#arrow-active)` : `url(#arrow-locked)`}
                    style={{ transition: 'all .5s ease' }}
                  />
                )
              })
            )}
          </svg>

          {/* Nodes */}
          {nodes.map((node, idx) => {
            const color = CAT_COLOR[node.category] || G
            const isCompleted = node.state === 'completed'
            const isActionable = node.state === 'actionable'
            const isLocked = node.state === 'locked'
            const isJustCompleted = justCompleted === node.id
            const isNewlyUnlocked = newlyUnlocked.includes(node.id)

            return (
              <div
                key={node.id}
                className={`node ${node.state} ${isJustCompleted ? 'just-completed' : ''} ${isNewlyUnlocked ? 'newly-unlocked' : ''}`}
                onClick={() => {
                  if (isLocked) return
                  setSelected(selected?.id === node.id ? null : node)
                }}
                style={{
                  position: 'absolute',
                  left: node.x - 80,
                  top: node.y + 64,
                  width: 160,
                  background: isCompleted ? '#0a1a0a' : isActionable ? `${color}0f` : '#0a0a0a',
                  border: `2px solid ${isCompleted ? '#1a3a1f' : isActionable ? `${color}60` : '#111'}`,
                  borderRadius: 18,
                  padding: '16px 14px',
                  opacity: isLocked ? 0.35 : 1,
                  boxShadow: isActionable ? `0 0 32px ${color}20` : 'none',
                  zIndex: selected?.id === node.id ? 10 : 1,
                  animationDelay: `${idx * 0.04}s`,
                }}
              >
                {/* Pulse ring for actionable */}
                {isActionable && !isJustCompleted && (
                  <div style={{ position: 'absolute', inset: -4, borderRadius: 22, border: `2px solid ${color}40`, animation: 'ring 2s ease infinite', pointerEvents: 'none' }} />
                )}

                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 24 }}>{node.icon}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isCompleted && <span className="check-icon" style={{ background: G, color: '#050f06', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900 }}>✓</span>}
                    {isLocked && <span style={{ fontSize: 12, color: '#333' }}>🔒</span>}
                    {isActionable && <span style={{ background: color, color: '#050f06', borderRadius: 6, fontSize: 9, fontWeight: 800, padding: '2px 7px', fontFamily: '"DM Mono", monospace' }}>NOW</span>}
                  </div>
                </div>

                <p style={{ color: isCompleted ? G : isActionable ? '#fff' : '#444', fontWeight: 700, fontSize: 12, lineHeight: 1.3, marginBottom: 5 }}>{node.title}</p>
                <p style={{ color: isCompleted ? '#1a3a1f' : '#2a2a2a', fontSize: 10, fontFamily: '"DM Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{node.category}</p>
                {node.day > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <span style={{ color: '#1a1a1a', fontSize: 9, fontFamily: '"DM Mono", monospace', background: '#111', borderRadius: 5, padding: '2px 7px' }}>DAY {node.day}</span>
                  </div>
                )}

                {/* Shimmer on just completed */}
                {isJustCompleted && (
                  <div style={{ position: 'absolute', inset: 0, borderRadius: 18, background: 'linear-gradient(90deg, transparent 0%, rgba(74,222,128,.3) 50%, transparent 100%)', backgroundSize: '200% 100%', animation: 'shimmer .8s ease', pointerEvents: 'none' }} />
                )}
              </div>
            )
          })}

          {/* ── "Newly Unlocked" floating toast ── */}
          {newlyUnlocked.length > 0 && (
            <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: '#0f2a1a', border: '1px solid #1a3a1f', borderRadius: 14, padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12, zIndex: 100, animation: 'unlockBoom .4s ease' }}>
              <span style={{ fontSize: 22 }}>🔓</span>
              <div>
                <p style={{ color: G, fontWeight: 800, fontSize: 14 }}>New mission unlocked!</p>
                <p style={{ color: '#555', fontSize: 12 }}>{nodes.find(n => newlyUnlocked.includes(n.id))?.title}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Side panel ── */}
      {selected && (
        <div className="panel sidebar" style={{ position: 'fixed', top: 60, right: 0, bottom: 0, width: 340, background: '#070707', borderLeft: '1px solid #111', padding: '28px 26px', overflowY: 'auto', zIndex: 100 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <span style={{ color: '#333', fontSize: 11, fontFamily: '"DM Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Mission Details</span>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 20 }}>×</button>
          </div>

          <div style={{ fontSize: 40, marginBottom: 14 }}>{selected.icon}</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <span style={{ background: `${CAT_COLOR[selected.category]}15`, color: CAT_COLOR[selected.category], fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8, fontFamily: '"DM Mono", monospace' }}>{selected.category}</span>
            {selected.state === 'completed' && <span style={{ background: '#0f2a1a', color: G, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8, fontFamily: '"DM Mono", monospace' }}>✓ DONE</span>}
            {selected.state === 'actionable' && <span style={{ background: '#fbbf2415', color: '#fbbf24', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8, fontFamily: '"DM Mono", monospace' }}>YOUR NEXT STEP</span>}
            {selected.state === 'locked' && <span style={{ background: '#111', color: '#333', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8, fontFamily: '"DM Mono", monospace' }}>🔒 LOCKED</span>}
          </div>

          <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 6 }}>{selected.title}</h2>
          {selected.day > 0 && <p style={{ color: '#333', fontSize: 13, fontFamily: '"DM Mono", monospace', marginBottom: 22 }}>Day {selected.day} of 7</p>}

          {/* Prereqs */}
          {selected.prereqs.length > 0 && (
            <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <p style={{ color: '#333', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: '"DM Mono", monospace', marginBottom: 12 }}>Prerequisites</p>
              {selected.prereqs.map(pid => {
                const p = nodes.find(n => n.id === pid)
                if (!p) return null
                return (
                  <div key={pid} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #111' }}>
                    <span style={{ fontSize: 16 }}>{p.icon}</span>
                    <span style={{ color: p.state === 'completed' ? G : '#555', fontSize: 13, fontWeight: 600, flex: 1 }}>{p.title}</span>
                    {p.state === 'completed' && <span style={{ color: G, fontSize: 12 }}>✓</span>}
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
              <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: 12, padding: 16, marginBottom: 22 }}>
                <p style={{ color: '#333', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: '"DM Mono", monospace', marginBottom: 12 }}>Unlocks Next</p>
                {unlocks.map(u => (
                  <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #111' }}>
                    <span style={{ fontSize: 16 }}>{u.icon}</span>
                    <span style={{ color: '#444', fontSize: 13, fontWeight: 600, flex: 1 }}>{u.title}</span>
                    <span style={{ color: '#222', fontSize: 10, fontFamily: '"DM Mono", monospace' }}>Day {u.day}</span>
                  </div>
                ))}
              </div>
            )
          })()}

          {selected.state === 'actionable' && selected.day > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => router.push(`/mission?day=${selected.day}`)} style={{ width: '100%', background: G, color: '#050f06', border: 'none', borderRadius: 12, padding: '14px 20px', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                Enter Mission →
              </button>
              {/* Demo button to simulate completion */}
              <button onClick={() => simulateComplete(selected.id)} style={{ width: '100%', background: '#111', border: '1px dashed #1a3a1f', borderRadius: 12, padding: '10px 20px', fontSize: 13, fontWeight: 600, color: '#1a3a1f', cursor: 'pointer', fontFamily: 'inherit' }}>
                ✓ Simulate Complete (Demo)
              </button>
            </div>
          )}
          {selected.state === 'completed' && (
            <div style={{ background: '#0f2a1a', border: '1px solid #1a3a1f', borderRadius: 12, padding: 14, textAlign: 'center' }}>
              <span style={{ color: G, fontSize: 14, fontWeight: 700 }}>✓ Mission Complete</span>
            </div>
          )}
          {selected.state === 'locked' && (
            <div style={{ background: '#0e0e0e', border: '1px solid #1a1a1a', borderRadius: 12, padding: 14, textAlign: 'center' }}>
              <p style={{ color: '#333', fontSize: 13, fontFamily: '"DM Mono", monospace' }}>Complete prerequisites first</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}