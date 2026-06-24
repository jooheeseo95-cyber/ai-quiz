import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'

export default function Home() {
  const navigate = useNavigate()

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🧠</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">AI 퀴즈 프로그램</h2>
          <p className="text-gray-500">교육 담당자 또는 참여자로 입장하세요</p>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button
            onClick={() => navigate('/quiz')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-8 rounded-2xl text-lg shadow-lg transition"
          >
            퀴즈 참여하기 👤
          </button>
          <button
            onClick={() => navigate('/admin/login')}
            className="bg-white hover:bg-gray-50 text-indigo-600 font-semibold py-4 px-8 rounded-2xl text-lg shadow border border-indigo-200 transition"
          >
            관리자 입장 🔑
          </button>
        </div>
      </div>
    </Layout>
  )
}
