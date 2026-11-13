import { useEffect, useState, type FormEvent } from 'react'
import type { AuthError, Session } from '@supabase/supabase-js'
import { supabase } from '../../shared/lib/supabase'
import { EntriesProvider } from '../entries/EntriesProvider'
import { App } from '../../app/App'
import { Card } from '../../shared/ui/Card'
import { Backdrop } from '../../shared/ui/Backdrop'

export function AuthGate() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(Boolean(supabase))
  const [recovery, setRecovery] = useState(false)

  useEffect(() => {
    if (!supabase) return
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next)
      setLoading(false)
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      if (event === 'SIGNED_OUT') setRecovery(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  if (!supabase) return <AuthFrame><p>Не настроено подключение к дневнику. Проверьте переменные Supabase и перезапустите приложение.</p></AuthFrame>
  if (loading) return <AuthFrame><p role="status">Проверяем вход…</p></AuthFrame>
  if (recovery) return <LoginForm recovery onRecovered={() => setRecovery(false)} />
  if (!session) return <LoginForm />
  return <EntriesProvider key={session.user.id} user={session.user}><App /></EntriesProvider>
}

function AuthFrame({ children }: { children: React.ReactNode }) {
  return <Backdrop><main className="relative mx-auto flex min-h-screen max-w-[460px] flex-col justify-center px-4 py-10"><Card className="space-y-6 p-7"><p className="text-xs uppercase tracking-[0.24em] text-muted-soft">Quiet Health</p>{children}</Card></main></Backdrop>
}

function LoginForm({ recovery = false, onRecovered }: { recovery?: boolean; onRecovered?: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [reset, setReset] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!supabase || busy) return
    setBusy(true)
    setMessage('')
    try {
      if (recovery) {
        const { error } = await supabase.auth.updateUser({ password })
        if (error) throw error
        onRecovered?.()
      } else if (reset) {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: new URL(import.meta.env.BASE_URL, window.location.origin).href })
        if (error) throw error
        setMessage('Если аккаунт существует, на почту придёт ссылка для смены пароля.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) throw error
      }
    } catch (cause) {
      const code = (cause as AuthError)?.code
      setMessage(recovery ? 'Не удалось изменить пароль. Проверьте требования к паролю или запросите новую ссылку.' : reset ? 'Не удалось отправить письмо. Проверьте соединение и попробуйте позже.' : code === 'email_not_confirmed' ? 'Почта этого аккаунта не подтверждена. Подтвердите её в письме или проверьте пользователя в Supabase → Authentication → Users.' : code === 'invalid_credentials' ? 'Неверная почта или пароль. Укажите почту созданного пользователя, а не его UUID.' : code === 'email_provider_disabled' ? 'В Supabase отключён вход по почте и паролю. Проверьте Authentication → Providers → Email.' : 'Не удалось войти. Проверьте подключение к интернету и попробуйте ещё раз.')
    } finally { setBusy(false) }
  }

  return <AuthFrame>
    <h1 className="text-3xl font-semibold tracking-[-0.03em] text-ink">{recovery ? 'Новый пароль' : reset ? 'Восстановить доступ' : 'Вход в дневник'}</h1>
    <form onSubmit={submit} className="space-y-4">
      {!recovery && <label className="block text-sm">Почта<input required type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} className="mt-2 w-full rounded-2xl border border-line bg-wash-soft px-4 py-3 text-sm outline-none transition focus:border-accent/70 focus:bg-surface" /></label>}
      {(!reset || recovery) && <label className="block text-sm">{recovery ? 'Новый пароль' : 'Пароль'}<input required minLength={recovery ? 8 : undefined} type="password" autoComplete={recovery ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} className="mt-2 w-full rounded-2xl border border-line bg-wash-soft px-4 py-3 text-sm outline-none transition focus:border-accent/70 focus:bg-surface" /></label>}
      {message && <p role="status" className="text-sm text-ink-soft">{message}</p>}
      <button disabled={busy} className="w-full rounded-2xl bg-accent-strong px-4 py-3 text-sm font-medium text-white shadow-chip disabled:opacity-50">{busy ? 'Подождите…' : recovery ? 'Сохранить пароль' : reset ? 'Отправить ссылку' : 'Войти'}</button>
      {!recovery && <button type="button" disabled={busy} onClick={() => { setReset(!reset); setMessage('') }} className="w-full text-sm text-muted transition hover:text-ink-soft">{reset ? 'Вернуться ко входу' : 'Забыли пароль?'}</button>}
    </form>
  </AuthFrame>
}
