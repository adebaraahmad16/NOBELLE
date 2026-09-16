import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search, ShoppingBag, Printer, X, Truck, CreditCard, User, MapPin,
  CheckCircle2, PackageCheck, PackageX, Undo2,
} from 'lucide-react';
import {
  Card, PageHeader, EmptyState, SearchInput, Select, StatusBadge, GhostButton,
  Modal, useToast,
} from '../../components/admin/ui/AdminUI';
import { useAdminData } from '../../context/AdminDataContext';
import { formatNaira } from '../../utils/currency';

const ORDER_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Ready for Delivery', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'];
const PAYMENT_STATUSES = ['Pending', 'Paid', 'Refunded', 'Failed'];

export default function AdminOrdersPage() {
  const [searchParams] = useSearchParams();
  const { orders, updateOrderStatus, updateOrderPaymentStatus, updateOrderTracking } = useAdminData();
  const { pushToast, ToastViewport } = useToast();

  const urlSearch = searchParams.get('search') || '';
  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [trackingFor, setTrackingFor] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const filtered = useMemo(() => {
    let list = [...orders];
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (o) =>
          o.id?.toLowerCase().includes(q) ||
          o.customerName?.toLowerCase().includes(q) ||
          o.email?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') list = list.filter((o) => o.status === statusFilter);
    if (paymentFilter !== 'all') list = list.filter((o) => o.paymentStatus === paymentFilter);
    if (dateFilter) list = list.filter((o) => (o.date || '').slice(0, 10) === dateFilter);
    return list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [orders, searchTerm, statusFilter, paymentFilter, dateFilter]);

  const openOrder = (order) => {
    setSelectedOrder(order);
    setTrackingInput(order.trackingNumber || '');
  };

  const statusFlow = {
    Pending: 'Confirmed',
    Confirmed: 'Processing',
    Processing: 'Ready for Delivery',
    'Ready for Delivery': 'Shipped',
    Shipped: 'Delivered',
  };

  const doAction = () => {
    const { order, action } = confirmAction;
    if (action === 'advance') {
      const next = statusFlow[order.status];
      if (next) {
        updateOrderStatus(order.id, next);
        pushToast(`${order.id} marked as ${next}.`);
      }
    } else if (action === 'cancel') {
      updateOrderStatus(order.id, 'Cancelled');
      pushToast(`${order.id} cancelled.`, 'info');
    } else if (action === 'refund') {
      updateOrderStatus(order.id, 'Refunded');
      updateOrderPaymentStatus(order.id, 'Refunded');
      pushToast(`${order.id} refunded.`, 'info');
    } else if (action === 'markPaid') {
      updateOrderPaymentStatus(order.id, 'Paid');
      pushToast(`${order.id} marked as paid.`);
    }
    setSelectedOrder((prev) =>
      prev && prev.id === order.id
        ? {
            ...prev,
            status: action === 'advance' ? statusFlow[order.status] : action === 'cancel' ? 'Cancelled' : action === 'refund' ? 'Refunded' : prev.status,
            paymentStatus: action === 'refund' ? 'Refunded' : action === 'markPaid' ? 'Paid' : prev.paymentStatus,
          }
        : prev
    );
    setConfirmAction(null);
  };

  const saveTracking = () => {
    updateOrderTracking(selectedOrder.id, trackingInput.trim());
    setSelectedOrder((prev) => ({ ...prev, trackingNumber: trackingInput.trim() }));
    pushToast('Tracking number saved.');
  };

  const printInvoice = () => {
    window.print();
  };

  const subtotal = (o) => (o.items || []).reduce((acc, i) => acc + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);
  const shipping = (o) => Math.max(0, (Number(o.totalAmount) || 0) - subtotal(o));

  const statusTone = (s) =>
    ({ Delivered: '#16a34a', Shipped: '#7c3aed', 'Ready for Delivery': '#2563eb', Processing: '#2563eb', Confirmed: '#2563eb', Pending: '#d97706', Cancelled: '#A94A5A', Refunded: '#737373' }[s] || '#737373');

  return (
    <div className="space-y-5">
      {ToastViewport}
      <PageHeader
        title="Orders"
        subtitle={orders.length ? `${orders.length} order${orders.length !== 1 ? 's' : ''} received` : 'Customer orders will appear here'}
        breadcrumb={['Sales']}
      />

      {orders.length === 0 ? (
        <Card>
          <EmptyState
            icon={ShoppingBag}
            title="No orders yet"
            description="When customers complete checkout on your storefront, their orders appear here for confirmation, fulfilment and tracking."
          />
        </Card>
      ) : (
        <>
          {/* Filters */}
          <Card className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search order ID, customer, email..."
              ariaLabel="Search orders"
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              ariaLabel="Filter by order status"
              options={[{ value: 'all', label: 'All Statuses' }, ...ORDER_STATUSES.map((s) => ({ value: s, label: s }))]}
            />
            <Select
              value={paymentFilter}
              onChange={setPaymentFilter}
              ariaLabel="Filter by payment status"
              options={[{ value: 'all', label: 'All Payments' }, ...PAYMENT_STATUSES.map((s) => ({ value: s, label: s }))]}
            />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              aria-label="Filter by date"
              className="px-3 py-2 text-xs outline-none rounded-xl"
              style={{ background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border-soft)', color: 'var(--admin-text)' }}
            />
          </Card>

          {/* Table */}
          <Card padded={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead>
                  <tr
                    className="text-[9px] uppercase font-bold tracking-[0.14em]"
                    style={{ borderBottom: '1px solid var(--admin-border-soft)', color: 'var(--admin-text-muted)', background: 'var(--admin-surface-2)' }}
                  >
                    <th className="py-3.5 px-4">Order</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4 text-center">Items</th>
                    <th className="py-3.5 px-4 text-right">Total</th>
                    <th className="py-3.5 px-4 text-center">Payment</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o) => (
                    <tr
                      key={o.id}
                      onClick={() => openOrder(o)}
                      className="text-xs cursor-pointer transition-colors hover:bg-black/[0.03] dark:hover:bg-white/5"
                      style={{ borderBottom: '1px solid var(--admin-border-soft)' }}
                    >
                      <td className="py-3 px-4 font-bold" style={{ color: 'var(--admin-text)' }}>{o.id}</td>
                      <td className="py-3 px-4 text-[11px]" style={{ color: 'var(--admin-text-muted)' }}>
                        {o.date ? new Date(o.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold" style={{ color: 'var(--admin-text)' }}>{o.customerName}</p>
                        <p className="text-[10px]" style={{ color: 'var(--admin-text-faint)' }}>{o.email}</p>
                      </td>
                      <td className="py-3 px-4 text-center font-numeric" style={{ color: 'var(--admin-text-muted)' }}>
                        {(o.items || []).reduce((s, i) => s + (Number(i.quantity) || 1), 0)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold font-numeric" style={{ color: 'var(--admin-text)' }}>{formatNaira(o.totalAmount)}</td>
                      <td className="py-3 px-4 text-center"><StatusBadge status={o.paymentStatus} /></td>
                      <td className="py-3 px-4 text-center"><StatusBadge status={o.status} /></td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); openOrder(o); }}
                          className="text-[11px] font-bold hover:underline"
                          style={{ color: '#A94A5A' }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-xs" style={{ color: 'var(--admin-text-muted)' }}>
                        No orders match your search or filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ── Order details modal ── */}
      <Modal open={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={selectedOrder ? `Order ${selectedOrder.id}` : ''} width="max-w-3xl">
        {selectedOrder && (
          <div className="max-h-[75vh] overflow-y-auto admin-scroll">
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Customer info */}
              <section className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.16em] flex items-center gap-1.5" style={{ color: 'var(--admin-text-faint)' }}>
                  <User size={11} /> Customer
                </h4>
                <div className="p-3.5 rounded-xl text-xs space-y-1" style={{ background: 'var(--admin-surface-2)' }}>
                  <p className="font-bold" style={{ color: 'var(--admin-text)' }}>{selectedOrder.customerName}</p>
                  <p style={{ color: 'var(--admin-text-muted)' }}>{selectedOrder.email}</p>
                  <p style={{ color: 'var(--admin-text-muted)' }}>{selectedOrder.phone || '—'}</p>
                  {selectedOrder.shippingAddress && (
                    <p className="pt-1.5 flex gap-1.5" style={{ color: 'var(--admin-text-muted)' }}>
                      <MapPin size={12} className="shrink-0 mt-0.5" />
                      <span>
                        {selectedOrder.shippingAddress.address}
                        {selectedOrder.shippingAddress.city ? `, ${selectedOrder.shippingAddress.city}` : ''}
                        {selectedOrder.shippingAddress.state ? `, ${selectedOrder.shippingAddress.state}` : ''}
                        {selectedOrder.shippingAddress.zip ? ` ${selectedOrder.shippingAddress.zip}` : ''}
                      </span>
                    </p>
                  )}
                </div>
              </section>

              {/* Payment info */}
              <section className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.16em] flex items-center gap-1.5" style={{ color: 'var(--admin-text-faint)' }}>
                  <CreditCard size={11} /> Payment
                </h4>
                <div className="p-3.5 rounded-xl text-xs space-y-1.5" style={{ background: 'var(--admin-surface-2)' }}>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--admin-text-muted)' }}>Status</span>
                    <StatusBadge status={selectedOrder.paymentStatus} />
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--admin-text-muted)' }}>Method</span>
                    <span className="font-semibold capitalize" style={{ color: 'var(--admin-text)' }}>{selectedOrder.paymentMethod || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--admin-text-muted)' }}>Reference</span>
                    <span className="font-mono" style={{ color: 'var(--admin-text)' }}>{selectedOrder.transactionRef || '—'}</span>
                  </div>
                  <div className="flex justify-between pt-1.5" style={{ borderTop: '1px solid var(--admin-border-soft)' }}>
                    <span style={{ color: 'var(--admin-text-muted)' }}>Total</span>
                    <span className="font-bold font-numeric" style={{ color: '#A94A5A' }}>{formatNaira(selectedOrder.totalAmount)}</span>
                  </div>
                </div>
              </section>

              {/* Items */}
              <section className="space-y-2 md:col-span-2">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.16em] flex items-center gap-1.5" style={{ color: 'var(--admin-text-faint)' }}>
                  <ShoppingBag size={11} /> Order Items
                </h4>
                <div className="space-y-2">
                  {(selectedOrder.items || []).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-2.5 rounded-xl"
                      style={{ background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border-soft)' }}
                    >
                      <div className="w-10 h-12 rounded-lg overflow-hidden shrink-0" style={{ background: 'var(--admin-border-soft)' }}>
                        {item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate" style={{ color: 'var(--admin-text)' }}>{item.name}</p>
                        <p className="text-[10px]" style={{ color: 'var(--admin-text-muted)' }}>
                          {item.size ? `Size ${item.size}` : ''} {item.color ? `· ${item.color}` : ''} · Qty {item.quantity}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold font-numeric" style={{ color: 'var(--admin-text)' }}>{formatNaira((Number(item.price) || 0) * (Number(item.quantity) || 1))}</p>
                        <p className="text-[10px]" style={{ color: 'var(--admin-text-faint)' }}>{formatNaira(item.price)} each</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 rounded-xl text-xs space-y-1.5 mt-3" style={{ background: 'var(--admin-surface-2)' }}>
                  <div className="flex justify-between" style={{ color: 'var(--admin-text-muted)' }}>
                    <span>Subtotal</span>
                    <span className="font-numeric">{formatNaira(subtotal(selectedOrder))}</span>
                  </div>
                  <div className="flex justify-between" style={{ color: 'var(--admin-text-muted)' }}>
                    <span>Delivery</span>
                    <span className="font-numeric">{shipping(selectedOrder) === 0 ? 'Free' : formatNaira(shipping(selectedOrder))}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-1.5" style={{ borderTop: '1px solid var(--admin-border-soft)', color: 'var(--admin-text)' }}>
                    <span>Total</span>
                    <span className="font-numeric">{formatNaira(selectedOrder.totalAmount)}</span>
                  </div>
                </div>
              </section>

              {/* Delivery */}
              <section className="space-y-2 md:col-span-2">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.16em] flex items-center gap-1.5" style={{ color: 'var(--admin-text-faint)' }}>
                  <Truck size={11} /> Delivery
                </h4>
                <div className="p-3.5 rounded-xl text-xs grid grid-cols-1 sm:grid-cols-3 gap-3" style={{ background: 'var(--admin-surface-2)' }}>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--admin-text-faint)' }}>Method</p>
                    <p className="mt-1 font-semibold" style={{ color: 'var(--admin-text)' }}>{selectedOrder.deliveryMethod || 'Standard delivery'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--admin-text-faint)' }}>Tracking No.</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <input
                        type="text"
                        value={trackingInput}
                        onChange={(e) => setTrackingInput(e.target.value)}
                        placeholder="Add tracking number"
                        aria-label="Tracking number"
                        className="px-2.5 py-1.5 rounded-lg text-[11px] outline-none flex-1 min-w-0"
                        style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border-soft)', color: 'var(--admin-text)' }}
                      />
                      <button
                        onClick={saveTracking}
                        className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold shrink-0"
                        style={{ background: '#A94A5A', color: '#fff' }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--admin-text-faint)' }}>Status</p>
                    <p className="mt-1"><StatusBadge status={selectedOrder.status} /></p>
                  </div>
                </div>
              </section>

              {/* Actions */}
              <section className="md:col-span-2">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.16em] mb-2.5" style={{ color: 'var(--admin-text-faint)' }}>
                  Actions
                </h4>
                <div className="flex flex-wrap gap-2">
                  {statusFlow[selectedOrder.status] && (
                    <button
                      onClick={() => setConfirmAction({ order: selectedOrder, action: 'advance' })}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #A94A5A, #8E3D4C)' }}
                    >
                      {statusFlow[selectedOrder.status] === 'Delivered' ? 'Mark as Delivered' : `Mark as ${statusFlow[selectedOrder.status]}`}
                    </button>
                  )}
                  {selectedOrder.paymentStatus !== 'Paid' && selectedOrder.status !== 'Cancelled' && selectedOrder.status !== 'Refunded' && (
                    <button
                      onClick={() => setConfirmAction({ order: selectedOrder, action: 'markPaid' })}
                      className="px-4 py-2 rounded-xl text-xs font-bold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                    >
                      <CheckCircle2 size={12} className="inline mr-1 -mt-0.5" /> Mark Paid
                    </button>
                  )}
                  <button
                    onClick={printInvoice}
                    className="px-4 py-2 rounded-xl text-xs font-bold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                  >
                    <Printer size={12} className="inline mr-1 -mt-0.5" /> Print Invoice
                  </button>
                  {selectedOrder.status !== 'Cancelled' && selectedOrder.status !== 'Delivered' && selectedOrder.status !== 'Refunded' && (
                    <button
                      onClick={() => setConfirmAction({ order: selectedOrder, action: 'cancel' })}
                      className="px-4 py-2 rounded-xl text-xs font-bold transition-colors hover:bg-red-500/10"
                      style={{ border: '1px solid rgba(169,74,90,0.3)', color: '#A94A5A' }}
                    >
                      Cancel Order
                    </button>
                  )}
                  {selectedOrder.paymentStatus === 'Paid' && selectedOrder.status !== 'Refunded' && (
                    <button
                      onClick={() => setConfirmAction({ order: selectedOrder, action: 'refund' })}
                      className="px-4 py-2 rounded-xl text-xs font-bold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                    >
                      <Undo2 size={12} className="inline mr-1 -mt-0.5" /> Refund
                    </button>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm lifecycle action */}
      <Modal open={!!confirmAction} onClose={() => setConfirmAction(null)} title={null} width="max-w-sm">
        {confirmAction && (
          <div className="p-6">
            <h3 className="font-serif text-base font-bold" style={{ color: 'var(--admin-text)' }}>
              {confirmAction.action === 'cancel' ? 'Cancel this order?' : confirmAction.action === 'refund' ? 'Refund this order?' : 'Update order status?'}
            </h3>
            <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--admin-text-muted)' }}>
              {confirmAction.action === 'cancel'
                ? `${confirmAction.order.id} will be marked as cancelled. The customer will be notified.`
                : confirmAction.action === 'refund'
                ? `${confirmAction.order.id} will be marked as refunded. Make sure the payment has been returned to the customer.`
                : `${confirmAction.order.id} will move to "${statusFlow[confirmAction.order.status]}".`}
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <GhostButton onClick={() => setConfirmAction(null)}>Keep as is</GhostButton>
              <button
                onClick={doAction}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white"
                style={{ background: confirmAction.action === 'cancel' ? '#A94A5A' : 'linear-gradient(135deg, #A94A5A, #8E3D4C)' }}
              >
                {confirmAction.action === 'cancel' ? 'Cancel Order' : confirmAction.action === 'refund' ? 'Confirm Refund' : 'Confirm'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
