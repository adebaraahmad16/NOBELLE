import { useState } from 'react';
import {
  Store, CreditCard, Truck, Package, ShoppingBag, ShieldCheck, Save,
  Plus, Trash2,
} from 'lucide-react';
import {
  Card, PageHeader, PrimaryButton, GhostButton, Field, inputStyle, inputClass,
  useToast,
} from '../../components/admin/ui/AdminUI';
import { useAdminData } from '../../context/AdminDataContext';
import { formatNaira } from '../../utils/currency';

const TABS = [
  { key: 'store', label: 'Store', icon: Store },
  { key: 'payments', label: 'Payments', icon: CreditCard },
  { key: 'delivery', label: 'Delivery', icon: Truck },
  { key: 'inventory', label: 'Inventory', icon: Package },
  { key: 'orders', label: 'Orders', icon: ShoppingBag },
  { key: 'security', label: 'Security', icon: ShieldCheck },
];

export default function AdminSettingsPage() {
  const { settings, updateStoreSettings } = useAdminData();
  const { pushToast, ToastViewport } = useToast();

  const [tab, setTab] = useState('store');
  const [form, setForm] = useState(settings);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });

  // Re-sync the editable draft whenever the persisted settings change
  // (e.g. after a save, or when the Delivery page edits zones).
  const [lastSettings, setLastSettings] = useState(settings);
  if (settings !== lastSettings) {
    setLastSettings(settings);
    setForm(settings);
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = (sectionLabel) => {
    updateStoreSettings(form);
    pushToast(`${sectionLabel} settings saved.`);
  };

  const changePassword = (e) => {
    e.preventDefault();
    if (!pwForm.current || !pwForm.next) {
      pushToast('Fill in both password fields.', 'error');
      return;
    }
    if (pwForm.next.length < 8) {
      pushToast('New password must be at least 8 characters.', 'error');
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      pushToast('New passwords do not match.', 'error');
      return;
    }
    // Password change requires a real backend — acknowledged but not simulated.
    pushToast('Password update requires a connected backend. Settings kept until then.', 'info');
    setPwForm({ current: '', next: '', confirm: '' });
  };

  const zones = form.deliveryZones || [];

  return (
    <div className="space-y-5">
      {ToastViewport}
      <PageHeader title="Settings" subtitle="Configure how your store operates" breadcrumb={['System']} />

      {/* Tabs */}
      <Card padded={false}>
        <div className="p-3 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3.5 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all ${tab === t.key ? 'text-white' : ''}`}
              style={tab === t.key
                ? { background: '#A94A5A' }
                : { border: '1px solid var(--admin-border-soft)', color: 'var(--admin-text-muted)' }}
              aria-pressed={tab === t.key}
            >
              <t.icon size={12} /> {t.label}
            </button>
          ))}
        </div>
      </Card>

      {/* ── Store ── */}
      {tab === 'store' && (
        <Card>
          <h2 className="font-serif text-sm font-bold mb-4" style={{ color: 'var(--admin-text)' }}>Store Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Store Name" htmlFor="s-name">
              <input id="s-name" type="text" value={form.storeName || ''} onChange={(e) => set('storeName', e.target.value)} className={inputClass} style={inputStyle} />
            </Field>
            <Field label="Currency">
              <input type="text" value="₦ — Nigerian Naira (NGN)" disabled className={`${inputClass} opacity-60`} style={inputStyle} />
            </Field>
            <Field label="Contact Email" htmlFor="s-email">
              <input id="s-email" type="email" value={form.contactEmail || ''} onChange={(e) => set('contactEmail', e.target.value)} placeholder="customers@yourstore.com" className={inputClass} style={inputStyle} />
            </Field>
            <Field label="Contact Phone" htmlFor="s-phone">
              <input id="s-phone" type="tel" value={form.contactPhone || ''} onChange={(e) => set('contactPhone', e.target.value)} placeholder="+234 ..." className={inputClass} style={inputStyle} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Business Address" htmlFor="s-addr">
                <input id="s-addr" type="text" value={form.address || ''} onChange={(e) => set('address', e.target.value)} className={inputClass} style={inputStyle} />
              </Field>
            </div>
          </div>
          <div className="mt-5">
            <PrimaryButton onClick={() => save('Store')}><Save size={13} /> Save Store Settings</PrimaryButton>
          </div>
        </Card>
      )}

      {/* ── Payments ── */}
      {tab === 'payments' && (
        <Card>
          <h2 className="font-serif text-sm font-bold mb-1" style={{ color: 'var(--admin-text)' }}>Payment Provider</h2>
          <p className="text-xs mb-4" style={{ color: 'var(--admin-text-muted)' }}>
            Configure the gateway customers pay through. Keys are stored for your connected backend.
          </p>
          <div className="space-y-4">
            <Field label="Provider" htmlFor="s-provider">
              <select
                id="s-provider"
                value={form.paymentProvider || ''}
                onChange={(e) => set('paymentProvider', e.target.value)}
                className={inputClass}
                style={inputStyle}
              >
                <option value="">Select a provider...</option>
                <option value="paystack">Paystack</option>
                <option value="flutterwave">Flutterwave</option>
                <option value="remita">Remita</option>
                <option value="stripe">Stripe (international)</option>
              </select>
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Public Key" htmlFor="s-pub">
                <input
                  id="s-pub"
                  type="text"
                  value={form.paymentConfig?.publicKey || ''}
                  onChange={(e) => set('paymentConfig', { ...form.paymentConfig, publicKey: e.target.value })}
                  placeholder="pk_..."
                  className={`${inputClass} font-mono`}
                  style={inputStyle}
                />
              </Field>
              <Field label="Secret Key" htmlFor="s-sec" hint="Stored locally until a backend is connected — never exposed to customers.">
                <input
                  id="s-sec"
                  type="password"
                  value={form.paymentConfig?.secretKey || ''}
                  onChange={(e) => set('paymentConfig', { ...form.paymentConfig, secretKey: e.target.value })}
                  placeholder="sk_..."
                  className={`${inputClass} font-mono`}
                  style={inputStyle}
                />
              </Field>
            </div>
          </div>
          <div className="mt-5">
            <PrimaryButton onClick={() => save('Payment')}><Save size={13} /> Save Payment Settings</PrimaryButton>
          </div>
        </Card>
      )}

      {/* ── Delivery ── */}
      {tab === 'delivery' && (
        <Card>
          <h2 className="font-serif text-sm font-bold mb-1" style={{ color: 'var(--admin-text)' }}>Delivery Settings</h2>
          <p className="text-xs mb-4" style={{ color: 'var(--admin-text-muted)' }}>
            Manage zones and fees. You can also do this from the Delivery page.
          </p>
          <div className="space-y-2 mb-4">
            {zones.length === 0 ? (
              <p className="text-xs p-3.5 rounded-xl" style={{ background: 'var(--admin-surface-2)', color: 'var(--admin-text-muted)' }}>
                No delivery zones configured yet.
              </p>
            ) : (
              zones.map((z, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl"
                  style={{ background: 'var(--admin-surface-2)' }}
                >
                  <div>
                    <p className="text-xs font-bold" style={{ color: 'var(--admin-text)' }}>{z.name}</p>
                    <p className="text-[10px]" style={{ color: 'var(--admin-text-muted)' }}>
                      {formatNaira(z.fee)}{z.eta ? ` · ${z.eta}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => set('deliveryZones', zones.filter((_, x) => x !== i))}
                    className="p-1.5 rounded-lg"
                    style={{ color: '#A94A5A' }}
                    title="Remove zone"
                    aria-label={`Remove ${z.name}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
          <button
            onClick={() => set('deliveryZones', [...zones, { name: 'New Zone', fee: 0, eta: '' }])}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
            style={{ border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
          >
            <Plus size={13} /> Add Zone
          </button>
          <div className="mt-5">
            <PrimaryButton onClick={() => save('Delivery')}><Save size={13} /> Save Delivery Settings</PrimaryButton>
          </div>
        </Card>
      )}

      {/* ── Inventory ── */}
      {tab === 'inventory' && (
        <Card>
          <h2 className="font-serif text-sm font-bold mb-4" style={{ color: 'var(--admin-text)' }}>Inventory Settings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Default Low-Stock Threshold" htmlFor="s-threshold" hint="Products inherit this unless they set their own.">
              <input
                id="s-threshold"
                type="number"
                min="0"
                value={form.lowStockThreshold ?? 5}
                onChange={(e) => set('lowStockThreshold', Number(e.target.value))}
                className={inputClass}
                style={inputStyle}
              />
            </Field>
            <div className="flex items-end pb-2.5">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.trackStock !== false}
                  onChange={(e) => set('trackStock', e.target.checked)}
                  className="w-4 h-4 accent-[#A94A5A]"
                />
                <span className="text-xs font-semibold" style={{ color: 'var(--admin-text)' }}>Enable stock tracking storewide</span>
              </label>
            </div>
          </div>
          <div className="mt-5">
            <PrimaryButton onClick={() => save('Inventory')}><Save size={13} /> Save Inventory Settings</PrimaryButton>
          </div>
        </Card>
      )}

      {/* ── Orders ── */}
      {tab === 'orders' && (
        <Card>
          <h2 className="font-serif text-sm font-bold mb-4" style={{ color: 'var(--admin-text)' }}>Order Settings</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.allowCancellations !== false}
                onChange={(e) => set('allowCancellations', e.target.checked)}
                className="w-4 h-4 accent-[#A94A5A]"
              />
              <span className="text-xs font-semibold" style={{ color: 'var(--admin-text)' }}>Allow customers to cancel orders</span>
            </label>
            <Field label="Cancellation Window (hours)" htmlFor="s-cancel">
              <input
                id="s-cancel"
                type="number"
                min="0"
                value={form.cancellationWindowHours ?? 24}
                onChange={(e) => set('cancellationWindowHours', Number(e.target.value))}
                className={inputClass}
                style={inputStyle}
              />
            </Field>
            <Field label="Returns Window (days)" htmlFor="s-returns" hint="How long after delivery customers may request a return.">
              <input
                id="s-returns"
                type="number"
                min="0"
                value={form.returnsWindowDays ?? 14}
                onChange={(e) => set('returnsWindowDays', Number(e.target.value))}
                className={inputClass}
                style={inputStyle}
              />
            </Field>
          </div>
          <div className="mt-5">
            <PrimaryButton onClick={() => save('Order')}><Save size={13} /> Save Order Settings</PrimaryButton>
          </div>
        </Card>
      )}

      {/* ── Security ── */}
      {tab === 'security' && (
        <Card>
          <h2 className="font-serif text-sm font-bold mb-1" style={{ color: 'var(--admin-text)' }}>Security</h2>
          <p className="text-xs mb-4" style={{ color: 'var(--admin-text-muted)' }}>
            Admin authentication is currently local to this browser. Connect a backend for production-grade session security.
          </p>
          <form onSubmit={changePassword} className="space-y-4 max-w-sm">
            <Field label="Current Password" htmlFor="s-pw0">
              <input id="s-pw0" type="password" value={pwForm.current} onChange={(e) => setPwForm((p) => ({ ...p, current: e.target.value }))} className={inputClass} style={inputStyle} />
            </Field>
            <Field label="New Password" htmlFor="s-pw1" hint="Minimum 8 characters.">
              <input id="s-pw1" type="password" value={pwForm.next} onChange={(e) => setPwForm((p) => ({ ...p, next: e.target.value }))} className={inputClass} style={inputStyle} />
            </Field>
            <Field label="Confirm New Password" htmlFor="s-pw2">
              <input id="s-pw2" type="password" value={pwForm.confirm} onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))} className={inputClass} style={inputStyle} />
            </Field>
            <PrimaryButton type="submit">Update Password</PrimaryButton>
          </form>
        </Card>
      )}

    </div>
  );
}
