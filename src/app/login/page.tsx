"use client";
import React, { useState } from 'react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'خطا در ورود'); setLoading(false); return; }
      window.location.href = '/';
    } catch { setError('خطا در اتصال به سرور'); setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-base-300 via-base-200 to-base-300">
      <div className="card w-full max-w-md bg-base-100 shadow-2xl border border-base-300">
        <div className="card-body p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-primary">سیستم مدیریت کارخانه</h1>
            <p className="text-base-content/60 mt-1">نجاری و مبلمان</p>
          </div>

          {error && (
            <div className="alert alert-error mb-4 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">نام کاربری</span></label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                placeholder="نام کاربری" className="input input-bordered w-full" required autoFocus />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">رمز عبور</span></label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="رمز عبور" className="input input-bordered w-full" required />
            </div>
            <button type="submit" className={`btn btn-primary w-full mt-4 ${loading ? 'loading' : ''}`} disabled={loading}>
              {loading ? 'در حال ورود...' : 'ورود به سیستم'}
            </button>
          </form>

          <div className="divider text-xs text-base-content/40 mt-6">سیستم مدیریت یکپارچه ERP</div>
        </div>
      </div>
    </div>
  );
}
