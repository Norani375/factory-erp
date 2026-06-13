'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Package, DollarSign, AlertTriangle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { formatCurrency, formatNumber, CATEGORIES } from '@/lib/helpers';

interface Product {
  id: number;
  name: string;
  category: string;
  dimensions: string;
  unit: string;
  quantity: number;
  price: number;
  created_at: string;
}

interface ProductForm {
  name: string;
  category: string;
  dimensions: string;
  unit: string;
  quantity: number;
  price: number;
}

const emptyForm: ProductForm = { name: '', category: '', dimensions: '', unit: 'عدد', quantity: 0, price: 0 };
const PAGE_SIZE = 15;

export default function Products() {
  const { success, error } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('خطا در دریافت محصولات');
      const data = await res.json();
      setProducts(data);
    } catch (e: any) {
      error(e.message || 'خطا در دریافت محصولات');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.includes(search) || p.category.includes(search) || p.dimensions?.includes(search);
    const matchCategory = !categoryFilter || p.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search, categoryFilter]);

  // Summary
  const totalProducts = products.length;
  const totalValue = products.reduce((s, p) => s + p.quantity * p.price, 0);
  const lowStockCount = products.filter(p => p.quantity <= 5).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editProduct) {
        const res = await fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editProduct.id, ...form }),
        });
        if (!res.ok) throw new Error('خطا در ویرایش محصول');
        success('محصول با موفقیت ویرایش شد');
        setEditProduct(null);
      } else {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error('خطا در افزودن محصول');
        success('محصول با موفقیت اضافه شد');
        setShowAddModal(false);
      }
      setForm(emptyForm);
      fetchProducts();
    } catch (e: any) {
      error(e.message || 'خطا در عملیات');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteProduct) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteProduct.id }),
      });
      if (!res.ok) throw new Error('خطا در حذف محصول');
      success('محصول با موفقیت حذف شد');
      setDeleteProduct(null);
      fetchProducts();
    } catch (e: any) {
      error(e.message || 'خطا در حذف');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (p: Product) => {
    setForm({ name: p.name, category: p.category, dimensions: p.dimensions, unit: p.unit, quantity: p.quantity, price: p.price });
    setEditProduct(p);
  };

  const openAdd = () => {
    setForm(emptyForm);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditProduct(null);
    setForm(emptyForm);
  };

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-control">
        <label className="label"><span className="label-text">نام محصول</span></label>
        <input type="text" className="input input-bordered w-full" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label"><span className="label-text">دسته</span></label>
          <select className="select select-bordered w-full" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required>
            <option value="">انتخاب دسته</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text">ابعاد</span></label>
          <input type="text" className="input input-bordered w-full" value={form.dimensions} onChange={e => setForm({ ...form, dimensions: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="form-control">
          <label className="label"><span className="label-text">واحد</span></label>
          <input type="text" className="input input-bordered w-full" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} required />
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
          {submitting ? <span className="loading loading-spinner loading-sm" /> : editProduct ? 'ویرایش' : 'افزودن'}
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
            <div className="bg-primary/10 p-3 rounded-xl"><Package className="w-6 h-6 text-primary" /></div>
            <div>
              <div className="text-sm opacity-60">تعداد کل محصولات</div>
              <div className="text-2xl font-bold">{formatNumber(totalProducts)}</div>
            </div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-md animate-fade-in">
          <div className="card-body flex-row items-center gap-4 p-4">
            <div className="bg-success/10 p-3 rounded-xl"><DollarSign className="w-6 h-6 text-success" /></div>
            <div>
              <div className="text-sm opacity-60">ارزش کل انبار</div>
              <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            </div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-md animate-fade-in">
          <div className="card-body flex-row items-center gap-4 p-4">
            <div className="bg-warning/10 p-3 rounded-xl"><AlertTriangle className="w-6 h-6 text-warning" /></div>
            <div>
              <div className="text-sm opacity-60">موجودی کم (≤۵)</div>
              <div className="text-2xl font-bold">{formatNumber(lowStockCount)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
            <input type="text" placeholder="جستجو..." className="input input-bordered input-sm pr-9 w-56" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="select select-bordered select-sm" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="">همه دسته‌ها</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button className="btn btn-primary btn-sm gap-2" onClick={openAdd}>
          <Plus className="w-4 h-4" /> افزودن محصول
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
                <th>دسته</th>
                <th>ابعاد</th>
                <th>واحد</th>
                <th>موجودی</th>
                <th>قیمت واحد</th>
                <th>ارزش کل</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-8"><span className="loading loading-spinner loading-md" /></td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 opacity-50">محصولی یافت نشد</td></tr>
              ) : paginated.map((p, i) => (
                <tr key={p.id} className="hover">
                  <td>{formatNumber((currentPage - 1) * PAGE_SIZE + i + 1)}</td>
                  <td className="font-medium">{p.name}</td>
                  <td><span className="badge badge-ghost badge-sm">{p.category}</span></td>
                  <td>{p.dimensions || '—'}</td>
                  <td>{p.unit}</td>
                  <td className={p.quantity <= 5 ? 'text-error font-bold' : ''}>{formatNumber(p.quantity)}</td>
                  <td>{formatCurrency(p.price)}</td>
                  <td>{formatCurrency(p.quantity * p.price)}</td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-ghost btn-xs" onClick={() => openEdit(p)}><Edit2 className="w-4 h-4" /></button>
                      <button className="btn btn-ghost btn-xs text-error" onClick={() => setDeleteProduct(p)}><Trash2 className="w-4 h-4" /></button>
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
      {(showAddModal || editProduct) && (
        <div className="modal modal-open">
          <div className="modal-box">
            <button className="btn btn-sm btn-circle btn-ghost absolute left-2 top-2" onClick={closeModal}><X className="w-4 h-4" /></button>
            <h3 className="font-bold text-lg mb-4">{editProduct ? 'ویرایش محصول' : 'افزودن محصول جدید'}</h3>
            {renderForm()}
          </div>
          <div className="modal-backdrop" onClick={closeModal} />
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteProduct && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">حذف محصول</h3>
            <p className="py-4">آیا از حذف <strong>{deleteProduct.name}</strong> مطمئن هستید؟</p>
            <div className="modal-action">
              <button className="btn" onClick={() => setDeleteProduct(null)}>انصراف</button>
              <button className="btn btn-error" onClick={handleDelete} disabled={submitting}>
                {submitting ? <span className="loading loading-spinner loading-sm" /> : 'حذف'}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setDeleteProduct(null)} />
        </div>
      )}
    </div>
  );
}
