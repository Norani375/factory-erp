'use client';

import { useState, useEffect } from 'react';
import {
  Plus, Search, Eye, Edit2, Trash2, Printer, X,
  ShoppingCart, DollarSign, AlertCircle, FileText
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { formatCurrency, formatNumber, formatDate } from '@/lib/helpers';

interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface Customer {
  id: number;
  name: string;
  phone?: string;
}

interface InvoiceItem {
  product_id: number;
  product_name?: string;
  quantity: number;
  price: number;
  total?: number;
}

interface Invoice {
  id: number;
  invoice_number: string;
  customer_id: number;
  customer_name?: string;
  date: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  remaining: number;
  status: string;
  notes?: string;
}

type ModalMode = 'new' | 'edit';

export default function Sales() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('new');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const { success, error: toastError } = useToast();

  // Form state
  const [formCustomerId, setFormCustomerId] = useState<number>(0);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formItems, setFormItems] = useState<InvoiceItem[]>([{ product_id: 0, quantity: 1, price: 0 }]);
  const [formDiscount, setFormDiscount] = useState(0);
  const [formPaid, setFormPaid] = useState(0);
  const [formNotes, setFormNotes] = useState('');

  useEffect(() => {
    fetchInvoices();
    fetchProducts();
    fetchCustomers();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/invoices');
      if (!res.ok) throw new Error('خطا در دریافت فاکتورها');
      const data = await res.json();
      // Transform API data to match component expectations
      const transformed = data.map((inv: any) => ({
        ...inv,
        invoice_number: inv.invoice_number || `INV-${inv.id}`,
        date: inv.date || inv.created_at,
        subtotal: Number(inv.total) || 0,
        discount: Number(inv.discount) || 0,
        paid: Number(inv.paid) || 0,
        total: Number(inv.total) || 0,
        remaining: (Number(inv.total) || 0) - (Number(inv.discount) || 0) - (Number(inv.paid) || 0),
      }));
      setInvoices(transformed);
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch {}
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch {}
  };

  const resetForm = () => {
    setFormCustomerId(0);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormItems([{ product_id: 0, quantity: 1, price: 0 }]);
    setFormDiscount(0);
    setFormPaid(0);
    setFormNotes('');
  };

  const openNew = () => {
    resetForm();
    setModalMode('new');
    setShowModal(true);
  };

  const openEdit = (inv: Invoice) => {
    setModalMode('edit');
    setSelectedInvoice(inv);
    setFormCustomerId(inv.customer_id);
    setFormDate(inv.date?.split('T')[0] || new Date().toISOString().split('T')[0]);
    setFormItems(
      inv.items.map(it => ({
        product_id: it.product_id,
        quantity: it.quantity,
        price: it.price,
      }))
    );
    setFormDiscount(inv.discount || 0);
    setFormPaid(inv.paid || 0);
    setFormNotes(inv.notes || '');
    setShowModal(true);
  };

  const openDetail = async (inv: Invoice) => {
    try {
      const res = await fetch(`/api/invoices/${inv.id}`);
      if (!res.ok) throw new Error('خطا در دریافت جزئیات');
      const items = await res.json();
      // API returns items array; combine with invoice data
      const subtotal = items.reduce((s: number, it: any) => s + (Number(it.quantity) * Number(it.price)), 0);
      setSelectedInvoice({
        ...inv,
        items: items,
        subtotal: subtotal,
        total: Number(inv.total) || 0,
        discount: Number(inv.discount) || 0,
        paid: Number(inv.paid) || 0,
        remaining: (Number(inv.total) || 0) - (Number(inv.discount) || 0) - (Number(inv.paid) || 0),
      });
      setShowDetail(true);
    } catch (err: any) {
      toastError(err.message);
    }
  };

  const addItem = () => {
    setFormItems([...formItems, { product_id: 0, quantity: 1, price: 0 }]);
  };

  const removeItem = (index: number) => {
    if (formItems.length === 1) return;
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: number) => {
    const updated = [...formItems];
    (updated[index] as any)[field] = value;
    // Auto-fill price from product
    if (field === 'product_id' && value > 0) {
      const prod = products.find(p => p.id === value);
      if (prod) updated[index].price = prod.price;
    }
    setFormItems(updated);
  };

  const subtotal = formItems.reduce((sum, it) => sum + it.quantity * it.price, 0);
  const total = subtotal - formDiscount;
  const remaining = total - formPaid;

  const handleSave = async () => {
    if (!formCustomerId) {
      toastError('لطفا مشتری را انتخاب کنید');
      return;
    }
    if (formItems.some(it => !it.product_id || it.quantity <= 0)) {
      toastError('لطفا اقلام فاکتور را کامل کنید');
      return;
    }

    setSaving(true);
    try {
      const itemsData = formItems.map(it => ({
          product_id: it.product_id,
          quantity: it.quantity,
          price: it.price,
        }));
      const calcTotal = itemsData.reduce((s, it) => s + it.quantity * it.price, 0);
      const calcRemaining = calcTotal - formDiscount - formPaid;
      const calcStatus = formPaid >= calcTotal - formDiscount ? 'paid' : formPaid > 0 ? 'partial' : 'unpaid';
      const body = {
        customer_id: formCustomerId,
        total: calcTotal,
        items: itemsData,
        discount: formDiscount,
        paid: formPaid,
        status: calcStatus,
        notes: formNotes,
      };

      const url = modalMode === 'new' ? '/api/invoices' : `/api/invoices/${selectedInvoice?.id}`;
      const method = modalMode === 'new' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'خطا در ذخیره فاکتور');
      }

      success(modalMode === 'new' ? 'فاکتور با موفقیت ایجاد شد' : 'فاکتور با موفقیت ویرایش شد');
      setShowModal(false);
      fetchInvoices();
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (id: number) => {
    setDeleteId(id);
    setShowConfirmDelete(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/invoices/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('خطا در حذف فاکتور');
      success('فاکتور با موفقیت حذف شد');
      setShowConfirmDelete(false);
      setDeleteId(null);
      fetchInvoices();
    } catch (err: any) {
      toastError(err.message);
    }
  };

  const printInvoice = (inv: Invoice) => {
    const itemsHtml = (inv.items || []).map((it, i) => `
      <tr>
        <td style="border:1px solid #ddd;padding:6px;text-align:center">${i + 1}</td>
        <td style="border:1px solid #ddd;padding:6px;text-align:right">${it.product_name || 'محصول ' + it.product_id}</td>
        <td style="border:1px solid #ddd;padding:6px;text-align:center">${it.quantity}</td>
        <td style="border:1px solid #ddd;padding:6px;text-align:left">${Number(it.price).toLocaleString()} ؋</td>
        <td style="border:1px solid #ddd;padding:6px;text-align:left">${(it.quantity * it.price).toLocaleString()} ؋</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="UTF-8">
        <title>فاکتور ${inv.invoice_number}</title>
        <style>
          body { font-family: Tahoma, Arial, sans-serif; padding: 20px; color: #333; max-width: 800px; margin: 0 auto; }
          h1 { text-align: center; color: #2563eb; margin-bottom: 4px; }
          .subtitle { text-align: center; color: #666; margin-bottom: 24px; }
          .info { display: flex; justify-content: space-between; margin-bottom: 16px; padding: 12px; background: #f9fafb; border-radius: 8px; }
          .info div { font-size: 14px; }
          .info strong { color: #111; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          th { background: #2563eb; color: white; padding: 8px; text-align: center; }
          .totals { margin-top: 12px; text-align: left; }
          .totals div { padding: 4px 0; font-size: 14px; }
          .totals .grand { font-size: 18px; font-weight: bold; color: #2563eb; border-top: 2px solid #2563eb; padding-top: 8px; margin-top: 8px; }
          .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 12px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>نجاری ERP</h1>
        <p class="subtitle">فاکتور فروش</p>
        <div class="info">
          <div><strong>شماره فاکتور:</strong> ${inv.invoice_number}</div>
          <div><strong>تاریخ:</strong> ${formatDate(inv.date)}</div>
          <div><strong>مشتری:</strong> ${inv.customer_name || '-'}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width:40px">#</th>
              <th>محصول</th>
              <th style="width:60px">تعداد</th>
              <th style="width:100px">قیمت واحد</th>
              <th style="width:100px">مجموع</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div class="totals">
          <div>جمع کل: ${Number(inv.subtotal).toLocaleString()} ؋</div>
          <div>تخفیف: ${Number(inv.discount || 0).toLocaleString()} ؋</div>
          <div class="grand">مبلغ قابل پرداخت: ${Number(inv.total).toLocaleString()} ؋</div>
          <div>پرداخت شده: ${Number(inv.paid || 0).toLocaleString()} ؋</div>
          <div>باقیمانده: ${Number(inv.remaining || 0).toLocaleString()} ؋</div>
        </div>
        <div class="footer">نجاری ERP - سیستم مدیریت نجاری</div>
      </body>
      </html>
    `;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.setTimeout(() => win.print(), 500);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="badge badge-success badge-sm gap-1">پرداخت شده</span>;
      case 'partial':
        return <span className="badge badge-warning badge-sm gap-1">ناقص</span>;
      case 'unpaid':
        return <span className="badge badge-error badge-sm gap-1">پرداخت نشده</span>;
      default:
        return <span className="badge badge-ghost badge-sm">{status}</span>;
    }
  };

  const filtered = invoices.filter(inv =>
    (inv.invoice_number || '').includes(search) ||
    (inv.customer_name || '').includes(search)
  );

  const totalSales = filtered.reduce((s, i) => s + (i.total || 0), 0);
  const totalReceived = filtered.reduce((s, i) => s + (i.paid || 0), 0);
  const totalRemaining = filtered.reduce((s, i) => s + (i.remaining || 0), 0);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card bg-base-100 shadow-sm animate-fade-in">
          <div className="card-body p-3 flex-row items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ShoppingCart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-base-content/60">مجموع فروش</p>
              <p className="font-bold text-primary">{formatCurrency(totalSales)}</p>
            </div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-sm animate-fade-in">
          <div className="card-body p-3 flex-row items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <DollarSign className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-base-content/60">مجموع دریافتی</p>
              <p className="font-bold text-success">{formatCurrency(totalReceived)}</p>
            </div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-sm animate-fade-in">
          <div className="card-body p-3 flex-row items-center gap-3">
            <div className="p-2 rounded-lg bg-error/10">
              <AlertCircle className="w-5 h-5 text-error" />
            </div>
            <div>
              <p className="text-xs text-base-content/60">مجموع باقیمانده</p>
              <p className="font-bold text-error">{formatCurrency(totalRemaining)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="join w-full sm:w-auto">
          <div className="join-item flex items-center px-3 bg-base-200">
            <Search className="w-4 h-4 text-base-content/50" />
          </div>
          <input
            type="text"
            placeholder="جستجو شماره فاکتور یا مشتری..."
            className="input input-bordered join-item w-full sm:w-72"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-primary gap-2 w-full sm:w-auto" onClick={openNew}>
          <Plus className="w-4 h-4" />
          فاکتور جدید
        </button>
      </div>

      {/* Invoices Table */}
      <div className="card bg-base-100 shadow-md">
        <div className="card-body p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-md"></span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-base-content/50">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>فاکتوری یافت نشد</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>شماره</th>
                    <th>مشتری</th>
                    <th>تاریخ</th>
                    <th>مبلغ کل</th>
                    <th>پرداختی</th>
                    <th>باقیمانده</th>
                    <th>وضعیت</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(inv => (
                    <tr key={inv.id} className="hover">
                      <td className="font-mono text-sm">{inv.invoice_number}</td>
                      <td>{inv.customer_name}</td>
                      <td className="text-sm">{formatDate(inv.date)}</td>
                      <td className="font-medium">{formatCurrency(inv.total)}</td>
                      <td>{formatCurrency(inv.paid)}</td>
                      <td className={inv.remaining > 0 ? 'text-error font-medium' : ''}>
                        {formatCurrency(inv.remaining)}
                      </td>
                      <td>{getStatusBadge(inv.status)}</td>
                      <td>
                        <div className="flex gap-1">
                          <button
                            className="btn btn-ghost btn-xs tooltip"
                            data-tip="مشاهده"
                            onClick={() => openDetail(inv)}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className="btn btn-ghost btn-xs tooltip"
                            data-tip="ویرایش"
                            onClick={() => openEdit(inv)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            className="btn btn-ghost btn-xs text-error tooltip"
                            data-tip="حذف"
                            onClick={() => confirmDelete(inv.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* New/Edit Modal */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl">
            <button className="btn btn-sm btn-circle btn-ghost absolute left-2 top-2" onClick={() => setShowModal(false)}>
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-bold text-lg mb-4">
              {modalMode === 'new' ? 'فاکتور جدید' : 'ویرایش فاکتور'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="form-control">
                <label className="label"><span className="label-text">مشتری</span></label>
                <select
                  className="select select-bordered"
                  value={formCustomerId}
                  onChange={e => setFormCustomerId(Number(e.target.value))}
                >
                  <option value={0}>انتخاب مشتری...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">تاریخ</span></label>
                <input
                  type="date"
                  className="input input-bordered"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                />
              </div>
            </div>

            {/* Items */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="label-text font-medium">اقلام فاکتور</label>
                <button className="btn btn-sm btn-ghost gap-1" onClick={addItem}>
                  <Plus className="w-3 h-3" /> افزودن
                </button>
              </div>
              <div className="space-y-2">
                {formItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-end">
                    <div className="form-control flex-1">
                      {idx === 0 && <label className="label py-0"><span className="label-text text-xs">محصول</span></label>}
                      <select
                        className="select select-bordered select-sm"
                        value={item.product_id}
                        onChange={e => updateItem(idx, 'product_id', Number(e.target.value))}
                      >
                        <option value={0}>انتخاب...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-control w-20">
                      {idx === 0 && <label className="label py-0"><span className="label-text text-xs">تعداد</span></label>}
                      <input
                        type="number"
                        className="input input-bordered input-sm"
                        min={1}
                        value={item.quantity}
                        onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                      />
                    </div>
                    <div className="form-control w-28">
                      {idx === 0 && <label className="label py-0"><span className="label-text text-xs">قیمت</span></label>}
                      <input
                        type="number"
                        className="input input-bordered input-sm"
                        min={0}
                        value={item.price}
                        onChange={e => updateItem(idx, 'price', Number(e.target.value))}
                      />
                    </div>
                    <div className="w-24 text-sm text-left font-medium pt-1">
                      {formatCurrency(item.quantity * item.price)}
                    </div>
                    <button
                      className="btn btn-ghost btn-sm btn-square text-error"
                      onClick={() => removeItem(idx)}
                      disabled={formItems.length === 1}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="form-control">
                <label className="label"><span className="label-text text-xs">جمع</span></label>
                <input type="text" className="input input-bordered input-sm bg-base-200" value={formatCurrency(subtotal)} readOnly />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text text-xs">تخفیف</span></label>
                <input
                  type="number"
                  className="input input-bordered input-sm"
                  min={0}
                  value={formDiscount}
                  onChange={e => setFormDiscount(Number(e.target.value))}
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text text-xs">پرداختی</span></label>
                <input
                  type="number"
                  className="input input-bordered input-sm"
                  min={0}
                  value={formPaid}
                  onChange={e => setFormPaid(Number(e.target.value))}
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text text-xs">باقیمانده</span></label>
                <input
                  type="text"
                  className={`input input-bordered input-sm bg-base-200 ${remaining > 0 ? 'text-error' : 'text-success'}`}
                  value={formatCurrency(remaining)}
                  readOnly
                />
              </div>
            </div>

            <div className="form-control mb-4">
              <label className="label"><span className="label-text">یادداشت</span></label>
              <textarea
                className="textarea textarea-bordered"
                rows={2}
                value={formNotes}
                onChange={e => setFormNotes(e.target.value)}
                placeholder="یادداشت اختیاری..."
              />
            </div>

            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>انصراف</button>
              <button className="btn btn-primary gap-2" onClick={handleSave} disabled={saving}>
                {saving && <span className="loading loading-spinner loading-xs"></span>}
                {modalMode === 'new' ? 'ذخیره' : 'بروزرسانی'}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowModal(false)} />
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && selectedInvoice && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <button className="btn btn-sm btn-circle btn-ghost absolute left-2 top-2" onClick={() => setShowDetail(false)}>
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-bold text-lg mb-4">جزئیات فاکتور {selectedInvoice.invoice_number}</h3>

            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div><span className="text-base-content/60">مشتری:</span> <strong>{selectedInvoice.customer_name}</strong></div>
              <div><span className="text-base-content/60">تاریخ:</span> <strong>{formatDate(selectedInvoice.date)}</strong></div>
              <div><span className="text-base-content/60">وضعیت:</span> {getStatusBadge(selectedInvoice.status)}</div>
              <div><span className="text-base-content/60">شماره:</span> <strong className="font-mono">{selectedInvoice.invoice_number}</strong></div>
            </div>

            <div className="overflow-x-auto mb-4">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>محصول</th>
                    <th>تعداد</th>
                    <th>قیمت واحد</th>
                    <th>مجموع</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedInvoice.items || []).map((it, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>{it.product_name || 'محصول ' + it.product_id}</td>
                      <td>{formatNumber(it.quantity)}</td>
                      <td>{formatCurrency(it.price)}</td>
                      <td className="font-medium">{formatCurrency(it.quantity * it.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-base-200 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span>جمع کل:</span> <span className="font-medium">{formatCurrency(selectedInvoice.subtotal)}</span></div>
              <div className="flex justify-between"><span>تخفیف:</span> <span>{formatCurrency(selectedInvoice.discount || 0)}</span></div>
              <div className="divider my-1"></div>
              <div className="flex justify-between font-bold text-base"><span>مبلغ نهایی:</span> <span className="text-primary">{formatCurrency(selectedInvoice.total)}</span></div>
              <div className="flex justify-between"><span>پرداخت شده:</span> <span className="text-success">{formatCurrency(selectedInvoice.paid || 0)}</span></div>
              <div className="flex justify-between"><span>باقیمانده:</span> <span className={selectedInvoice.remaining > 0 ? 'text-error font-medium' : 'text-success'}>{formatCurrency(selectedInvoice.remaining || 0)}</span></div>
            </div>

            {selectedInvoice.notes && (
              <div className="mt-3 text-sm text-base-content/70">
                <span className="font-medium">یادداشت:</span> {selectedInvoice.notes}
              </div>
            )}

            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowDetail(false)}>بستن</button>
              <button
                className="btn btn-outline btn-info gap-2"
                onClick={() => printInvoice(selectedInvoice)}
              >
                <Printer className="w-4 h-4" />
                چاپ
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowDetail(false)} />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm">
            <h3 className="font-bold text-lg mb-2">تأیید حذف</h3>
            <p className="text-base-content/70">آیا از حذف این فاکتور مطمئن هستید؟ این عمل قابل بازگشت نیست.</p>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => { setShowConfirmDelete(false); setDeleteId(null); }}>انصراف</button>
              <button className="btn btn-error gap-2" onClick={handleDelete}>
                <Trash2 className="w-4 h-4" />
                حذف
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => { setShowConfirmDelete(false); setDeleteId(null); }} />
        </div>
      )}
    </div>
  );
}
