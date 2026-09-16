import { useState, useMemo } from 'react';
import { Users, Mail, Phone, ShoppingBag, Eye, UserX } from 'lucide-react';
import {
  Card, PageHeader, EmptyState, SearchInput, StatusBadge, Modal, useToast,
} from '../../components/admin/ui/AdminUI';
import { useAdminData } from '../../context/AdminDataContext';
import { formatNaira } from '../../utils/currency';

export default function AdminCustomersPage() {
  const { customers, orders, updateCustomerStatus } = useAdminData();
  const { pushToast, ToastViewport } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState(null);

  const customerOrders = (customerId) => orders.filter((o) => o.customerId === customerId || o.email === selected?.email);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) => c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.includes(q)
    );
  }, [customers, searchTerm]);

  const toggleStatus = (c) => {
    const next = c.status === 'Active' ? 'Blocked' : 'Active';
    updateCustomerStatus(c.id, next);
    pushToast(`${c.name} is now ${next.toLowerCase()}.`, 'info');
    setSelected((prev) => (prev && prev.id === c.id ? { ...prev, status: next } : prev));
  };

  const ordersFor = (c) => orders.filter((o) => o.customerId === c.id || (o.email && o.email === c.email));

  return (
    <div className="space-y-5">
      {ToastViewport}
      <PageHeader
        title="Customers"
        subtitle={customers.length ? `${customers.length} registered customer${customers.length !== 1 ? 's' : ''}` : 'People who shop with you'}
        breadcrumb={['Sales']}
      />

      {customers.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="No customers yet"
            description="Customers are registered automatically when they place an order or create an account on your storefront."
          />
        </Card>
      ) : (
        <>
          <Card>
            <SearchInput
              className="w-full sm:max-w-sm"
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by name, email or phone..."
              ariaLabel="Search customers"
            />
          </Card>

          <Card padded={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[720px]">
                <thead>
                  <tr
                    className="text-[9px] uppercase font-bold tracking-[0.14em]"
                    style={{ borderBottom: '1px solid var(--admin-border-soft)', color: 'var(--admin-text-muted)', background: 'var(--admin-surface-2)' }}
                  >
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4 text-center">Orders</th>
                    <th className="py-3.5 px-4 text-right">Total Spent</th>
                    <th className="py-3.5 px-4">Joined</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => {
                    const cOrders = ordersFor(c);
                    return (
                      <tr
                        key={c.id}
                        className="text-xs transition-colors hover:bg-black/[0.03] dark:hover:bg-white/5"
                        style={{ borderBottom: '1px solid var(--admin-border-soft)' }}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                              style={{ background: 'linear-gradient(135deg, #A94A5A, #8E3D4C)' }}
                            >
                              {(c.name || '?').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                            </div>
                            <p className="font-bold" style={{ color: 'var(--admin-text)' }}>{c.name}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-[11px]" style={{ color: 'var(--admin-text-muted)' }}>{c.email}</p>
                          <p className="text-[10px]" style={{ color: 'var(--admin-text-faint)' }}>{c.phone || '—'}</p>
                        </td>
                        <td className="py-3 px-4 text-center font-numeric font-bold" style={{ color: 'var(--admin-text)' }}>{cOrders.length || c.totalOrders || 0}</td>
                        <td className="py-3 px-4 text-right font-bold font-numeric" style={{ color: 'var(--admin-text)' }}>
                          {formatNaira(cOrders.length ? cOrders.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0) : c.totalSpent || 0)}
                        </td>
                        <td className="py-3 px-4 text-[11px]" style={{ color: 'var(--admin-text-muted)' }}>
                          {c.joinedDate ? new Date(c.joinedDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </td>
                        <td className="py-3 px-4 text-center"><StatusBadge status={c.status || 'Active'} /></td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelected(c)}
                            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                            style={{ color: 'var(--admin-text-muted)' }}
                            title="View customer"
                            aria-label={`View ${c.name}`}
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-xs" style={{ color: 'var(--admin-text-muted)' }}>
                        No customers match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? selected.name : ''}>
        {selected && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl space-y-1.5" style={{ background: 'var(--admin-surface-2)' }}>
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--admin-text-faint)' }}>
                  <Mail size={10} /> Email
                </p>
                <p style={{ color: 'var(--admin-text)' }}>{selected.email}</p>
              </div>
              <div className="p-3.5 rounded-xl space-y-1.5" style={{ background: 'var(--admin-surface-2)' }}>
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--admin-text-faint)' }}>
                  <Phone size={10} /> Phone
                </p>
                <p style={{ color: 'var(--admin-text)' }}>{selected.phone || '—'}</p>
              </div>
              <div className="p-3.5 rounded-xl space-y-1.5" style={{ background: 'var(--admin-surface-2)' }}>
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--admin-text-faint)' }}>
                  <ShoppingBag size={10} /> Orders
                </p>
                <p className="font-bold font-numeric" style={{ color: 'var(--admin-text)' }}>{ordersFor(selected).length || selected.totalOrders || 0}</p>
              </div>
              <div className="p-3.5 rounded-xl space-y-1.5" style={{ background: 'var(--admin-surface-2)' }}>
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--admin-text-faint)' }}>
                  Total spent
                </p>
                <p className="font-bold font-numeric" style={{ color: 'var(--admin-text)' }}>
                  {formatNaira(ordersFor(selected).length ? ordersFor(selected).reduce((s, o) => s + (Number(o.totalAmount) || 0), 0) : selected.totalSpent || 0)}
                </p>
              </div>
            </div>

            {/* Recent orders */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.16em] mb-2" style={{ color: 'var(--admin-text-faint)' }}>
                Order history
              </h4>
              {ordersFor(selected).length === 0 ? (
                <p className="text-xs p-3.5 rounded-xl" style={{ background: 'var(--admin-surface-2)', color: 'var(--admin-text-muted)' }}>
                  No orders recorded for this customer yet.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto admin-scroll">
                  {ordersFor(selected).map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between p-2.5 rounded-xl text-xs"
                      style={{ background: 'var(--admin-surface-2)' }}
                    >
                      <span className="font-bold" style={{ color: 'var(--admin-text)' }}>{o.id}</span>
                      <span style={{ color: 'var(--admin-text-muted)' }}>{formatNaira(o.totalAmount)}</span>
                      <StatusBadge status={o.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => toggleStatus(selected)}
                className="px-4 py-2 rounded-xl text-xs font-bold transition-colors hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-1.5"
                style={{
                  border: '1px solid var(--admin-border)',
                  color: selected.status === 'Active' ? '#A94A5A' : '#16a34a',
                }}
              >
                <UserX size={12} />
                {selected.status === 'Active' ? 'Block Customer' : 'Unblock Customer'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
