import { create } from 'zustand'
import type { QuizSet, Question, Submission, LeaderboardEntry } from '../types'

interface ParticipantSession {
  nickname: string
  department: string | null
}

interface QuizPlayState {
  currentQuestionIndex: number
  answers: { questionId: string; selectedAnswer: string; timeSpentMs: number }[]
  startTime: number
  questionStartTime: number
}

interface AppState {
  // Admin
  isAdmin: boolean
  setIsAdmin: (v: boolean) => void

  // Participant session
  participant: ParticipantSession | null
  setParticipant: (p: ParticipantSession | null) => void

  // Current quiz
  currentQuizSet: QuizSet | null
  setCurrentQuizSet: (q: QuizSet | null) => void

  currentQuestions: Question[]
  setCurrentQuestions: (qs: Question[]) => void

  // Quiz play
  quizPlay: QuizPlayState | null
  initQuizPlay: () => void
  recordAnswer: (questionId: string, selectedAnswer: string, timeSpentMs: number) => void
  nextQuestion: () => void

  // Results
  lastSubmission: Submission | null
  setLastSubmission: (s: Submission | null) => void

  lastLeaderboard: LeaderboardEntry[]
  setLastLeaderboard: (l: LeaderboardEntry[]) => void

  // Admin - quiz creation
  draftQuestions: Question[]
  setDraftQuestions: (qs: Question[]) => void
  updateDraftQuestion: (index: number, q: Question) => void
  removeDraftQuestion: (index: number) => void
}

export const useStore = create<AppState>((set, get) => ({
  isAdmin: sessionStorage.getItem('isAdmin') === 'true',
  setIsAdmin: (v) => {
    sessionStorage.setItem('isAdmin', v ? 'true' : 'false')
    set({ isAdmin: v })
  },

  participant: null,
  setParticipant: (p) => set({ participant: p }),

  currentQuizSet: null,
  setCurrentQuizSet: (q) => set({ currentQuizSet: q }),

  currentQuestions: [],
  setCurrentQuestions: (qs) => set({ currentQuestions: qs }),

  quizPlay: null,
  initQuizPlay: () =>
    set({
      quizPlay: {
        currentQuestionIndex: 0,
        answers: [],
        startTime: Date.now(),
        questionStartTime: Date.now(),
      },
    }),
  recordAnswer: (questionId, selectedAnswer, timeSpentMs) => {
    const state = get()
    if (!state.quizPlay) return
    set({
      quizPlay: {
        ...state.quizPlay,
        answers: [...state.quizPlay.answers, { questionId, selectedAnswer, timeSpentMs }],
        questionStartTime: Date.now(),
      },
    })
  },
  nextQuestion: () => {
    const state = get()
    if (!state.quizPlay) return
    set({
      quizPlay: {
        ...state.quizPlay,
        currentQuestionIndex: state.quizPlay.currentQuestionIndex + 1,
        questionStartTime: Date.now(),
      },
    })
  },

  lastSubmission: null,
  setLastSubmission: (s) => set({ lastSubmission: s }),

  lastLeaderboard: [],
  setLastLeaderboard: (l) => set({ lastLeaderboard: l }),

  draftQuestions: [],
  setDraftQuestions: (qs) => set({ draftQuestions: qs }),
  updateDraftQuestion: (index, q) => {
    const qs = [...get().draftQuestions]
    qs[index] = q
    set({ draftQuestions: qs })
  },
  removeDraftQuestion: (index) => {
    const qs = get().draftQuestions.filter((_, i) => i !== index)
    set({ draftQuestions: qs })
  },
}))
