import { LoaderCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ApiError, getSession, type SessionData } from './api';
import { Dashboard } from './components/Dashboard';
import { LoginScreen } from './components/LoginScreen';

export default function App() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startupError, setStartupError] = useState('');

  const checkSession = useCallback(async () => {
    setLoading(true);
    setStartupError('');
    try {
      setSession(await getSession());
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) {
        setStartupError(error instanceof Error ? error.message : '后台暂时不可用');
      }
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  if (loading) {
    return (
      <main className="startup-state">
        <LoaderCircle className="spin" size={24} />
        <span>正在打开写作后台…</span>
      </main>
    );
  }

  if (!session) {
    return (
      <>
        {startupError && (
          <div className="startup-error" role="alert">
            {startupError}
            <button type="button" onClick={() => void checkSession()}>
              重试
            </button>
          </div>
        )}
        <LoginScreen onLogin={setSession} />
      </>
    );
  }

  return <Dashboard session={session} onUnauthorized={() => setSession(null)} />;
}
