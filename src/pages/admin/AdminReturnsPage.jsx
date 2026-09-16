import { useState, useMemo } from 'react';
import { RotateCcw, Check, X, PackageCheck, Banknote } from 'lucide-react';
import {
  Card, PageHeader, EmptyState, StatusBadge, useToast,
} from '../../components/admin/ui/AdminUI';
import { useAdminData } from '../../context/AdminDataContext';
import { formatNaira } from '../../utils/currency';

const FLOW = {
  Requested: ['Approved', 'Rejected'],
  Approved: ['Received'],
  Received: ['Refunded'],
};

const NEXT_LABEL = {
  Approved: 'Approve Return',
  Rejected: 'Reject Request',
  Received: 'Mark Received',
  Refunded: 'Mark Refunded',
};

export default function AdminReturnsPage() {
  const { returns, updateReturnStatus, orders } = useAdminData();
  const { pushToast, ToastViewport } = useToast();
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return returns;
    return returns.filter((r) => r.status === statusFilter);
  }, [returns, statusFilter]);

  const counts = {
    all: returns.length,
    Requested: returns.filter((r) => r.status === 'Requested').length,
    Approved: returns.filter((r) => r.status === 'Approved').length,
    Received: returns.filter((r) => r.status === 'Received').length,
    Refunded: returns.filter((r) => r.status === 'Refunded').length,
    Rejected: returns.filter((r) => r.status === 'Rejected').length,
  };

  const orderFor = (r) => orders.find((o) => o.id === r.orderId);

  const advance = (r, next) => {
    updateReturnStatus(r.id, next);
    pushToast(`Return for ${r.orderId} → ${next}.`, next === 'Rejected' ? 'info' : 'success');
  };

  return (
    <div className="space-y-5">
      {ToastViewport}
      <PageHeader
        title="Returns"
        subtitle={returns.length ? `${returns.length} return request${returns.length !== 1 ? 's' : ''}` : 'Handle return and refund requests'}
        breadcrumb={['Operations']}
      />

      {returns.length === 0 ? (
        <Card>
          <EmptyState
            icon={RotateCcw}
            title="No return requests yet"
            description="When customers request a return or refund on the storefront, it will appear here for approval and processing."
          />
        </Card>
      ) : (
        <>
          {/* Status tabs */}
          <Card className="flex flex-wrap items-center gap-2">
            {[
              { key: 'all', label: `All (${counts.all})` },
              { key: 'Requested', label: `Requested (${counts.Requested})` },
              { key: 'Approved', label: `Approved (${counts.Approved})` },
              { key: 'Received', label: `Received (${counts.Received})` },
              { key: 'Refunded', label: `Refunded (${counts.Refunded})` },
              { key: 'Rejected', label: `Rejected (${counts.Rejected})` },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setStatusFilter(t.key)}
                className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold transition-all ${statusFilter === t.key ? 'text-white' : ''}`}
                style={statusFilter === t.key
                  ? { background: '#A94A5A' }
                  : { border: '1px solid var(--admin-border-soft)', color: 'var(--admin-text-muted)' }}
                aria-pressed={statusFilter === t.key}
              >
                {t.label}
              </button>
            ))}
          </Card>

          <div className="space-y-3">
            {filtered.map((r) => {
              const order = orderFor(r);
              const actions = FLOW[r.status] || [];
              return (
                <Card key={r.id}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-bold" style={{ color: 'var(--admin-text)' }}>{r.orderId}</p>
                        <StatusBadge status={r.status} />
                      </div>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--admin-text-faint)' }}>
                        {r.customerName || 'Customer'} ·{' '}
                        {r.date ? new Date(r.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                        {order ? ` · ${formatNaira(order.totalAmount)}` : ''}
                      </p>
                      {r.reason && (
                        <p className="text-xs mt-2" style={{ color: 'var(--admin-text-muted)' }}>
                          Reason: “{r.reason}”
                        </p>
                      )}
                    </div>

                    <div className="flex gap-1.5 shrink-0">
                      {actions.map((next) => (
                        <button
                          key={next}
                          onClick={() => advance(r, next)}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                          style={{
                            border: `1px solid ${next === 'Rejected' ? 'rgba(169,74,90,0.3)' : 'rgba(22,163,74,0.3)'}`,
                            color: next === 'Rejected' ? '#A94A5A' : '#16a34a',
                          }}
                        >
                          {next === 'Rejected' ? <X size={11} /> : <Check size={11} />}
                          {NEXT_LABEL[next]}
                        </button>
                      ))}
                    </div>
                  </div>
                </Card>
              );
            })}

            {filtered.length === 0 && (
              <Card>
                <EmptyState
                  icon={RotateCcw}
                  title="No returns in this view"
                  description="Try a different status filter."
                />
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
