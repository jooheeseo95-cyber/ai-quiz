import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import OpenAI from 'openai'

admin.initializeApp()
const db = admin.firestore()

const getOpenAI = () =>
  new OpenAI({ apiKey: functions.config().openai?.key || process.env.OPENAI_API_KEY })

// ───────────────────────────────────────────────
// generateQuestions
// ───────────────────────────────────────────────
interface GenerateRequest {
  inputType: 'topic' | 'text'
  content: string
  settings: {
    questionCount: number
    difficulty: string
    questionType: string
    language: string
  }
}

export const generateQuestions = functions
  .runWith({ timeoutSeconds: 120, memory: '512MB' })
  .https.onCall(async (data: GenerateRequest) => {
    const { content, settings } = data

    const difficultyMap: Record<string, string> = { easy: '쉬움', medium: '보통', hard: '어려움' }
    const typeMap: Record<string, string> = { multiple: '객관식 4지선다', short: '단답형', mixed: '혼합' }

    const prompt = `당신은 기업 교육용 퀴즈 문제를 생성하는 전문가입니다.

[입력 내용]
${content}

[요구사항]
- 문제 수: ${settings.questionCount}개
- 난이도: ${difficultyMap[settings.difficulty] || settings.difficulty}
- 유형: ${typeMap[settings.questionType] || settings.questionType}
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

    const openai = getOpenAI()
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4000,
      temperature: 0.7,
    })

    const raw = response.choices[0].message.content?.trim() ?? '[]'
    // extract JSON array from response
    const match = raw.match(/\[[\s\S]*\]/)
    const questions = JSON.parse(match ? match[0] : raw)

    return { questions }
  })

// ───────────────────────────────────────────────
// submitQuiz
// ───────────────────────────────────────────────
interface SubmitRequest {
  setId: string
  nickname: string
  department: string | null
  answers: { questionId: string; selectedAnswer: string; timeSpentMs: number }[]
}

export const submitQuiz = functions.https.onCall(async (data: SubmitRequest) => {
  const { setId, nickname, department, answers } = data

  // Fetch questions
  const questionsSnap = await db
    .collection('quizSets')
    .doc(setId)
    .collection('questions')
    .orderBy('order')
    .get()

  const questions = questionsSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as {
    id: string
    answer: string
    explanation: string
    options: string[]
  }[]

  // Grade
  const results = answers.map((a) => {
    const q = questions.find((q) => q.id === a.questionId)
    const isCorrect = q ? q.answer === a.selectedAnswer : false
    return {
      questionId: a.questionId,
      isCorrect,
      correctAnswer: q?.answer ?? '',
      explanation: q?.explanation ?? '',
    }
  })

  const score = results.filter((r) => r.isCorrect).length
  const totalTimeMs = answers.reduce((sum, a) => sum + a.timeSpentMs, 0)

  // Save submission
  const submissionRef = await db
    .collection('quizSets')
    .doc(setId)
    .collection('submissions')
    .add({
      nickname,
      department: department ?? null,
      score,
      totalQuestions: questions.length,
      totalTimeMs,
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      answers: answers.map((a, i) => ({
        ...a,
        isCorrect: results[i].isCorrect,
      })),
    })

  // Update leaderboard (top 50)
  const allSubmissions = await db
    .collection('quizSets')
    .doc(setId)
    .collection('submissions')
    .orderBy('score', 'desc')
    .orderBy('totalTimeMs', 'asc')
    .limit(50)
    .get()

  const rankings = allSubmissions.docs.map((d, i) => ({
    rank: i + 1,
    nickname: d.data().nickname,
    department: d.data().department,
    score: d.data().score,
    totalTimeMs: d.data().totalTimeMs,
    submittedAt: d.data().submittedAt,
  }))

  await db.collection('leaderboards').doc(setId).set({
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    rankings,
  })

  const myRank = rankings.findIndex((r) => r.nickname === nickname) + 1

  return {
    submissionId: submissionRef.id,
    score,
    totalQuestions: questions.length,
    totalTimeMs,
    rank: myRank || rankings.length,
    results,
  }
})
