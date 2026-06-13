"use client";
import React, { useState } from 'react';
import { Settings as SettingsIcon, Lock, Shield, Info, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function Settings() {
  const { success, error: showError } = useToast();
  const [curPass, setCurPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [repPass, setRepPass] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPass !== repPass) { showError('رمز جدید و تکرار مطابقت ندارد'); return; }
    if (newPass.length < 4) { showError('رمز جدید باید حداقل ۴ کاراکتر باشد'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword: curPass, newPassword: newPass }) });
      const data = await res.json();
      if (res.ok) { success('رمز با موفقیت تغییر کرد'); setCurPass(''); setNewPass(''); setRepPass(''); }
      else showError(data.error || 'خطا');
    } catch { showError('خطا در ارتباط'); }
    setSaving(false);
  }

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto max-w-2xl mx-auto">
      <h2 className="text-lg font-bold flex items-center gap-2"><SettingsIcon size={22} /> تنظیمات</h2>

      <div className="card bg-base-200 border border-base-300 animate-fade-in">
        <div className="card-body p-4">
          <h3 className="card-title text-sm gap-2"><Info size={16} /> سیستم</h3>
          <div className="grid grid-cols-2 gap-3 text-sm mt-2">
            <div className="flex justify-between p-2 bg-base-100 rounded-lg"><span className="text-base-content/60">نام:</span><span className="font-bold">نجاری ERP</span></div>
            <div className="flex justify-between p-2 bg-base-100 rounded-lg"><span className="text-base-content/60">نسخه:</span><span className="font-bold text-primary">2.0</span></div>
            <div className="flex justify-between p-2 bg-base-100 rounded-lg"><span className="text-base-content/60">واحد پول:</span><span className="font-bold">افغانی ؋</span></div>
            <div className="flex justify-between p-2 bg-base-100 rounded-lg"><span className="text-base-content/60">دیتابیس:</span><span className="font-bold">Turso</span></div>
          </div>
        </div>
      </div>

      <div className="card bg-base-200 border border-base-300 animate-fade-in">
        <div className="card-body p-4">
          <h3 className="card-title text-sm gap-2"><Lock size={16} /> تغییر رمز</h3>
          <form onSubmit={changePassword} className="space-y-3 mt-2">
            <div className="relative">
              <input className="input input-bordered w-full input-sm pr-10" type={showCur ? 'text' : 'password'} placeholder="رمز فعلی" value={curPass} onChange={e => setCurPass(e.target.value)} required />
              <button type="button" className="absolute left-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs" onClick={() => setShowCur(!showCur)}>{showCur ? <EyeOff size={14} /> : <Eye size={14} />}</button>
            </div>
            <div className="relative">
              <input className="input input-bordered w-full input-sm pr-10" type={showNew ? 'text' : 'password'} placeholder="رمز جدید" value={newPass} onChange={e => setNewPass(e.target.value)} required />
              <button type="button" className="absolute left-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs" onClick={() => setShowNew(!showNew)}>{showNew ? <EyeOff size={14} /> : <Eye size={14} />}</button>
            </div>
            <input className="input input-bordered w-full input-sm" type="password" placeholder="تکرار رمز" value={repPass} onChange={e => setRepPass(e.target.value)} required />
            {newPass && repPass && newPass !== repPass && <p className="text-error text-xs">رمزها مطابقت ندارند</p>}
            <button type="submit" className="btn btn-primary btn-sm w-full" disabled={saving}>{saving ? <span className="loading loading-spinner loading-xs" /> : 'ذخیره'}</button>
          </form>
        </div>
      </div>

      <div className="card bg-base-200 border border-base-300 animate-fade-in">
        <div className="card-body p-4">
          <h3 className="card-title text-sm gap-2"><Shield size={16} /> امنیت</h3>
          <ul className="text-sm space-y-2 mt-2">
            <li className="flex items-center gap-2 p-2 bg-base-100 rounded-lg">🔒 مسیرها محافظت شده</li>
            <li className="flex items-center gap-2 p-2 bg-base-100 rounded-lg">🍪 نشست ۷ روزه امن</li>
            <li className="flex items-center gap-2 p-2 bg-base-100 rounded-lg">📡 ارتباط رمزگذاری شده</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
