import { useLocation, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useStore } from '../store/useStore'

interface ResultItem {
  questionId: string
  isCorrect: boolean
  correctAnswer: string
  explanation: string
}

interface LocationState {
  results: ResultItem[]
  score: number
  total: number
  rank: number
  totalTimeMs: number
}

function formatTime(ms: number): string {
  const sec = Math.floor(ms / 1000)
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m}분 ${s}초` : `${s}초`
}

export default function QuizResult() {
  const navigate = useNavigate()
  const location = useLocation()
  const { results, score, total, rank, totalTimeMs } = location.state as LocationState
  const currentQuestions = useStore((s) => s.currentQuestions)
  const lastSubmission = useStore((s) => s.lastSubmission)
  const currentQuizSet = useStore((s) => s.currentQuizSet)

  const pct = Math.round((score / total) * 100)
  const isGood = pct >= 70

  return (
    <Layout>
      <div className="py-4">
        <div className="bg-white rounded-2xl shadow p-6 mb-4 text-center">
          <div className="text-5xl mb-3">{pct >= 80 ? '🏆' : pct >= 60 ? '😊' : '😅'}</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">
            {score} / {total}
          </h2>
          <p className={`text-3xl font-bold mb-2 ${isGood ? 'text-green-500' : 'text-orange-400'}`}>{pct}점</p>
          <div className="flex justify-center gap-6 text-sm text-gray-500">
            <div>
              <span className="block text-xl font-bold text-indigo-600">#{rank}</span>
              현재 순위
            </div>
            <div>
              <span className="block text-xl font-bold text-gray-700">{formatTime(totalTimeMs)}</span>
              소요 시간
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 mb-4">
          {results.map((r, i) => {
            const q = currentQuestions.find((q) => q.id === r.questionId)
            const myAnswer = lastSubmission?.answers[i]?.selectedAnswer
            return (
              <div key={r.questionId} className={`bg-white rounded-2xl shadow p-4 border-l-4 ${r.isCorrect ? 'border-green-400' : 'border-red-400'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {r.isCorrect ? '✓ 정답' : '✗ 오답'}
                  </span>
                  <span className="text-sm font-semibold text-gray-700">Q{i + 1}</span>
                </div>
                {q && <p className="text-sm text-gray-700 mb-2">{q.question}</p>}
                {!r.isCorrect && myAnswer && (
                  <p className="text-xs text-red-500 mb-1">내 답: {myAnswer || '(시간 초과)'}</p>
                )}
                <p className="text-xs text-green-600 font-semibold mb-1">정답: {r.correctAnswer}</p>
                <p className="text-xs text-gray-400 italic">{r.explanation}</p>
              </div>
            )
          })}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/quiz/leaderboard?setId=${currentQuizSet?.id}`)}
            className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-white font-semibold py-3 rounded-xl transition"
          >
            리더보드 🏅
          </button>
          <button
            onClick={() => navigate('/quiz/list')}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition"
          >
            다른 퀴즈 보기
          </button>
        </div>
      </div>
    </Layout>
  )
}
