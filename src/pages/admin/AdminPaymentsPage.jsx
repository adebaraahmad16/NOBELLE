import { useState, useMemo } from 'react';
import { CreditCard, Search } from 'lucide-react';
import {
  Card, PageHeader, EmptyState, SearchInput, Select, StatusBadge, useToast,
} from '../../components/admin/ui/AdminUI';
import { useAdminData } from '../../context/AdminDataContext';
import { formatNaira } from '../../utils/currency';

export default function AdminPaymentsPage() {
  const { transactions, orders } = useAdminData();
  const { pushToast, ToastViewport } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Transactions are the source of truth; if none exist yet, show empty state.
  const filtered = useMemo(() => {
    let list = [...transactions];
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.reference?.toLowerCase().includes(q) ||
          t.orderId?.toLowerCase().includes(q) ||
          t.customerName?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') list = list.filter((t) => t.status === statusFilter);
    return list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [transactions, searchTerm, statusFilter]);

  const successful = transactions.filter((t) => t.status === 'Successful');
  const totalSuccessful = successful.reduce((s, t) => s + (Number(t.amount) || 0), 0);

  return (
    <div className="space-y-5">
      {ToastViewport}
      <PageHeader
        title="Payments"
        subtitle={transactions.length ? `${transactions.length} transaction${transactions.length !== 1 ? 's' : ''}` : 'Payment activity from real orders'}
        breadcrumb={['Sales']}
      />

      {transactions.length === 0 ? (
        <Card>
          <EmptyState
            icon={CreditCard}
            title="No transactions yet"
            description="When customers pay for orders through your configured payment provider, the transactions will be listed here with their references and statuses."
          />
        </Card>
      ) : (
        <>
          {/* Summary strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <p className="text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--admin-text-muted)' }}>Total settled</p>
              <p className="text-lg font-bold font-numeric mt-1" style={{ color: 'var(--admin-text)' }}>{formatNaira(totalSuccessful)}</p>
            </Card>
            <Card>
              <p className="text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--admin-text-muted)' }}>Successful</p>
              <p className="text-lg font-bold font-numeric mt-1" style={{ color: '#16a34a' }}>{successful.length}</p>
            </Card>
            <Card>
              <p className="text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--admin-text-muted)' }}>Pending</p>
              <p className="text-lg font-bold font-numeric mt-1" style={{ color: '#d97706' }}>
                {transactions.filter((t) => t.status === 'Pending').length}
              </p>
            </Card>
            <Card>
              <p className="text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--admin-text-muted)' }}>Failed / Refunded</p>
              <p className="text-lg font-bold font-numeric mt-1" style={{ color: '#A94A5A' }}>
                {transactions.filter((t) => t.status === 'Failed' || t.status === 'Refunded').length}
              </p>
            </Card>
          </div>

          {/* Filters */}
          <Card className="flex flex-col md:flex-row md:items-center gap-3">
            <SearchInput
              className="flex-1"
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by reference, order or customer..."
              ariaLabel="Search transactions"
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              ariaLabel="Filter by payment status"
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'Successful', label: 'Successful' },
                { value: 'Pending', label: 'Pending' },
                { value: 'Failed', label: 'Failed' },
                { value: 'Refunded', label: 'Refunded' },
              ]}
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
                    <th className="py-3.5 px-4">Transaction</th>
                    <th className="py-3.5 px-4">Order</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 px-4">Method</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr
                      key={t.id}
                      className="text-xs transition-colors hover:bg-black/[0.03] dark:hover:bg-white/5"
                      style={{ borderBottom: '1px solid var(--admin-border-soft)' }}
                    >
                      <td className="py-3 px-4 font-mono text-[11px] font-bold" style={{ color: 'var(--admin-text)' }}>{t.reference || t.id}</td>
                      <td className="py-3 px-4 font-semibold" style={{ color: 'var(--admin-text)' }}>{t.orderId}</td>
                      <td className="py-3 px-4" style={{ color: 'var(--admin-text-muted)' }}>{t.customerName || '—'}</td>
                      <td className="py-3 px-4 text-right font-bold font-numeric" style={{ color: 'var(--admin-text)' }}>{formatNaira(t.amount)}</td>
                      <td className="py-3 px-4 capitalize" style={{ color: 'var(--admin-text-muted)' }}>{t.method || '—'}</td>
                      <td className="py-3 px-4 text-[11px]" style={{ color: 'var(--admin-text-muted)' }}>
                        {t.date ? new Date(t.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td className="py-3 px-4 text-center"><StatusBadge status={t.status} /></td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-xs" style={{ color: 'var(--admin-text-muted)' }}>
                        No transactions match your search or filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
