import { useState } from 'react';
import { login, signup } from '../api.js';

export default function AuthPanel({ onAuth }) {
  const [mode, setMode] = useState('signup');
  const [form, setForm] = useState({ name: 'Creator', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function updateField(field, value) {
    setForm(current => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = mode === 'signup' ? await signup(form) : await login(form);
      onAuth(result);
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card authCard" onSubmit={submit}>
      <p className="eyebrow">Account Access</p>
      <h2>{mode === 'signup' ? 'Create creator account' : 'Login'}</h2>

      {mode === 'signup' && (
        <>
          <label>Name</label>
          <input value={form.name} onChange={event => updateField('name', event.target.value)} />
        </>
      )}

      <label>Email</label>
      <input type="email" value={form.email} onChange={event => updateField('email', event.target.value)} />

      <label>Password</label>
      <input type="password" value={form.password} onChange={event => updateField('password', event.target.value)} />

      {error && <p className="error">{error}</p>}

      <button disabled={loading}>{loading ? 'Please wait...' : mode === 'signup' ? 'Sign up' : 'Login'}</button>
      <button type="button" className="ghost" onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}>
        {mode === 'signup' ? 'Already have account? Login' : 'Need account? Sign up'}
      </button>
    </form>
  );
}
