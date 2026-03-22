import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import styles from './Auth.module.css'

export function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)

  function validate() {
    if (password.length < 8) return 'Password must be at least 8 characters.'
    if (password !== confirm) return 'Passwords do not match.'
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setLoading(true)
    try {
      const { user } = await signUp({ email, password })
      // Supabase may require email confirmation — handle both flows
      if (user && !user.email_confirmed_at) {
        setRegistered(true)
      } else {
        navigate('/dashboard', { replace: true })
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
            <h1 className={styles.title}>Create account</h1>
          </div>

          {registered ? (
            <div className={styles.magicConfirm}>
              <p>Account created. Check <strong>{email}</strong> to confirm your address.</p>
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
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                required
                hint="At least 8 characters."
              />
              <Input
                label="Confirm password"
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />

              {error && <p className={styles.errorMsg}>{error}</p>}

              <Button type="submit" fullWidth loading={loading} size="lg">
                Create account
              </Button>
            </form>
          )}

          <footer className={styles.cardFooter}>
            <span>Already registered?</span>
            <Link to="/login">Sign in</Link>
          </footer>
        </div>
      </div>
    </div>
  )
}
