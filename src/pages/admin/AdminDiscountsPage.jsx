import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Power, TicketPercent, Copy, Check } from 'lucide-react';
import {
  Card, PageHeader, EmptyState, SearchInput, PrimaryButton, GhostButton, StatusBadge,
  Field, Modal, ConfirmDialog, inputStyle, inputClass, useToast,
} from '../../components/admin/ui/AdminUI';
import { useAdminData } from '../../context/AdminDataContext';
import { formatNaira } from '../../utils/currency';

const emptyForm = {
  code: '',
  type: 'percentage',
  value: '',
  minPurchase: '',
  maxDiscount: '',
  usageLimit: '',
  startDate: '',
  expiryDate: '',
  active: true,
};

export default function AdminDiscountsPage() {
  const { discounts, addDiscount, updateDiscount, toggleDiscountStatus, deleteDiscount } = useAdminData();
  const { pushToast, ToastViewport } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [errors, setErrors] = useState({});
  const [copied, setCopied] = useState('');

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return discounts;
    return discounts.filter((d) => d.code?.toLowerCase().includes(q));
  }, [discounts, searchTerm]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (d) => {
    setEditing(d);
    setForm({
      code: d.code || '',
      type: d.type || 'percentage',
      value: d.value ?? '',
      minPurchase: d.minPurchase ?? '',
      maxDiscount: d.maxDiscount ?? '',
      usageLimit: d.usageLimit ?? '',
      startDate: d.startDate || '',
      expiryDate: d.expiryDate || '',
      active: d.active !== false,
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.code.trim()) errs.code = 'Coupon code is required.';
    if (form.value === '' || Number(form.value) < 0) errs.value = 'Discount value is required.';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const payload = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: Number(form.value),
      minPurchase: form.minPurchase ? Number(form.minPurchase) : 0,
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      startDate: form.startDate || null,
      expiryDate: form.expiryDate || null,
      active: form.active,
    };

    if (editing) {
      updateDiscount(editing.id, payload);
      pushToast('Coupon updated.');
    } else {
      addDiscount(payload);
      pushToast(`Coupon "${payload.code}" created.`);
    }
    setModalOpen(false);
  };

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(''), 1500);
  };

  const describeCoupon = (d) => {
    if (d.type === 'percentage') return `${d.value}% off`;
    if (d.type === 'fixed') return `${formatNaira(d.value)} off`;
    return 'Free shipping';
  };

  const isExpired = (d) => d.expiryDate && new Date(d.expiryDate) < new Date();

  return (
    <div className="space-y-5">
      {ToastViewport}
      <PageHeader
        title="Coupons"
        subtitle={discounts.length ? `${discounts.length} coupon${discounts.length !== 1 ? 's' : ''}` : 'Create discount codes for your customers'}
        breadcrumb={['Marketing']}
        actions={
          <PrimaryButton onClick={openAdd}>
            <Plus size={14} /> Create Coupon
          </PrimaryButton>
        }
      />

      {discounts.length === 0 ? (
        <Card>
          <EmptyState
            icon={TicketPercent}
            title="No coupons yet"
            description="Create your first discount code — percentage or fixed amount — with optional usage limits and expiry dates."
            action={<PrimaryButton onClick={openAdd}><Plus size={14} /> Create Coupon</PrimaryButton>}
          />
        </Card>
      ) : (
        <>
          <Card>
            <SearchInput
              className="w-full sm:max-w-xs"
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search coupon codes..."
              ariaLabel="Search coupons"
            />
          </Card>

          <Card padded={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead>
                  <tr
                    className="text-[9px] uppercase font-bold tracking-[0.14em]"
                    style={{ borderBottom: '1px solid var(--admin-border-soft)', color: 'var(--admin-text-muted)', background: 'var(--admin-surface-2)' }}
                  >
                    <th className="py-3.5 px-4">Code</th>
                    <th className="py-3.5 px-4">Discount</th>
                    <th className="py-3.5 px-4">Min. Purchase</th>
                    <th className="py-3.5 px-4 text-center">Usage</th>
                    <th className="py-3.5 px-4">Expires</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d) => (
                    <tr
                      key={d.id}
                      className="text-xs transition-colors hover:bg-black/[0.03] dark:hover:bg-white/5"
                      style={{ borderBottom: '1px solid var(--admin-border-soft)' }}
                    >
                      <td className="py-3 px-4">
                        <button
                          onClick={() => copyCode(d.code)}
                          className="flex items-center gap-1.5 font-mono font-bold px-2 py-1 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                          style={{ color: '#A94A5A' }}
                          title="Copy code"
                        >
                          {d.code}
                          {copied === d.code ? <Check size={11} /> : <Copy size={11} style={{ color: 'var(--admin-text-faint)' }} />}
                        </button>
                      </td>
                      <td className="py-3 px-4 font-semibold" style={{ color: 'var(--admin-text)' }}>{describeCoupon(d)}</td>
                      <td className="py-3 px-4 font-numeric" style={{ color: 'var(--admin-text-muted)' }}>
                        {d.minPurchase ? formatNaira(d.minPurchase) : '—'}
                      </td>
                      <td className="py-3 px-4 text-center font-numeric" style={{ color: 'var(--admin-text)' }}>
                        {d.usageCount || 0}{d.usageLimit ? ` / ${d.usageLimit}` : ''}
                      </td>
                      <td className="py-3 px-4 text-[11px]" style={{ color: isExpired(d) ? '#A94A5A' : 'var(--admin-text-muted)' }}>
                        {d.expiryDate || 'No expiry'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={d.active === false ? 'Inactive' : isExpired(d) ? 'Inactive' : 'Active'} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => toggleDiscountStatus(d.id)}
                            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                            style={{ color: d.active !== false ? '#d97706' : '#16a34a' }}
                            title={d.active !== false ? 'Disable coupon' : 'Enable coupon'}
                            aria-label={d.active !== false ? 'Disable coupon' : 'Enable coupon'}
                          >
                            <Power size={13} />
                          </button>
                          <button
                            onClick={() => openEdit(d)}
                            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                            style={{ color: 'var(--admin-text-muted)' }}
                            title="Edit coupon"
                            aria-label={`Edit ${d.code}`}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(d)}
                            className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                            style={{ color: '#A94A5A' }}
                            title="Delete coupon"
                            aria-label={`Delete ${d.code}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Create/Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Coupon' : 'New Coupon'} width="max-w-lg">
        <form onSubmit={handleSubmit}>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Coupon Code" required htmlFor="cp-code">
              <input
                id="cp-code"
                type="text"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. WELCOME10"
                className={`${inputClass} font-mono uppercase`}
                style={{ ...inputStyle, borderColor: errors.code ? '#A94A5A' : inputStyle.border }}
                aria-invalid={!!errors.code}
              />
              {errors.code && <p className="text-[10px] mt-1" style={{ color: '#A94A5A' }}>{errors.code}</p>}
            </Field>

            <Field label="Discount Type" htmlFor="cp-type">
              <select
                id="cp-type"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className={inputClass}
                style={inputStyle}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed amount (₦)</option>
                <option value="free_shipping">Free shipping</option>
              </select>
            </Field>

            {form.type !== 'free_shipping' && (
              <Field label={form.type === 'percentage' ? 'Discount (%)' : 'Discount (₦)'} required>
                <input
                  type="number"
                  min="0"
                  value={form.value}
                  onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                  className={inputClass}
                  style={{ ...inputStyle, borderColor: errors.value ? '#A94A5A' : inputStyle.border }}
                />
                {errors.value && <p className="text-[10px] mt-1" style={{ color: '#A94A5A' }}>{errors.value}</p>}
              </Field>
            )}

            <Field label="Minimum Order (₦)">
              <input
                type="number"
                min="0"
                value={form.minPurchase}
                onChange={(e) => setForm((f) => ({ ...f, minPurchase: e.target.value }))}
                placeholder="Optional"
                className={inputClass}
                style={inputStyle}
              />
            </Field>

            {form.type === 'percentage' && (
              <Field label="Maximum Discount (₦)" hint="Cap for percentage coupons">
                <input
                  type="number"
                  min="0"
                  value={form.maxDiscount}
                  onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))}
                  placeholder="Optional"
                  className={inputClass}
                  style={inputStyle}
                />
              </Field>
            )}

            <Field label="Usage Limit" hint="Blank = unlimited">
              <input
                type="number"
                min="0"
                value={form.usageLimit}
                onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))}
                className={inputClass}
                style={inputStyle}
              />
            </Field>

            <Field label="Start Date">
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                className={inputClass}
                style={inputStyle}
              />
            </Field>

            <Field label="Expiration Date">
              <input
                type="date"
                value={form.expiryDate}
                onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
                className={inputClass}
                style={inputStyle}
              />
            </Field>

            <div className="sm:col-span-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                  className="w-4 h-4 accent-[#A94A5A]"
                />
                <span className="text-xs font-semibold" style={{ color: 'var(--admin-text)' }}>Coupon is active</span>
              </label>
            </div>
          </div>

          <div className="px-5 py-4 flex justify-end gap-2" style={{ borderTop: '1px solid var(--admin-border-soft)' }}>
            <GhostButton type="button" onClick={() => setModalOpen(false)}>Cancel</GhostButton>
            <PrimaryButton type="submit">{editing ? 'Save Changes' : 'Create Coupon'}</PrimaryButton>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          deleteDiscount(confirmDelete.id);
          pushToast(`Coupon "${confirmDelete.code}" deleted.`);
          setConfirmDelete(null);
        }}
        title="Delete coupon?"
        message={`Are you sure you want to delete "${confirmDelete?.code}"? Customers will no longer be able to use this code. This action cannot be undone.`}
        confirmLabel="Delete Coupon"
      />
    </div>
  );
}
