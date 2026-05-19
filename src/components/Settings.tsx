"use client";
import React, { useState } from 'react';
import { Save, Key, Info, Shield } from 'lucide-react';

export default function Settings() {
  const [cp, setCp] = useState('');
  const [np, setNp] = useState('');
  const [rp, setRp] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function changePass(ev: React.FormEvent) {
    ev.preventDefault();
    if (np !== rp) { setMsg('رمز جدید مطابقت ندارد'); return; }
    if (np.length < 4) { setMsg('حداقل ۴ کاراکتر'); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/auth/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword: cp, newPassword: np }) });
      const d = await res.json();
      setMsg(res.ok ? '✅ رمز تغییر کرد' : (d.error || 'خطا'));
      if (res.ok) { setCp(''); setNp(''); setRp(''); }
    } catch { setMsg('خطا در ارتباط'); }
    setBusy(false);
  }

  return (
    <div className="p-4 space-y-6 h-full overflow-y-auto max-w-2xl">
      <h2 className="text-lg font-bold">⚙️ تنظیمات</h2>
      <div className="card bg-base-200 border border-base-300"><div className="card-body p-4">
        <h3 className="font-bold text-sm flex items-center gap-2"><Info size={16} /> سیستم</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-base-content/60">نام:</span><span>نجاری ERP</span>
          <span className="text-base-content/60">نسخه:</span><span>1.0</span>
          <span className="text-base-content/60">واحد پول:</span><span>افغانی ؋</span>
          <span className="text-base-content/60">دیتابیس:</span><span>Turso</span>
        </div>
      </div></div>
      <div className="card bg-base-200 border border-base-300"><div className="card-body p-4">
        <h3 className="font-bold text-sm flex items-center gap-2"><Key size={16} /> تغییر رمز</h3>
        <form onSubmit={changePass} className="space-y-2">
          <input type="password" className="input input-bordered input-sm w-full" placeholder="رمز فعلی" value={cp} onChange={e => setCp(e.target.value)} required />
          <input type="password" className="input input-bordered input-sm w-full" placeholder="رمز جدید" value={np} onChange={e => setNp(e.target.value)} required />
          <input type="password" className="input input-bordered input-sm w-full" placeholder="تکرار رمز" value={rp} onChange={e => setRp(e.target.value)} required />
          {msg && <div className={`text-sm ${msg.includes('✅') ? 'text-success' : 'text-error'}`}>{msg}</div>}
          <button type="submit" className="btn btn-primary btn-sm gap-1" disabled={busy}><Save size={14} /> ذخیره</button>
        </form>
      </div></div>
      <div className="card bg-base-200 border border-base-300"><div className="card-body p-4">
        <h3 className="font-bold text-sm flex items-center gap-2"><Shield size={16} /> امنیت</h3>
        <ul className="text-sm space-y-1 text-base-content/70">
          <li>🔒 مسیرها محافظت شده</li><li>🍪 نشست ۷ روزه امن</li><li>📡 ارتباط رمزگذاری شده</li>
        </ul>
      </div></div>
    </div>
  );
}
