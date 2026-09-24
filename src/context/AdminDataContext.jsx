import { createContext, useContext, useState, useEffect } from 'react';
import { getAdminUser } from '../utils/api';

const AdminDataContext = createContext();

const DATA_VERSION = 'nobelle_v4_nigerian_fashion';

function loadState(key, defaultValue) {
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error(`Failed to parse ${key}:`, e);
    }
  }
  return defaultValue;
}

function saveState(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ─────────────────────────────────────────────────────────────
// NOBELLE Admin Data Layer
//
// DATA PRINCIPLE: every collection below starts EMPTY. No demo
// products, customers, orders, transactions, reviews, coupons,
// inventory or analytics are invented anywhere in this file. The
// dashboard renders elegant empty states until real records are
// created by administrators or arrive from the storefront /
// a connected backend API.
// ─────────────────────────────────────────────────────────────

export function AdminDataProvider({ children }) {
  if (localStorage.getItem('nobelle_data_version') !== DATA_VERSION) {
    [
      'nobelle_admin_categories', 'nobelle_admin_customers', 'nobelle_admin_orders',
      'nobelle_admin_discounts', 'nobelle_admin_reviews', 'nobelle_admin_subscribers',
      'nobelle_admin_campaigns', 'nobelle_admin_cms', 'nobelle_admin_users',
      'nobelle_admin_logs', 'nobelle_admin_collections', 'nobelle_admin_returns',
      'nobelle_admin_notifications', 'nobelle_admin_transactions', 'nobelle_admin_delivery',
      'nobelle_admin_settings',
    ].forEach((k) => localStorage.removeItem(k));
    localStorage.setItem('nobelle_data_version', DATA_VERSION);
  }

  // ── 1. STORE SETTINGS (brand-neutral operational defaults only) ──
  const defaultSettings = {
    storeName: 'NOBELLE',
    logo: '',
    currency: 'NGN',
    contactEmail: '',
    contactPhone: '',
    address: '',
    lowStockThreshold: 5,
    trackStock: true,
    allowCancellations: true,
    cancellationWindowHours: 24,
    returnsWindowDays: 14,
    deliveryZones: [], // [{ id, name, fee, eta }]
    paymentProvider: '', // configured by admin in Settings
    paymentConfig: { publicKey: '', secretKey: '' },
  };
  const [settings, setSettings] = useState(() => loadState('nobelle_admin_settings', defaultSettings));

  // ── 2. CATEGORIES ──
  const [categories, setCategories] = useState(() => loadState('nobelle_admin_categories', []));

  // ── 3. COLLECTIONS ──
  const [collections, setCollections] = useState(() => loadState('nobelle_admin_collections', []));

  // ── 4. CUSTOMERS (registered via storefront accounts / checkout) ──
  const [customers, setCustomers] = useState(() => loadState('nobelle_admin_customers', []));

  // ── 5. ORDERS (created by real storefront checkout) ──
  const [orders, setOrders] = useState(() => loadState('nobelle_admin_orders', []));

  // ── 6. PAYMENT TRANSACTIONS (logged when orders are paid) ──
  const [transactions, setTransactions] = useState(() => loadState('nobelle_admin_transactions', []));

  // ── 7. DISCOUNTS / COUPONS ──
  const [discounts, setDiscounts] = useState(() => loadState('nobelle_admin_discounts', []));

  // ── 8. REVIEWS (submitted by real customers) ──
  const [reviews, setReviews] = useState(() => loadState('nobelle_admin_reviews', []));

  // ── 9. RETURNS / REFUND REQUESTS ──
  const [returns, setReturns] = useState(() => loadState('nobelle_admin_returns', []));

  // ── 10. NEWSLETTER SUBSCRIBERS (real signups from the storefront) ──
  const [subscribers, setSubscribers] = useState(() => loadState('nobelle_admin_subscribers', []));

  // ── 11. NOTIFICATIONS (event-driven: orders, stock, reviews…) ──
  const [notifications, setNotifications] = useState(() => loadState('nobelle_admin_notifications', []));

  // ── 11. WEBSITE / CMS CONTENT (managed in Website Manager) ──
  const defaultCMS = {
    homepage: {
      heroTitle: '',
      heroSubtitle: '',
      heroImage: '',
      heroTagline: 'Modern Nigerian Women\'s Fashion',
      ctaText: 'Shop Collection',
      ctaLink: '/shop',
      banners: [], // [{ id, title, subtitle, image, link }]
      featuredProductIds: [],
      featuredCollectionTitle: 'The Ankara Edit',
    },
    pages: {
      about: { title: 'About NOBELLE', content: '' },
      contact: { title: 'Contact Us', content: '' },
      navigation: {
        main: [
          { label: 'Shop', href: '/shop' },
          { label: 'Categories', href: '/categories' },
          { label: 'About', href: '/about' },
          { label: 'Contact', href: '/contact' },
        ],
      },
    },
  };
  const [cms, setCms] = useState(() => {
    const saved = loadState('nobelle_admin_cms', null);
    if (saved) return saved;
    return defaultCMS;
  });

  // ── 12. ACTIVITY LOGS ──
  const [activityLogs, setActivityLogs] = useState(() => loadState('nobelle_admin_logs', []));

  // ── PERSISTENCE ──
  useEffect(() => saveState('nobelle_admin_settings', settings), [settings]);
  useEffect(() => saveState('nobelle_admin_categories', categories), [categories]);
  useEffect(() => saveState('nobelle_admin_collections', collections), [collections]);
  useEffect(() => saveState('nobelle_admin_customers', customers), [customers]);
  useEffect(() => saveState('nobelle_admin_orders', orders), [orders]);
  useEffect(() => saveState('nobelle_admin_transactions', transactions), [transactions]);
  useEffect(() => saveState('nobelle_admin_discounts', discounts), [discounts]);
  useEffect(() => saveState('nobelle_admin_reviews', reviews), [reviews]);
  useEffect(() => saveState('nobelle_admin_returns', returns), [returns]);
  useEffect(() => saveState('nobelle_admin_subscribers', subscribers), [subscribers]);
  useEffect(() => saveState('nobelle_admin_notifications', notifications), [notifications]);
  useEffect(() => saveState('nobelle_admin_cms', cms), [cms]);
  useEffect(() => saveState('nobelle_admin_logs', activityLogs), [activityLogs]);

  // ── INTERNAL: event notifications + logging ──
  const pushNotification = (type, title, message, link) => {
    setNotifications((prev) => [
      { id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`, type, title, message, link, date: new Date().toISOString(), read: false },
      ...prev,
    ]);
  };

  const addActivityLog = (action, details) => {
    const email = getAdminUser()?.email || 'system';
    setActivityLogs((prev) => [
      { id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`, user: email, action, details, timestamp: new Date().toISOString() },
      ...prev,
    ]);
  };

  const id = (prefix) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

  // ── SETTINGS ──
  const updateStoreSettings = (patch) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  // ── CATEGORIES ──
  const addCategory = (category) => {
    const record = { id: category.id || id('cat'), ...category, productCount: 0 };
    setCategories((prev) => [...prev, record]);
    addActivityLog('Category Created', `Created category "${record.name}"`);
    return record;
  };
  const updateCategory = (cid, updated) => {
    setCategories((prev) => prev.map((c) => (c.id === cid ? { ...c, ...updated } : c)));
    addActivityLog('Category Updated', `Updated category "${updated.name || cid}"`);
  };
  const deleteCategory = (cid) => {
    setCategories((prev) => prev.filter((c) => c.id !== cid));
    addActivityLog('Category Deleted', `Removed category ${cid}`);
  };

  // ── COLLECTIONS ──
  const addCollection = (collection) => {
    const record = { id: collection.id || id('col'), ...collection, active: collection.active ?? true };
    setCollections((prev) => [...prev, record]);
    addActivityLog('Collection Created', `Created collection "${record.name}"`);
    return record;
  };
  const updateCollection = (cid, updated) => {
    setCollections((prev) => prev.map((c) => (c.id === cid ? { ...c, ...updated } : c)));
    addActivityLog('Collection Updated', `Updated collection "${updated.name || cid}"`);
  };
  const deleteCollection = (cid) => {
    setCollections((prev) => prev.filter((c) => c.id !== cid));
    addActivityLog('Collection Deleted', `Removed collection ${cid}`);
  };

  // ── ORDERS ──
  const addOrder = (order) => {
    const record = {
      id: order.id || `#NB${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      status: 'Pending',
      paymentStatus: order.paymentStatus || 'Pending',
      trackingNumber: '',
      ...order,
    };
    setOrders((prev) => [record, ...prev]);
    pushNotification('order', 'New order received', `${record.id} — ${record.totalAmount ? '₦' + Number(record.totalAmount).toLocaleString() : ''}`, '/admin/orders');
    addActivityLog('Order Created', `Order ${record.id} placed.`);
    return record;
  };

  const updateOrderStatus = (oid, status) => {
    setOrders((prev) => prev.map((o) => (o.id === oid ? { ...o, status } : o)));
    addActivityLog('Order Status Update', `${oid} → ${status}`);
  };
  const updateOrderPaymentStatus = (oid, paymentStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === oid ? { ...o, paymentStatus } : o)));
    addActivityLog('Payment Status Update', `${oid} → ${paymentStatus}`);
  };
  const updateOrderTracking = (oid, trackingNumber) => {
    setOrders((prev) => prev.map((o) => (o.id === oid ? { ...o, trackingNumber } : o)));
    addActivityLog('Tracking Updated', `${oid} → ${trackingNumber}`);
  };

  // ── TRANSACTIONS ──
  const addTransaction = (txn) => {
    const record = { id: txn.id || id('txn'), date: new Date().toISOString(), ...txn };
    setTransactions((prev) => [record, ...prev]);
    if (record.status === 'Successful') {
      pushNotification('payment', 'Payment received', `${record.orderId} paid via ${record.method}.`, '/admin/payments');
    }
    return record;
  };
  const updateTransactionStatus = (tid, status) => {
    setTransactions((prev) => prev.map((t) => (t.id === tid ? { ...t, status } : t)));
  };

  // ── CUSTOMERS (auto-registered from storefront checkout) ──
  const addCustomer = (customer) => {
    let created = null;
    setCustomers((prev) => {
      const existing = prev.find((c) => c.email.toLowerCase() === customer.email.toLowerCase());
      if (existing) {
        created = existing;
        return prev.map((c) =>
          c.email.toLowerCase() === customer.email.toLowerCase()
            ? {
                ...c,
                totalOrders: (c.totalOrders || 0) + (customer.orderCount || 1),
                totalSpent: (c.totalSpent || 0) + (customer.amount || 0),
                lastActivity: new Date().toISOString(),
              }
            : c
        );
      }
      created = {
        id: id('cust'),
        joinedDate: new Date().toISOString(),
        status: 'Active',
        totalOrders: customer.orderCount || 1,
        totalSpent: customer.amount || 0,
        lastActivity: new Date().toISOString(),
        ...customer,
      };
      return [created, ...prev];
    });
    return created;
  };

  const updateCustomerStatus = (cid, status) => {
    setCustomers((prev) => prev.map((c) => (c.id === cid ? { ...c, status } : c)));
  };

  // ── DISCOUNTS / COUPONS ──
  const addDiscount = (coupon) => {
    const record = { id: id('cpn'), usageCount: 0, active: coupon.active ?? true, ...coupon };
    setDiscounts((prev) => [record, ...prev]);
    addActivityLog('Coupon Created', `Added coupon "${record.code}"`);
    return record;
  };
  const updateDiscount = (did, updated) => {
    setDiscounts((prev) => prev.map((d) => (d.id === did ? { ...d, ...updated } : d)));
    addActivityLog('Coupon Updated', `Updated coupon ${updated.code || did}`);
  };
  const toggleDiscountStatus = (did) => {
    setDiscounts((prev) => prev.map((d) => (d.id === did ? { ...d, active: !d.active } : d)));
    addActivityLog('Coupon Toggled', `Toggled coupon ${did}`);
  };
  const deleteDiscount = (did) => {
    setDiscounts((prev) => prev.filter((d) => d.id !== did));
    addActivityLog('Coupon Deleted', `Deleted coupon ${did}`);
  };

  // ── REVIEWS ──
  const addReview = (review) => {
    const record = { id: id('rev'), date: new Date().toISOString(), status: 'Pending', ...review };
    setReviews((prev) => [record, ...prev]);
    pushNotification('review', 'New review submitted', `${review.customerName || 'A customer'} left a ${review.rating}-star review.`, '/admin/reviews');
    return record;
  };
  const updateReviewStatus = (rid, status) => {
    setReviews((prev) => prev.map((r) => (r.id === rid ? { ...r, status } : r)));
    addActivityLog('Review Moderated', `Review ${rid} → ${status}`);
  };
  const deleteReview = (rid) => {
    setReviews((prev) => prev.filter((r) => r.id !== rid));
    addActivityLog('Review Deleted', `Deleted review ${rid}`);
  };

  // ── RETURNS ──
  const addReturnRequest = (request) => {
    const record = { id: id('ret'), date: new Date().toISOString(), status: 'Requested', ...request };
    setReturns((prev) => [record, ...prev]);
    pushNotification('return', 'Return request', `${request.orderId} — a customer requested a return.`, '/admin/returns');
    return record;
  };
  const updateReturnStatus = (rid, status) => {
    setReturns((prev) => prev.map((r) => (r.id === rid ? { ...r, status } : r)));
    addActivityLog('Return Updated', `Return ${rid} → ${status}`);
  };

  // ── NOTIFICATIONS ──
  const markNotificationRead = (nid) => {
    setNotifications((prev) => prev.map((n) => (n.id === nid ? { ...n, read: true } : n)));
  };
  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };
  const clearNotifications = () => setNotifications([]);

  // ── NEWSLETTER ──
  const addSubscriber = (email, source = 'Storefront') => {
    setSubscribers((prev) => {
      if (prev.some((s) => s.email.toLowerCase() === email.toLowerCase())) return prev;
      return [
        { id: id('sub'), email, source, status: 'Subscribed', dateSubscribed: new Date().toISOString() },
        ...prev,
      ];
    });
  };

  // ── CMS ──
  const updateCMS = (updater) => {
    setCms((prev) => (typeof updater === 'function' ? updater(prev) : updater));
    addActivityLog('Website Updated', 'Website content changed in Website Manager.');
  };

  return (
    <AdminDataContext.Provider
      value={{
        settings, updateStoreSettings,
        categories, addCategory, updateCategory, deleteCategory,
        collections, addCollection, updateCollection, deleteCollection,
        customers, addCustomer, updateCustomerStatus,
        orders, addOrder, updateOrderStatus, updateOrderPaymentStatus, updateOrderTracking,
        transactions, addTransaction, updateTransactionStatus,
        discounts, addDiscount, updateDiscount, toggleDiscountStatus, deleteDiscount,
        reviews, addReview, updateReviewStatus, deleteReview,
        returns, addReturnRequest, updateReturnStatus,
        notifications, markNotificationRead, markAllNotificationsRead, clearNotifications,
        subscribers, addSubscriber,
        cms, updateCMS,
        activityLogs, addActivityLog,
        pushNotification,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData() {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error('useAdminData must be used within an AdminDataProvider');
  }
  return context;
}
