"use client";
import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react';
import { formatCurrency, formatNumber, CATEGORIES } from '@/lib/helpers';

interface Product {
  id: number; name: string; category: string; dimensions: string;
  unit: string; quantity: number; price: number; created_at: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: '', category: 'سایر', dimensions: '', unit: 'عدد', quantity: 0, price: 0 });

  useEffect(() => { loadProducts(); }, []);

  async function loadProducts() {
    const data = await fetch('/api/products').then(r => r.json());
    setProducts(data);
    setLoading(false);
  }

  function openAdd() { setEditing(null); setForm({ name: '', category: 'سایر', dimensions: '', unit: 'عدد', quantity: 0, price: 0 }); setShowModal(true); }
  function openEdit(p: Product) { setEditing(p); setForm({ name: p.name, category: p.category, dimensions: p.dimensions, unit: p.unit, quantity: p.quantity, price: p.price }); setShowModal(true); }

  async function handleSave() {
    if (!form.name.trim()) return;
    if (editing) {
      await fetch('/api/products', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, ...form }) });
    } else {
      await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    }
    setShowModal(false);
    await loadProducts();
  }

  async function handleDelete(id: number) {
    await fetch('/api/products', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setProducts(prev => prev.filter(p => p.id !== id));
  }

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.includes(search) || p.category.includes(search);
    const matchCat = !catFilter || p.category === catFilter;
    return matchSearch && matchCat;
  });
  const totalValue = filtered.reduce((s, p) => s + p.quantity * p.price, 0);

  if (loading) return <div className="flex justify-center p-8"><span className="loading loading-spinner loading-lg text-primary" /></div>;

  return (
    <div className="p-4 bg-gradient-to-br from-slate-50 to-white space-y-3 h-full overflow-y-auto">
      <div className="flex flex-wrap items-center gap-2">
        <label className="input input-bordered input-sm flex items-center gap-2 flex-1 min-w-48">
          <Search className="h-[1em] opacity-50" />
          <input className="grow" placeholder="جستجو محصول..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <X className="h-[1em] opacity-50 cursor-pointer" onClick={() => setSearch('')} />}
        </label>
        <select className="select select-bordered select-sm" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">همه دسته\u200cها</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className="btn btn-primary btn-sm" onClick={openAdd}><Plus size={16} /> افزودن</button>
      </div>

      <div className="text-sm text-base-content/60">{formatNumber(filtered.length)} محصول | ارزش کل: {formatCurrency(totalValue)}</div>

      <div className="overflow-x-auto">
        <table className="table table-zebra table-sm">
          <thead><tr><th>#</th><th>نام محصول</th><th>دسته</th><th>ابعاد</th><th>واحد</th><th>موجودی</th><th>قیمت واحد</th><th>ارزش کل</th><th>عملیات</th></tr></thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr key={p.id} className={p.quantity <= 3 ? 'text-warning' : ''}>
                <td>{i + 1}</td>
                <td className="font-medium">{p.name}</td>
                <td><span className="badge badge-sm badge-outline">{p.category}</span></td>
                <td>{p.dimensions}</td>
                <td>{p.unit}</td>
                <td>{p.quantity <= 3 ? <span className="badge badge-error badge-sm">{formatNumber(p.quantity)}</span> : formatNumber(p.quantity)}</td>
                <td>{formatCurrency(p.price)}</td>
                <td>{formatCurrency(p.quantity * p.price)}</td>
                <td>
                  <div className="flex gap-1">
                    <button className="btn btn-ghost btn-xs" onClick={() => openEdit(p)}><Pencil size={14} /></button>
                    <button className="btn btn-ghost btn-xs text-error" onClick={() => handleDelete(p.id)}><Trash2 size={14} /></button>
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
            <h3 className="font-bold mb-4">{editing ? 'ویرایش محصول' : 'افزودن محصول جدید'}</h3>
            <div className="space-y-3">
              <input className="input input-bordered w-full input-sm" placeholder="نام محصول" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <select className="select select-bordered w-full select-sm" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input className="input input-bordered w-full input-sm" placeholder="ابعاد" value={form.dimensions} onChange={e => setForm({ ...form, dimensions: e.target.value })} />
              <input className="input input-bordered w-full input-sm" placeholder="واحد" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
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
