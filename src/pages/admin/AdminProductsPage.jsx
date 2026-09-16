import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Package, Filter, ArrowUpDown } from 'lucide-react';
import {
  Card, PageHeader, EmptyState, SearchInput, Select, StatusBadge,
  PrimaryButton, ConfirmDialog, Pagination, TableSkeleton, useToast,
} from '../../components/admin/ui/AdminUI';
import { useProducts } from '../../context/ProductContext';
import { useAdminData } from '../../context/AdminDataContext';
import { formatNaira } from '../../utils/currency';

const ITEMS_PER_PAGE = 8;

export default function AdminProductsPage() {
  const navigate = useNavigate();
  const { products, deleteProduct } = useProducts();
  const { addActivityLog, categories } = useAdminData();
  const { pushToast, ToastViewport } = useToast();

  const [loading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = useMemo(() => {
    let list = [...products];
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) => p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)
      );
    }
    if (selectedCategory !== 'all') list = list.filter((p) => p.category === selectedCategory);
    if (selectedStatus !== 'all') list = list.filter((p) => p.status === selectedStatus);

    switch (sortBy) {
      case 'price-low': list.sort((a, b) => a.price - b.price); break;
      case 'price-high': list.sort((a, b) => b.price - a.price); break;
      case 'name': list.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'stock-low': list.sort((a, b) => (a.stock || 0) - (b.stock || 0)); break;
      case 'newest':
      default:
        list.sort((a, b) => new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0));
    }
    return list;
  }, [products, searchTerm, selectedCategory, selectedStatus, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const handleDelete = () => {
    const product = confirmDelete;
    deleteProduct(product.id);
    addActivityLog('Product Deleted', `Deleted product "${product.name}"`);
    pushToast(`"${product.name}" deleted successfully.`);
    setConfirmDelete(null);
  };

  const stockBadge = (p) => {
    if (p.trackStock === false) return <span className="text-[10px] font-bold" style={{ color: 'var(--admin-text-faint)' }}>Not tracked</span>;
    const s = Number(p.stock) || 0;
    if (s === 0) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(169,74,90,0.1)', color: '#A94A5A' }}>Out of stock</span>;
    if (s <= 5) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(217,119,6,0.12)', color: '#d97706' }}>{s} left</span>;
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(22,163,74,0.12)', color: '#16a34a' }}>{s} in stock</span>;
  };

  return (
    <div className="space-y-5">
      {ToastViewport}
      <PageHeader
        title="Products"
        subtitle={products.length ? `${products.length} product${products.length !== 1 ? 's' : ''} in your catalog` : 'Build your NOBELLE catalog'}
        breadcrumb={['Catalog']}
        actions={
          <PrimaryButton onClick={() => navigate('/admin/products/new')}>
            <Plus size={14} /> Add Product
          </PrimaryButton>
        }
      />

      {/* Filters toolbar */}
      {products.length > 0 && (
        <Card className="flex flex-col md:flex-row md:items-center gap-3">
          <SearchInput
            className="flex-1"
            value={searchTerm}
            onChange={(v) => { setSearchTerm(v); setPage(1); }}
            placeholder="Search by product name or SKU..."
            ariaLabel="Search products"
          />
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={13} style={{ color: 'var(--admin-text-faint)' }} />
            <Select
              value={selectedCategory}
              onChange={(v) => { setSelectedCategory(v); setPage(1); }}
              ariaLabel="Filter by category"
              options={[
                { value: 'all', label: 'All Categories' },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
            <Select
              value={selectedStatus}
              onChange={(v) => { setSelectedStatus(v); setPage(1); }}
              ariaLabel="Filter by status"
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'Draft', label: 'Draft' },
                { value: 'Active', label: 'Active' },
                { value: 'Out of Stock', label: 'Out of Stock' },
                { value: 'Archived', label: 'Archived' },
              ]}
            />
            <Select
              value={sortBy}
              onChange={setSortBy}
              ariaLabel="Sort products"
              options={[
                { value: 'newest', label: 'Newest' },
                { value: 'name', label: 'Name A–Z' },
                { value: 'price-low', label: 'Price: Low → High' },
                { value: 'price-high', label: 'Price: High → Low' },
                { value: 'stock-low', label: 'Stock: Low → High' },
              ]}
            />
          </div>
        </Card>
      )}

      {/* Product table / empty state */}
      {loading ? (
        <Card padded={false}><TableSkeleton rows={5} cols={5} /></Card>
      ) : products.length === 0 ? (
        <Card>
          <EmptyState
            icon={Package}
            title="No products yet"
            description="Start building your NOBELLE catalog. Products you publish will appear on the storefront instantly."
            action={<PrimaryButton onClick={() => navigate('/admin/products/new')}><Plus size={14} /> Add Product</PrimaryButton>}
          />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={Package}
            title="No products match your filters"
            description="Try adjusting the search term or clearing the category and status filters."
            action={
              <button
                onClick={() => { setSearchTerm(''); setSelectedCategory('all'); setSelectedStatus('all'); }}
                className="text-xs font-bold underline"
                style={{ color: '#A94A5A' }}
              >
                Clear all filters
              </button>
            }
          />
        </Card>
      ) : (
        <Card padded={false}>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr
                  className="text-[9px] uppercase font-bold tracking-[0.14em]"
                  style={{ borderBottom: '1px solid var(--admin-border-soft)', color: 'var(--admin-text-muted)', background: 'var(--admin-surface-2)' }}
                >
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">SKU</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((p) => (
                  <tr
                    key={p.id}
                    className="text-xs transition-colors hover:bg-black/[0.03] dark:hover:bg-white/5"
                    style={{ borderBottom: '1px solid var(--admin-border-soft)' }}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-12 rounded-xl overflow-hidden shrink-0" style={{ background: 'var(--admin-surface-2)' }}>
                          {p.image ? (
                            <img src={p.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package size={14} style={{ color: 'var(--admin-text-faint)' }} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold truncate max-w-[220px]" style={{ color: 'var(--admin-text)' }}>{p.name}</p>
                          <p className="text-[10px] mt-0.5" style={{ color: 'var(--admin-text-faint)' }}>
                            {p.sizes?.length ? p.sizes.join(' · ') : 'No sizes'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px]" style={{ color: 'var(--admin-text-muted)' }}>
                      {p.sku || '—'}
                    </td>
                    <td className="py-3 px-4 capitalize" style={{ color: 'var(--admin-text-muted)' }}>
                      {p.category ? String(p.category).replace(/-/g, ' ') : 'Uncategorized'}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold font-numeric" style={{ color: 'var(--admin-text)' }}>{formatNaira(p.price)}</p>
                      {p.salePrice && Number(p.salePrice) < Number(p.price) && (
                        <p className="text-[10px]" style={{ color: '#16a34a' }}>Sale: {formatNaira(p.salePrice)}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">{stockBadge(p)}</td>
                    <td className="py-3 px-4"><StatusBadge status={p.status || 'Active'} /></td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/admin/products/edit/${p.id}`)}
                          className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                          style={{ color: 'var(--admin-text-muted)' }}
                          title="Edit product"
                          aria-label={`Edit ${p.name}`}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(p)}
                          className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                          style={{ color: '#A94A5A' }}
                          title="Delete product"
                          aria-label={`Delete ${p.name}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y" style={{ borderColor: 'var(--admin-border-soft)' }}>
            {pageItems.map((p) => (
              <div key={p.id} className="p-4 flex gap-3">
                <div className="w-14 h-16 rounded-xl overflow-hidden shrink-0" style={{ background: 'var(--admin-surface-2)' }}>
                  {p.image ? (
                    <img src={p.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={16} style={{ color: 'var(--admin-text-faint)' }} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate" style={{ color: 'var(--admin-text)' }}>{p.name}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--admin-text-muted)' }}>
                    {p.sku || 'No SKU'} · {p.category ? String(p.category).replace(/-/g, ' ') : 'Uncategorized'}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs font-bold font-numeric" style={{ color: 'var(--admin-text)' }}>{formatNaira(p.price)}</span>
                    {stockBadge(p)}
                    <StatusBadge status={p.status || 'Active'} />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => navigate(`/admin/products/edit/${p.id}`)}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold"
                      style={{ border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmDelete(p)}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold"
                      style={{ border: '1px solid rgba(169,74,90,0.3)', color: '#A94A5A' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            page={safePage}
            totalPages={totalPages}
            onPageChange={setPage}
            total={filtered.length}
            label={filtered.length === 1 ? 'product' : 'products'}
          />
        </Card>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete product?"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete Product"
      />
    </div>
  );
}

