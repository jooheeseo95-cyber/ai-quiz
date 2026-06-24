import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useStore } from '../store/useStore'
import { getAllQuizSets, updateQuizSetStatus } from '../services/quizService'
import type { QuizSet } from '../types'

const STATUS_LABEL: Record<QuizSet['status'], string> = {
  draft: '초안',
  active: '공개',
  closed: '마감',
}

const STATUS_COLOR: Record<QuizSet['status'], string> = {
  draft: 'bg-gray-100 text-gray-600',
  active: 'bg-green-100 text-green-700',
  closed: 'bg-red-100 text-red-600',
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const setIsAdmin = useStore((s) => s.setIsAdmin)
  const [quizSets, setQuizSets] = useState<QuizSet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllQuizSets()
      .then(setQuizSets)
      .finally(() => setLoading(false))
  }, [])

  const handleToggleStatus = async (set: QuizSet) => {
    const next = set.status === 'active' ? 'closed' : 'active'
    await updateQuizSetStatus(set.id, next)
    setQuizSets((prev) => prev.map((s) => (s.id === set.id ? { ...s, status: next } : s)))
  }

  const handleLogout = () => {
    setIsAdmin(false)
    navigate('/')
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6 mt-2">
        <h2 className="text-2xl font-bold text-gray-800">관리자 대시보드</h2>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/admin/create')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
          >
            + 퀴즈 생성
          </button>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2">
            로그아웃
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">불러오는 중...</div>
      ) : quizSets.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 mb-4">생성된 퀴즈 세트가 없습니다.</p>
          <button
            onClick={() => navigate('/admin/create')}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold"
          >
            첫 퀴즈 만들기
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {quizSets.map((set) => (
            <div key={set.id} className="bg-white rounded-2xl shadow p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[set.status]}`}>
                      {STATUS_LABEL[set.status]}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">{set.accessCode}</span>
                  </div>
                  <h3 className="font-bold text-gray-800 truncate">{set.title}</h3>
                  <p className="text-sm text-gray-500">
                    {set.settings.questionCount}문제 · {set.settings.difficulty === 'easy' ? '쉬움' : set.settings.difficulty === 'medium' ? '보통' : '어려움'} · {set.settings.timerSeconds}초/문제
                  </p>
                </div>
                <button
                  onClick={() => handleToggleStatus(set)}
                  className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                    set.status === 'active'
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                  }`}
                >
                  {set.status === 'active' ? '마감' : '공개'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
