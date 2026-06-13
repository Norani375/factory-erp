'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Edit2, Trash2, X, Check, Search, Download,
  DollarSign, TrendingUp, Calendar, FileText, ChevronLeft, ChevronRight,
  Loader2, Filter
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { formatNumber, formatDate, exportToCSV, PAYMENT_METHODS } from '@/lib/helpers';

interface Expense {
  id: number;
  category: string;
  description: string;
  amount: number;
  payment_method: string;
  expense_date: string;
  notes: string;
}

interface ExpenseForm {
  category: string;
  description: string;
  amount: string;
  payment_method: string;
  expense_date: string;
  notes: string;
}

const CATEGORIES = ['اجاره', 'حقوق', 'برق', 'آب', 'گاز', 'حمل‌ونقل', 'تعمیرات', 'خرید مواد', 'خوراکه', 'تلفون', 'متفرقه'];

const PER_PAGE = 15;

const emptyForm: ExpenseForm = {
  category: '',
  description: '',
  amount: '',
  payment_method: '',
  expense_date: new Date().toISOString().split('T')[0],
  notes: '',
};

export default function Expenses() {
  const { success, error } = useToast();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ExpenseForm>({ ...emptyForm });

  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [categoryFilter, setCategoryFilter] = useState('');
  const [delId, setDelId] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/expenses?month=${monthFilter}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setExpenses(data);
    } catch {
      error('خطا در دریافت مصارف');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
    setPage(1);
  }, [monthFilter]);

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const matchSearch =
        !search ||
        e.description?.toLowerCase().includes(search.toLowerCase()) ||
        e.category?.includes(search) ||
        e.notes?.toLowerCase().includes(search.toLowerCase());
      const matchCategory = !categoryFilter || e.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [expenses, search, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter]);

  // Summary
  const totalAmount = filtered.reduce((s, e) => s + Number(e.amount), 0);
  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + Number(e.amount);
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [filtered]);

  const openAdd = () => {
    setEditId(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  };

  const openEdit = (exp: Expense) => {
    setEditId(exp.id);
    setForm({
      category: exp.category,
      description: exp.description || '',
      amount: String(exp.amount),
      payment_method: exp.payment_method || '',
      expense_date: exp.expense_date || '',
      notes: exp.notes || '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm({ ...emptyForm });
  };

  const handleSubmit = async () => {
    if (!form.category || !form.amount || !form.expense_date) {
      error('دسته، مبلغ و تاریخ الزامی است');
      return;
    }
    setSaving(true);
    try {
      const body = { ...form, amount: parseFloat(form.amount) };
      const url = '/api/expenses';
      const method = editId ? 'PUT' : 'POST';
      const payload = editId ? { ...body, id: editId } : body;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      success(editId ? 'مصرف ویرایش شد' : 'مصرف اضافه شد');
      closeForm();
      fetchExpenses();
    } catch {
      error('خطا در ذخیره مصرف');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch('/api/expenses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error();
      success('مصرف حذف شد');
      setDelId(null);
      fetchExpenses();
    } catch {
      error('خطا در حذف مصرف');
    }
  };

  const handleExport = () => {
    exportToCSV(
      filtered.map((e, i) => ({
        '#': i + 1,
        'تاریخ': e.expense_date,
        'دسته': e.category,
        'شرح': e.description,
        'مبلغ': e.amount,
        'پرداخت': e.payment_method,
        'یادداشت': e.notes,
      })),
      `expenses-${monthFilter}`
    );
    success('فایل CSV دانلود شد');
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="w-7 h-7 text-error" />
          مدیریت مصارف
        </h1>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn btn-outline btn-sm gap-1">
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button onClick={openAdd} className="btn btn-primary btn-sm gap-1">
            <Plus className="w-4 h-4" />
            مصرف جدید
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-error/10 border border-error/20">
          <div className="card-body p-4">
            <div className="flex items-center gap-3">
              <div className="bg-error/20 rounded-xl p-2">
                <DollarSign className="w-5 h-5 text-error" />
              </div>
              <div>
                <p className="text-xs opacity-60">مجموع مصارف</p>
                <p className="text-lg font-bold">{formatNumber(totalAmount)} ؋</p>
              </div>
            </div>
          </div>
        </div>
        {categoryTotals.map(([cat, total]) => (
          <div key={cat} className="card bg-base-200/50 border border-base-300">
            <div className="card-body p-4">
              <div className="flex items-center gap-3">
                <div className="bg-warning/20 rounded-xl p-2">
                  <TrendingUp className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-xs opacity-60">{cat}</p>
                  <p className="text-lg font-bold">{formatNumber(total)} ؋</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Form Card */}
      {showForm && (
        <div className="card bg-base-100 shadow-lg border border-primary/20 animate-fade-in">
          <div className="card-body p-5">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {editId ? 'ویرایش مصرف' : 'مصرف جدید'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="form-control">
                <label className="label"><span className="label-text">دسته *</span></label>
                <select
                  className="select select-bordered select-sm"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option value="">انتخاب دسته</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">شرح</span></label>
                <input
                  type="text"
                  className="input input-bordered input-sm"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="توضیح مختصر"
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">مبلغ (؋) *</span></label>
                <input
                  type="number"
                  className="input input-bordered input-sm"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">روش پرداخت</span></label>
                <select
                  className="select select-bordered select-sm"
                  value={form.payment_method}
                  onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                >
                  <option value="">انتخاب</option>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">تاریخ *</span></label>
                <input
                  type="date"
                  className="input input-bordered input-sm"
                  value={form.expense_date}
                  onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">یادداشت</span></label>
                <input
                  type="text"
                  className="input input-bordered input-sm"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="یادداشت اختیاری"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={closeForm} className="btn btn-ghost btn-sm gap-1">
                <X className="w-4 h-4" />
                لغو
              </button>
              <button onClick={handleSubmit} className="btn btn-primary btn-sm gap-1" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editId ? 'ویرایش' : 'ذخیره'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 opacity-50" />
          <input
            type="text"
            className="input input-bordered input-sm w-full pr-9"
            placeholder="جستجو در شرح، دسته، یادداشت..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-4 h-4 opacity-50" />
          <input
            type="month"
            className="input input-bordered input-sm"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1">
          <Filter className="w-4 h-4 opacity-50" />
          <select
            className="select select-bordered select-sm"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">همه دسته‌ها</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card bg-base-100 shadow border border-base-300">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : paginated.length === 0 ? (
            <div className="text-center p-12 opacity-50">
              <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>مصرفی یافت نشد</p>
            </div>
          ) : (
            <table className="table table-sm">
              <thead>
                <tr className="bg-base-200/50">
                  <th className="text-center w-12">#</th>
                  <th>تاریخ</th>
                  <th>دسته</th>
                  <th>شرح</th>
                  <th>مبلغ</th>
                  <th>پرداخت</th>
                  <th>یادداشت</th>
                  <th className="text-center">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((exp, idx) => (
                  <tr key={exp.id} className="hover">
                    <td className="text-center opacity-50">{(page - 1) * PER_PAGE + idx + 1}</td>
                    <td className="whitespace-nowrap">{formatDate(exp.expense_date)}</td>
                    <td>
                      <span className="badge badge-outline badge-sm">{exp.category}</span>
                    </td>
                    <td>{exp.description}</td>
                    <td className="font-bold text-error whitespace-nowrap">
                      {formatNumber(exp.amount)} ؋
                    </td>
                    <td>{exp.payment_method}</td>
                    <td className="max-w-[150px] truncate opacity-70">{exp.notes}</td>
                    <td className="text-center">
                      {delId === exp.id ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleDelete(exp.id)}
                            className="btn btn-error btn-xs gap-1"
                          >
                            <Check className="w-3 h-3" />
                            حذف
                          </button>
                          <button
                            onClick={() => setDelId(null)}
                            className="btn btn-ghost btn-xs"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEdit(exp)}
                            className="btn btn-ghost btn-xs"
                            title="ویرایش"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDelId(exp.id)}
                            className="btn btn-ghost btn-xs text-error"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-base-300">
            <button
              className="btn btn-ghost btn-sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-sm opacity-70">
              صفحه {page} از {totalPages}
            </span>
            <button
              className="btn btn-ghost btn-sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
