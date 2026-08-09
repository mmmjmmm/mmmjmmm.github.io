import { ArrowRight, LockKeyhole } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { ApiError, login, type SessionData } from '../api';

interface LoginScreenProps {
  onLogin: (session: SessionData) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      onLogin(await login(username.trim(), password));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : '登录失败，请重试');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-mark" aria-hidden="true">
          <LockKeyhole size={22} strokeWidth={1.8} />
        </div>
        <p className="login-eyebrow">PRIVATE DESK</p>
        <h1 id="login-title">mjm&apos;s blog</h1>
        <p className="login-intro">登录后写作、保存草稿并发布文章。</p>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            <span>用户名</span>
            <input
              autoComplete="username"
              inputMode="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              disabled={submitting}
              required
            />
          </label>
          <label>
            <span>密码</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={submitting}
              required
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button
            className="button button--primary login-submit"
            type="submit"
            disabled={submitting}
          >
            <span>{submitting ? '登录中…' : '进入后台'}</span>
            {!submitting && <ArrowRight size={18} aria-hidden="true" />}
          </button>
        </form>
      </section>
    </main>
  );
}
