"use client";
import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react';
import { formatCurrency, formatNumber, UNITS } from '@/lib/helpers';

interface Material { id: number; name: string; unit: string; quantity: number; price: number; created_at: string; }

export default function Materials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [form, setForm] = useState({ name: '', unit: 'دانه', quantity: 0, price: 0 });

  useEffect(() => { loadMaterials(); }, []);

  async function loadMaterials() {
    const data = await fetch('/api/materials').then(r => r.json());
    setMaterials(data);
    setLoading(false);
  }

  function openAdd() { setEditing(null); setForm({ name: '', unit: 'دانه', quantity: 0, price: 0 }); setShowModal(true); }
  function openEdit(m: Material) { setEditing(m); setForm({ name: m.name, unit: m.unit, quantity: m.quantity, price: m.price }); setShowModal(true); }

  async function handleSave() {
    if (!form.name.trim()) return;
    if (editing) {
      await fetch('/api/materials', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, ...form }) });
    } else {
      await fetch('/api/materials', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    }
    setShowModal(false);
    await loadMaterials();
  }

  async function handleDelete(id: number) {
    await fetch('/api/materials', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setMaterials(prev => prev.filter(m => m.id !== id));
  }

  const filtered = materials.filter(m => !search || m.name.includes(search));
  const totalValue = filtered.reduce((s, m) => s + m.quantity * m.price, 0);

  if (loading) return <div className="flex justify-center p-8"><span className="loading loading-spinner loading-lg text-primary" /></div>;

  return (
    <div className="p-4 bg-gradient-to-br from-slate-50 to-white space-y-3 h-full overflow-y-auto">
      <div className="flex flex-wrap items-center gap-2">
        <label className="input input-bordered input-sm flex items-center gap-2 flex-1 min-w-48">
          <Search className="h-[1em] opacity-50" />
          <input className="grow" placeholder="جستجو مواد..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <X className="h-[1em] opacity-50 cursor-pointer" onClick={() => setSearch('')} />}
        </label>
        <button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={16} /> افزودن</button>
      </div>

      <div className="text-sm text-base-content/60">{formatNumber(filtered.length)} قلم | ارزش کل: {formatCurrency(totalValue)}</div>

      <div className="overflow-x-auto">
        <table className="table table-zebra table-sm">
          <thead><tr><th>#</th><th>نام</th><th>واحد</th><th>موجودی</th><th>قیمت واحد</th><th>ارزش کل</th><th>عملیات</th></tr></thead>
          <tbody>
            {filtered.map((m, i) => (
              <tr key={m.id}>
                <td>{i + 1}</td>
                <td className="font-medium">{m.name}</td>
                <td>{m.unit}</td>
                <td>{formatNumber(m.quantity)}</td>
                <td>{formatCurrency(m.price)}</td>
                <td>{formatCurrency(m.quantity * m.price)}</td>
                <td>
                  <div className="flex gap-1">
                    <button className="btn btn-ghost btn-xs" onClick={() => openEdit(m)}><Pencil size={14} /></button>
                    <button className="btn btn-ghost btn-xs text-error" onClick={() => handleDelete(m.id)}><Trash2 size={14} /></button>
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
            <h3 className="font-bold mb-4">{editing ? 'ویرایش ماده' : 'افزودن ماده جدید'}</h3>
            <div className="space-y-3">
              <input className="input input-bordered w-full input-sm" placeholder="نام ماده" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <select className="select select-bordered w-full select-sm" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input className="input input-bordered input-sm" type="number" placeholder="موجودی" value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} />
                <input className="input input-bordered input-sm" type="number" placeholder="قیمت واحد" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
              </div>
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
