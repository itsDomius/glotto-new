'use client'
import { useState } from 'react'

const vocab = [
  { word: 'Hola',        trans: 'Hello',            pct: 95, status: 'strong'   },
  { word: 'Gracias',     trans: 'Thank you',         pct: 88, status: 'strong'   },
  { word: 'Por favor',   trans: 'Please',            pct: 72, status: 'strong'   },
  { word: 'Buenos días', trans: 'Good morning',      pct: 61, status: 'fading'   },
  { word: 'Lo siento',   trans: 'I am sorry',        pct: 45, status: 'fading'   },
  { word: 'No entiendo', trans: "I don't understand",pct: 38, status: 'forgotten'},
  { word: 'Quiero',      trans: 'I want',            pct: 22, status: 'forgotten'},
  { word: 'Dónde está',  trans: 'Where is',          pct: 15, status: 'forgotten'},
  { word: 'Cuánto cuesta',trans: 'How much',         pct: 8,  status: 'forgotten'},
]

const statusConfig = {
  strong:    { color: '#4ade80', bg: 'rgba(74,222,128,0.06)',   border: 'rgba(74,222,128,0.12)',  label: 'Strong'   },
  fading:    { color: '#fbbf24', bg: 'rgba(251,191,36,0.06)',   border: 'rgba(251,191,36,0.12)',  label: 'Fading'   },
  forgotten: { color: '#f87171', bg: 'rgba(248,113,113,0.06)',  border: 'rgba(248,113,113,0.12)', label: 'Review'   },
}

export default function ForgettingCurve() {
  const [filter, setFilter] = useState<'all' | 'strong' | 'fading' | 'forgotten'>('all')
  const counts = { strong: vocab.filter(v=>v.status==='strong').length, fading: vocab.filter(v=>v.status==='fading').length, forgotten: vocab.filter(v=>v.status==='forgotten').length }
  const shown = filter === 'all' ? vocab : vocab.filter(v => v.status === filter)

  return (
    <div style={{fontFamily:'Noto Sans,system-ui,sans-serif'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'18px'}}>
        <div>
          <h3 style={{color:'#fff',fontSize:'15px',fontWeight:'800',margin:'0 0 3px',letterSpacing:'-0.4px',fontFamily:'Syne,sans-serif'}}>Forgetting Curve</h3>
          <p style={{color:'#252525',fontSize:'9px',margin:0,fontFamily:'JetBrains Mono,monospace',letterSpacing:'1px'}}>WORDS FADING FROM MEMORY NEED REVIEW</p>
        </div>
        <button onClick={()=>setFilter(f=>f==='forgotten'?'all':'forgotten')}
          style={{background: filter==='forgotten' ? 'rgba(248,113,113,0.1)' : '#111',border: filter==='forgotten' ? '1px solid rgba(248,113,113,0.2)' : '1px solid #1a1a1a',color: filter==='forgotten' ? '#f87171' : '#333',borderRadius:'20px',padding:'4px 12px',fontSize:'9px',fontWeight:'600',cursor:'pointer',fontFamily:'JetBrains Mono,monospace',letterSpacing:'1px',transition:'all 0.15s ease'}}>
          {filter==='forgotten' ? 'SHOW ALL' : 'REVIEW ONLY'}
        </button>
      </div>

      {/* Summary pills */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',marginBottom:'16px'}}>
        {(['strong','fading','forgotten'] as const).map(s => {
          const cfg = statusConfig[s]
          return (
            <button key={s} onClick={()=>setFilter(f=>f===s?'all':s)}
              style={{background: filter===s ? cfg.bg : '#111', border:`1px solid ${filter===s ? cfg.border : '#1a1a1a'}`,borderRadius:'10px',padding:'12px',textAlign:'center',cursor:'pointer',transition:'all 0.15s ease'}}>
              <p style={{color:cfg.color,fontSize:'20px',fontWeight:'800',margin:'0 0 2px',fontFamily:'Syne,sans-serif'}}>{counts[s]}</p>
              <p style={{color: filter===s ? cfg.color : '#252525',fontSize:'8px',margin:0,fontFamily:'JetBrains Mono,monospace',letterSpacing:'1.5px',textTransform:'uppercase'}}>{cfg.label}</p>
            </button>
          )
        })}
      </div>

      {/* Word list */}
      <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
        {shown.map(v => {
          const cfg = statusConfig[v.status as keyof typeof statusConfig]
          return (
            <div key={v.word}
              style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 14px',background:cfg.bg,border:`1px solid ${cfg.border}`,borderRadius:'9px',transition:'all 0.15s ease'}}>
              <div style={{width:'6px',height:'6px',borderRadius:'50%',background:cfg.color,flexShrink:0,boxShadow:`0 0 6px ${cfg.color}`}} />
              <div style={{flex:1}}>
                <span style={{color:'#fff',fontSize:'13px',fontWeight:'600',fontFamily:'Noto Sans,sans-serif'}}>{v.word}</span>
                <span style={{color:'#2a2a2a',fontSize:'12px',fontFamily:'Noto Sans,sans-serif',marginLeft:'8px'}}>{v.trans}</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                <span style={{color:cfg.color,fontSize:'11px',fontWeight:'700',fontFamily:'JetBrains Mono,monospace'}}>{v.pct}%</span>
                <button style={{background:'#111',border:`1px solid ${cfg.border}`,color:cfg.color,borderRadius:'6px',padding:'4px 10px',fontSize:'10px',fontWeight:'600',cursor:'pointer',fontFamily:'JetBrains Mono,monospace',letterSpacing:'0.5px',transition:'all 0.15s ease'}}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=cfg.bg}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='#111'}>
                  Review
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
