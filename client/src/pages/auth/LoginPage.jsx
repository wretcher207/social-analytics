import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import styles from './Auth.module.css'

export function LoginPage() {
  const { signIn, sendMagicLink } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [magicSent, setMagicSent] = useState(false)
  const [mode, setMode] = useState('password') // 'password' | 'magic'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'magic') {
        await sendMagicLink({ email })
        setMagicSent(true)
      } else {
        await signIn({ email, password })
        navigate(from, { replace: true })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />

      <div className={styles.container}>
        <header className={styles.brand}>
          <span className={styles.wordmark}>TERP</span>
          <p className={styles.tagline}>Terpene intelligence. Personal record.</p>
        </header>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h1 className={styles.title}>Sign in</h1>
            <div className={styles.modeToggle}>
              <button
                type="button"
                className={mode === 'password' ? styles.modeActive : styles.modeBtn}
                onClick={() => { setMode('password'); setError(''); setMagicSent(false) }}
              >
                Password
              </button>
              <button
                type="button"
                className={mode === 'magic' ? styles.modeActive : styles.modeBtn}
                onClick={() => { setMode('magic'); setError(''); setMagicSent(false) }}
              >
                Magic link
              </button>
            </div>
          </div>

          {magicSent ? (
            <div className={styles.magicConfirm}>
              <p>Check your inbox. A sign-in link was sent to <strong>{email}</strong>.</p>
            </div>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />

              {mode === 'password' && (
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              )}

              {error && <p className={styles.errorMsg}>{error}</p>}

              <Button type="submit" fullWidth loading={loading} size="lg">
                {mode === 'magic' ? 'Send magic link' : 'Sign in'}
              </Button>
            </form>
          )}

          <footer className={styles.cardFooter}>
            <span>No account?</span>
            <Link to="/register">Create one</Link>
          </footer>
        </div>
      </div>
    </div>
  )
}
