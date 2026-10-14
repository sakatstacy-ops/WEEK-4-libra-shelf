import { useState } from 'react';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import { LoadingState } from '../components/StatePanel.jsx';

export default function LoginPage() {
  const { login, status, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (status === 'loading') return <main className="detail-state"><LoadingState label="Checking your account" /></main>;
  if (isAuthenticated) return <Navigate to={location.state?.from?.pathname || '/'} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(form);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (loginError) {
      setError(loginError.message || 'We could not sign you in. Check your details and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-art"><span className="eyebrow"><span className="eyebrow-line" /> WELCOME BACK</span><h1>Pick up<br /><em>where you left off.</em></h1><p>Your shelves, your notes, your next good read.</p><div className="auth-art-shape" aria-hidden="true"><span>READ<br />MORE</span></div></section>
      <section className="auth-panel">
        <div className="auth-panel-heading"><span className="auth-icon"><LockKeyhole size={19} /></span><span className="eyebrow">MEMBER SIGN IN</span><h2>Come on in.</h2><p>Sign in to keep your reading list close.</p></div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="login-email">Email address</label>
          <input id="login-email" type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          <label htmlFor="login-password">Password</label>
          <input id="login-password" type="password" autoComplete="current-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="button-primary auth-submit" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'} <ArrowRight size={16} /></button>
        </form>
        <p className="auth-switch">New to Stacks? <Link to="/register">Create an account</Link></p>
      </section>
    </main>
  );
}
