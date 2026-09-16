import { useState, useMemo } from 'react';
import { Warehouse, Search, PackageMinus, PackagePlus, Minus, Plus } from 'lucide-react';
import {
  Card, PageHeader, EmptyState, SearchInput, Select, PrimaryButton, GhostButton,
  Field, Modal, inputStyle, inputClass, useToast,
} from '../../components/admin/ui/AdminUI';
import { useProducts } from '../../context/ProductContext';
import { useAdminData } from '../../context/AdminDataContext';

export default function AdminInventoryPage() {
  const { products, updateStock } = useProducts();
  const { addActivityLog } = useAdminData();
  const { pushToast, ToastViewport } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [adjusting, setAdjusting] = useState(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustNote, setAdjustNote] = useState('');

  const variants = useMemo(
    () =>
      products
        .filter((p) => p.trackStock !== false)
        .map((p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku || '',
          variant: p.sizes?.length ? p.sizes.join(' / ') : 'One size',
          available: Number(p.stock) || 0,
          reserved: 0, // No reservation system yet — real data only.
          threshold: Number(p.lowStockThreshold) || 5,
          image: p.image,
        })),
    [products]
  );

  const filtered = useMemo(() => {
    let list = variants;
    const q = searchTerm.trim().toLowerCase();
    if (q) list = list.filter((v) => v.name.toLowerCase().includes(q) || v.sku.toLowerCase().includes(q));
    if (statusFilter === 'in') list = list.filter((v) => v.available > v.threshold);
    if (statusFilter === 'low') list = list.filter((v) => v.available > 0 && v.available <= v.threshold);
    if (statusFilter === 'out') list = list.filter((v) => v.available === 0);
    return list;
  }, [variants, searchTerm, statusFilter]);

  const counts = {
    all: variants.length,
    in: variants.filter((v) => v.available > v.threshold).length,
    low: variants.filter((v) => v.available > 0 && v.available <= v.threshold).length,
    out: variants.filter((v) => v.available === 0).length,
  };

  const openAdjust = (v) => {
    setAdjusting(v);
    setAdjustQty(v.available);
    setAdjustNote('');
  };

  const submitAdjust = () => {
    updateStock(adjusting.id, Number(adjustQty) || 0);
    addActivityLog('Stock Adjusted', `${adjusting.name}: stock set to ${adjustQty}. ${adjustNote}`);
    pushToast(`Stock updated for "${adjusting.name}".`);
    setAdjusting(null);
  };

  const statusBadge = (v) => {
    if (v.available === 0) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(169,74,90,0.1)', color: '#A94A5A' }}>Out of stock</span>;
    if (v.available <= v.threshold) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(217,119,6,0.12)', color: '#d97706' }}>Low stock</span>;
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(22,163,74,0.12)', color: '#16a34a' }}>In stock</span>;
  };

  return (
    <div className="space-y-5">
      {ToastViewport}
      <PageHeader
        title="Inventory"
        subtitle="Track stock levels and adjust quantities for every product"
        breadcrumb={['Operations', 'Inventory']}
      />

      {variants.length === 0 ? (
        <Card>
          <EmptyState
            icon={Warehouse}
            title="No inventory data available yet"
            description={
              products.length === 0
                ? 'Inventory tracking starts once you add products with stock levels to your catalog.'
                : 'All products have stock tracking disabled. Enable "Track stock" on a product to manage it here.'
            }
          />
        </Card>
      ) : (
        <>
          {/* Filters */}
          <Card className="flex flex-col md:flex-row md:items-center gap-3">
            <SearchInput
              className="flex-1"
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by product name or SKU..."
              ariaLabel="Search inventory"
            />
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { key: 'all', label: `All (${counts.all})` },
                { key: 'in', label: `In stock (${counts.in})` },
                { key: 'low', label: `Low (${counts.low})` },
                { key: 'out', label: `Out (${counts.out})` },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setStatusFilter(t.key)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${statusFilter === t.key ? 'text-white' : ''}`}
                  style={statusFilter === t.key
                    ? { background: '#A94A5A' }
                    : { border: '1px solid var(--admin-border-soft)', color: 'var(--admin-text-muted)' }}
                  aria-pressed={statusFilter === t.key}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Table */}
          <Card padded={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[720px]">
                <thead>
                  <tr
                    className="text-[9px] uppercase font-bold tracking-[0.14em]"
                    style={{ borderBottom: '1px solid var(--admin-border-soft)', color: 'var(--admin-text-muted)', background: 'var(--admin-surface-2)' }}
                  >
                    <th className="py-3.5 px-4">Product</th>
                    <th className="py-3.5 px-4">Variant</th>
                    <th className="py-3.5 px-4">SKU</th>
                    <th className="py-3.5 px-4 text-center">Available</th>
                    <th className="py-3.5 px-4 text-center">Reserved</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((v) => (
                    <tr
                      key={v.id}
                      className="text-xs transition-colors hover:bg-black/[0.03] dark:hover:bg-white/5"
                      style={{ borderBottom: '1px solid var(--admin-border-soft)' }}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-10 rounded-lg overflow-hidden shrink-0" style={{ background: 'var(--admin-surface-2)' }}>
                            {v.image && <img src={v.image} alt="" className="w-full h-full object-cover" />}
                          </div>
                          <p className="font-bold truncate max-w-[200px]" style={{ color: 'var(--admin-text)' }}>{v.name}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[11px]" style={{ color: 'var(--admin-text-muted)' }}>{v.variant}</td>
                      <td className="py-3 px-4 font-mono text-[10px]" style={{ color: 'var(--admin-text-muted)' }}>{v.sku || '—'}</td>
                      <td className="py-3 px-4 text-center font-bold font-numeric" style={{ color: 'var(--admin-text)' }}>{v.available}</td>
                      <td className="py-3 px-4 text-center font-numeric" style={{ color: 'var(--admin-text-faint)' }}>{v.reserved}</td>
                      <td className="py-3 px-4">{statusBadge(v)}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openAdjust(v)}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-1.5 ml-auto"
                          style={{ border: '1px solid var(--admin-border-soft)', color: 'var(--admin-text)' }}
                        >
                          <Plus size={11} /> Adjust
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-xs" style={{ color: 'var(--admin-text-muted)' }}>
                        No inventory rows match your search or filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Quick stats strip */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Tracked SKUs', value: counts.all, icon: PackagePlus },
              { label: 'Low stock', value: counts.low, icon: PackageMinus },
              { label: 'Out of stock', value: counts.out, icon: Warehouse },
            ].map((s) => (
              <Card key={s.label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--admin-red-dim)' }}>
                  <s.icon size={15} style={{ color: '#A94A5A' }} />
                </div>
                <div>
                  <p className="text-lg font-bold font-numeric leading-none" style={{ color: 'var(--admin-text)' }}>{s.value}</p>
                  <p className="text-[10px] mt-1" style={{ color: 'var(--admin-text-muted)' }}>{s.label}</p>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Adjust modal */}
      <Modal open={!!adjusting} onClose={() => setAdjusting(null)} title="Adjust Stock" width="max-w-sm">
        <div className="p-5 space-y-4">
          <p className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>
            Set the available stock for <strong style={{ color: 'var(--admin-text)' }}>{adjusting?.name}</strong>.
          </p>
          <Field label="Available Stock" htmlFor="adj-qty">
            <input
              id="adj-qty"
              type="number"
              min="0"
              value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)}
              className={inputClass}
              style={inputStyle}
            />
          </Field>
          <Field label="Note (optional)" htmlFor="adj-note">
            <input
              id="adj-note"
              type="text"
              value={adjustNote}
              onChange={(e) => setAdjustNote(e.target.value)}
              placeholder="e.g. Restock from supplier"
              className={inputClass}
              style={inputStyle}
            />
          </Field>
        </div>
        <div className="px-5 py-4 flex justify-end gap-2" style={{ borderTop: '1px solid var(--admin-border-soft)' }}>
          <GhostButton onClick={() => setAdjusting(null)}>Cancel</GhostButton>
          <PrimaryButton onClick={submitAdjust}>Save Stock</PrimaryButton>
        </div>
      </Modal>
    </div>
  );
}
