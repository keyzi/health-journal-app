import { useEffect, useState, type FormEvent } from 'react'
import type { AuthError, Session } from '@supabase/supabase-js'
import { supabase } from '../../shared/lib/supabase'
import { EntriesProvider } from '../entries/EntriesProvider'
import { App } from '../../app/App'

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
  return <main className="min-h-screen bg-stone-100 px-5 py-20 text-stone-800"><div className="mx-auto max-w-sm space-y-6 rounded-3xl bg-white p-7 shadow-sm"><p className="text-xs uppercase tracking-widest text-stone-400">Quiet Health</p>{children}</div></main>
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
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin })
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
    <h1 className="text-2xl font-semibold">{recovery ? 'Новый пароль' : reset ? 'Восстановить доступ' : 'Вход в дневник'}</h1>
    <form onSubmit={submit} className="space-y-4">
      {!recovery && <label className="block text-sm">Почта<input required type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-stone-200 p-3" /></label>}
      {(!reset || recovery) && <label className="block text-sm">{recovery ? 'Новый пароль' : 'Пароль'}<input required minLength={recovery ? 8 : undefined} type="password" autoComplete={recovery ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-stone-200 p-3" /></label>}
      {message && <p role="status" className="text-sm text-stone-600">{message}</p>}
      <button disabled={busy} className="w-full rounded-xl bg-stone-900 p-3 text-white disabled:opacity-50">{busy ? 'Подождите…' : recovery ? 'Сохранить пароль' : reset ? 'Отправить ссылку' : 'Войти'}</button>
      {!recovery && <button type="button" disabled={busy} onClick={() => { setReset(!reset); setMessage('') }} className="w-full text-sm text-stone-500">{reset ? 'Вернуться ко входу' : 'Забыли пароль?'}</button>}
    </form>
  </AuthFrame>
}
