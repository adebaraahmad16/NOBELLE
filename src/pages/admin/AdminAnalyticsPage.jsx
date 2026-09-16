import { useState, useMemo } from 'react';
import { BarChart3, Banknote, ShoppingBag, Users, Package, TrendingUp } from 'lucide-react';
import {
  Card, PageHeader, EmptyState, Select, useToast,
} from '../../components/admin/ui/AdminUI';
import { useAdminData } from '../../context/AdminDataContext';
import { useProducts } from '../../context/ProductContext';
import { formatNaira } from '../../utils/currency';

const RANGES = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '365', label: 'This year' },
];

export default function AdminAnalyticsPage() {
  const { orders, customers } = useAdminData();
  const { products } = useProducts();
  const { pushToast, ToastViewport } = useToast();
  const [range, setRange] = useState('30');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const inRange = useMemo(() => {
    const now = new Date();
    let start = new Date(0);
    let end = new Date();

    if (customStart && customEnd) {
      start = new Date(customStart);
      end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
    } else {
      start = new Date(now.getTime() - Number(range) * 24 * 60 * 60 * 1000);
    }

    return orders.filter((o) => {
      const d = new Date(o.date || 0);
      return d >= start && d <= end;
    });
  }, [orders, range, customStart, customEnd]);

  const paid = inRange.filter((o) => o.paymentStatus === 'Paid' || o.status === 'Delivered');
  const revenue = paid.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
  const avgOrder = paid.length ? revenue / paid.length : 0;
  const unitsSold = paid.reduce(
    (s, o) => s + (o.items || []).reduce((x, i) => x + (Number(i.quantity) || 1), 0),
    0
  );

  // Product performance from real order items
  const productPerf = useMemo(() => {
    const tally = {};
    paid.forEach((o) => {
      (o.items || []).forEach((item) => {
        const k = item.productId || item.name;
        tally[k] = tally[k] || { name: item.name, qty: 0, revenue: 0 };
        tally[k].qty += Number(item.quantity) || 1;
        tally[k].revenue += (Number(item.price) || 0) * (Number(item.quantity) || 1);
      });
    });
    return Object.values(tally).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [paid]);

  // Customer growth in range
  const newCustomers = customers.filter((c) => {
    const d = new Date(c.joinedDate || 0);
    if (customStart && customEnd) {
      return d >= new Date(customStart) && d <= new Date(customEnd);
    }
    return d >= new Date(Date.now() - Number(range) * 24 * 60 * 60 * 1000);
  }).length;

  const hasEnoughData = paid.length > 0;

  const metrics = [
    { label: 'Revenue', value: formatNaira(revenue), icon: Banknote, accent: '#16a34a' },
    { label: 'Orders', value: String(inRange.length), icon: ShoppingBag, accent: '#A94A5A' },
    { label: 'Avg. Order Value', value: formatNaira(avgOrder), icon: TrendingUp, accent: '#2563eb' },
    { label: 'Products Sold', value: String(unitsSold), icon: Package, accent: '#7c3aed' },
    { label: 'New Customers', value: String(newCustomers), icon: Users, accent: '#d97706' },
  ];

  return (
    <div className="space-y-5">
      {ToastViewport}
      <PageHeader
        title="Reports & Analytics"
        subtitle="Everything on this page is calculated from your real store activity"
        breadcrumb={['Operations']}
      />

      {/* Range filters */}
      <Card className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => { setRange(r.value); setCustomStart(''); setCustomEnd(''); }}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${range === r.value && !customStart ? 'text-white' : ''}`}
              style={range === r.value && !customStart
                ? { background: '#A94A5A' }
                : { border: '1px solid var(--admin-border-soft)', color: 'var(--admin-text-muted)' }}
              aria-pressed={range === r.value && !customStart}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 md:ml-auto">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            aria-label="Custom start date"
            className="px-2.5 py-1.5 text-[11px] rounded-lg outline-none"
            style={{ background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border-soft)', color: 'var(--admin-text)' }}
          />
          <span className="text-[10px]" style={{ color: 'var(--admin-text-faint)' }}>to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            aria-label="Custom end date"
            className="px-2.5 py-1.5 text-[11px] rounded-lg outline-none"
            style={{ background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border-soft)', color: 'var(--admin-text)' }}
          />
        </div>
      </Card>

      {!hasEnoughData ? (
        <Card>
          <EmptyState
            icon={BarChart3}
            title="No analytics data available yet"
            description="Analytics are generated from real orders and payments. Once customers start purchasing, revenue, trends and product performance will appear here — nothing is estimated or simulated."
          />
        </Card>
      ) : (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {metrics.map((m) => (
              <Card key={m.label}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: `${m.accent}14` }}>
                  <m.icon size={14} style={{ color: m.accent }} />
                </div>
                <p className="text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--admin-text-muted)' }}>{m.label}</p>
                <p className="text-lg font-bold font-numeric mt-0.5 truncate" style={{ color: 'var(--admin-text)' }}>{m.value}</p>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Revenue trend */}
            <Card className="lg:col-span-2">
              <h2 className="font-serif text-sm font-bold mb-4" style={{ color: 'var(--admin-text)' }}>Revenue Trend</h2>
              <TrendChart orders={paid} />
            </Card>

            {/* Product performance */}
            <Card>
              <h2 className="font-serif text-sm font-bold mb-4" style={{ color: 'var(--admin-text)' }}>Product Performance</h2>
              {productPerf.length === 0 ? (
                <p className="text-xs p-3.5 rounded-xl" style={{ background: 'var(--admin-surface-2)', color: 'var(--admin-text-muted)' }}>
                  No product sales in this period.
                </p>
              ) : (
                <div className="space-y-3">
                  {productPerf.map((p, i) => {
                    const max = productPerf[0].revenue || 1;
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-bold truncate" style={{ color: 'var(--admin-text)' }}>{p.name}</span>
                          <span className="font-numeric shrink-0" style={{ color: 'var(--admin-text-muted)' }}>{formatNaira(p.revenue)}</span>
                        </div>
                        <div className="h-1.5 rounded-full mt-1.5" style={{ background: 'var(--admin-border-soft)' }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${(p.revenue / max) * 100}%`, background: 'linear-gradient(90deg, #A94A5A, #8E3D4C)' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Sales trend note */}
          <Card>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--admin-red-dim)' }}>
                <TrendingUp size={15} style={{ color: '#A94A5A' }} />
              </div>
              <div>
                <p className="text-xs font-bold" style={{ color: 'var(--admin-text)' }}>Sales trends</p>
                <p className="text-xs mt-1" style={{ color: 'var(--admin-text-muted)' }}>
                  {paid.length} paid order{paid.length !== 1 ? 's' : ''} in the selected period generating {formatNaira(revenue)}.
                  {inRange.length > paid.length && ` ${inRange.length - paid.length} order(s) are awaiting payment confirmation.`}
                </p>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

/* Simple SVG trend chart built from real order data */
function TrendChart({ orders }) {
  const byDay = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const sum = orders
        .filter((o) => (o.date || '').slice(0, 10) === key)
        .reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
      days.push({ key, value: sum, label: d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) });
    }
    return days;
  }, [orders]);

  const max = Math.max(...byDay.map((d) => d.value), 1);
  const W = 560;
  const H = 180;
  const step = byDay.length > 1 ? W / (byDay.length - 1) : W;
  const points = byDay.map((d, i) => `${i * step},${H - (d.value / max) * (H - 20) - 10}`).join(' ');

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + 24}`} className="w-full" role="img" aria-label="Revenue trend chart">
        <polyline
          points={points}
          fill="none"
          stroke="#A94A5A"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {byDay.map((d, i) => (
          <g key={d.key}>
            <circle
              cx={i * step}
              cy={H - (d.value / max) * (H - 20) - 10}
              r="3.5"
              fill="#A94A5A"
            />
            {i % 2 === 0 && (
              <text x={i * step} y={H + 14} textAnchor="middle" fontSize="9" fill="var(--admin-text-faint)">
                {d.label}
              </text>
            )}
          </g>
        ))}
      </svg>
      <div className="flex justify-between text-[10px] mt-1" style={{ color: 'var(--admin-text-faint)' }}>
        <span>{byDay[0]?.label}</span>
        <span>Peak: {formatNaira(max)}</span>
        <span>{byDay[byDay.length - 1]?.label}</span>
      </div>
    </div>
  );
}
