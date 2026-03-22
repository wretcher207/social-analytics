import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { AppShell } from '@/components/layout/AppShell'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { JournalPage } from '@/pages/journal/JournalPage'
import { NewEntryPage } from '@/pages/journal/NewEntryPage'
import { EntryDetailPage } from '@/pages/journal/EntryDetailPage'
import { ProductsPage } from '@/pages/products/ProductsPage'
import { ProductFormPage } from '@/pages/products/ProductFormPage'
import { ProductDetailPage } from '@/pages/products/ProductDetailPage'
import { AnalyticsPage } from '@/pages/analytics/AnalyticsPage'
import { RecommendPage } from '@/pages/recommend/RecommendPage'
import { DabTimerPage } from '@/pages/dab-timer/DabTimerPage'
import { ProfilePage } from '@/pages/profile/ProfilePage'
import { GoalsPage } from '@/pages/goals/GoalsPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected */}
          <Route
            element={
              <AuthGuard>
                <AppShell />
              </AuthGuard>
            }
          >
            <Route path="/dashboard"           element={<DashboardPage />} />

            {/* Journal */}
            <Route path="/journal"             element={<JournalPage />} />
            <Route path="/journal/new"         element={<NewEntryPage />} />
            <Route path="/journal/:id"         element={<EntryDetailPage />} />

            {/* Products */}
            <Route path="/products"            element={<ProductsPage />} />
            <Route path="/products/new"        element={<ProductFormPage />} />
            <Route path="/products/:id"        element={<ProductDetailPage />} />
            <Route path="/products/:id/edit"   element={<ProductFormPage />} />

            {/* Analytics */}
            <Route path="/analytics"           element={<AnalyticsPage />} />

            {/* Recommendations */}
            <Route path="/recommend"           element={<RecommendPage />} />

            {/* Dab Timer */}
            <Route path="/dab-timer"           element={<DabTimerPage />} />

            {/* Goals */}
            <Route path="/goals"               element={<GoalsPage />} />

            {/* Profile */}
            <Route path="/profile"             element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

function Placeholder({ label }) {
  return (
    <div style={{ padding: '64px 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
      <p className="label-caps">{label} — coming in a later phase</p>
    </div>
  )
}
