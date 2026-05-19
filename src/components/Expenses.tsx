"use client";
import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Check, Search } from 'lucide-react';
import { formatCurrency, formatDate, PAYMENT_METHODS } from '@/lib/helpers';

const CATS = ['اجاره', 'حقوق', 'برق', 'آب', 'گاز', 'حمل‌ونقل', 'تعمیرات', 'خرید مواد', 'خوراکه', 'تلفون', 'متفرقه'];

interface Exp { id: number; category: string; description: string; amount: number; payment_method: string; expense_date: string; notes: string; }

export default function Expenses() {
  const [items, setItems] = useState<Exp[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number|null>(null);
  const [delId, setDelId] = useState<number|null>(null);
  const [search, setSearch] = useState('');
  const [fMonth, setFMonth] = useState('');
  const [fCat, setFCat] = useState('');
  const [form, setForm] = useState({ category: 'متفرقه', description: '', amount: '', payment_method: 'نقد', expense_date: new Date().toISOString().split('T')[0], notes: '' });

  useEffect(() => { load(); }, [fMonth]);

  async function load() {
    setLoading(true);
    const url = fMonth ? `/api/expenses?month=${fMonth}` : '/api/expenses';
    setItems(await fetch(url).then(r => r.json()));
    setLoading(false);
  }

  function reset() { setForm({ category: 'متفرقه', description: '', amount: '', payment_method: 'نقد', expense_date: new Date().toISOString().split('T')[0], notes: '' }); setEditId(null); setShowForm(false); }

  function startEdit(e: Exp) {
    setForm({ category: e.category, description: e.description, amount: String(e.amount), payment_method: e.payment_method, expense_date: e.expense_date, notes: e.notes || '' });
    setEditId(e.id); setShowForm(true);
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const p = { ...form, amount: parseFloat(form.amount) };
    if (editId) await fetch('/api/expenses', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editId, ...p }) });
    else await fetch('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) });
    reset(); load();
  }

  async function del(id: number) {
    await fetch('/api/expenses', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setDelId(null); load();
  }

  const filtered = items.filter(e => {
    const ms = !search || e.description.includes(search) || e.category.includes(search);
    const mc = !fCat || e.category === fCat;
    return ms && mc;
  });
  const total = filtered.reduce((s, e) => s + Number(e.amount), 0);
  const catTotals = filtered.reduce((a, e) => { a[e.category] = (a[e.category] || 0) + Number(e.amount); return a; }, {} as Record<string, number>);

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-bold">💰 مصارف و هزینه‌ها</h2>
        <button className="btn btn-primary btn-sm gap-1" onClick={() => { reset(); setShowForm(true); }}><Plus size={16} /> ثبت مصرف</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="card bg-error/10 border border-error/30"><div className="card-body p-3"><p className="text-xs text-base-content/60">مجموع</p><p className="font-bold text-error">{formatCurrency(total)}</p></div></div>
        {Object.entries(catTotals).slice(0, 3).map(([c, t]) => (
          <div key={c} className="card bg-base-200 border border-base-300"><div className="card-body p-3"><p className="text-xs text-base-content/60">{c}</p><p className="font-bold text-sm">{formatCurrency(t)}</p></div></div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="join"><span className="join-item btn btn-sm btn-ghost"><Search size={14} /></span><input className="input input-bordered input-sm join-item w-48" placeholder="جستجو..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        <input type="month" className="input input-bordered input-sm w-40" value={fMonth} onChange={e => setFMonth(e.target.value)} />
        <select className="select select-bordered select-sm" value={fCat} onChange={e => setFCat(e.target.value)}><option value="">همه</option>{CATS.map(c => <option key={c}>{c}</option>)}</select>
        {(search || fMonth || fCat) && <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFMonth(''); setFCat(''); }}>پاک</button>}
      </div>

      {showForm && (
        <div className="card bg-base-200 border border-primary/30"><div className="card-body p-4">
          <h3 className="font-bold text-sm">{editId ? '✏️ ویرایش' : '➕ مصرف جدید'}</h3>
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select className="select select-bordered select-sm" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{CATS.map(c => <option key={c}>{c}</option>)}</select>
            <input className="input input-bordered input-sm" placeholder="شرح *" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
            <input type="number" className="input input-bordered input-sm" placeholder="مبلغ ؋ *" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required min="0" />
            <select className="select select-bordered select-sm" value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}>{PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}</select>
            <input type="date" className="input input-bordered input-sm" value={form.expense_date} onChange={e => setForm({ ...form, expense_date: e.target.value })} />
            <input className="input input-bordered input-sm" placeholder="یادداشت" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            <div className="flex gap-2 md:col-span-3">
              <button type="submit" className="btn btn-primary btn-sm gap-1"><Check size={14} /> {editId ? 'بروزرسانی' : 'ثبت'}</button>
              <button type="button" className="btn btn-ghost btn-sm gap-1" onClick={reset}><X size={14} /> لغو</button>
            </div>
          </form>
        </div></div>
      )}

      {loading ? <div className="flex justify-center p-8"><span className="loading loading-spinner loading-lg text-primary" /></div> : (
        <div className="card bg-base-200"><div className="card-body p-4"><div className="overflow-x-auto">
          <table className="table table-zebra table-sm">
            <thead><tr><th>#</th><th>تاریخ</th><th>دسته</th><th>شرح</th><th>مبلغ</th><th>پرداخت</th><th>یادداشت</th><th>عملیات</th></tr></thead>
            <tbody>
              {filtered.map((e, i) => (
                <tr key={e.id}>
                  <td className="text-base-content/50">{i+1}</td>
                  <td className="text-xs">{formatDate(e.expense_date)}</td>
                  <td><span className="badge badge-outline badge-sm">{e.category}</span></td>
                  <td>{e.description}</td>
                  <td className="font-bold text-error">{formatCurrency(e.amount)}</td>
                  <td className="text-xs">{e.payment_method}</td>
                  <td className="text-xs text-base-content/60 max-w-[120px] truncate">{e.notes}</td>
                  <td>{delId === e.id ? (
                    <div className="flex gap-1"><button className="btn btn-error btn-xs" onClick={() => del(e.id)}>تأیید</button><button className="btn btn-ghost btn-xs" onClick={() => setDelId(null)}>لغو</button></div>
                  ) : (
                    <div className="flex gap-1"><button className="btn btn-ghost btn-xs" onClick={() => startEdit(e)}><Edit2 size={13} /></button><button className="btn btn-ghost btn-xs text-error" onClick={() => setDelId(e.id)}><Trash2 size={13} /></button></div>
                  )}</td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={8} className="text-center text-base-content/60 py-8">مصرفی ثبت نشده</td></tr>}
            </tbody>
            {filtered.length > 0 && <tfoot><tr><td colSpan={4} className="font-bold">جمع</td><td className="font-bold text-error">{formatCurrency(total)}</td><td colSpan={3}></td></tr></tfoot>}
          </table>
        </div></div></div>
      )}
    </div>
  );
}
