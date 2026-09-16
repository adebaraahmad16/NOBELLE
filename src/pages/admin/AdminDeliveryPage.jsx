import { useState } from 'react';
import { Plus, Edit2, Trash2, Truck, MapPin, Banknote, Clock } from 'lucide-react';
import {
  Card, PageHeader, EmptyState, PrimaryButton, GhostButton, Field, Modal,
  ConfirmDialog, inputStyle, inputClass, useToast,
} from '../../components/admin/ui/AdminUI';
import { useAdminData } from '../../context/AdminDataContext';
import { formatNaira } from '../../utils/currency';

const emptyZone = { name: '', fee: '', eta: '' };

export default function AdminDeliveryPage() {
  const { settings, updateStoreSettings, orders } = useAdminData();
  const { pushToast, ToastViewport } = useToast();

  const zones = settings.deliveryZones || [];
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);
  const [form, setForm] = useState(emptyZone);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [errors, setErrors] = useState({});

  const openAdd = () => {
    setEditingIdx(null);
    setForm(emptyZone);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (zone, idx) => {
    setEditingIdx(idx);
    setForm({ name: zone.name || '', fee: zone.fee ?? '', eta: zone.eta || '' });
    setErrors({});
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Zone name is required.';
    if (form.fee === '' || Number(form.fee) < 0) errs.fee = 'Delivery fee is required.';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const zone = { name: form.name.trim(), fee: Number(form.fee), eta: form.eta.trim() };
    const next = editingIdx !== null
      ? zones.map((z, i) => (i === editingIdx ? zone : z))
      : [...zones, zone];
    updateStoreSettings({ deliveryZones: next });
    pushToast(editingIdx !== null ? 'Delivery zone updated.' : 'Delivery zone added.');
    setModalOpen(false);
  };

  const handleDelete = () => {
    updateStoreSettings({ deliveryZones: zones.filter((_, i) => i !== confirmDelete.idx) });
    pushToast(`Zone "${confirmDelete.name}" removed.`);
    setConfirmDelete(null);
  };

  // Real delivery pipeline: orders that are shipped/delivered.
  const inTransit = orders.filter((o) => o.status === 'Shipped' || o.status === 'Ready for Delivery');
  const delivered = orders.filter((o) => o.status === 'Delivered');

  return (
    <div className="space-y-5">
      {ToastViewport}
      <PageHeader
        title="Delivery"
        subtitle="Configure delivery zones, fees and monitor active deliveries"
        breadcrumb={['Operations']}
        actions={
          <PrimaryButton onClick={openAdd}>
            <Plus size={14} /> Add Delivery Zone
          </PrimaryButton>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Zones */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-serif text-sm font-bold" style={{ color: 'var(--admin-text)' }}>
            Delivery Zones & Fees
          </h2>

          {zones.length === 0 ? (
            <Card>
              <EmptyState
                icon={Truck}
                title="No delivery zones configured"
                description="Define the areas you deliver to and their fees. Customers will choose a zone at checkout."
                action={<PrimaryButton onClick={openAdd}><Plus size={14} /> Add Your First Zone</PrimaryButton>}
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {zones.map((z, i) => (
                <Card key={i}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--admin-text)' }}>
                        <MapPin size={13} style={{ color: '#A94A5A' }} /> {z.name}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: 'var(--admin-text-muted)' }}>
                        <span className="flex items-center gap-1.5">
                          <Banknote size={11} /> {formatNaira(z.fee)}
                        </span>
                        {z.eta && (
                          <span className="flex items-center gap-1.5">
                            <Clock size={11} /> {z.eta}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(z, i)}
                        className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                        style={{ color: 'var(--admin-text-muted)' }}
                        title="Edit zone"
                        aria-label={`Edit ${z.name}`}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete({ ...z, idx: i })}
                        className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                        style={{ color: '#A94A5A' }}
                        title="Delete zone"
                        aria-label={`Delete ${z.name}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Active deliveries */}
        <div className="space-y-4">
          <h2 className="font-serif text-sm font-bold" style={{ color: 'var(--admin-text)' }}>
            Active Deliveries
          </h2>
          <Card>
            {inTransit.length === 0 ? (
              <EmptyState
                compact
                icon={Truck}
                title="No active deliveries"
                description="Orders marked as shipped will be tracked here."
              />
            ) : (
              <div className="space-y-2.5">
                {inTransit.slice(0, 6).map((o) => (
                  <div key={o.id} className="flex items-center justify-between gap-3 py-1.5">
                    <div className="min-w-0">
                      <p className="text-xs font-bold" style={{ color: 'var(--admin-text)' }}>{o.id}</p>
                      <p className="text-[10px] truncate" style={{ color: 'var(--admin-text-muted)' }}>{o.customerName}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: 'rgba(124,58,237,0.12)', color: '#7c3aed' }}>
                      {o.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(22,163,74,0.12)' }}>
              <Truck size={15} style={{ color: '#16a34a' }} />
            </div>
            <div>
              <p className="text-lg font-bold font-numeric leading-none" style={{ color: 'var(--admin-text)' }}>{delivered.length}</p>
              <p className="text-[10px] mt-1" style={{ color: 'var(--admin-text-muted)' }}>Delivered all-time</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Zone modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingIdx !== null ? 'Edit Delivery Zone' : 'New Delivery Zone'} width="max-w-sm">
        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-4">
            <Field label="Zone Name" required htmlFor="z-name">
              <input
                id="z-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Lagos Mainland"
                className={inputClass}
                style={{ ...inputStyle, borderColor: errors.name ? '#A94A5A' : inputStyle.border }}
                aria-invalid={!!errors.name}
              />
              {errors.name && <p className="text-[10px] mt-1" style={{ color: '#A94A5A' }}>{errors.name}</p>}
            </Field>
            <Field label="Delivery Fee (₦)" required htmlFor="z-fee">
              <input
                id="z-fee"
                type="number"
                min="0"
                value={form.fee}
                onChange={(e) => setForm((f) => ({ ...f, fee: e.target.value }))}
                placeholder="2500"
                className={inputClass}
                style={{ ...inputStyle, borderColor: errors.fee ? '#A94A5A' : inputStyle.border }}
                aria-invalid={!!errors.fee}
              />
              {errors.fee && <p className="text-[10px] mt-1" style={{ color: '#A94A5A' }}>{errors.fee}</p>}
            </Field>
            <Field label="Estimated Time" htmlFor="z-eta">
              <input
                id="z-eta"
                type="text"
                value={form.eta}
                onChange={(e) => setForm((f) => ({ ...f, eta: e.target.value }))}
                placeholder="e.g. 2–3 business days"
                className={inputClass}
                style={inputStyle}
              />
            </Field>
          </div>
          <div className="px-5 py-4 flex justify-end gap-2" style={{ borderTop: '1px solid var(--admin-border-soft)' }}>
            <GhostButton type="button" onClick={() => setModalOpen(false)}>Cancel</GhostButton>
            <PrimaryButton type="submit">{editingIdx !== null ? 'Save Changes' : 'Add Zone'}</PrimaryButton>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete delivery zone?"
        message={`Are you sure you want to remove "${confirmDelete?.name}"? Customers in this zone will not be able to select delivery at checkout.`}
        confirmLabel="Delete Zone"
      />
    </div>
  );
}
