'use client'
import { useState } from 'react'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'

const data = [
  { skill: 'Grammar',    value: 12 },
  { skill: 'Vocabulary', value: 8  },
  { skill: 'Listening',  value: 15 },
  { skill: 'Speaking',   value: 5  },
  { skill: 'Reading',    value: 20 },
  { skill: 'Writing',    value: 10 },
]

const total = data.reduce((a, d) => a + d.value, 0)

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{background:'#111',border:'1px solid #222',borderRadius:'8px',padding:'8px 12px'}}>
        <p style={{color:'#fff',fontSize:'12px',fontWeight:'600',margin:'0 0 2px',fontFamily:'Noto Sans,sans-serif'}}>{payload[0].payload.skill}</p>
        <p style={{color:'#60a5fa',fontSize:'11px',margin:0,fontFamily:'JetBrains Mono,monospace'}}>{payload[0].value} pts</p>
      </div>
    )
  }
  return null
}

export default function LanguageFitnessScore() {
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div style={{fontFamily:'Noto Sans,system-ui,sans-serif'}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'20px'}}>
        <div>
          <h3 style={{color:'#fff',fontSize:'18px',fontWeight:'800',margin:'0 0 4px',letterSpacing:'-0.5px',fontFamily:'Syne,sans-serif'}}>{total}</h3>
          <p style={{color:'#333',fontSize:'10px',margin:0,fontFamily:'JetBrains Mono,monospace',letterSpacing:'1px'}}>OUT OF 1000</p>
        </div>
        <div style={{background:'rgba(96,165,250,0.08)',border:'1px solid rgba(96,165,250,0.15)',borderRadius:'20px',padding:'4px 12px'}}>
          <span style={{color:'#60a5fa',fontSize:'10px',fontWeight:'600',fontFamily:'JetBrains Mono,monospace',letterSpacing:'1px'}}>UPDATES LIVE</span>
        </div>
      </div>

      <div style={{height:'220px',marginBottom:'20px'}}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="#1a1a1a" strokeDasharray="0" />
            <PolarAngleAxis dataKey="skill" tick={{ fill: '#333', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }} />
            <Tooltip content={<CustomTooltip />} />
            <Radar dataKey="value" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.08} strokeWidth={1.5} dot={{ fill: '#60a5fa', strokeWidth: 0, r: 3 }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px'}}>
        {data.map(d => (
          <div key={d.skill}
            onMouseEnter={() => setHovered(d.skill)}
            onMouseLeave={() => setHovered(null)}
            style={{background: hovered === d.skill ? '#141414' : '#111',border:'1px solid #1a1a1a',borderRadius:'8px',padding:'12px',transition:'all 0.15s ease',cursor:'default'}}>
            <p style={{color:'#fff',fontSize:'16px',fontWeight:'800',margin:'0 0 2px',letterSpacing:'-0.5px',fontFamily:'Syne,sans-serif'}}>{d.value}</p>
            <p style={{color:'#333',fontSize:'9px',margin:'0 0 6px',fontFamily:'JetBrains Mono,monospace',letterSpacing:'1px',textTransform:'uppercase'}}>{d.skill}</p>
            <div style={{background:'#1a1a1a',borderRadius:'2px',height:'2px',overflow:'hidden'}}>
              <div style={{height:'100%',width:`${d.value}%`,background:'linear-gradient(90deg,#60a5fa,#818cf8)',borderRadius:'2px',transition:'width 0.8s cubic-bezier(0.16,1,0.3,1)'}} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}