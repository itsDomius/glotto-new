// force update 1
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// Ορίζουμε έναν τύπο για τα options για να μην γκρινιάζει το TypeScript
type Option = {
  value: string;
  label: string;
  flag?: string;
  description?: string;
}

const STEPS = [
  {
    id: 'language',
    title: '΅Which language?',
    subtitle: 'Choose your target language',
    type: 'grid',
    options: [
      { value: 'english', label: 'English', flag: '🇬🇧' },
      { value: 'spanish', label: 'Spanish', flag: '🇪🇸' },
      { value: 'french', label: 'French', flag: '🇫🇷' },
      { value: 'german', label: 'German', flag: '🇩🇪' },
      { value: 'italian', label: 'Italian', flag: '🇮🇹' },
      { value: 'portuguese', label: 'Portuguese', flag: '🇵🇹' },
      { value: 'japanese', label: 'Japanese', flag: '🇯🇵' },
      { value: 'mandarin', label: 'Mandarin', flag: '🇨🇳' },
    ]
  },
  {
    id: 'level',
    title: 'What is your current level?',
    subtitle: 'Be honest — we adapt everything to where you are right now',
    type: 'list',
    options: [
      { value: 'A1', label: 'Complete Beginner', description: 'I know almost nothing' },
      { value: 'A2', label: 'Elementary', description: 'I know basic phrases and greetings' },
      { value: 'B1', label: 'Intermediate', description: 'I can handle simple conversations' },
      { value: 'B2', label: 'Upper Intermediate', description: 'I can discuss most topics' },
      { value: 'C1', label: 'Advanced', description: 'I am nearly fluent' },
      { value: 'C2', label: 'Mastery', description: 'I want to perfect my language' },
    ]
  },
  {
    id: 'goal',
    title: 'What is your Dream Goal?',
    subtitle: 'Everything we build for you will be aimed at this specific outcome',
    type: 'list',
    options: [
      { value: 'job', label: 'Get a job or promotion', description: 'Career advancement requiring language skills' },
      { value: 'travel', label: 'Travel independently', description: 'Navigate a country with confidence' },
      { value: 'netflix', label: 'Watch content without subtitles', description: 'Fully enjoy films, series, and videos' },
      { value: 'move', label: 'Move to another country', description: 'Live and thrive in a new place' },
      { value: 'exam', label: 'Pass a language exam', description: 'IELTS, TOEFL, DELF, or other certification' },
      { value: 'connect', label: 'Connect with people', description: 'Make friends, date, build relationships' },
      { value: 'business', label: 'Run my business internationally', description: 'Communicate with global clients and partners' },
      { value: 'study', label: 'Study abroad', description: 'Attend university or courses overseas' },
    ]
  },
  {
    id: 'style',
    title: 'How do you learn best?',
    subtitle: 'Your lessons will be designed around your natural learning style',
    type: 'list',
    options: [
      { value: 'visual', label: 'Visual Learner', description: 'I learn best by reading, seeing patterns, and using visuals' },
      { value: 'auditory', label: 'Auditory Learner', description: 'I learn best by listening, speaking, and hearing explanations' },
      { value: 'kinesthetic', label: 'Kinesthetic Learner', description: 'I learn best by doing, practicing, and applying immediately' },
    ]
  },
  {
    id: 'commitment',
    title: 'Set your monthly commitment',
    subtitle: 'Users who set a goal are 40% more likely to succeed',
    type: 'commitment',
    options: [
      { value: '3', label: '3 sessions per week', description: 'Casual — great for busy schedules' },
      { value: '5', label: '5 sessions per week', description: 'Recommended — steady progress' },
      { value: '7', label: 'Every day', description: 'Intensive — fastest results' },
    ]
  }
]

export default function Onboarding() {
  const [step, setStep] = useState(0)
  const [selections, setSelections] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const currentStep = STEPS[step]
  const progress = ((step) / STEPS.length) * 100

  const handleSelect = (value: string) => {
    setSelections(prev => ({ ...prev, [currentStep.id]: value }))
  }

  const handleNext = async () => {
    if (!selections[currentStep.id]) return

    if (step < STEPS.length - 1) {
      setStep(prev => prev + 1)
      return
    }

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    await supabase.from('profiles').upsert({
        user_id: user.id,
        full_name: user.user_metadata?.full_name,
        target_language: selections.language,
        current_level: selections.level,
        dream_goal: selections.goal,
        learning_style: selections.style,
        onboarding_complete: true,
      })
    
    await supabase.from('streaks').upsert({
      user_id: user.id,
      current_streak: 0,
      longest_streak: 0,
    })

    await supabase.from('personal_bests').upsert({
      user_id: user.id,
      longest_session: 0,
      most_words_produced: 0,
      highest_accuracy: 0,
      most_xp_single_session: 0,
    })

    setLoading(false)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#f5f4f0] flex flex-col">
      <div className="w-full h-1 bg-gray-200">
        <div
          className="h-1 bg-[#111111] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Glotto" className="w-7 h-7 object-contain" />
          <span className="font-bold text-[#111111] text-lg">Glotto</span>
        </div>
        <span className="text-gray-400 text-sm">{step + 1} of {STEPS.length}</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-2xl">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold text-[#111111] mb-3">{currentStep.title}</h1>
            <p className="text-gray-500">{currentStep.subtitle}</p>
          </div>

          {currentStep.type === 'grid' && (
            <div className="grid grid-cols-4 gap-3 mb-10">
              {currentStep.options.map((option: Option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${
                    selections[currentStep.id] === option.value
                      ? 'border-[#111111] bg-[#111111] text-white'
                      : 'border-gray-200 bg-white text-[#111111] hover:border-gray-300'
                  }`}
                >
                  {/* @ts-ignore */}
                 <span className="text-3xl">{(option as any).flag}</span>
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          )}

          {(currentStep.type === 'list' || currentStep.type === 'commitment') && (
            <div className="flex flex-col gap-3 mb-10">
              {currentStep.options.map((option: any) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
                    selections[currentStep.id] === option.value
                      ? 'border-[#111111] bg-[#111111] text-white'
                      : 'border-gray-200 bg-white text-[#111111] hover:border-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                    selections[currentStep.id] === option.value
                      ? 'border-white bg-white'
                      : 'border-gray-300'
                  }`}>
                    {selections[currentStep.id] === option.value && (
                      <div className="w-2.5 h-2.5 rounded-full bg-[#111111]" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{option.label}</p>
                    {option.description && (
                      <p className={`text-sm mt-0.5 ${
                        selections[currentStep.id] === option.value ? 'text-gray-300' : 'text-gray-500'
                      }`}>{option.description}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          <button
            onClick={handleNext}
            disabled={!selections[currentStep.id] || loading}
            className="w-full py-4 rounded-2xl bg-[#111111] text-white font-bold text-base hover:bg-[#222222] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading ? 'Setting up your experience...' : step === STEPS.length - 1 ? 'Start my journey →' : 'Continue →'}
          </button>

          {step > 0 && (
            <button
              onClick={() => setStep(prev => prev - 1)}
              className="w-full py-3 mt-3 text-gray-400 text-sm hover:text-gray-600 transition-colors"
            >
              ← Back
            </button>
          )}

        </div>
      </div>
    </div>
  )
} 