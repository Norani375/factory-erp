'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Layers, DollarSign, Package, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { formatCurrency, formatNumber, UNITS } from '@/lib/helpers';

interface Material {
  id: number;
  name: string;
  unit: string;
  quantity: number;
  price: number;
  created_at: string;
}

interface MaterialForm {
  name: string;
  unit: string;
  quantity: number;
  price: number;
}

const emptyForm: MaterialForm = { name: '', unit: 'عدد', quantity: 0, price: 0 };
const PAGE_SIZE = 15;

export default function Materials() {
  const { success, error } = useToast();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editMaterial, setEditMaterial] = useState<Material | null>(null);
  const [deleteMaterial, setDeleteMaterial] = useState<Material | null>(null);
  const [form, setForm] = useState<MaterialForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);

  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/materials');
      if (!res.ok) throw new Error('خطا در دریافت مواد');
      const data = await res.json();
      setMaterials(data);
    } catch (e: any) {
      error(e.message || 'خطا در دریافت مواد');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

  const filtered = materials.filter(m =>
    !search || m.name.includes(search) || m.unit.includes(search)
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search]);

  // Summary
  const totalMaterials = materials.length;
  const totalValue = materials.reduce((s, m) => s + m.quantity * m.price, 0);
  const lowStockCount = materials.filter(m => m.quantity <= 5).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editMaterial) {
        const res = await fetch('/api/materials', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editMaterial.id, ...form }),
        });
        if (!res.ok) throw new Error('خطا در ویرایش ماده');
        success('ماده با موفقیت ویرایش شد');
        setEditMaterial(null);
      } else {
        const res = await fetch('/api/materials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error('خطا در افزودن ماده');
        success('ماده با موفقیت اضافه شد');
        setShowAddModal(false);
      }
      setForm(emptyForm);
      fetchMaterials();
    } catch (e: any) {
      error(e.message || 'خطا در عملیات');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteMaterial) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/materials', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteMaterial.id }),
      });
      if (!res.ok) throw new Error('خطا در حذف ماده');
      success('ماده با موفقیت حذف شد');
      setDeleteMaterial(null);
      fetchMaterials();
    } catch (e: any) {
      error(e.message || 'خطا در حذف');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (m: Material) => {
    setForm({ name: m.name, unit: m.unit, quantity: m.quantity, price: m.price });
    setEditMaterial(m);
  };

  const openAdd = () => {
    setForm(emptyForm);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditMaterial(null);
    setForm(emptyForm);
  };

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-control">
        <label className="label"><span className="label-text">نام ماده</span></label>
        <input type="text" className="input input-bordered w-full" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="form-control">
          <label className="label"><span className="label-text">واحد</span></label>
          <select className="select select-bordered w-full" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} required>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text">موجودی</span></label>
          <input type="number" className="input input-bordered w-full" value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} min={0} required />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text">قیمت واحد (؋)</span></label>
          <input type="number" className="input input-bordered w-full" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} min={0} required />
        </div>
      </div>
      <div className="modal-action">
        <button type="button" className="btn" onClick={closeModal}>انصراف</button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? <span className="loading loading-spinner loading-sm" /> : editMaterial ? 'ویرایش' : 'افزودن'}
        </button>
      </div>
    </form>
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages: number[] = [];
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return (
      <div className="flex justify-center items-center gap-1 mt-4">
        <button className="btn btn-sm btn-ghost" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
          <ChevronRight className="w-4 h-4" />
        </button>
        {pages.map(p => (
          <button key={p} className={`btn btn-sm ${p === currentPage ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setPage(p)}>
            {formatNumber(p)}
          </button>
        ))}
        <button className="btn btn-sm btn-ghost" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-base-100 shadow-md animate-fade-in">
          <div className="card-body flex-row items-center gap-4 p-4">
            <div className="bg-primary/10 p-3 rounded-xl"><Layers className="w-6 h-6 text-primary" /></div>
            <div>
              <div className="text-sm opacity-60">تعداد کل مواد</div>
              <div className="text-2xl font-bold">{formatNumber(totalMaterials)}</div>
            </div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-md animate-fade-in">
          <div className="card-body flex-row items-center gap-4 p-4">
            <div className="bg-success/10 p-3 rounded-xl"><DollarSign className="w-6 h-6 text-success" /></div>
            <div>
              <div className="text-sm opacity-60">ارزش کل مواد</div>
              <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            </div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-md animate-fade-in">
          <div className="card-body flex-row items-center gap-4 p-4">
            <div className="bg-warning/10 p-3 rounded-xl"><Package className="w-6 h-6 text-warning" /></div>
            <div>
              <div className="text-sm opacity-60">موجودی کم (≤۵)</div>
              <div className="text-2xl font-bold">{formatNumber(lowStockCount)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
          <input type="text" placeholder="جستجو..." className="input input-bordered input-sm pr-9 w-56" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-primary btn-sm gap-2" onClick={openAdd}>
          <Plus className="w-4 h-4" /> افزودن ماده
        </button>
      </div>

      {/* Table */}
      <div className="card bg-base-100 shadow-md">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>#</th>
                <th>نام</th>
                <th>واحد</th>
                <th>موجودی</th>
                <th>قیمت واحد</th>
                <th>ارزش کل</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8"><span className="loading loading-spinner loading-md" /></td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 opacity-50">ماده‌ای یافت نشد</td></tr>
              ) : paginated.map((m, i) => (
                <tr key={m.id} className="hover">
                  <td>{formatNumber((currentPage - 1) * PAGE_SIZE + i + 1)}</td>
                  <td className="font-medium">{m.name}</td>
                  <td>{m.unit}</td>
                  <td className={m.quantity <= 5 ? 'text-error font-bold' : ''}>{formatNumber(m.quantity)}</td>
                  <td>{formatCurrency(m.price)}</td>
                  <td>{formatCurrency(m.quantity * m.price)}</td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-ghost btn-xs" onClick={() => openEdit(m)}><Edit2 className="w-4 h-4" /></button>
                      <button className="btn btn-ghost btn-xs text-error" onClick={() => setDeleteMaterial(m)}><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {renderPagination()}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editMaterial) && (
        <div className="modal modal-open">
          <div className="modal-box">
            <button className="btn btn-sm btn-circle btn-ghost absolute left-2 top-2" onClick={closeModal}><X className="w-4 h-4" /></button>
            <h3 className="font-bold text-lg mb-4">{editMaterial ? 'ویرایش ماده' : 'افزودن ماده جدید'}</h3>
            {renderForm()}
          </div>
          <div className="modal-backdrop" onClick={closeModal} />
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteMaterial && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">حذف ماده</h3>
            <p className="py-4">آیا از حذف <strong>{deleteMaterial.name}</strong> مطمئن هستید؟</p>
            <div className="modal-action">
              <button className="btn" onClick={() => setDeleteMaterial(null)}>انصراف</button>
              <button className="btn btn-error" onClick={handleDelete} disabled={submitting}>
                {submitting ? <span className="loading loading-spinner loading-sm" /> : 'حذف'}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setDeleteMaterial(null)} />
        </div>
      )}
    </div>
  );
}
