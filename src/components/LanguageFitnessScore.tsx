'use client'

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts'

const data = [
  { dimension: 'Grammar', score: 12 },
  { dimension: 'Vocabulary', score: 8 },
  { dimension: 'Listening', score: 15 },
  { dimension: 'Speaking', score: 5 },
  { dimension: 'Reading', score: 20 },
  { dimension: 'Writing', score: 10 },
]

const totalScore = Math.round(
  data.reduce((sum, d) => sum + d.score, 0) / data.length
)

export default function LanguageFitnessScore() {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-[#111111] font-bold">Language Fitness Score</h3>
          <p className="text-gray-400 text-xs mt-0.5">Updates after every session</p>
        </div>
        <div className="text-right">
          <p className="text-4xl font-bold text-[#111111]">{totalScore}</p>
          <p className="text-gray-400 text-xs">out of 1000</p>
        </div>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="#f0f0f0" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
            />
            <Radar
              name="Score"
              dataKey="score"
              stroke="#059669"
              fill="#059669"
              fillOpacity={0.15}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-2">
        {data.map((d) => (
          <div key={d.dimension} className="bg-gray-50 rounded-xl p-3">
            <p className="text-[#111111] font-bold text-sm">{d.score}</p>
            <p className="text-gray-400 text-xs">{d.dimension}</p>
            <div className="w-full bg-gray-200 rounded-full h-1 mt-1.5">
              <div
                className="h-1 rounded-full bg-green-500"
                style={{ width: `${d.score / 10}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}