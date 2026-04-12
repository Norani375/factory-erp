"use client";
import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/helpers';

interface Customer { id: number; name: string; phone: string; address: string; type: string; balance: number; created_at: string; }

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', address: '', type: 'نقدی' });

  useEffect(() => { loadCustomers(); }, []);

  async function loadCustomers() {
    const data = await fetch('/api/customers').then(r => r.json());
    setCustomers(data);
    setLoading(false);
  }

  function openAdd() { setEditing(null); setForm({ name: '', phone: '', address: '', type: 'نقدی' }); setShowModal(true); }
  function openEdit(c: Customer) { setEditing(c); setForm({ name: c.name, phone: c.phone, address: c.address, type: c.type }); setShowModal(true); }

  async function handleSave() {
    if (!form.name.trim()) return;
    if (editing) {
      await fetch('/api/customers', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, ...form }) });
    } else {
      await fetch('/api/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    }
    setShowModal(false);
    await loadCustomers();
  }

  async function handleDelete(id: number) {
    await fetch('/api/customers', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setCustomers(prev => prev.filter(c => c.id !== id));
  }

  const filtered = customers.filter(c => {
    const matchSearch = !search || c.name.includes(search) || c.phone.includes(search);
    const matchType = !typeFilter || c.type === typeFilter;
    return matchSearch && matchType;
  });
  const totalDebt = filtered.reduce((s, c) => s + (c.balance > 0 ? c.balance : 0), 0);

  if (loading) return <div className="flex justify-center p-8"><span className="loading loading-spinner loading-lg text-primary" /></div>;

  return (
    <div className="p-4 bg-gradient-to-br from-slate-50 to-white space-y-3 h-full overflow-y-auto">
      <div className="flex flex-wrap items-center gap-2">
        <label className="input input-bordered input-sm flex items-center gap-2 flex-1 min-w-48">
          <Search className="h-[1em] opacity-50" />
          <input className="grow" placeholder="جستجو مشتری..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <X className="h-[1em] opacity-50 cursor-pointer" onClick={() => setSearch('')} />}
        </label>
        <select className="select select-bordered select-sm" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">همه</option>
          <option value="نقدی">نقدی</option>
          <option value="نسیه">نسیه</option>
        </select>
        <button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={16} /> افزودن</button>
      </div>

      <div className="text-sm text-base-content/60">{formatNumber(filtered.length)} مشتری | بدهی کل: {formatCurrency(totalDebt)}</div>

      <div className="overflow-x-auto">
        <table className="table table-zebra table-sm">
          <thead><tr><th>#</th><th>نام</th><th>تلفن</th><th>آدرس</th><th>نوع</th><th>بدهی</th><th>عملیات</th></tr></thead>
          <tbody>
            {filtered.map((c, i) => (
              <tr key={c.id}>
                <td>{i + 1}</td>
                <td className="font-medium">{c.name}</td>
                <td className="ltr-num">{c.phone}</td>
                <td>{c.address}</td>
                <td><span className={`badge badge-sm ${c.type === 'نسیه' ? 'badge-warning' : 'badge-success'}`}>{c.type}</span></td>
                <td className={c.balance > 0 ? 'text-error font-medium' : ''}>{c.balance > 0 ? formatCurrency(c.balance) : '-'}</td>
                <td>
                  <div className="flex gap-1">
                    <button className="btn btn-ghost btn-xs" onClick={() => openEdit(c)}><Pencil size={14} /></button>
                    <button className="btn btn-ghost btn-xs text-error" onClick={() => handleDelete(c.id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold mb-4">{editing ? 'ویرایش مشتری' : 'افزودن مشتری جدید'}</h3>
            <div className="space-y-3">
              <input className="input input-bordered w-full input-sm" placeholder="نام مشتری" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <input className="input input-bordered w-full input-sm" placeholder="شماره تماس" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              <input className="input input-bordered w-full input-sm" placeholder="آدرس" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              <select className="select select-bordered w-full select-sm" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="نقدی">نقدی</option>
                <option value="نسیه">نسیه</option>
              </select>
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>انصراف</button>
              <button className="btn btn-primary btn-sm" onClick={handleSave}>ذخیره</button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowModal(false)} />
        </div>
      )}
    </div>
  );
}
