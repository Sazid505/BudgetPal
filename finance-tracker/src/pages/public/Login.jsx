import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const s = {
  page: {
    minHeight: '100vh',
    background: '#0a0a0f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    fontFamily: "'Segoe UI', sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  orb1: {
    position: 'absolute', borderRadius: '50%',
    width: '500px', height: '500px',
    background: 'radial-gradient(circle, rgba(200,169,110,0.15), transparent)',
    top: '-150px', right: '-100px', filter: 'blur(80px)', pointerEvents: 'none',
  },
  orb2: {
    position: 'absolute', borderRadius: '50%',
    width: '350px', height: '350px',
    background: 'radial-gradient(circle, rgba(74,111,165,0.12), transparent)',
    bottom: '-100px', left: '-80px', filter: 'blur(80px)', pointerEvents: 'none',
  },
  card: {
    position: 'relative', zIndex: 1,
    width: '100%', maxWidth: '420px',
    background: '#13131a',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: '20px',
    padding: '2.5rem',
    boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
  },
  logo: {
    fontSize: '1.3rem', fontWeight: '700',
    color: '#c8a96e', marginBottom: '1.75rem',
    display: 'block',
  },
  title: {
    fontSize: '2rem', fontWeight: '900',
    color: '#f0ede8', margin: '0 0 0.4rem',
    lineHeight: '1.2',
  },
  sub: { fontSize: '0.88rem', color: '#6e6b64', margin: '0 0 2rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1.1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontSize: '0.82rem', fontWeight: '600', color: '#a09d96' },
  input: {
    background: '#1a1a24',
    border: '1.5px solid rgba(255,255,255,0.08)',
    borderRadius: '10px', color: '#f0ede8',
    fontSize: '0.92rem', padding: '12px 14px',
    outline: 'none', width: '100%', boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  btn: {
    background: '#c8a96e', color: '#0a0a0f',
    fontWeight: '700', fontSize: '0.95rem',
    padding: '13px', border: 'none',
    borderRadius: '10px', cursor: 'pointer',
    marginTop: '0.4rem', width: '100%',
    fontFamily: 'inherit',
  },
  error: {
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.25)',
    color: '#f87171', fontSize: '0.84rem',
    padding: '10px 14px', borderRadius: '8px',
  },
  switchText: { textAlign: 'center', fontSize: '0.85rem', color: '#5e5b54', marginTop: '1.25rem' },
  link: { color: '#c8a96e', fontWeight: '600', textDecoration: 'none' },
};

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Login failed');
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      onLogin(result.user);
      navigate(result?.user?.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.orb1} />
      <div style={s.orb2} />
      <div style={s.card}>
        <span style={s.logo}>BudgetPal</span>
        <h1 style={s.title}>Welcome back</h1>
        <p style={s.sub}>Sign in to your account to continue</p>
        <form style={s.form} onSubmit={handleSubmit}>
          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input style={s.input} type="email" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div style={s.field}>
            <label style={s.label}>Password</label>
            <input style={s.input} type="password" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <div style={s.error}>{error}</div>}
          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p style={s.switchText}>
          Don't have an account?{' '}
          <Link to="/signup" style={s.link}>Sign up free</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
