"use client";
import React, { useEffect, useState } from 'react';
import { Plus, Eye, Trash2, Search, X } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/helpers';

interface Invoice { id: number; customer_id: number; customer_name?: string; total: number; discount: number; paid: number; status: string; created_at: string; }
interface Product { id: number; name: string; quantity: number; price: number; }
interface Customer { id: number; name: string; }
interface InvoiceItem { id: number; product_name?: string; quantity: number; price: number; total: number; }

export default function Sales() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showDetail, setShowDetail] = useState<Invoice | null>(null);
  const [detailItems, setDetailItems] = useState<InvoiceItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selCustomer, setSelCustomer] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [payMethod, setPayMethod] = useState('نقد');
  const [items, setItems] = useState<{ product_id: number; quantity: number; price: number }[]>([]);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [inv, prods, custs] = await Promise.all([
      fetch('/api/invoices').then(r => r.json()),
      fetch('/api/products').then(r => r.json()),
      fetch('/api/customers').then(r => r.json()),
    ]);
    setInvoices(inv); setProducts(prods); setCustomers(custs);
    setLoading(false);
  }

  function addItem() {
    if (products.length === 0) return;
    setItems([...items, { product_id: products[0].id, quantity: 1, price: products[0].price }]);
  }
  function updateItem(idx: number, field: string, value: number) {
    const next = [...items];
    (next[idx] as any)[field] = value;
    if (field === 'product_id') { const p = products.find(pp => pp.id === value); if (p) next[idx].price = p.price; }
    setItems(next);
  }
  function removeItem(idx: number) { setItems(items.filter((_, i) => i !== idx)); }

  const itemsTotal = items.reduce((s, it) => s + it.quantity * it.price, 0);
  const grandTotal = itemsTotal - discount;

  async function saveInvoice() {
    if (!selCustomer || items.length === 0) return;
    const status = paidAmount >= grandTotal ? 'paid' : paidAmount > 0 ? 'partial' : 'pending';
    await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: selCustomer, total: itemsTotal, discount, paid: paidAmount, status, items, payMethod }),
    });
    setShowNew(false); setItems([]); setDiscount(0); setPaidAmount(0);
    await loadAll();
  }

  async function viewDetail(inv: Invoice) {
    const data = await fetch(`/api/invoices/${inv.id}`).then(r => r.json());
    setDetailItems(data);
    setShowDetail(inv);
  }

  const filtered = invoices.filter(inv => !search || (inv.customer_name || '').includes(search) || String(inv.id).includes(search));

  if (loading) return <div className="flex justify-center p-8"><span className="loading loading-spinner loading-lg text-primary" /></div>;

  return (
    <div className="p-4 bg-gradient-to-br from-slate-50 to-white space-y-3 h-full overflow-y-auto">
      <div className="flex flex-wrap items-center gap-2">
        <label className="input input-bordered input-sm flex items-center gap-2 flex-1 min-w-48">
          <Search className="h-[1em] opacity-50" />
          <input className="grow" placeholder="جستجو فاکتور..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <X className="h-[1em] opacity-50 cursor-pointer" onClick={() => setSearch('')} />}
        </label>
        <button className="btn btn-primary btn-sm" onClick={() => { setShowNew(true); setItems([]); setDiscount(0); setPaidAmount(0); setSelCustomer(customers[0]?.id || 0); }}>
          <Plus size={16} /> فاکتور جدید
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="table table-zebra table-sm">
          <thead><tr><th>#</th><th>مشتری</th><th>مبلغ کل</th><th>تخفیف</th><th>پرداخت شده</th><th>مانده</th><th>وضعیت</th><th>تاریخ</th><th>عملیات</th></tr></thead>
          <tbody>
            {filtered.map(inv => (
              <tr key={inv.id}>
                <td>{inv.id}</td>
                <td>{inv.customer_name}</td>
                <td>{formatCurrency(inv.total)}</td>
                <td>{inv.discount > 0 ? formatCurrency(inv.discount) : '-'}</td>
                <td>{formatCurrency(inv.paid)}</td>
                <td className={inv.total - inv.discount - inv.paid > 0 ? 'text-error' : ''}>{formatCurrency(inv.total - inv.discount - inv.paid)}</td>
                <td>
                  <span className={`badge badge-sm ${inv.status === 'paid' ? 'badge-success' : inv.status === 'partial' ? 'badge-warning' : 'badge-error'}`}>
                    {inv.status === 'paid' ? 'تسویه' : inv.status === 'partial' ? 'ناقص' : 'بدهکار'}
                  </span>
                </td>
                <td>{formatDate(inv.created_at)}</td>
                <td><button className="btn btn-ghost btn-xs" onClick={() => viewDetail(inv)}><Eye size={14} /></button></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={9} className="text-center text-base-content/60">فاکتوری ثبت نشده</td></tr>}
          </tbody>
        </table>
      </div>

      {showNew && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold mb-4">فاکتور جدید</h3>
            <div className="space-y-3">
              <select className="select select-bordered w-full select-sm" value={selCustomer} onChange={e => setSelCustomer(Number(e.target.value))}>
                <option value={0}>انتخاب مشتری...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="divider text-xs">اقلام فاکتور</div>
              {items.map((it, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select className="select select-bordered select-xs flex-1" value={it.product_id} onChange={e => updateItem(idx, 'product_id', Number(e.target.value))}>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} (موجودی: {p.quantity})</option>)}
                  </select>
                  <input className="input input-bordered input-xs w-16" type="number" min={1} value={it.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} />
                  <input className="input input-bordered input-xs w-24" type="number" value={it.price} onChange={e => updateItem(idx, 'price', Number(e.target.value))} />
                  <span className="text-xs w-24">{formatCurrency(it.quantity * it.price)}</span>
                  <button className="btn btn-ghost btn-xs text-error" onClick={() => removeItem(idx)}><Trash2 size={14} /></button>
                </div>
              ))}
              <button className="btn btn-outline btn-xs" onClick={addItem}><Plus size={14} /> افزودن قلم</button>
              <div className="divider text-xs">محاسبات</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>جمع اقلام: <strong>{formatCurrency(itemsTotal)}</strong></div>
                <div><label className="text-xs text-base-content/60">تخفیف:</label><input className="input input-bordered input-xs w-full" type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} /></div>
                <div>مبلغ نهایی: <strong className="text-primary">{formatCurrency(grandTotal)}</strong></div>
                <div><label className="text-xs text-base-content/60">مبلغ پرداختی:</label><input className="input input-bordered input-xs w-full" type="number" value={paidAmount} onChange={e => setPaidAmount(Number(e.target.value))} /></div>
              </div>
              <select className="select select-bordered select-xs" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                <option value="نقد">نقد</option><option value="چک">چک</option><option value="کارت">کارت</option><option value="انتقال بانکی">انتقال بانکی</option>
              </select>
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowNew(false)}>انصراف</button>
              <button className="btn btn-primary btn-sm" onClick={saveInvoice} disabled={!selCustomer || items.length === 0}>ثبت فاکتور</button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowNew(false)} />
        </div>
      )}

      {showDetail && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg">
            <h3 className="font-bold mb-2">فاکتور #{showDetail.id}</h3>
            <p className="text-sm text-base-content/60">مشتری: {showDetail.customer_name} | تاریخ: {formatDate(showDetail.created_at)}</p>
            <table className="table table-sm mt-3">
              <thead><tr><th>محصول</th><th>تعداد</th><th>قیمت</th><th>جمع</th></tr></thead>
              <tbody>
                {detailItems.map((it, i) => (
                  <tr key={i}><td>{it.product_name}</td><td>{it.quantity}</td><td>{formatCurrency(it.price)}</td><td>{formatCurrency(it.total)}</td></tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td colSpan={3} className="text-left font-bold">جمع کل:</td><td>{formatCurrency(showDetail.total)}</td></tr>
                {showDetail.discount > 0 && <tr><td colSpan={3} className="text-left">تخفیف:</td><td>{formatCurrency(showDetail.discount)}</td></tr>}
                <tr><td colSpan={3} className="text-left font-bold">پرداخت شده:</td><td>{formatCurrency(showDetail.paid)}</td></tr>
                <tr><td colSpan={3} className="text-left font-bold text-error">مانده:</td><td className="text-error">{formatCurrency(showDetail.total - showDetail.discount - showDetail.paid)}</td></tr>
              </tfoot>
            </table>
            <div className="modal-action">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowDetail(null)}>بستن</button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowDetail(null)} />
        </div>
      )}
    </div>
  );
}
