import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { GoogleMark, Icon } from '../components/Icon'
import { Scene } from '../components/Scene'
import { CODE_LENGTH } from '../data/config'

type Step = 'start' | 'email' | 'code'

function describe(error: unknown, step: Step): string {
  const message = String((error as { message?: string })?.message ?? '').toLowerCase()
  if (message.includes('rate limit') || message.includes('security purposes')) return 'Too many tries just now. Wait a minute and try again.'
  if (step === 'code' && (message.includes('expired') || message.includes('invalid'))) return "That code didn't work. Check it, or send a new one."
  if (message.includes('provider is not enabled')) return 'This sign-in method isn’t switched on yet.'
  if (!navigator.onLine) return "You're offline. Connect and try again."
  return step === 'start' ? "Couldn't sign in with Google. Please try again." : 'Something went wrong. Please try again.'
}

/** Sign-in: Google, a code sent by email, or no account at all. With `upgrade`, it's reached from You to sign in later. */
export function Welcome({ upgrade = false }: { upgrade?: boolean }) {
  const { cloudEnabled, signInWithGoogle, sendEmailCode, verifyEmailCode, continueWithoutAccount } = useAuth()
  const [step, setStep] = useState<Step>('start')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [wait, setWait] = useState(0)

  useEffect(() => {
    if (wait <= 0) return
    const id = window.setTimeout(() => setWait((s) => s - 1), 1000)
    return () => window.clearTimeout(id)
  }, [wait])

  const attempt = async (action: () => Promise<void>, from: Step) => {
    setBusy(true)
    setError('')
    try {
      await action()
    } catch (e) {
      console.error(e)
      setError(describe(e, from))
    } finally {
      setBusy(false)
    }
  }

  const google = () => attempt(signInWithGoogle, 'start')

  const sendCode = (e?: FormEvent) => {
    e?.preventDefault()
    if (!email.trim()) return
    attempt(async () => {
      await sendEmailCode(email.trim())
      setCode('')
      setStep('code')
      setWait(60)
    }, 'email')
  }

  const verify = (value: string) => {
    if (value.length < CODE_LENGTH || busy) return
    attempt(() => verifyEmailCode(email.trim(), value), 'code')
  }

  const go = (next: Step) => {
    setError('')
    setStep(next)
  }

  return (
    <main className="welcome">
      {upgrade && step === 'start' && (
        <button className="icon-btn welcome__back" onClick={() => window.history.back()} aria-label="Back">
          <Icon name="back" />
        </button>
      )}

      <div className={`welcome__hero ${step !== 'start' ? 'welcome__hero--small' : ''}`}>
        <div className="welcome__words">
          <h1 className="welcome__title">Little Stories</h1>
          {step === 'start' && <p className="welcome__lead">The people you’ve shared your life with, and the moments you lived together.</p>}
        </div>
        <Scene />
      </div>

      {step === 'start' && (
        <div className="welcome__body">
          <div className="welcome__actions">
            <button className="btn btn--primary btn--block btn--lg" onClick={google} disabled={!cloudEnabled || busy}>
              <span className="btn__badge">
                <GoogleMark size={18} />
              </span>
              Continue with Google
            </button>
            <button className="btn btn--secondary btn--block btn--lg" onClick={() => go('email')} disabled={!cloudEnabled || busy}>
              <Icon name="mail" size={20} />
              Continue with email
            </button>
            {!upgrade && (
              <button className="btn btn--ghost btn--block" onClick={continueWithoutAccount}>
                Try it without an account
              </button>
            )}
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <p className="fineprint">
            {!cloudEnabled
              ? 'Sign-in isn’t set up yet. You can try Little Stories with everything kept on this device.'
              : upgrade
                ? 'After signing in, you can move the stories kept on this device into your account.'
                : 'Your journal is private: only you can read it. Without an account, it stays on this device only.'}
          </p>
        </div>
      )}

      {step === 'email' && (
        <form className="welcome__body" onSubmit={sendCode}>
          <h2 className="title">Sign in with email</h2>
          <p className="subtitle">We’ll send you a {CODE_LENGTH}-digit code. No password to remember.</p>
          <input
            className="input input--lg"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-label="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            required
          />
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="welcome__actions">
            <button className="btn btn--primary btn--block btn--lg" disabled={busy || !email.includes('@')}>
              {busy ? 'Sending…' : 'Send me a code'}
            </button>
            <button type="button" className="btn btn--ghost btn--block" onClick={() => go('start')}>
              Back
            </button>
          </div>
        </form>
      )}

      {step === 'code' && (
        <form
          className="welcome__body"
          onSubmit={(e) => {
            e.preventDefault()
            verify(code)
          }}
        >
          <h2 className="title">Check your inbox</h2>
          <p className="subtitle">
            Enter the code we sent to <b>{email.trim()}</b>.
          </p>
          <input
            className="input input--lg input--code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={CODE_LENGTH}
            placeholder={'•'.repeat(CODE_LENGTH)}
            aria-label={`${CODE_LENGTH}-digit code`}
            value={code}
            onChange={(e) => {
              const next = e.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH)
              setCode(next)
              verify(next)
            }}
            autoFocus
          />
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="welcome__actions">
            <button className="btn btn--primary btn--block btn--lg" disabled={busy || code.length < CODE_LENGTH}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
            <button type="button" className="btn btn--ghost btn--block" onClick={() => sendCode()} disabled={busy || wait > 0}>
              {wait > 0 ? `Send a new code in ${wait}s` : 'Send a new code'}
            </button>
            <button type="button" className="text-btn" onClick={() => go('email')}>
              Use another email
            </button>
          </div>
        </form>
      )}
    </main>
  )
}
