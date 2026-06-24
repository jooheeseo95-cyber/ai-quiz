import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'
import Timer from '../components/Timer'
import { useStore } from '../store/useStore'
import { getQuizSetById, getQuizSetByCode, getQuestions, submitQuiz } from '../services/quizService'

export default function QuizPlay() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const code = searchParams.get('code')
  const setId = searchParams.get('setId')

  const {
    participant,
    currentQuizSet,
    setCurrentQuizSet,
    currentQuestions,
    setCurrentQuestions,
    quizPlay,
    initQuizPlay,
    recordAnswer,
    nextQuestion,
    setLastSubmission,
  } = useStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [timeoutMsg, setTimeoutMsg] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [timerKey, setTimerKey] = useState(0)

  useEffect(() => {
    if (!participant) { navigate('/quiz'); return }

    const load = async () => {
      try {
        let quiz = currentQuizSet
        if (code) {
          quiz = await getQuizSetByCode(code)
        } else if (setId) {
          quiz = await getQuizSetById(setId)
        }
        if (!quiz) { setError('퀴즈를 찾을 수 없습니다.'); setLoading(false); return }
        setCurrentQuizSet(quiz)
        const qs = await getQuestions(quiz.id)
        setCurrentQuestions(qs)
        initQuizPlay()
      } catch {
        setError('퀴즈 로딩 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])  // eslint-disable-line

  const currentQ = currentQuestions[quizPlay?.currentQuestionIndex ?? 0]
  const isLastQuestion = quizPlay && currentQuestions.length > 0 && quizPlay.currentQuestionIndex === currentQuestions.length - 1

  const handleAnswer = useCallback((answer: string) => {
    if (!quizPlay || !currentQ || selected !== null) return
    const timeSpentMs = Date.now() - quizPlay.questionStartTime
    setSelected(answer)
    recordAnswer(currentQ.id, answer, timeSpentMs)
  }, [quizPlay, currentQ, selected, recordAnswer])

  const handleTimeout = useCallback(() => {
    if (!quizPlay || !currentQ || selected !== null) return
    const timeSpentMs = currentQuizSet!.settings.timerSeconds * 1000
    recordAnswer(currentQ.id, '', timeSpentMs)
    setTimeoutMsg(true)
    setTimeout(() => {
      setTimeoutMsg(false)
      setSelected(null)
      setTimerKey((k) => k + 1)
      nextQuestion()
    }, 800)
  }, [quizPlay, currentQ, selected, currentQuizSet, recordAnswer, nextQuestion])

  const handleNext = () => {
    if (selected === null) return
    setSelected(null)
    setTimerKey((k) => k + 1)
    nextQuestion()
  }

  const handleSubmit = async () => {
    if (!quizPlay || !currentQuizSet || !participant) return
    setSubmitting(true)
    try {
      const res = await submitQuiz({
        setId: currentQuizSet.id,
        nickname: participant.nickname,
        department: participant.department,
        answers: quizPlay.answers,
      })
      setLastSubmission({
        id: res.submissionId,
        nickname: participant.nickname,
        department: participant.department,
        score: res.score,
        totalQuestions: res.totalQuestions,
        totalTimeMs: res.totalTimeMs,
        submittedAt: new Date(),
        answers: quizPlay.answers.map((a, i) => ({
          questionId: a.questionId,
          selectedAnswer: a.selectedAnswer,
          isCorrect: res.results[i]?.isCorrect ?? false,
          timeSpentMs: a.timeSpentMs,
        })),
      })
      navigate('/quiz/result', { state: { results: res.results, score: res.score, total: res.totalQuestions, rank: res.rank, totalTimeMs: res.totalTimeMs } })
    } catch {
      alert('제출 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Layout><div className="text-center py-20 text-gray-400">퀴즈 불러오는 중...</div></Layout>
  if (error) return <Layout><div className="text-center py-20 text-red-500">{error}</div></Layout>
  if (!quizPlay || !currentQ) return <Layout><div className="text-center py-20 text-gray-400">퀴즈 데이터를 불러오지 못했습니다.</div></Layout>

  const progress = (quizPlay.currentQuestionIndex + 1) / currentQuestions.length

  return (
    <Layout>
      {timeoutMsg && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-red-500 text-white text-2xl font-bold px-8 py-4 rounded-2xl shadow-2xl animate-bounce">
            시간 초과!
          </div>
        </div>
      )}

      <div className="py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
              <span>{quizPlay.currentQuestionIndex + 1} / {currentQuestions.length}</span>
              <span className="font-semibold text-gray-700">{currentQuizSet?.title}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
          <div className="ml-4">
            <Timer
              key={timerKey}
              totalSeconds={currentQuizSet?.settings.timerSeconds ?? 30}
              onTimeout={handleTimeout}
              paused={selected !== null}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-5 mb-4">
          <p className="text-base font-semibold text-gray-800 leading-relaxed">
            <span className="text-indigo-500 font-bold mr-2">Q{quizPlay.currentQuestionIndex + 1}.</span>
            {currentQ.question}
          </p>
        </div>

        <div className="flex flex-col gap-2 mb-4">
          {currentQ.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(opt)}
              disabled={selected !== null}
              className={`w-full text-left px-4 py-3.5 rounded-xl border-2 font-medium transition text-sm ${
                selected === opt
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : selected !== null
                  ? 'border-gray-200 bg-gray-50 text-gray-400'
                  : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 text-gray-700'
              }`}
            >
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-bold mr-2">
                {i + 1}
              </span>
              {opt}
            </button>
          ))}
        </div>

        {selected !== null && !isLastQuestion && (
          <button
            onClick={handleNext}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl transition"
          >
            다음 문제 →
          </button>
        )}

        {selected !== null && isLastQuestion && (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold py-3.5 rounded-xl transition"
          >
            {submitting ? '제출 중...' : '퀴즈 제출 ✓'}
          </button>
        )}
      </div>
    </Layout>
  )
}
