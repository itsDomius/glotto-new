'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const LESSON = {
  title: "Order a coffee in Spanish",
  level: "A1",
  duration: 5,
  steps: [
    {
      id: 1,
      type: 'vocab',
      title: 'Learn 3 key phrases',
      content: [
        { phrase: 'Un café, por favor', translation: 'A coffee, please', pronunciation: 'oon kah-FEH por fah-VOR' },
        { phrase: '¿Cuánto cuesta?', translation: 'How much is it?', pronunciation: 'KWAN-toh KWES-tah' },
        { phrase: 'Gracias', translation: 'Thank you', pronunciation: 'GRAH-see-as' },
      ]
    },
    {
      id: 2,
      type: 'observe',
      title: 'Read this conversation',
      content: {
        dialogue: [
          { speaker: 'You', line: 'Buenos días. Un café con leche, por favor.' },
          { speaker: 'Barista', line: '¿Grande o pequeño?' },
          { speaker: 'You', line: 'Grande, por favor. ¿Cuánto cuesta?' },
          { speaker: 'Barista', line: 'Son dos euros.' },
          { speaker: 'You', line: 'Gracias.' },
        ],
        insight: 'Notice: Spanish uses "Son" (they are) for prices, not "Es" (it is). This is one of the most common patterns in everyday Spanish.'
      }
    },
    {
      id: 3,
      type: 'quiz',
      title: 'Quick check',
      content: {
        question: 'How do you say "A coffee, please" in Spanish?',
        options: [
          { text: 'Un café, por favor', correct: true },
          { text: 'Un té, gracias', correct: false },
          { text: 'Café con leche', correct: false },
          { text: 'Por favor café', correct: false },
        ]
      }
    },
    {
      id: 4,
      type: 'produce',
      title: 'Your turn',
      content: {
        prompt: 'You walk into a café. Order a large coffee with milk and ask how much it costs.',
        hint: 'Use: Un café con leche grande, por favor. ¿Cuánto cuesta?',
        example: 'Buenos días. Un café con leche grande, por favor. ¿Cuánto cuesta?'
      }
    },
    {
      id: 5,
      type: 'complete',
      title: 'Session complete!',
      content: {
        summary: "You just learned how to order coffee in Spanish — a skill you can use in any Spanish-speaking country today.",
        learned: ['Un café, por favor', '¿Cuánto cuesta?', 'Son dos euros', 'Grande / Pequeño'],
        xp: 25,
        nextHook: "Tomorrow: Learn how to order food from a menu — you're 1 step closer to your café reward 🎁"
      }
    }
  ]
}

export default function EmergencyLesson() {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [showExample, setShowExample] = useState(false)
  const [timeLeft, setTimeLeft] = useState(300)
  const router = useRouter()

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const step = LESSON.steps[currentStep]
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const progress = ((currentStep) / (LESSON.steps.length - 1)) * 100

  const handleNext = () => {
    if (currentStep < LESSON.steps.length - 1) {
      setCurrentStep(prev => prev + 1)
      setSelectedAnswer(null)
      setShowAnswer(false)
      setShowExample(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f4f0] flex flex-col">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Glotto" className="w-7 h-7 object-contain" />
            <div>
              <p className="text-[#111111] font-bold text-sm">5-Minute Lesson</p>
              <p className="text-gray-400 text-xs">{LESSON.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${
              timeLeft < 60 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
            }`}>
              ⏱ {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-400 text-sm hover:text-gray-600"
            >
              Exit
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="max-w-2xl mx-auto mt-3">
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-green-500 transition-all duration-500"
              style={{width: `${progress}%`}}
            />
          </div>
          <div className="flex justify-between mt-1">
            <p className="text-gray-400 text-xs">Step {currentStep + 1} of {LESSON.steps.length}</p>
            <p className="text-gray-400 text-xs">{Math.round(progress)}% complete</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-2xl">

          {/* Step title */}
          <h2 className="text-2xl font-bold text-[#111111] mb-8 text-center">{step.title}</h2>

          {/* VOCAB STEP */}
          {step.type === 'vocab' && (
            <div className="flex flex-col gap-4">
              {(step.content as any[]).map((item: any, i: number) => (
                <div key={i} className="bg-white rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-2xl font-bold text-[#111111]">{item.phrase}</p>
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">#{i + 1}</span>
                  </div>
                  <p className="text-gray-500 mb-2">{item.translation}</p>
                  <p className="text-blue-500 text-sm font-medium">🔊 {item.pronunciation}</p>
                </div>
              ))}
            </div>
          )}

          {/* OBSERVE STEP */}
          {step.type === 'observe' && (
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <div className="flex flex-col gap-3">
                  {(step.content as any).dialogue.map((line: any, i: number) => (
                    <div key={i} className={`flex gap-3 ${line.speaker === 'You' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        line.speaker === 'You' ? 'bg-green-700 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {line.speaker === 'You' ? 'Y' : 'B'}
                      </div>
                      <div className={`rounded-2xl px-4 py-2.5 max-w-xs ${
                        line.speaker === 'You'
                          ? 'bg-[#111111] text-white rounded-tr-sm'
                          : 'bg-gray-100 text-[#111111] rounded-tl-sm'
                      }`}>
                        <p className="text-sm">{line.line}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-3xl p-5">
                <p className="text-blue-700 text-sm leading-relaxed">
                  💡 {(step.content as any).insight}
                </p>
              </div>
            </div>
          )}

          {/* QUIZ STEP */}
          {step.type === 'quiz' && (
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-3xl p-6 shadow-sm text-center mb-2">
                <p className="text-[#111111] font-semibold text-lg">{(step.content as any).question}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(step.content as any).options.map((option: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedAnswer(i)
                      setShowAnswer(true)
                    }}
                    disabled={showAnswer}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      showAnswer
                        ? option.correct
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : selectedAnswer === i
                            ? 'border-red-400 bg-red-50 text-red-600'
                            : 'border-gray-200 bg-white text-gray-400'
                        : 'border-gray-200 bg-white text-[#111111] hover:border-gray-300'
                    }`}
                  >
                    <p className="text-sm font-medium">{option.text}</p>
                    {showAnswer && option.correct && <p className="text-xs mt-1 text-green-600">✓ Correct!</p>}
                    {showAnswer && !option.correct && selectedAnswer === i && <p className="text-xs mt-1 text-red-500">✗ Not quite</p>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PRODUCE STEP */}
          {step.type === 'produce' && (
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <p className="text-[#111111] font-semibold mb-2">Your challenge:</p>
                <p className="text-gray-600 leading-relaxed">{(step.content as any).prompt}</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-3xl p-5">
                <p className="text-yellow-700 text-sm">💡 Hint: {(step.content as any).hint}</p>
              </div>
              {!showExample ? (
                <button
                  onClick={() => setShowExample(true)}
                  className="w-full py-3 rounded-2xl border-2 border-gray-200 text-gray-500 text-sm hover:border-gray-300 transition-colors"
                >
                  Show me an example answer
                </button>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-3xl p-5">
                  <p className="text-green-700 text-sm font-medium mb-1">Example answer:</p>
                  <p className="text-green-800">{(step.content as any).example}</p>
                </div>
              )}
            </div>
          )}

          {/* COMPLETE STEP */}
          {step.type === 'complete' && (
            <div className="flex flex-col gap-4 text-center">
              <div className="text-6xl mb-2">🎉</div>
              <div className="bg-white rounded-3xl p-6 shadow-sm">
                <p className="text-[#111111] leading-relaxed mb-4">{(step.content as any).summary}</p>
                <div className="flex flex-wrap gap-2 justify-center mb-4">
                  {(step.content as any).learned.map((item: string) => (
                    <span key={item} className="bg-green-100 text-green-700 text-xs px-3 py-1.5 rounded-full font-medium">
                      {item}
                    </span>
                  ))}
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3 inline-block">
                  <p className="text-yellow-700 font-bold">+{(step.content as any).xp} XP earned</p>
                </div>
              </div>
              <div className="bg-[#111111] rounded-3xl p-5">
                <p className="text-white text-sm leading-relaxed">{(step.content as any).nextHook}</p>
              </div>
            </div>
          )}

          {/* Next Button */}
          <div className="mt-8">
            {step.type === 'quiz' && !showAnswer ? (
              <p className="text-center text-gray-400 text-sm">Select an answer to continue</p>
            ) : step.type === 'complete' ? (
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full py-4 rounded-2xl bg-green-600 text-white font-bold text-base hover:bg-green-500 transition-colors"
              >
                Back to dashboard →
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="w-full py-4 rounded-2xl bg-[#111111] text-white font-bold text-base hover:bg-[#222222] transition-colors"
              >
                Continue →
              </button>
            )}
          </div>

        </div>
      </div>
    </main>
  )
}