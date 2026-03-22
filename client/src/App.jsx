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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route
            element={
              <AuthGuard>
                <AppShell />
              </AuthGuard>
            }
          >
            <Route path="/dashboard"       element={<DashboardPage />} />
            <Route path="/journal"         element={<JournalPage />} />
            <Route path="/journal/new"     element={<NewEntryPage />} />
            <Route path="/journal/:id"     element={<EntryDetailPage />} />
            <Route path="/products"        element={<Placeholder label="Products" />} />
            <Route path="/analytics"       element={<Placeholder label="Analytics" />} />
            <Route path="/recommend"       element={<Placeholder label="For You" />} />
            <Route path="/dab-timer"       element={<Placeholder label="Dab Timer" />} />
          </Route>

          {/* Fallback */}
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
