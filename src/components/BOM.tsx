"use client";
import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { formatNumber } from '@/lib/helpers';

interface Product { id: number; name: string; }
interface Material { id: number; name: string; unit: string; }
interface BomItem { id: number; material_name?: string; material_unit?: string; quantity: number; }

export default function BOM() {
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedProduct, setSelectedProduct] = useState(0);
  const [bomItems, setBomItems] = useState<BomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newMatId, setNewMatId] = useState(0);
  const [newQty, setNewQty] = useState(1);

  useEffect(() => { loadBase(); }, []);
  useEffect(() => { if (selectedProduct > 0) loadBom(); }, [selectedProduct]);

  async function loadBase() {
    const [prods, mats] = await Promise.all([
      fetch('/api/products').then(r => r.json()),
      fetch('/api/materials').then(r => r.json()),
    ]);
    setProducts(prods); setMaterials(mats);
    if (prods.length > 0) setSelectedProduct(prods[0].id);
    setLoading(false);
  }

  async function loadBom() {
    const data = await fetch(`/api/bom?product_id=${selectedProduct}`).then(r => r.json());
    setBomItems(data);
  }

  async function addBomItem() {
    if (!newMatId || newQty <= 0) return;
    await fetch('/api/bom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: selectedProduct, material_id: newMatId, quantity: newQty }),
    });
    setShowAdd(false); setNewQty(1);
    await loadBom();
  }

  async function removeBomItem(id: number) {
    await fetch('/api/bom', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setBomItems(prev => prev.filter(b => b.id !== id));
  }

  if (loading) return <div className="flex justify-center p-8"><span className="loading loading-spinner loading-lg text-primary" /></div>;

  const selProd = products.find(p => p.id === selectedProduct);

  return (
    <div className="p-4 bg-gradient-to-br from-slate-50 to-white space-y-4 h-full overflow-y-auto">
      <p className="text-sm text-base-content/60">فرمول ساخت (BOM) مشخص می\u200cکند برای تولید هر محصول چه مواد مصرفی و به چه مقدار نیاز است.</p>

      <div className="flex flex-wrap items-center gap-2">
        <select className="select select-bordered select-sm flex-1" value={selectedProduct} onChange={e => setSelectedProduct(Number(e.target.value))}>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button className="btn btn-primary btn-sm" onClick={() => { setShowAdd(true); if (materials.length > 0) setNewMatId(materials[0].id); }}>
          <Plus size={16} /> افزودن ماده
        </button>
      </div>

      {selProd && (
        <div className="card bg-white border border-base-300 shadow-sm">
          <div className="card-body p-4">
            <h3 className="card-title text-sm">مواد لازم برای: {selProd.name}</h3>
            {bomItems.length === 0 ? (
              <p className="text-base-content/60 text-sm">هنوز فرمولی تعریف نشده</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead><tr><th>ماده مصرفی</th><th>مقدار</th><th>واحد</th><th>حذف</th></tr></thead>
                  <tbody>
                    {bomItems.map(b => (
                      <tr key={b.id}>
                        <td>{b.material_name}</td>
                        <td>{formatNumber(b.quantity)}</td>
                        <td>{b.material_unit}</td>
                        <td><button className="btn btn-ghost btn-xs text-error" onClick={() => removeBomItem(b.id)}><Trash2 size={14} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {showAdd && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold mb-4">افزودن ماده به فرمول ساخت</h3>
            <div className="space-y-3">
              <select className="select select-bordered w-full select-sm" value={newMatId} onChange={e => setNewMatId(Number(e.target.value))}>
                {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
              </select>
              <input className="input input-bordered w-full input-sm" type="number" placeholder="مقدار مصرف" value={newQty} onChange={e => setNewQty(Number(e.target.value))} />
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost btn-sm" onClick={() => setShowAdd(false)}>انصراف</button>
              <button className="btn btn-primary btn-sm" onClick={addBomItem}>ذخیره</button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowAdd(false)} />
        </div>
      )}
    </div>
  );
}
