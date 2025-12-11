'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/admin/dashboard');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-2" style={{ background: 'var(--background)' }}>
      <div className="max-w-md w-full">
        <div className="aol-box" style={{ padding: '16px' }}>
          <h1 className="aol-heading-large mb-2 text-center" style={{ fontSize: '23px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span className="material-icons" style={{ fontSize: '24px' }}>lock</span> Admin Login
          </h1>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {error && (
              <div className="aol-box-inset" style={{ padding: '8px', background: 'var(--inset-bg)', borderColor: 'var(--color-saddle-brown-700)' }}>
                <p style={{ fontSize: '12px', color: 'var(--color-saddle-brown-700)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-icons" style={{ fontSize: '16px' }}>warning</span> {error}
                </p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block compact-mb" style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--foreground)', marginBottom: '2px' }}>
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="aol-input"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label htmlFor="password" className="block compact-mb" style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--foreground)', marginBottom: '2px' }}>
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="aol-input"
                style={{ width: '100%' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="aol-button"
              style={{ 
                width: '100%',
                fontSize: '14px',
                padding: '6px',
                opacity: loading ? 0.5 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Signing in...' : (
                <>
                  <span className="material-icons" style={{ fontSize: '16px', verticalAlign: 'middle', marginRight: '4px' }}>vpn_key</span> Sign In
                </>
              )}
            </button>
          </form>

          <div className="compact-mt text-center" style={{ marginTop: '12px' }}>
            <a href="/" className="aol-button-secondary" style={{ textDecoration: 'none', fontSize: '12px', padding: '3px 8px' }}>
              ← Back to homepage
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}




