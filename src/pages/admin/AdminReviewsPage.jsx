import { useState, useMemo } from 'react';
import { Star, Check, EyeOff, Trash2, MessageSquare } from 'lucide-react';
import {
  Card, PageHeader, EmptyState, Select, StatusBadge, ConfirmDialog, useToast,
} from '../../components/admin/ui/AdminUI';
import { useAdminData } from '../../context/AdminDataContext';

function Stars({ rating }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={11}
          className={i <= rating ? 'fill-amber-400' : ''}
          style={{ color: i <= rating ? '#f59e0b' : 'var(--admin-border)' }}
        />
      ))}
    </span>
  );
}

export default function AdminReviewsPage() {
  const { reviews, updateReviewStatus, deleteReview } = useAdminData();
  const { pushToast, ToastViewport } = useToast();

  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return reviews;
    return reviews.filter((r) => r.status === statusFilter);
  }, [reviews, statusFilter]);

  const counts = {
    all: reviews.length,
    Pending: reviews.filter((r) => r.status === 'Pending').length,
    Approved: reviews.filter((r) => r.status === 'Approved').length,
    Hidden: reviews.filter((r) => r.status === 'Hidden').length,
  };

  const handleDelete = () => {
    deleteReview(confirmDelete.id);
    pushToast('Review deleted.');
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-5">
      {ToastViewport}
      <PageHeader
        title="Reviews"
        subtitle={reviews.length ? `${reviews.length} customer review${reviews.length !== 1 ? 's' : ''}` : 'Moderate what customers say about your pieces'}
        breadcrumb={['Marketing']}
      />

      {reviews.length === 0 ? (
        <Card>
          <EmptyState
            icon={MessageSquare}
            title="No reviews yet"
            description="When customers review their purchases on the storefront, you can approve, hide or delete them here."
          />
        </Card>
      ) : (
        <>
          {/* Filter tabs */}
          <Card className="flex flex-wrap items-center gap-2">
            {[
              { key: 'all', label: `All (${counts.all})` },
              { key: 'Pending', label: `Pending (${counts.Pending})` },
              { key: 'Approved', label: `Approved (${counts.Approved})` },
              { key: 'Hidden', label: `Hidden (${counts.Hidden})` },
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
            {filtered.map((r) => (
              <Card key={r.id} className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg, #A94A5A, #8E3D4C)' }}
                >
                  {(r.customerName || '?').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-bold" style={{ color: 'var(--admin-text)' }}>{r.customerName}</p>
                    <Stars rating={r.rating} />
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--admin-text-faint)' }}>
                    {r.productName ? `on ${r.productName}` : 'General feedback'} ·{' '}
                    {r.date ? new Date(r.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                  </p>
                  {r.text && (
                    <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--admin-text-muted)' }}>
                      “{r.text}”
                    </p>
                  )}
                </div>

                <div className="flex sm:flex-col gap-1.5 shrink-0">
                  {r.status !== 'Approved' && (
                    <button
                      onClick={() => { updateReviewStatus(r.id, 'Approved'); pushToast('Review approved.'); }}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors hover:bg-green-500/10"
                      style={{ border: '1px solid rgba(22,163,74,0.3)', color: '#16a34a' }}
                    >
                      <Check size={11} /> Approve
                    </button>
                  )}
                  {r.status !== 'Hidden' && (
                    <button
                      onClick={() => { updateReviewStatus(r.id, 'Hidden'); pushToast('Review hidden.', 'info'); }}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ border: '1px solid var(--admin-border-soft)', color: 'var(--admin-text)' }}
                    >
                      <EyeOff size={11} /> Hide
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmDelete(r)}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors hover:bg-red-500/10"
                    style={{ border: '1px solid rgba(169,74,90,0.25)', color: '#A94A5A' }}
                  >
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
              </Card>
            ))}

            {filtered.length === 0 && (
              <Card>
                <EmptyState
                  icon={MessageSquare}
                  title="No reviews in this view"
                  description="Try a different status filter to see more reviews."
                />
              </Card>
            )}
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete review?"
        message="Are you sure you want to permanently delete this review? This action cannot be undone."
        confirmLabel="Delete Review"
      />
    </div>
  );
}
