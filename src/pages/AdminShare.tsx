import { useLocation, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useEffect, useState } from 'react'
import { getQuizSetById } from '../services/quizService'

export default function AdminShare() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setId, title, activate } = location.state as { setId: string; title: string; activate: boolean }
  const [accessCode, setAccessCode] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    getQuizSetById(setId).then((set) => {
      if (set) setAccessCode(set.accessCode)
    })
  }, [setId])

  const shareUrl = `${window.location.origin}/quiz?code=${accessCode}`

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
        <div className="text-center">
          <div className="text-5xl mb-3">{activate ? '🎉' : '💾'}</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">{activate ? '퀴즈가 공개되었습니다!' : '초안으로 저장되었습니다'}</h2>
          <p className="text-gray-500">{title}</p>
        </div>

        {activate && accessCode && (
          <div className="bg-white rounded-2xl shadow p-6 w-full max-w-sm text-center">
            <p className="text-sm text-gray-500 mb-2">참여 코드</p>
            <p className="text-4xl font-mono font-bold text-indigo-600 tracking-widest mb-4">{accessCode}</p>
            <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-500 break-all mb-3">{shareUrl}</div>
            <button
              onClick={handleCopy}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition"
            >
              {copied ? '✓ 복사됨!' : '링크 복사'}
            </button>
          </div>
        )}

        <button
          onClick={() => navigate('/admin/dashboard')}
          className="text-indigo-600 hover:text-indigo-800 font-semibold"
        >
          대시보드로 돌아가기 →
        </button>
      </div>
    </Layout>
  )
}
