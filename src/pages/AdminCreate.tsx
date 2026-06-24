import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useStore } from '../store/useStore'
import { generateQuestions } from '../services/quizService'
import { extractTextFromPdf } from '../lib/pdfExtract'
import type { QuizSettings } from '../types'

type InputMode = 'topic' | 'text' | 'pdf'

const DIFFICULTIES = [
  { value: 'easy', label: '쉬움' },
  { value: 'medium', label: '보통' },
  { value: 'hard', label: '어려움' },
]
const TIMER_OPTIONS = [15, 30, 60, 90]
const QUESTION_COUNTS = [5, 10, 20]

export default function AdminCreate() {
  const navigate = useNavigate()
  const { setDraftQuestions } = useStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [inputMode, setInputMode] = useState<InputMode>('topic')
  const [content, setContent] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfStatus, setPdfStatus] = useState<'idle' | 'reading' | 'done' | 'error'>('idle')
  const [settings, setSettings] = useState<QuizSettings>({
    questionCount: 10,
    difficulty: 'medium',
    questionType: 'multiple',
    timerSeconds: 30,
    retryLimit: null,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePdfSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('PDF 파일만 업로드할 수 있습니다.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('파일 크기는 10MB 이하여야 합니다.')
      return
    }
    setError('')
    setPdfFile(file)
    setPdfStatus('reading')
    try {
      const text = await extractTextFromPdf(file)
      setContent(text)
      setPdfStatus('done')
      if (!title) setTitle(file.name.replace(/\.pdf$/i, ''))
    } catch {
      setPdfStatus('error')
      setError('PDF 텍스트 추출 중 오류가 발생했습니다.')
    }
  }

  const handleGenerate = async () => {
    if (!title.trim()) { setError('퀴즈 제목을 입력하세요.'); return }
    if (inputMode !== 'pdf' && !content.trim()) { setError('주제 또는 본문을 입력하세요.'); return }
    if (inputMode === 'pdf' && pdfStatus !== 'done') { setError('PDF를 먼저 선택해주세요.'); return }
    setError('')
    setLoading(true)
    try {
      const questions = await generateQuestions({
        inputType: inputMode === 'pdf' ? 'text' : inputMode,
        content,
        settings: {
          questionCount: settings.questionCount,
          difficulty: settings.difficulty,
          questionType: settings.questionType,
          language: 'ko',
        },
      })
      setDraftQuestions(questions)
      navigate('/admin/review', { state: { title, description, settings } })
    } catch (e) {
      console.error(e)
      setError(e instanceof Error ? e.message : '문제 생성 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const INPUT_TABS: { mode: InputMode; label: string; icon: string }[] = [
    { mode: 'topic', label: '주제 입력', icon: '✏️' },
    { mode: 'text', label: '텍스트 붙여넣기', icon: '📝' },
    { mode: 'pdf', label: 'PDF 업로드', icon: '📄' },
  ]

  return (
    <Layout>
      <div className="py-4">
        <button onClick={() => navigate('/admin/dashboard')} className="text-sm text-gray-500 hover:text-gray-700 mb-4 block">
          ← 대시보드로
        </button>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">퀴즈 세트 생성</h2>

        <div className="bg-white rounded-2xl shadow p-5 flex flex-col gap-5">
          {/* 제목 / 설명 */}
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">퀴즈 제목 *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: 세계 나라별 수도 퀴즈"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">설명 (선택)</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="퀴즈에 대한 간단한 설명"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          {/* 입력 방식 탭 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">입력 방식</label>
            <div className="flex gap-2">
              {INPUT_TABS.map((tab) => (
                <button
                  key={tab.mode}
                  onClick={() => { setInputMode(tab.mode); setError('') }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition flex flex-col items-center gap-0.5 ${
                    inputMode === tab.mode
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-300'
                  }`}
                >
                  <span className="text-base">{tab.icon}</span>
                  <span className="text-xs">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 입력 영역 */}
          {inputMode === 'topic' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">퀴즈 주제 *</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="예: 세계 나라별 수도, 사내 개인정보보호법, IT 보안 정책"
                rows={3}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
            </div>
          )}

          {inputMode === 'text' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">본문 텍스트 *</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="학습 자료, 교안 텍스트를 붙여넣으세요..."
                rows={6}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none text-sm"
              />
            </div>
          )}

          {inputMode === 'pdf' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">PDF 파일 *</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handlePdfSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`w-full border-2 border-dashed rounded-xl py-8 flex flex-col items-center gap-2 transition ${
                  pdfStatus === 'done'
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50'
                }`}
              >
                {pdfStatus === 'idle' && (
                  <>
                    <span className="text-3xl">📄</span>
                    <span className="text-sm font-semibold text-gray-600">PDF 파일 선택</span>
                    <span className="text-xs text-gray-400">최대 10MB · PDF만 지원</span>
                  </>
                )}
                {pdfStatus === 'reading' && (
                  <>
                    <span className="text-3xl animate-spin">⚙️</span>
                    <span className="text-sm font-semibold text-indigo-600">PDF 텍스트 추출 중...</span>
                  </>
                )}
                {pdfStatus === 'done' && pdfFile && (
                  <>
                    <span className="text-3xl">✅</span>
                    <span className="text-sm font-semibold text-green-700">{pdfFile.name}</span>
                    <span className="text-xs text-green-600">{content.length.toLocaleString()}자 추출 완료 · 다시 선택하려면 클릭</span>
                  </>
                )}
                {pdfStatus === 'error' && (
                  <>
                    <span className="text-3xl">❌</span>
                    <span className="text-sm font-semibold text-red-600">추출 실패 · 다시 시도</span>
                  </>
                )}
              </button>

              {pdfStatus === 'done' && content && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">추출된 텍스트 미리보기</summary>
                  <div className="mt-1 text-xs text-gray-500 bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {content.slice(0, 500)}...
                  </div>
                </details>
              )}
            </div>
          )}

          {/* 옵션 설정 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">문제 수</label>
              <select
                value={settings.questionCount}
                onChange={(e) => setSettings((s) => ({ ...s, questionCount: Number(e.target.value) }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {QUESTION_COUNTS.map((n) => <option key={n} value={n}>{n}문제</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">난이도</label>
              <select
                value={settings.difficulty}
                onChange={(e) => setSettings((s) => ({ ...s, difficulty: e.target.value as QuizSettings['difficulty'] }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {DIFFICULTIES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">타이머 (초/문제)</label>
              <select
                value={settings.timerSeconds}
                onChange={(e) => setSettings((s) => ({ ...s, timerSeconds: Number(e.target.value) }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {TIMER_OPTIONS.map((t) => <option key={t} value={t}>{t}초</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">재도전</label>
              <select
                value={settings.retryLimit === null ? 'null' : String(settings.retryLimit)}
                onChange={(e) => setSettings((s) => ({ ...s, retryLimit: e.target.value === 'null' ? null : Number(e.target.value) }))}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="null">무제한</option>
                <option value="1">1회</option>
                <option value="3">3회</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading || pdfStatus === 'reading'}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold py-4 rounded-xl transition text-base flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⚙️</span>
                AI가 문제를 생성하는 중... (최대 30초)
              </>
            ) : (
              <>🤖 AI 문제 생성</>
            )}
          </button>
        </div>
      </div>
    </Layout>
  )
}
