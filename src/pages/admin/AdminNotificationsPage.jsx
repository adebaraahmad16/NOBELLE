import { useState, useMemo } from 'react';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import {
  Card, PageHeader, EmptyState, ConfirmDialog, useToast,
} from '../../components/admin/ui/AdminUI';
import { useAdminData } from '../../context/AdminDataContext';

const TYPE_ICONS = { order: '🛍', payment: '💳', review: '⭐', stock: '📦', return: '↩' };
const TYPE_LABELS = { order: 'Order', payment: 'Payment', review: 'Review', stock: 'Stock', return: 'Return' };

export default function AdminNotificationsPage() {
  const {
    notifications, markNotificationRead, markAllNotificationsRead, clearNotifications,
  } = useAdminData();
  const { pushToast, ToastViewport } = useToast();

  const [filter, setFilter] = useState('all');
  const [confirmClear, setConfirmClear] = useState(false);

  const filtered = useMemo(() => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter((n) => !n.read);
    return notifications.filter((n) => n.type === filter);
  }, [notifications, filter]);

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-5">
      {ToastViewport}
      <PageHeader
        title="Notifications"
        subtitle={notifications.length ? `${unread} unread of ${notifications.length}` : 'You\'re all caught up'}
        breadcrumb={['System']}
        actions={
          notifications.length > 0 && (
            <div className="flex gap-2">
              {unread > 0 && (
                <button
                  onClick={() => { markAllNotificationsRead(); pushToast('All notifications marked as read.'); }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}
                >
                  <CheckCheck size={13} /> Mark all read
                </button>
              )}
              <button
                onClick={() => setConfirmClear(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors hover:bg-red-500/10"
                style={{ border: '1px solid rgba(169,74,90,0.3)', color: '#A94A5A' }}
              >
                <Trash2 size={13} /> Clear all
              </button>
            </div>
          )
        }
      />

      {notifications.length === 0 ? (
        <Card>
          <EmptyState
            icon={Bell}
            title="You're all caught up"
            description="Notifications appear here when real events happen in your store — new orders, payments, low stock alerts, new reviews and return requests."
          />
        </Card>
      ) : (
        <>
          <Card className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All' },
              { key: 'unread', label: `Unread (${unread})` },
              { key: 'order', label: 'Orders' },
              { key: 'payment', label: 'Payments' },
              { key: 'review', label: 'Reviews' },
              { key: 'return', label: 'Returns' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold transition-all ${filter === t.key ? 'text-white' : ''}`}
                style={filter === t.key
                  ? { background: '#A94A5A' }
                  : { border: '1px solid var(--admin-border-soft)', color: 'var(--admin-text-muted)' }}
                aria-pressed={filter === t.key}
              >
                {t.label}
              </button>
            ))}
          </Card>

          <div className="space-y-2">
            {filtered.map((n) => (
              <Card
                key={n.id}
                className={`flex items-start gap-4 cursor-pointer transition-all ${!n.read ? '' : ''}`}
                style={!n.read ? { borderLeft: '3px solid #A94A5A' } : undefined}
              >
                <div
                  onClick={() => markNotificationRead(n.id)}
                  className="flex items-start gap-4 flex-1 min-w-0"
                >
                  <span className="text-lg leading-none mt-0.5">{TYPE_ICONS[n.type] || '🔔'}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-bold" style={{ color: 'var(--admin-text)' }}>{n.title}</p>
                      <span
                        className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                        style={{ background: 'var(--admin-surface-2)', color: 'var(--admin-text-faint)' }}
                      >
                        {TYPE_LABELS[n.type] || 'Event'}
                      </span>
                      {!n.read && (
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider" style={{ background: 'rgba(169,74,90,0.12)', color: '#A94A5A' }}>
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--admin-text-muted)' }}>{n.message}</p>
                    <p className="text-[10px] mt-1.5" style={{ color: 'var(--admin-text-faint)' }}>
                      {new Date(n.date).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                {!n.read && (
                  <button
                    onClick={() => markNotificationRead(n.id)}
                    className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg shrink-0"
                    style={{ background: 'var(--admin-red-dim)', color: '#A94A5A' }}
                  >
                    Mark read
                  </button>
                )}
              </Card>
            ))}

            {filtered.length === 0 && (
              <Card>
                <EmptyState icon={Bell} title="Nothing here" description="No notifications match this filter." />
              </Card>
            )}
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => { clearNotifications(); pushToast('Notification history cleared.'); }}
        title="Clear all notifications?"
        message="This removes your entire notification history. This action cannot be undone."
        confirmLabel="Clear All"
      />
    </div>
  );
}
