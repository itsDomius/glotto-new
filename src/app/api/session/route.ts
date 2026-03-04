import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { userId, messages, durationSeconds, language, level } = await req.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    )

    const xpEarned = Math.max(10, Math.floor(durationSeconds / 60) * 5)

    // Save session
    await supabase.from('sessions').insert({
      user_id: userId,
      ended_at: new Date().toISOString(),
      duration_seconds: durationSeconds,
      language: language || 'spanish',
      level: level || 'A1',
      messages: messages,
      xp_earned: xpEarned
    })

    // Update streak
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    const { data: streak } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .single()

    let newStreak = 1
    if (streak?.last_session_date === today) {
      newStreak = streak.current_streak
    } else if (streak?.last_session_date === yesterday) {
      newStreak = (streak.current_streak || 0) + 1
    }

    await supabase.from('streaks').upsert({
      user_id: userId,
      current_streak: newStreak,
      longest_streak: Math.max(newStreak, streak?.longest_streak || 0),
      last_session_date: today
    })

    return NextResponse.json({ success: true, xpEarned })

  } catch (error) {
    console.error('Session save error:', error)
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500 })
  }
}