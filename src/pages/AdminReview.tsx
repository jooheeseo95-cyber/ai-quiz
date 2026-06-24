import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Layout from '../components/Layout'
import { useStore } from '../store/useStore'
import { createQuizSet, updateQuizSetStatus } from '../services/quizService'
import type { QuizSettings } from '../types'

interface LocationState {
  title: string
  description: string
  settings: QuizSettings
}

export default function AdminReview() {
  const navigate = useNavigate()
  const location = useLocation()
  const { title, description, settings } = location.state as LocationState
  const { draftQuestions, updateDraftQuestion, removeDraftQuestion } = useStore()
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [accessCode, setAccessCode] = useState('')

  const handleSave = async (activate: boolean) => {
    setSaving(true)
    try {
      const setId = await createQuizSet(title, description, draftQuestions, settings)
      if (activate) {
        await updateQuizSetStatus(setId, 'active')
      }
      const quiz = draftQuestions
      setAccessCode(quiz.length > 0 ? '' : '')
      navigate('/admin/share', { state: { setId, title, activate } })
    } catch (e) {
      console.error(e)
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout>
      <div className="py-4">
        <button onClick={() => navigate('/admin/create')} className="text-sm text-gray-500 hover:text-gray-700 mb-4 block">
          ← 다시 생성
        </button>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">문제 검토 ({draftQuestions.length}문제)</h2>
        </div>

        <div className="flex flex-col gap-3 mb-6">
          {draftQuestions.map((q, i) => (
            <div key={q.id} className="bg-white rounded-2xl shadow p-4">
              {editingIndex === i ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={q.question}
                    onChange={(e) => updateDraftQuestion(i, { ...q, question: e.target.value })}
                    className="w-full border rounded-xl px-3 py-2 text-sm resize-none"
                    rows={2}
                  />
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${opt === q.answer ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        {oi + 1}
                      </span>
                      <input
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...q.options]
                          newOpts[oi] = e.target.value
                          updateDraftQuestion(i, { ...q, options: newOpts })
                        }}
                        className="flex-1 border rounded-lg px-2 py-1 text-sm"
                      />
                      <button
                        onClick={() => updateDraftQuestion(i, { ...q, answer: opt })}
                        className={`text-xs px-2 py-1 rounded ${opt === q.answer ? 'bg-green-100 text-green-600' : 'text-gray-400'}`}
                      >
                        정답
                      </button>
                    </div>
                  ))}
                  <input
                    value={q.explanation}
                    onChange={(e) => updateDraftQuestion(i, { ...q, explanation: e.target.value })}
                    placeholder="해설"
                    className="w-full border rounded-xl px-3 py-2 text-sm"
                  />
                  <button onClick={() => setEditingIndex(null)} className="self-end text-sm bg-indigo-600 text-white px-4 py-1.5 rounded-lg">완료</button>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-semibold text-gray-800 flex-1">
                      <span className="text-indigo-500 mr-1">Q{i + 1}.</span>{q.question}
                    </p>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => setEditingIndex(i)} className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1 rounded">편집</button>
                      <button onClick={() => removeDraftQuestion(i)} className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded">삭제</button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    {q.options.map((opt, oi) => (
                      <div
                        key={oi}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${opt === q.answer ? 'bg-green-50 text-green-700 font-semibold' : 'text-gray-600'}`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${opt === q.answer ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                          {oi + 1}
                        </span>
                        {opt}
                        {opt === q.answer && <span className="ml-auto text-xs">✓ 정답</span>}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2 italic">{q.explanation}</p>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition"
          >
            초안 저장
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition"
          >
            {saving ? '저장 중...' : '저장 & 공개'}
          </button>
        </div>
      </div>
    </Layout>
  )
}
