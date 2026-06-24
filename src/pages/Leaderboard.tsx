import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { useStore } from '../store/useStore'
import { subscribeLeaderboard } from '../services/quizService'
import type { LeaderboardEntry } from '../types'

function formatTime(ms: number): string {
  const sec = Math.floor(ms / 1000)
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`
}

const MEDALS = ['🥇', '🥈', '🥉']

export default function Leaderboard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const setId = searchParams.get('setId') || ''
  const participant = useStore((s) => s.participant)
  const currentQuizSet = useStore((s) => s.currentQuizSet)
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    if (!setId) return
    const unsub = subscribeLeaderboard(setId, setEntries)
    return () => unsub()
  }, [setId])

  return (
    <Layout>
      <div className="py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">리더보드 🏆</h2>
            {currentQuizSet && <p className="text-sm text-gray-500">{currentQuizSet.title}</p>}
          </div>
          <button
            onClick={() => navigate('/quiz/list')}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold"
          >
            목록으로
          </button>
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">🏁</p>
            <p>아직 참여자가 없습니다.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {entries.map((entry, i) => {
              const isMe = entry.nickname === participant?.nickname
              return (
                <div
                  key={i}
                  className={`rounded-2xl p-4 flex items-center gap-3 ${
                    isMe
                      ? 'bg-indigo-50 border-2 border-indigo-400 shadow'
                      : 'bg-white shadow'
                  }`}
                >
                  <div className="text-xl w-8 text-center">
                    {i < 3 ? MEDALS[i] : <span className="text-gray-500 font-bold text-sm">#{i + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className={`font-bold text-sm ${isMe ? 'text-indigo-700' : 'text-gray-800'}`}>
                        {entry.nickname}
                      </span>
                      {isMe && <span className="text-xs bg-indigo-500 text-white px-1.5 py-0.5 rounded-full">나</span>}
                      {entry.department && (
                        <span className="text-xs text-gray-400">{entry.department}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{formatTime(entry.totalTimeMs)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-bold ${i === 0 ? 'text-yellow-500' : 'text-gray-700'}`}>
                      {entry.score}
                    </span>
                    <span className="text-xs text-gray-400">/{currentQuizSet?.settings.questionCount ?? '?'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}
