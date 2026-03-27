import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Layout } from '@/shared/layout/Layout'
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'
import { useAuthStore } from '@/features/auth/store/authStore'
import { DashboardPage } from '@/pages/DashboardPage'
import { EntriesPage } from '@/pages/EntriesPage'
import { FlashcardsPage } from '@/pages/FlashcardsPage'
import { PracticePage } from '@/pages/PracticePage'
import { QuizPage } from '@/pages/practice/QuizPage'
import { MatchPage } from '@/pages/practice/MatchPage'
import { PuzzlePage } from '@/pages/practice/PuzzlePage'
import { AboutPage } from '@/pages/AboutPage'
import { LoginPage } from '@/pages/LoginPage'
import { ProfilePage } from '@/pages/ProfilePage'

function RootRedirect() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return <Navigate to={isAuthenticated ? '/dashboard' : '/about'} replace />
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },

  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <RootRedirect /> },
      { path: 'about', element: <AboutPage /> },

      {
        element: <ProtectedRoute />,
        children: [
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'entries', element: <EntriesPage /> },
          { path: 'flashcards', element: <FlashcardsPage /> },
          { path: 'practice', element: <PracticePage /> },
          { path: 'practice/flashcards', element: <Navigate to="/flashcards" replace /> },
          { path: 'practice/quiz', element: <QuizPage /> },
          { path: 'practice/match', element: <MatchPage /> },
          { path: 'practice/puzzle', element: <PuzzlePage /> },
          { path: 'profile', element: <ProfilePage /> },
        ],
      },
    ],
  },
])
