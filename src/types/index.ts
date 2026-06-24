export interface QuizSet {
  id: string
  title: string
  description: string
  createdAt: Date
  status: 'draft' | 'active' | 'closed'
  settings: QuizSettings
  accessCode: string
  shareUrl?: string
}

export interface QuizSettings {
  questionCount: number
  difficulty: 'easy' | 'medium' | 'hard'
  questionType: 'multiple' | 'short' | 'mixed'
  timerSeconds: number
  retryLimit: number | null
}

export interface Question {
  id: string
  order: number
  type: 'multiple' | 'short'
  question: string
  options: string[]
  answer: string
  explanation: string
}

export interface Submission {
  id: string
  nickname: string
  department: string | null
  score: number
  totalQuestions: number
  totalTimeMs: number
  submittedAt: Date
  answers: AnswerRecord[]
}

export interface AnswerRecord {
  questionId: string
  selectedAnswer: string
  isCorrect: boolean
  timeSpentMs: number
}

export interface LeaderboardEntry {
  rank: number
  nickname: string
  department: string | null
  score: number
  totalTimeMs: number
  submittedAt: Date
}

export interface GenerateQuestionsRequest {
  inputType: 'topic' | 'text'
  content: string
  settings: {
    questionCount: number
    difficulty: string
    questionType: string
    language: string
  }
}

export interface SubmitQuizRequest {
  setId: string
  nickname: string
  department: string | null
  answers: {
    questionId: string
    selectedAnswer: string
    timeSpentMs: number
  }[]
}

export interface SubmitQuizResponse {
  submissionId: string
  score: number
  totalQuestions: number
  totalTimeMs: number
  rank: number
  results: {
    questionId: string
    isCorrect: boolean
    correctAnswer: string
    explanation: string
  }[]
}
