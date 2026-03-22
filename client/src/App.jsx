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
import { ConsumptionPage } from '@/pages/consumption/ConsumptionPage'
import { StrainsPage } from '@/pages/strains/StrainsPage'
import { StrainDetailPage } from '@/pages/strains/StrainDetailPage'
import { StrainFormPage } from '@/pages/strains/StrainFormPage'
import { SearchPage } from '@/pages/search/SearchPage'
import { TerpenesPage } from '@/pages/terpenes/TerpenesPage'
import { AchievementsPage } from '@/pages/achievements/AchievementsPage'
import { CalendarPage } from '@/pages/calendar/CalendarPage'
import { TimelinePage } from '@/pages/timeline/TimelinePage'

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

            {/* Strains */}
            <Route path="/strains"             element={<StrainsPage />} />
            <Route path="/strains/new"         element={<StrainFormPage />} />
            <Route path="/strains/:id"         element={<StrainDetailPage />} />
            <Route path="/strains/:id/edit"    element={<StrainFormPage />} />

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

            {/* Consumption log */}
            <Route path="/log"                 element={<ConsumptionPage />} />

            {/* Goals */}
            <Route path="/goals"               element={<GoalsPage />} />

            {/* Terpenes */}
            <Route path="/terpenes"            element={<TerpenesPage />} />

            {/* Achievements */}
            <Route path="/achievements"        element={<AchievementsPage />} />

            {/* Calendar */}
            <Route path="/calendar"            element={<CalendarPage />} />

            {/* Timeline */}
            <Route path="/timeline"            element={<TimelinePage />} />

            {/* Search */}
            <Route path="/search"              element={<SearchPage />} />

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
