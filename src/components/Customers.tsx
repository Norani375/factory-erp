'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Users, X } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { formatCurrency, formatNumber } from '@/lib/helpers';

interface Customer {
  id: number;
  name: string;
  phone: string;
  address: string;
  balance: number;
  created_at: string;
}

interface CustomerForm {
  name: string;
  phone: string;
  address: string;
}

const emptyForm: CustomerForm = { name: '', phone: '', address: '' };

export default function Customers() {
  const { success, error } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/customers');
      if (!res.ok) throw new Error('خطا در دریافت مشتریان');
      const data = await res.json();
      setCustomers(data);
    } catch (e: any) {
      error(e.message || 'خطا در دریافت مشتریان');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const filtered = customers.filter(c =>
    !search || c.name.includes(search) || c.phone?.includes(search) || c.address?.includes(search)
  );

  const totalCustomers = customers.length;
  const totalBalance = customers.reduce((s, c) => s + (c.balance || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editCustomer) {
        const res = await fetch('/api/customers', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editCustomer.id, ...form }),
        });
        if (!res.ok) throw new Error('خطا در ویرایش مشتری');
        success('مشتری با موفقیت ویرایش شد');
        setEditCustomer(null);
      } else {
        const res = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error('خطا در افزودن مشتری');
        success('مشتری با موفقیت اضافه شد');
        setShowAddModal(false);
      }
      setForm(emptyForm);
      fetchCustomers();
    } catch (e: any) {
      error(e.message || 'خطا در عملیات');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCustomer) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteCustomer.id }),
      });
      if (!res.ok) throw new Error('خطا در حذف مشتری');
      success('مشتری با موفقیت حذف شد');
      setDeleteCustomer(null);
      fetchCustomers();
    } catch (e: any) {
      error(e.message || 'خطا در حذف');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (c: Customer) => {
    setForm({ name: c.name, phone: c.phone, address: c.address });
    setEditCustomer(c);
  };

  const openAdd = () => {
    setForm(emptyForm);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditCustomer(null);
    setForm(emptyForm);
  };

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-control">
        <label className="label"><span className="label-text">نام مشتری</span></label>
        <input type="text" className="input input-bordered w-full" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label"><span className="label-text">تلفن</span></label>
          <input type="text" className="input input-bordered w-full" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text">آدرس</span></label>
          <input type="text" className="input input-bordered w-full" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
        </div>
      </div>
      <div className="modal-action">
        <button type="button" className="btn" onClick={closeModal}>انصراف</button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? <span className="loading loading-spinner loading-sm" /> : editCustomer ? 'ویرایش' : 'افزودن'}
        </button>
      </div>
    </form>
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card bg-base-100 shadow-md animate-fade-in">
          <div className="card-body flex-row items-center gap-4 p-4">
            <div className="bg-primary/10 p-3 rounded-xl"><Users className="w-6 h-6 text-primary" /></div>
            <div>
              <div className="text-sm opacity-60">تعداد کل مشتریان</div>
              <div className="text-2xl font-bold">{formatNumber(totalCustomers)}</div>
            </div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-md animate-fade-in">
          <div className="card-body flex-row items-center gap-4 p-4">
            <div className={`${totalBalance > 0 ? 'bg-error/10' : 'bg-success/10'} p-3 rounded-xl`}>
              <Users className={`w-6 h-6 ${totalBalance > 0 ? 'text-error' : 'text-success'}`} />
            </div>
            <div>
              <div className="text-sm opacity-60">مجموع بدهی‌ها</div>
              <div className={`text-2xl font-bold ${totalBalance > 0 ? 'text-error' : ''}`}>{formatCurrency(totalBalance)}</div>
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
          <Plus className="w-4 h-4" /> افزودن مشتری
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
                <th>تلفن</th>
                <th>آدرس</th>
                <th>بدهی</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8"><span className="loading loading-spinner loading-md" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 opacity-50">مشتری‌ای یافت نشد</td></tr>
              ) : filtered.map((c, i) => (
                <tr key={c.id} className="hover">
                  <td>{formatNumber(i + 1)}</td>
                  <td className="font-medium">{c.name}</td>
                  <td>{c.phone || '—'}</td>
                  <td>{c.address || '—'}</td>
                  <td className={c.balance > 0 ? 'text-error font-bold' : 'text-success'}>{formatCurrency(c.balance || 0)}</td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-ghost btn-xs" onClick={() => openEdit(c)}><Edit2 className="w-4 h-4" /></button>
                      <button className="btn btn-ghost btn-xs text-error" onClick={() => setDeleteCustomer(c)}><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editCustomer) && (
        <div className="modal modal-open">
          <div className="modal-box">
            <button className="btn btn-sm btn-circle btn-ghost absolute left-2 top-2" onClick={closeModal}><X className="w-4 h-4" /></button>
            <h3 className="font-bold text-lg mb-4">{editCustomer ? 'ویرایش مشتری' : 'افزودن مشتری جدید'}</h3>
            {renderForm()}
          </div>
          <div className="modal-backdrop" onClick={closeModal} />
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteCustomer && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">حذف مشتری</h3>
            <p className="py-4">آیا از حذف <strong>{deleteCustomer.name}</strong> مطمئن هستید؟</p>
            <div className="modal-action">
              <button className="btn" onClick={() => setDeleteCustomer(null)}>انصراف</button>
              <button className="btn btn-error" onClick={handleDelete} disabled={submitting}>
                {submitting ? <span className="loading loading-spinner loading-sm" /> : 'حذف'}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setDeleteCustomer(null)} />
        </div>
      )}
    </div>
  );
}
