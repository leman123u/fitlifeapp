import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout.tsx'
import DashboardPage from './pages/DashboardPage.tsx'
import ProfilePage from './pages/ProfilePage.tsx'
import LoginPage from './pages/LoginPage.tsx'
import OnboardingPage from './pages/OnboardingPage.tsx'
import NutritionPage from './pages/NutritionPage.tsx'
import ProgressPage from './pages/ProgressPage.tsx'
import SignupPage from './pages/SignupPage.tsx'
import WorkoutDetailPage from './pages/WorkoutDetailPage.tsx'
import WorkoutsPage from './pages/WorkoutsPage.tsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="workouts" element={<WorkoutsPage />} />
        <Route path="workouts/:workoutId" element={<WorkoutDetailPage />} />
        <Route path="nutrition" element={<NutritionPage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
