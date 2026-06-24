import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useStore } from '../store/useStore'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const setIsAdmin = useStore((s) => s.setIsAdmin)

  const handleLogin = () => {
    const adminPw = import.meta.env.VITE_ADMIN_PASSWORD
    if (password === adminPw) {
      setIsAdmin(true)
      navigate('/admin/dashboard')
    } else {
      setError('비밀번호가 올바르지 않습니다.')
    }
  }

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="bg-white rounded-2xl shadow p-8 w-full max-w-sm">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">관리자 로그인</h2>
          <input
            type="password"
            placeholder="관리자 비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <button
            onClick={handleLogin}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition"
          >
            입장
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full mt-3 text-gray-500 hover:text-gray-700 text-sm"
          >
            ← 뒤로가기
          </button>
        </div>
      </div>
    </Layout>
  )
}
