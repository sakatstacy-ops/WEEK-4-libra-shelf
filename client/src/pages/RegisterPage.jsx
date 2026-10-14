import { useState } from 'react';
import { ArrowRight, UserRoundPlus } from 'lucide-react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import { LoadingState } from '../components/StatePanel.jsx';

export default function RegisterPage() {
  const { register, status, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (status === 'loading') return <main className="detail-state"><LoadingState label="Preparing your account" /></main>;
  if (isAuthenticated) return <Navigate to={location.state?.from?.pathname || '/'} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await register(form);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (registerError) {
      setError(registerError.message || 'We could not create your account. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-art register-art"><span className="eyebrow"><span className="eyebrow-line" /> A PLACE FOR READERS</span><h1>Every shelf<br /><em>starts somewhere.</em></h1><p>Make a space for stories you want to remember.</p><div className="auth-art-shape" aria-hidden="true"><span>YOUR<br />SHELF</span></div></section>
      <section className="auth-panel">
        <div className="auth-panel-heading"><span className="auth-icon"><UserRoundPlus size={19} /></span><span className="eyebrow">JOIN THE LIBRARY</span><h2>Find your place.</h2><p>Create your reader account. It only takes a moment.</p></div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="register-email">Email address</label>
          <input id="register-email" type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          <label htmlFor="register-password">Password <span className="field-hint">12 characters minimum</span></label>
          <input id="register-password" type="password" autoComplete="new-password" minLength={12} maxLength={72} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="button-primary auth-submit" type="submit" disabled={busy}>{busy ? 'Creating account…' : 'Create account'} <ArrowRight size={16} /></button>
        </form>
        <p className="auth-switch">Already a member? <Link to="/login">Sign in</Link></p>
      </section>
    </main>
  );
}
