import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Banknote, ShoppingBag, Package, Users, Clock, AlertTriangle,
  Plus, ChevronRight, TrendingUp, Star,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Card, PageHeader, EmptyState, CardsSkeleton, ChartSkeleton, PrimaryButton,
} from '../../components/admin/ui/AdminUI';
import { useAdminData } from '../../context/AdminDataContext';
import { useProducts } from '../../context/ProductContext';
import { formatNaira } from '../../utils/currency';

const LOW_STOCK_THRESHOLD = 5;

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { orders, customers, activityLogs } = useAdminData();
  const { products } = useProducts();
  const [loading, setLoading] = useState(true);

  // Brief loading state so skeletons are shown on first paint.
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, []);

  const paidOrders = orders.filter((o) => o.paymentStatus === 'Paid' || o.status === 'Delivered');
  const totalSales = paidOrders.reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);
  const pendingOrders = orders.filter((o) => o.status === 'Pending' || o.status === 'Processing').length;
  const lowStock = products.filter(
    (p) => p.trackStock !== false && Number(p.stock) <= LOW_STOCK_THRESHOLD
  );
  const hasData = orders.length > 0 || products.length > 0 || customers.length > 0;

  // Sales trend from real orders (last 7 days, grouped by day)
  const salesByDay = (() => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const sum = paidOrders
        .filter((o) => (o.date || '').slice(0, 10) === key)
        .reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);
      days.push({ key, label: d.toLocaleDateString('en-NG', { weekday: 'short' }), value: sum });
    }
    return days;
  })();
  const maxDay = Math.max(...salesByDay.map((d) => d.value), 1);

  const cards = [
    { name: 'Total Sales', value: formatNaira(totalSales), sub: paidOrders.length ? `${paidOrders.length} paid order${paidOrders.length !== 1 ? 's' : ''}` : 'No sales yet', icon: Banknote, accent: '#16a34a', path: '/admin/payments' },
    { name: 'Orders', value: String(orders.length), sub: orders.length ? `${pendingOrders} awaiting action` : 'No orders yet', icon: ShoppingBag, accent: '#A94A5A', path: '/admin/orders' },
    { name: 'Products', value: String(products.length), sub: products.length ? 'In your catalog' : 'Catalog is empty', icon: Package, accent: '#2563eb', path: '/admin/products' },
    { name: 'Customers', value: String(customers.length), sub: customers.length ? 'Registered shoppers' : 'No customers yet', icon: Users, accent: '#7c3aed', path: '/admin/customers' },
    { name: 'Pending Orders', value: String(pendingOrders), sub: pendingOrders ? 'Needs confirmation' : 'Nothing pending', icon: Clock, accent: '#d97706', path: '/admin/orders' },
    { name: 'Low Stock', value: String(lowStock.length), sub: lowStock.length ? 'Restock soon' : 'Stock levels healthy', icon: AlertTriangle, accent: lowStock.length ? '#A94A5A' : '#737373', path: '/admin/inventory' },
  ];

  const recentOrders = orders.slice(0, 5);

  // Best sellers derived from real order line items
  const bestSellers = (() => {
    const tally = {};
    orders.forEach((o) => {
      (o.items || []).forEach((item) => {
        const k = item.productId || item.name;
        tally[k] = tally[k] || { name: item.name, qty: 0, image: item.image };
        tally[k].qty += item.quantity || 1;
      });
    });
    return Object.values(tally).sort((a, b) => b.qty - a.qty).slice(0, 4);
  })();

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" subtitle="Store overview at a glance" breadcrumb={['Home']} />
        <CardsSkeleton count={6} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ChartSkeleton />
          </div>
          <CardsSkeleton count={1} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={hasData ? 'Here is what is happening in your store today.' : 'Welcome to your NOBELLE admin studio.'}
        breadcrumb={['Home']}
        actions={
          <>
            <button
              onClick={() => navigate('/admin/categories')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:bg-black/5 dark:hover:bg-white/5"
              style={{ border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
            >
              Add Category
            </button>
            <PrimaryButton onClick={() => navigate('/admin/products/new')}>
              <Plus size={14} />
              Add Product
            </PrimaryButton>
          </>
        }
      />

      {/* ── First-run: nothing exists yet ── */}
      {!hasData && (
        <Card className="relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 justify-between">
            <div>
              <h2 className="font-serif text-lg font-bold" style={{ color: 'var(--admin-text)' }}>
                Set up your store
              </h2>
              <p className="text-xs mt-1 max-w-lg leading-relaxed" style={{ color: 'var(--admin-text-muted)' }}>
                Your dashboard is empty because no data exists yet. Start by creating your first
                product and organising your catalog — sales figures, orders and analytics will
                appear here automatically as real activity happens.
              </p>
            </div>
            <PrimaryButton onClick={() => navigate('/admin/products/new')} className="shrink-0">
              <Plus size={14} />
              Add Your First Product
            </PrimaryButton>
          </div>
        </Card>
      )}

      {/* ── Overview cards (all real values) ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.25 }}
            onClick={() => navigate(card.path)}
            onKeyDown={(e) => e.key === 'Enter' && navigate(card.path)}
            role="link"
            tabIndex={0}
            className="p-4 sm:p-5 rounded-2xl cursor-pointer transition-all hover:-translate-y-0.5"
            style={{
              background: 'var(--admin-surface)',
              border: '1px solid var(--admin-border)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${card.accent}14` }}>
              <card.icon size={15} style={{ color: card.accent }} />
            </div>
            <p className="text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--admin-text-muted)' }}>
              {card.name}
            </p>
            <h3 className="text-lg sm:text-xl font-bold font-numeric mt-0.5" style={{ color: 'var(--admin-text)' }}>
              {card.value}
            </h3>
            <p className="text-[10px] mt-1 truncate" style={{ color: 'var(--admin-text-faint)' }}>
              {card.sub}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Sales overview ── */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-serif text-sm font-bold" style={{ color: 'var(--admin-text)' }}>Sales Overview</h2>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--admin-text-muted)' }}>Paid orders, last 7 days</p>
            </div>
            <TrendingUp size={15} style={{ color: 'var(--admin-text-faint)' }} />
          </div>

          {totalSales === 0 ? (
            <EmptyState
              compact
              icon={TrendingUp}
              title="No sales data available yet"
              description="Once customers start placing paid orders, your sales performance will be charted here."
              action={
                <button
                  onClick={() => navigate('/admin/orders')}
                  className="text-xs font-bold underline"
                  style={{ color: '#A94A5A' }}
                >
                  View Orders
                </button>
              }
            />
          ) : (
            <div className="flex items-end gap-2 sm:gap-3" style={{ height: 200 }}>
              {salesByDay.map((d) => (
                <div key={d.key} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div
                    className="w-full rounded-t-lg transition-all"
                    style={{
                      height: `${Math.max((d.value / maxDay) * 100, d.value > 0 ? 4 : 1)}%`,
                      background: d.value > 0 ? 'linear-gradient(180deg, #A94A5A, #8E3D4C)' : 'var(--admin-border-soft)',
                      minHeight: 4,
                    }}
                    title={`${d.label}: ${formatNaira(d.value)}`}
                  />
                  <span className="text-[9px]" style={{ color: 'var(--admin-text-faint)' }}>{d.label}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* ── Low stock ── */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-sm font-bold" style={{ color: 'var(--admin-text)' }}>Low Stock</h2>
            <button onClick={() => navigate('/admin/inventory')} className="text-[11px] font-bold" style={{ color: '#A94A5A' }}>
              Manage
            </button>
          </div>
          {lowStock.length === 0 ? (
            <EmptyState
              compact
              icon={Package}
              title={products.length === 0 ? 'No inventory data yet' : 'No low-stock products'}
              description={
                products.length === 0
                  ? 'Add products with stock levels to monitor inventory here.'
                  : 'All tracked products are above the low-stock threshold.'
              }
            />
          ) : (
            <div className="space-y-2.5">
              {lowStock.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 py-1.5">
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate" style={{ color: 'var(--admin-text)' }}>{p.name}</p>
                    <p className="text-[10px]" style={{ color: 'var(--admin-text-muted)' }}>
                      {p.sku || 'No SKU'} · {p.category || 'Uncategorized'}
                    </p>
                  </div>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                    style={{
                      background: Number(p.stock) === 0 ? 'rgba(169,74,90,0.1)' : 'rgba(217,119,6,0.12)',
                      color: Number(p.stock) === 0 ? '#A94A5A' : '#d97706',
                    }}
                  >
                    {p.stock} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Recent orders ── */}
        <Card className="lg:col-span-2" padded={false}>
          <div className="p-5 pb-3 flex items-center justify-between">
            <h2 className="font-serif text-sm font-bold" style={{ color: 'var(--admin-text)' }}>Recent Orders</h2>
            <button
              onClick={() => navigate('/admin/orders')}
              className="text-[11px] font-bold flex items-center gap-0.5"
              style={{ color: '#A94A5A' }}
            >
              View All <ChevronRight size={11} />
            </button>
          </div>
          {recentOrders.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="No orders yet"
              description="When customers check out on your storefront, their orders will appear here for fulfilment."
              action={<PrimaryButton onClick={() => navigate('/admin/products/new')}>Start Selling</PrimaryButton>}
            />
          ) : (
            <div className="overflow-x-auto px-2 pb-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr
                    className="text-[9px] uppercase font-bold tracking-[0.14em]"
                    style={{ borderBottom: '1px solid var(--admin-border-soft)', color: 'var(--admin-text-muted)' }}
                  >
                    <th className="py-2.5 px-3">Order</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Total</th>
                    <th className="py-2.5 px-3">Payment</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr
                      key={o.id}
                      onClick={() => navigate(`/admin/orders?search=${encodeURIComponent(o.id)}`)}
                      className="text-xs cursor-pointer transition-colors hover:bg-black/[0.03] dark:hover:bg-white/5"
                    >
                      <td className="py-3 px-3 font-bold" style={{ color: 'var(--admin-text)' }}>{o.id}</td>
                      <td className="py-3 px-3" style={{ color: 'var(--admin-text-muted)' }}>{o.customerName}</td>
                      <td className="py-3 px-3 font-bold font-numeric" style={{ color: 'var(--admin-text)' }}>{formatNaira(o.totalAmount)}</td>
                      <td className="py-3 px-3">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{
                            background: o.paymentStatus === 'Paid' ? 'rgba(22,163,74,0.12)' : 'rgba(217,119,6,0.12)',
                            color: o.paymentStatus === 'Paid' ? '#16a34a' : '#d97706',
                          }}
                        >
                          {o.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--admin-red-dim)', color: '#A94A5A' }}>
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* ── Best sellers ── */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-sm font-bold" style={{ color: 'var(--admin-text)' }}>Best Selling Products</h2>
            <Star size={14} style={{ color: 'var(--admin-text-faint)' }} />
          </div>
          {bestSellers.length === 0 ? (
            <EmptyState
              compact
              icon={Star}
              title="No sales data available yet"
              description="Your top sellers will be ranked here based on real order quantities."
            />
          ) : (
            <div className="space-y-3">
              {bestSellers.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-11 rounded-lg overflow-hidden shrink-0" style={{ background: 'var(--admin-surface-2)' }}>
                    {p.image ? (
                      <img src={p.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package size={13} style={{ color: 'var(--admin-text-faint)' }} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate" style={{ color: 'var(--admin-text)' }}>{p.name}</p>
                    <p className="text-[10px]" style={{ color: 'var(--admin-text-muted)' }}>{p.qty} sold</p>
                  </div>
                  <span className="text-[10px] font-bold font-numeric" style={{ color: 'var(--admin-text-faint)' }}>#{i + 1}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
