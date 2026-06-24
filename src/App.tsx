import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import AdminCreate from './pages/AdminCreate'
import AdminReview from './pages/AdminReview'
import AdminShare from './pages/AdminShare'
import ParticipantEntry from './pages/ParticipantEntry'
import QuizList from './pages/QuizList'
import QuizPlay from './pages/QuizPlay'
import QuizResult from './pages/QuizResult'
import Leaderboard from './pages/Leaderboard'
import AdminRoute from './components/AdminRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/create" element={<AdminRoute><AdminCreate /></AdminRoute>} />
        <Route path="/admin/review" element={<AdminRoute><AdminReview /></AdminRoute>} />
        <Route path="/admin/share" element={<AdminRoute><AdminShare /></AdminRoute>} />

        {/* Participant */}
        <Route path="/quiz" element={<ParticipantEntry />} />
        <Route path="/quiz/list" element={<QuizList />} />
        <Route path="/quiz/play" element={<QuizPlay />} />
        <Route path="/quiz/result" element={<QuizResult />} />
        <Route path="/quiz/leaderboard" element={<Leaderboard />} />
      </Routes>
    </BrowserRouter>
  )
}
