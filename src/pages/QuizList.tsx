import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useStore } from '../store/useStore'
import { getActiveQuizSets } from '../services/quizService'
import type { QuizSet } from '../types'

const DIFFICULTY_LABEL: Record<string, string> = { easy: '쉬움', medium: '보통', hard: '어려움' }
const DIFFICULTY_COLOR: Record<string, string> = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-600',
}

export default function QuizList() {
  const navigate = useNavigate()
  const participant = useStore((s) => s.participant)
  const [quizSets, setQuizSets] = useState<QuizSet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!participant) { navigate('/quiz'); return }
    getActiveQuizSets()
      .then(setQuizSets)
      .finally(() => setLoading(false))
  }, [participant, navigate])

  return (
    <Layout>
      <div className="py-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-800">퀴즈 목록</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              안녕하세요, <span className="font-semibold text-indigo-600">{participant?.nickname}</span>님!
              {participant?.department && (
                <span className="ml-1 text-gray-400">({participant.department})</span>
              )}
            </p>
          </div>
          <button
            onClick={() => navigate('/quiz')}
            className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-2.5 py-1.5"
          >
            닉네임 변경
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">퀴즈 불러오는 중...</p>
          </div>
        ) : quizSets.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-gray-500 font-semibold mb-1">공개된 퀴즈가 없습니다.</p>
            <p className="text-sm text-gray-400">관리자에게 퀴즈 코드를 받아 참여하세요.</p>
            <button
              onClick={() => navigate('/quiz')}
              className="mt-4 text-sm text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              ← 코드로 참여하기
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {quizSets.map((set) => (
              <button
                key={set.id}
                onClick={() => navigate(`/quiz/play?setId=${set.id}`)}
                className="bg-white rounded-2xl shadow hover:shadow-md transition p-5 text-left group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 text-base mb-1 group-hover:text-indigo-600 transition">
                      {set.title}
                    </h3>
                    {set.description && (
                      <p className="text-sm text-gray-500 mb-3 line-clamp-2">{set.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-semibold">
                        📝 {set.settings.questionCount}문제
                      </span>
                      <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-semibold">
                        ⏱ {set.settings.timerSeconds}초/문제
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${DIFFICULTY_COLOR[set.settings.difficulty] || 'bg-gray-100 text-gray-600'}`}>
                        {DIFFICULTY_LABEL[set.settings.difficulty] || set.settings.difficulty}
                      </span>
                      {set.settings.retryLimit === null && (
                        <span className="text-xs bg-purple-50 text-purple-600 px-2.5 py-1 rounded-full font-semibold">
                          ♾️ 무제한 재도전
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 transition">
                    <span className="text-indigo-400 group-hover:text-white text-lg transition">→</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
