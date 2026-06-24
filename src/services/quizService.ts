import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type {
  QuizSet,
  Question,
  LeaderboardEntry,
  GenerateQuestionsRequest,
  SubmitQuizRequest,
  SubmitQuizResponse,
} from '../types'

function generateAccessCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

// ── Quiz Sets ──────────────────────────────────────────

export async function getActiveQuizSets(): Promise<QuizSet[]> {
  const q = query(collection(db, 'quizSets'), where('status', '==', 'active'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: (d.data().createdAt as Timestamp)?.toDate() ?? new Date(),
  })) as QuizSet[]
}

export async function getAllQuizSets(): Promise<QuizSet[]> {
  const snap = await getDocs(collection(db, 'quizSets'))
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: (d.data().createdAt as Timestamp)?.toDate() ?? new Date(),
  })) as QuizSet[]
}

export async function getQuizSetByCode(code: string): Promise<QuizSet | null> {
  const q = query(collection(db, 'quizSets'), where('accessCode', '==', code.toUpperCase()))
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return {
    id: d.id,
    ...d.data(),
    createdAt: (d.data().createdAt as Timestamp)?.toDate() ?? new Date(),
  } as QuizSet
}

export async function getQuizSetById(setId: string): Promise<QuizSet | null> {
  const snap = await getDoc(doc(db, 'quizSets', setId))
  if (!snap.exists()) return null
  return {
    id: snap.id,
    ...snap.data(),
    createdAt: (snap.data().createdAt as Timestamp)?.toDate() ?? new Date(),
  } as QuizSet
}

export async function getQuestions(setId: string): Promise<Question[]> {
  const q = query(collection(db, 'quizSets', setId, 'questions'), orderBy('order'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Question[]
}

export async function createQuizSet(
  title: string,
  description: string,
  questions: Omit<Question, 'id'>[],
  settings: QuizSet['settings']
): Promise<string> {
  const accessCode = generateAccessCode()
  const setRef = await addDoc(collection(db, 'quizSets'), {
    title,
    description,
    status: 'draft',
    accessCode,
    settings,
    createdAt: serverTimestamp(),
    shareUrl: '',
  })

  await Promise.all(
    questions.map((q, i) =>
      addDoc(collection(db, 'quizSets', setRef.id, 'questions'), { ...q, order: i + 1 })
    )
  )

  return setRef.id
}

export async function updateQuizSetStatus(setId: string, status: 'draft' | 'active' | 'closed'): Promise<void> {
  await updateDoc(doc(db, 'quizSets', setId), { status })
}

// ── AI 문제 생성 (OpenAI 직접 호출) ────────────────────

export async function generateQuestions(req: GenerateQuestionsRequest): Promise<Question[]> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) throw new Error('OpenAI API 키가 설정되지 않았습니다.')

  const difficultyMap: Record<string, string> = { easy: '쉬움', medium: '보통', hard: '어려움' }
  const typeMap: Record<string, string> = {
    multiple: '객관식 4지선다',
    short: '단답형',
    mixed: '혼합',
  }

  const prompt = `당신은 기업 교육용 퀴즈 문제를 생성하는 전문가입니다.

[입력 내용]
${req.content}

[요구사항]
- 문제 수: ${req.settings.questionCount}개
- 난이도: ${difficultyMap[req.settings.difficulty] || req.settings.difficulty}
- 유형: ${typeMap[req.settings.questionType] || req.settings.questionType}
- 언어: 한국어

[출력 형식] JSON 배열만 출력하세요. 다른 텍스트 없이.
[
  {
    "order": 1,
    "type": "multiple",
    "question": "문제 내용",
    "options": ["보기1", "보기2", "보기3", "보기4"],
    "answer": "정답 (options 중 하나와 정확히 일치)",
    "explanation": "해설 (2-3문장)"
  }
]

[주의사항]
- 정답이 항상 특정 위치에 오지 않도록 무작위 배치
- 오답 보기는 그럴듯하게 작성
- 해설은 왜 정답인지 포함`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4.1',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4000,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error?.message ?? 'OpenAI API 오류')
  }

  const data = await response.json()
  const raw: string = data.choices[0].message.content?.trim() ?? '[]'
  const match = raw.match(/\[[\s\S]*\]/)
  const questions = JSON.parse(match ? match[0] : raw) as Omit<Question, 'id'>[]
  return questions.map((q, i) => ({ ...q, id: `draft-${i}` }))
}

// ── 퀴즈 제출 (클라이언트 직접 채점) ────────────────────

export async function submitQuiz(req: SubmitQuizRequest): Promise<SubmitQuizResponse> {
  const questions = await getQuestions(req.setId)

  const results = req.answers.map((a) => {
    const q = questions.find((q) => q.id === a.questionId)
    return {
      questionId: a.questionId,
      isCorrect: q ? q.answer === a.selectedAnswer : false,
      correctAnswer: q?.answer ?? '',
      explanation: q?.explanation ?? '',
    }
  })

  const score = results.filter((r) => r.isCorrect).length
  const totalTimeMs = req.answers.reduce((s, a) => s + a.timeSpentMs, 0)

  const submissionRef = await addDoc(
    collection(db, 'quizSets', req.setId, 'submissions'),
    {
      nickname: req.nickname,
      department: req.department ?? null,
      score,
      totalQuestions: questions.length,
      totalTimeMs,
      submittedAt: serverTimestamp(),
      answers: req.answers.map((a, i) => ({ ...a, isCorrect: results[i].isCorrect })),
    }
  )

  // 리더보드 갱신 (인메모리 정렬 - 복합 인덱스 불필요)
  const allSnap = await getDocs(collection(db, 'quizSets', req.setId, 'submissions'))

  const allSubs = allSnap.docs.map((d) => ({
    nickname: d.data().nickname as string,
    department: (d.data().department as string | null) ?? null,
    score: d.data().score as number,
    totalTimeMs: d.data().totalTimeMs as number,
    submittedAt: (d.data().submittedAt as Timestamp)?.toDate() ?? new Date(),
  }))

  allSubs.sort((a, b) => b.score - a.score || a.totalTimeMs - b.totalTimeMs)

  const rankings: LeaderboardEntry[] = allSubs.slice(0, 50).map((s, i) => ({
    rank: i + 1,
    ...s,
  }))

  await setDoc(doc(db, 'leaderboards', req.setId), {
    updatedAt: serverTimestamp(),
    rankings,
  })

  const myRank = rankings.findIndex((r) => r.nickname === req.nickname) + 1

  return {
    submissionId: submissionRef.id,
    score,
    totalQuestions: questions.length,
    totalTimeMs,
    rank: myRank || rankings.length,
    results,
  }
}

// ── 리더보드 실시간 구독 ────────────────────────────────

export function subscribeLeaderboard(setId: string, cb: (entries: LeaderboardEntry[]) => void) {
  return onSnapshot(doc(db, 'leaderboards', setId), (snap) => {
    if (snap.exists()) {
      const raw = snap.data().rankings as (Omit<LeaderboardEntry, 'submittedAt'> & { submittedAt: Timestamp })[]
      cb(raw.map((r) => ({ ...r, submittedAt: r.submittedAt?.toDate() ?? new Date() })))
    } else {
      cb([])
    }
  })
}
