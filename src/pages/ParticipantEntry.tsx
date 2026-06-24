import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { useStore } from '../store/useStore'

export default function ParticipantEntry() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const codeFromUrl = searchParams.get('code') || ''

  const [nickname, setNickname] = useState('')
  const [department, setDepartment] = useState('')
  const [quizCode, setQuizCode] = useState(codeFromUrl)
  const [error, setError] = useState('')

  const setParticipant = useStore((s) => s.setParticipant)

  const handleStart = (target: 'code' | 'list') => {
    if (nickname.trim().length < 2) {
      setError('닉네임은 최소 2자 이상이어야 합니다.')
      return
    }
    if (nickname.trim().length > 10) {
      setError('닉네임은 최대 10자까지 가능합니다.')
      return
    }
    if (target === 'code' && !quizCode.trim()) {
      setError('퀴즈 코드를 입력하세요.')
      return
    }
    setError('')
    setParticipant({ nickname: nickname.trim(), department: department.trim() || null })

    if (target === 'code') {
      navigate(`/quiz/play?code=${quizCode.trim().toUpperCase()}`)
    } else {
      navigate('/quiz/list')
    }
  }

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[70vh] py-6">
        <div className="bg-white rounded-2xl shadow p-7 w-full max-w-sm">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">퀴즈 참여</h2>

          <div className="flex flex-col gap-4">
            {/* 닉네임 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">닉네임 *</label>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStart(quizCode ? 'code' : 'list')}
                placeholder="닉네임 (2~10자)"
                maxLength={10}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* 부서 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">부서 (선택)</label>
              <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="예: 개발팀"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {/* 구분선 */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 shrink-0">참여 방법 선택</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* 코드 입력 영역 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">퀴즈 코드로 참여</label>
              <div className="flex gap-2">
                <input
                  value={quizCode}
                  onChange={(e) => setQuizCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleStart('code')}
                  placeholder="예: L6BEUB"
                  maxLength={6}
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-3 font-mono uppercase tracking-widest text-lg text-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  onClick={() => handleStart('code')}
                  disabled={!quizCode.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold px-4 rounded-xl transition shrink-0"
                >
                  →
                </button>
              </div>
            </div>

            {/* 또는 목록 */}
            <button
              onClick={() => handleStart('list')}
              className="w-full flex items-center justify-center gap-2 border-2 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 text-indigo-600 font-semibold py-3.5 rounded-xl transition"
            >
              <span>📋</span>
              전체 퀴즈 목록 보기
            </button>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}
          </div>

          <button onClick={() => navigate('/')} className="w-full mt-4 text-gray-400 hover:text-gray-600 text-sm">
            ← 처음으로
          </button>
        </div>
      </div>
    </Layout>
  )
}
