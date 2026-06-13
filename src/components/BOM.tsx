'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, X, Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { formatNumber } from '@/lib/helpers';

interface Product {
  id: number;
  name: string;
}

interface Material {
  id: number;
  name: string;
  unit: string;
}

interface BOMItem {
  id: number;
  product_id: number;
  material_id: number;
  quantity: number;
  product_name?: string;
  material_name?: string;
  material_unit?: string;
}

interface BOMForm {
  product_id: number;
  material_id: number;
  quantity: number;
}

const emptyForm: BOMForm = { product_id: 0, material_id: 0, quantity: 0 };

export default function BOM() {
  const { success, error } = useToast();
  const [bomItems, setBomItems] = useState<BOMItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [productFilter, setProductFilter] = useState<number>(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState<BOMItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<BOMItem | null>(null);
  const [form, setForm] = useState<BOMForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set());

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [bomRes, prodRes, matRes] = await Promise.all([
        fetch('/api/bom'),
        fetch('/api/products'),
        fetch('/api/materials'),
      ]);
      if (!bomRes.ok) throw new Error('خطا در دریافت فرمول‌ها');
      if (!prodRes.ok) throw new Error('خطا در دریافت محصولات');
      if (!matRes.ok) throw new Error('خطا در دریافت مواد');
      const [bomData, prodData, matData] = await Promise.all([
        bomRes.json(), prodRes.json(), matRes.json(),
      ]);
      setBomItems(bomData);
      setProducts(prodData);
      setMaterials(matData);
    } catch (e: any) {
      error(e.message || 'خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Enrich BOM items with names
  const enriched = bomItems.map(b => ({
    ...b,
    product_name: b.product_name || products.find(p => p.id === b.product_id)?.name || '—',
    material_name: b.material_name || materials.find(m => m.id === b.material_id)?.name || '—',
    material_unit: b.material_unit || materials.find(m => m.id === b.material_id)?.unit || '',
  }));

  const filtered = productFilter ? enriched.filter(b => b.product_id === productFilter) : enriched;

  // Group by product
  const grouped = filtered.reduce<Record<number, { productName: string; items: typeof enriched }>>((acc, item) => {
    if (!acc[item.product_id]) {
      acc[item.product_id] = { productName: item.product_name || '—', items: [] };
    }
    acc[item.product_id].items.push(item);
    return acc;
  }, {});

  const toggleProduct = (pid: number) => {
    setExpandedProducts(prev => {
      const next = new Set(prev);
      if (next.has(pid)) next.delete(pid); else next.add(pid);
      return next;
    });
  };

  // Expand all by default
  useEffect(() => {
    const ids = Object.keys(grouped).map(Number);
    setExpandedProducts(new Set(ids));
  }, [bomItems, productFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editItem) {
        const res = await fetch('/api/bom', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editItem.id, quantity: form.quantity }),
        });
        if (!res.ok) throw new Error('خطا در ویرایش فرمول');
        success('فرمول با موفقیت ویرایش شد');
        setEditItem(null);
      } else {
        const res = await fetch('/api/bom', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error('خطا در افزودن فرمول');
        success('فرمول با موفقیت اضافه شد');
        setShowAddModal(false);
      }
      setForm(emptyForm);
      fetchData();
    } catch (e: any) {
      error(e.message || 'خطا در عملیات');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/bom', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteItem.id }),
      });
      if (!res.ok) throw new Error('خطا در حذف فرمول');
      success('فرمول با موفقیت حذف شد');
      setDeleteItem(null);
      fetchData();
    } catch (e: any) {
      error(e.message || 'خطا در حذف');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (item: BOMItem) => {
    setForm({ product_id: item.product_id, material_id: item.material_id, quantity: item.quantity });
    setEditItem(item);
  };

  const openAdd = () => {
    setForm(emptyForm);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditItem(null);
    setForm(emptyForm);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-xl"><Layers className="w-5 h-5 text-primary" /></div>
          <div>
            <h2 className="text-lg font-bold">فرمول ساخت (BOM)</h2>
            <p className="text-sm opacity-60">{formatNumber(bomItems.length)} فرمول ثبت شده</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select className="select select-bordered select-sm" value={productFilter} onChange={e => setProductFilter(Number(e.target.value))}>
            <option value={0}>همه محصولات</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button className="btn btn-primary btn-sm gap-2" onClick={openAdd}>
            <Plus className="w-4 h-4" /> افزودن فرمول
          </button>
        </div>
      </div>

      {/* Grouped BOM Table */}
      <div className="card bg-base-100 shadow-md">
        {loading ? (
          <div className="flex justify-center py-12"><span className="loading loading-spinner loading-md" /></div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-12 opacity-50">فرمولی یافت نشد</div>
        ) : (
          <div className="divide-y divide-base-200">
            {Object.entries(grouped).map(([pid, group]) => {
              const productId = Number(pid);
              const isExpanded = expandedProducts.has(productId);
              return (
                <div key={productId}>
                  {/* Product Header */}
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-base-200/50 transition-colors"
                    onClick={() => toggleProduct(productId)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <Layers className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-bold text-base">{group.productName}</span>
                      <span className="badge badge-sm badge-ghost">{formatNumber(group.items.length)} ماده</span>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 opacity-50" /> : <ChevronDown className="w-4 h-4 opacity-50" />}
                  </button>
                  {/* Materials List */}
                  {isExpanded && (
                    <div className="overflow-x-auto">
                      <table className="table w-full">
                        <thead>
                          <tr className="bg-base-200/30">
                            <th className="pr-12">ماده</th>
                            <th>مقدار</th>
                            <th>واحد</th>
                            <th>عملیات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.items.map(item => (
                            <tr key={item.id} className="hover">
                              <td className="pr-12 font-medium">{item.material_name}</td>
                              <td>{formatNumber(item.quantity)}</td>
                              <td>{item.material_unit}</td>
                              <td>
                                <div className="flex gap-1">
                                  <button className="btn btn-ghost btn-xs" onClick={() => openEdit(item)}><Edit2 className="w-4 h-4" /></button>
                                  <button className="btn btn-ghost btn-xs text-error" onClick={() => setDeleteItem(item)}><Trash2 className="w-4 h-4" /></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Flat Table (fallback view) */}
      {!loading && Object.keys(grouped).length > 0 && (
        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-4">
            <h3 className="font-bold text-sm opacity-60 mb-2">نمای جدولی</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>محصول</th>
                  <th>ماده</th>
                  <th>مقدار</th>
                  <th>واحد</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id} className="hover">
                    <td className="font-medium">{item.product_name}</td>
                    <td>{item.material_name}</td>
                    <td>{formatNumber(item.quantity)}</td>
                    <td>{item.material_unit}</td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn btn-ghost btn-xs" onClick={() => openEdit(item)}><Edit2 className="w-4 h-4" /></button>
                        <button className="btn btn-ghost btn-xs text-error" onClick={() => setDeleteItem(item)}><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <button className="btn btn-sm btn-circle btn-ghost absolute left-2 top-2" onClick={closeModal}><X className="w-4 h-4" /></button>
            <h3 className="font-bold text-lg mb-4">افزودن فرمول جدید</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label"><span className="label-text">محصول</span></label>
                <select className="select select-bordered w-full" value={form.product_id} onChange={e => setForm({ ...form, product_id: Number(e.target.value) })} required>
                  <option value={0} disabled>انتخاب محصول</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">ماده</span></label>
                <select className="select select-bordered w-full" value={form.material_id} onChange={e => setForm({ ...form, material_id: Number(e.target.value) })} required>
                  <option value={0} disabled>انتخاب ماده</option>
                  {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                </select>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">مقدار</span></label>
                <input type="number" className="input input-bordered w-full" value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} min={0} step="any" required />
              </div>
              <div className="modal-action">
                <button type="button" className="btn" onClick={closeModal}>انصراف</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <span className="loading loading-spinner loading-sm" /> : 'افزودن'}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={closeModal} />
        </div>
      )}

      {/* Edit Quantity Modal */}
      {editItem && (
        <div className="modal modal-open">
          <div className="modal-box">
            <button className="btn btn-sm btn-circle btn-ghost absolute left-2 top-2" onClick={closeModal}><X className="w-4 h-4" /></button>
            <h3 className="font-bold text-lg mb-4">ویرایش مقدار</h3>
            <p className="text-sm opacity-60 mb-4">
              {editItem.product_name} ← {editItem.material_name}
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label"><span className="label-text">مقدار</span></label>
                <input type="number" className="input input-bordered w-full" value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} min={0} step="any" required />
              </div>
              <div className="modal-action">
                <button type="button" className="btn" onClick={closeModal}>انصراف</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <span className="loading loading-spinner loading-sm" /> : 'ویرایش'}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={closeModal} />
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteItem && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">حذف فرمول</h3>
            <p className="py-4">
              آیا از حذف فرمول <strong>{deleteItem.material_name}</strong> از <strong>{deleteItem.product_name}</strong> مطمئن هستید؟
            </p>
            <div className="modal-action">
              <button className="btn" onClick={() => setDeleteItem(null)}>انصراف</button>
              <button className="btn btn-error" onClick={handleDelete} disabled={submitting}>
                {submitting ? <span className="loading loading-spinner loading-sm" /> : 'حذف'}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setDeleteItem(null)} />
        </div>
      )}
    </div>
  );
}
