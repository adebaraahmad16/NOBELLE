import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Globe, Eye, Plus, Trash2, Home, Image as ImageIcon, Star, Layers, Menu as MenuIcon, FileText, Phone, Save } from 'lucide-react';
import {
  Card, PageHeader, EmptyState, PrimaryButton, GhostButton, Field, Modal,
  ConfirmDialog, StatusBadge, inputStyle, inputClass, useToast,
} from '../../components/admin/ui/AdminUI';
import { useAdminData } from '../../context/AdminDataContext';
import { useProducts } from '../../context/ProductContext';

const TABS = [
  { key: 'homepage', label: 'Homepage', icon: Home },
  { key: 'banners', label: 'Banners', icon: ImageIcon },
  { key: 'featured', label: 'Featured Products', icon: Star },
  { key: 'collections', label: 'Collections', icon: Layers },
  { key: 'navigation', label: 'Navigation', icon: MenuIcon },
  { key: 'about', label: 'About', icon: FileText },
  { key: 'contact', label: 'Contact', icon: Phone },
];

export default function AdminWebsitePage() {
  const { cms, updateCMS, collections, categories } = useAdminData();
  const { products } = useProducts();
  const { pushToast, ToastViewport } = useToast();

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [tab, setTab] = useState(
    TABS.some((t) => t.key === tabParam) ? tabParam : 'homepage'
  );
  const [preview, setPreview] = useState(false);

  // Keep the active tab in sync when arriving via sidebar submenu links
  // like /admin/website?tab=banners.
  useEffect(() => {
    if (tabParam && TABS.some((t) => t.key === tabParam) && tabParam !== tab) {
      setTab(tabParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam]);

  const switchTab = (key) => {
    setTab(key);
    if (tabParam) setSearchParams({ tab: key }, { replace: true });
  };

  const home = cms.homepage || {};
  const pages = cms.pages || {};

  // ── Homepage hero form ──
  const [hero, setHero] = useState(cms.homepage || {});
  const [lastCmsHero, setLastCmsHero] = useState(cms.homepage);
  if (cms.homepage !== lastCmsHero) {
    setLastCmsHero(cms.homepage);
    setHero(cms.homepage || {});
  }

  const saveHero = () => {
    updateCMS((prev) => ({ ...prev, homepage: { ...prev.homepage, ...hero } }));
    pushToast('Homepage content saved.');
  };

  // ── Banners ──
  const [bannerModal, setBannerModal] = useState(false);
  const [bannerForm, setBannerForm] = useState({ title: '', subtitle: '', image: '', link: '' });
  const [editBannerIdx, setEditBannerIdx] = useState(null);
  const [confirmBanner, setConfirmBanner] = useState(null);

  const banners = home.banners || [];

  const openBannerAdd = () => {
    setEditBannerIdx(null);
    setBannerForm({ title: '', subtitle: '', image: '', link: '' });
    setBannerModal(true);
  };
  const openBannerEdit = (b, i) => {
    setEditBannerIdx(i);
    setBannerForm({ ...b });
    setBannerModal(true);
  };
  const saveBanner = () => {
    if (!bannerForm.title.trim()) {
      pushToast('Banner title is required.', 'error');
      return;
    }
    const next = editBannerIdx !== null
      ? banners.map((b, i) => (i === editBannerIdx ? { ...bannerForm, id: b.id } : b))
      : [...banners, { ...bannerForm, id: `bn_${Date.now()}` }];
    updateCMS((prev) => ({ ...prev, homepage: { ...prev.homepage, banners: next } }));
    pushToast(editBannerIdx !== null ? 'Banner updated.' : 'Banner added.');
    setBannerModal(false);
  };

  // ── Featured products ──
  const featuredIds = home.featuredProductIds || [];
  const toggleFeatured = (pid) => {
    const next = featuredIds.includes(pid)
      ? featuredIds.filter((x) => x !== pid)
      : [...featuredIds, pid];
    updateCMS((prev) => ({ ...prev, homepage: { ...prev.homepage, featuredProductIds: next } }));
  };

  // ── Navigation ──
  const navItems = pages.navigation?.main || [];
  const [navForm, setNavForm] = useState({ label: '', href: '' });

  const addNavItem = () => {
    if (!navForm.label.trim() || !navForm.href.trim()) {
      pushToast('Label and link are required.', 'error');
      return;
    }
    updateCMS((prev) => ({
      ...prev,
      pages: { ...prev.pages, navigation: { main: [...(prev.pages.navigation?.main || []), { ...navForm }] } },
    }));
    setNavForm({ label: '', href: '' });
    pushToast('Navigation link added.');
  };

  const removeNavItem = (i) => {
    updateCMS((prev) => ({
      ...prev,
      pages: { ...prev.pages, navigation: { main: (prev.pages.navigation?.main || []).filter((_, x) => x !== i) } },
    }));
  };

  // ── Static pages ──
  const savePage = (key, field, value) => {
    updateCMS((prev) => ({
      ...prev,
      pages: { ...prev.pages, [key]: { ...prev.pages[key], [field]: value } },
    }));
  };

  const featuredProducts = products.filter((p) => featuredIds.includes(p.id));

  return (
    <div className="space-y-5">
      {ToastViewport}
      <PageHeader
        title="Website Manager"
        subtitle="Update your customer-facing website content without touching code"
        breadcrumb={['Operations']}
        actions={
          <GhostButton onClick={() => setPreview(true)}>
            <Eye size={13} /> Preview Homepage
          </GhostButton>
        }
      />

      {/* Tabs */}
      <Card className="flex flex-wrap gap-2" padded={false}>
        <div className="p-3 flex flex-wrap gap-2 w-full">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => switchTab(t.key)}
              className={`px-3.5 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all ${tab === t.key ? 'text-white' : ''}`}
              style={tab === t.key
                ? { background: '#A94A5A' }
                : { border: '1px solid var(--admin-border-soft)', color: 'var(--admin-text-muted)' }}
              aria-pressed={tab === t.key}
            >
              <t.icon size={12} /> {t.label}
            </button>
          ))}
        </div>
      </Card>

      {/* ── Homepage tab ── */}
      {tab === 'homepage' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <h2 className="font-serif text-sm font-bold mb-4" style={{ color: 'var(--admin-text)' }}>Hero Section</h2>
            <div className="space-y-4">
              <Field label="Hero Tagline" htmlFor="h-tag">
                <input
                  id="h-tag"
                  type="text"
                  value={hero.heroTagline || ''}
                  onChange={(e) => setHero((h) => ({ ...h, heroTagline: e.target.value }))}
                  placeholder="e.g. New Collection"
                  className={inputClass}
                  style={inputStyle}
                />
              </Field>
              <Field label="Hero Heading" htmlFor="h-title">
                <input
                  id="h-title"
                  type="text"
                  value={hero.heroTitle || ''}
                  onChange={(e) => setHero((h) => ({ ...h, heroTitle: e.target.value }))}
                  placeholder="e.g. Bold. Elegant. Unapologetically You."
                  className={inputClass}
                  style={inputStyle}
                />
              </Field>
              <Field label="Hero Description" htmlFor="h-sub">
                <textarea
                  id="h-sub"
                  rows={3}
                  value={hero.heroSubtitle || ''}
                  onChange={(e) => setHero((h) => ({ ...h, heroSubtitle: e.target.value }))}
                  className={inputClass}
                  style={inputStyle}
                />
              </Field>
              <Field label="Hero Image URL" htmlFor="h-img">
                <input
                  id="h-img"
                  type="text"
                  value={hero.heroImage || ''}
                  onChange={(e) => setHero((h) => ({ ...h, heroImage: e.target.value }))}
                  placeholder="https://... or /images/hero.jpg"
                  className={inputClass}
                  style={inputStyle}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="CTA Text" htmlFor="h-cta">
                  <input
                    id="h-cta"
                    type="text"
                    value={hero.ctaText || ''}
                    onChange={(e) => setHero((h) => ({ ...h, ctaText: e.target.value }))}
                    className={inputClass}
                    style={inputStyle}
                  />
                </Field>
                <Field label="CTA Link" htmlFor="h-cta-link">
                  <input
                    id="h-cta-link"
                    type="text"
                    value={hero.ctaLink || ''}
                    onChange={(e) => setHero((h) => ({ ...h, ctaLink: e.target.value }))}
                    className={inputClass}
                    style={inputStyle}
                  />
                </Field>
              </div>
              <PrimaryButton onClick={saveHero}>
                <Save size={13} /> Publish Homepage
              </PrimaryButton>
            </div>
          </Card>

          {/* Live preview panel */}
          <Card padded={false} className="overflow-hidden">
            <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: '1px solid var(--admin-border-soft)' }}>
              <Eye size={13} style={{ color: '#A94A5A' }} />
              <h2 className="font-serif text-sm font-bold" style={{ color: 'var(--admin-text)' }}>Live Preview</h2>
              <StatusBadge status={hero.heroTitle ? 'Active' : 'Draft'} />
            </div>
            <div className="p-5">
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--admin-border-soft)' }}>
                <div className="relative h-64 flex items-center" style={{ background: '#1a1a1a' }}>
                  {hero.heroImage && (
                    <img src={hero.heroImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                  )}
                  <div className="relative z-10 p-6">
                    {hero.heroTagline && (
                      <p className="text-[9px] tracking-[0.3em] uppercase mb-2" style={{ color: '#C8A96A' }}>{hero.heroTagline}</p>
                    )}
                    <p className="font-serif text-xl text-white font-bold leading-tight">
                      {hero.heroTitle || 'Your hero heading will appear here'}
                    </p>
                    {hero.heroSubtitle && (
                      <p className="text-[10px] text-white/60 mt-2 max-w-xs">{hero.heroSubtitle}</p>
                    )}
                    {hero.ctaText && (
                      <span className="inline-block mt-4 px-4 py-1.5 text-[10px] font-bold text-white rounded" style={{ background: '#A94A5A' }}>
                        {hero.ctaText}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-[10px] mt-3" style={{ color: 'var(--admin-text-faint)' }}>
                This is how the storefront hero will render once published.
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* ── Banners tab ── */}
      {tab === 'banners' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <PrimaryButton onClick={openBannerAdd}><Plus size={14} /> Add Banner</PrimaryButton>
          </div>
          {banners.length === 0 ? (
            <Card>
              <EmptyState
                icon={ImageIcon}
                title="No promotional banners yet"
                description="Create banners to promote sales, new collections or announcements on the homepage."
                action={<PrimaryButton onClick={openBannerAdd}><Plus size={14} /> Create Banner</PrimaryButton>}
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {banners.map((b, i) => (
                <Card key={b.id || i} padded={false} className="overflow-hidden">
                  <div className="h-28 relative" style={{ background: 'var(--admin-surface-2)' }}>
                    {b.image && <img src={b.image} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="p-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color: 'var(--admin-text)' }}>{b.title}</p>
                      {b.subtitle && <p className="text-[10px] truncate" style={{ color: 'var(--admin-text-muted)' }}>{b.subtitle}</p>}
                      {b.link && <p className="text-[10px] font-mono mt-1" style={{ color: 'var(--admin-text-faint)' }}>{b.link}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openBannerEdit(b, i)} className="p-1.5 rounded-lg" style={{ border: '1px solid var(--admin-border-soft)', color: 'var(--admin-text)' }} title="Edit banner" aria-label="Edit banner">
                        <Star size={11} />
                      </button>
                      <button onClick={() => setConfirmBanner(b)} className="p-1.5 rounded-lg" style={{ border: '1px solid rgba(169,74,90,0.25)', color: '#A94A5A' }} title="Remove banner" aria-label="Remove banner">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Featured products tab ── */}
      {tab === 'featured' && (
        <Card>
          <h2 className="font-serif text-sm font-bold mb-1" style={{ color: 'var(--admin-text)' }}>Featured Products</h2>
          <p className="text-xs mb-4" style={{ color: 'var(--admin-text-muted)' }}>
            Select the products to showcase in the homepage featured section. Currently {featuredIds.length} selected.
          </p>
          {products.length === 0 ? (
            <EmptyState
              icon={Star}
              title="No products to feature yet"
              description="Create products in your catalog first, then come back to select which ones appear on the homepage."
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {products.map((p) => {
                const on = featuredIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleFeatured(p.id)}
                    aria-pressed={on}
                    className="relative rounded-xl overflow-hidden text-left transition-all"
                    style={{ border: on ? '2px solid #A94A5A' : '1px solid var(--admin-border-soft)' }}
                  >
                    <div className="h-28" style={{ background: 'var(--admin-surface-2)' }}>
                      {p.image && <img src={p.image} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="p-2">
                      <p className="text-[10px] font-bold truncate" style={{ color: 'var(--admin-text)' }}>{p.name}</p>
                    </div>
                    {on && (
                      <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ background: '#A94A5A' }}>
                        <Star size={10} className="fill-white" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* ── Collections tab (storefront display) ── */}
      {tab === 'collections' && (
        <Card>
          <h2 className="font-serif text-sm font-bold mb-1" style={{ color: 'var(--admin-text)' }}>Storefront Collections</h2>
          <p className="text-xs mb-4" style={{ color: 'var(--admin-text-muted)' }}>
            Collections and categories available for display on the website.
          </p>
          {collections.length === 0 && categories.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="No collections or categories yet"
              description="Create collections and categories in the Catalog section to organise your storefront."
            />
          ) : (
            <div className="space-y-4">
              {collections.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] mb-2" style={{ color: 'var(--admin-text-faint)' }}>Collections</h3>
                  <div className="flex flex-wrap gap-2">
                    {collections.map((c) => (
                      <span key={c.id} className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background: 'var(--admin-red-dim)', color: '#A94A5A' }}>
                        {c.name} <StatusBadge status={c.active !== false ? 'Active' : 'Inactive'} />
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {categories.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] mb-2" style={{ color: 'var(--admin-text-faint)' }}>Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((c) => (
                      <span key={c.id} className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background: 'var(--admin-surface-2)', color: 'var(--admin-text)', border: '1px solid var(--admin-border-soft)' }}>
                        {c.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* ── Navigation tab ── */}
      {tab === 'navigation' && (
        <Card>
          <h2 className="font-serif text-sm font-bold mb-1" style={{ color: 'var(--admin-text)' }}>Store Navigation</h2>
          <p className="text-xs mb-4" style={{ color: 'var(--admin-text-muted)' }}>Control the links in the storefront header menu.</p>

          <div className="space-y-2 mb-5">
            {navItems.length === 0 ? (
              <p className="text-xs p-3.5 rounded-xl" style={{ background: 'var(--admin-surface-2)', color: 'var(--admin-text-muted)' }}>
                No custom navigation links yet. Add links below.
              </p>
            ) : (
              navItems.map((n, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl"
                  style={{ background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border-soft)' }}
                >
                  <div>
                    <p className="text-xs font-bold" style={{ color: 'var(--admin-text)' }}>{n.label}</p>
                    <p className="text-[10px] font-mono" style={{ color: 'var(--admin-text-faint)' }}>{n.href}</p>
                  </div>
                  <button onClick={() => removeNavItem(i)} className="p-1.5 rounded-lg" style={{ color: '#A94A5A' }} title="Remove link" aria-label={`Remove ${n.label}`}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <Field label="Label" htmlFor="nav-label">
              <input
                id="nav-label"
                type="text"
                value={navForm.label}
                onChange={(e) => setNavForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="e.g. Lookbook"
                className={inputClass}
                style={inputStyle}
              />
            </Field>
            <Field label="Link" htmlFor="nav-href">
              <input
                id="nav-href"
                type="text"
                value={navForm.href}
                onChange={(e) => setNavForm((f) => ({ ...f, href: e.target.value }))}
                placeholder="e.g. /shop"
                className={inputClass}
                style={inputStyle}
              />
            </Field>
            <PrimaryButton onClick={addNavItem}><Plus size={13} /> Add</PrimaryButton>
          </div>
        </Card>
      )}

      {/* ── About / Contact tabs ── */}
      {(tab === 'about' || tab === 'contact') && (
        <Card>
          <h2 className="font-serif text-sm font-bold mb-4 capitalize" style={{ color: 'var(--admin-text)' }}>
            {tab === 'about' ? 'About Page' : 'Contact Page'}
          </h2>
          <div className="space-y-4">
            <Field label="Page Title">
              <input
                type="text"
                value={pages[tab]?.title || ''}
                onChange={(e) => savePage(tab, 'title', e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </Field>
            <Field label="Page Content" hint="Supports simple paragraphs — separate paragraphs with a blank line.">
              <textarea
                rows={8}
                value={pages[tab]?.content || ''}
                onChange={(e) => savePage(tab, 'content', e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </Field>
            <PrimaryButton onClick={() => pushToast(`${tab === 'about' ? 'About' : 'Contact'} page saved.`)}>
              <Save size={13} /> Save Page
            </PrimaryButton>
          </div>
        </Card>
      )}

      {/* Banner modal */}
      <Modal open={bannerModal} onClose={() => setBannerModal(false)} title={editBannerIdx !== null ? 'Edit Banner' : 'New Banner'}>
        <div className="p-5 space-y-4">
          <Field label="Banner Title" required>
            <input
              type="text"
              value={bannerForm.title}
              onChange={(e) => setBannerForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Mid-Season Sale"
              className={inputClass}
              style={inputStyle}
            />
          </Field>
          <Field label="Subtitle">
            <input
              type="text"
              value={bannerForm.subtitle}
              onChange={(e) => setBannerForm((f) => ({ ...f, subtitle: e.target.value }))}
              className={inputClass}
              style={inputStyle}
            />
          </Field>
          <Field label="Image URL">
            <input
              type="text"
              value={bannerForm.image}
              onChange={(e) => setBannerForm((f) => ({ ...f, image: e.target.value }))}
              placeholder="https://... or /images/banner.jpg"
              className={inputClass}
              style={inputStyle}
            />
          </Field>
          <Field label="Link">
            <input
              type="text"
              value={bannerForm.link}
              onChange={(e) => setBannerForm((f) => ({ ...f, link: e.target.value }))}
              placeholder="e.g. /shop"
              className={inputClass}
              style={inputStyle}
            />
          </Field>
        </div>
        <div className="px-5 py-4 flex justify-end gap-2" style={{ borderTop: '1px solid var(--admin-border-soft)' }}>
          <GhostButton onClick={() => setBannerModal(false)}>Cancel</GhostButton>
          <PrimaryButton onClick={saveBanner}>{editBannerIdx !== null ? 'Save Banner' : 'Add Banner'}</PrimaryButton>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmBanner}
        onClose={() => setConfirmBanner(null)}
        onConfirm={() => {
          updateCMS((prev) => ({
            ...prev,
            homepage: { ...prev.homepage, banners: (prev.homepage.banners || []).filter((b) => b.id !== confirmBanner.id) },
          }));
          pushToast('Banner removed.');
          setConfirmBanner(null);
        }}
        title="Remove banner?"
        message={`Are you sure you want to remove "${confirmBanner?.title}" from the homepage?`}
        confirmLabel="Remove Banner"
      />

      {/* Full preview modal */}
      <Modal open={preview} onClose={() => setPreview(false)} title="Homepage Preview" width="max-w-2xl">
        <div className="p-5">
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--admin-border-soft)' }}>
            <div className="relative h-72 flex items-center" style={{ background: '#1a1a1a' }}>
              {hero.heroImage && <img src={hero.heroImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />}
              <div className="relative z-10 p-8">
                {hero.heroTagline && <p className="text-[10px] tracking-[0.3em] uppercase mb-2" style={{ color: '#C8A96A' }}>{hero.heroTagline}</p>}
                <p className="font-serif text-2xl text-white font-bold">{hero.heroTitle || 'Your hero heading will appear here'}</p>
                {hero.heroSubtitle && <p className="text-xs text-white/60 mt-2 max-w-sm">{hero.heroSubtitle}</p>}
                {hero.ctaText && (
                  <span className="inline-block mt-4 px-5 py-2 text-[11px] font-bold text-white rounded" style={{ background: '#A94A5A' }}>
                    {hero.ctaText}
                  </span>
                )}
              </div>
            </div>
            {banners.length > 0 && (
              <div className="p-4 grid grid-cols-2 gap-3" style={{ background: 'var(--admin-surface-2)' }}>
                {banners.map((b) => (
                  <div key={b.id} className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--admin-border-soft)' }}>
                    <div className="h-20" style={{ background: 'var(--admin-border-soft)' }}>
                      {b.image && <img src={b.image} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <p className="p-2 text-[10px] font-bold" style={{ color: 'var(--admin-text)' }}>{b.title}</p>
                  </div>
                ))}
              </div>
            )}
            {featuredProducts.length > 0 && (
              <div className="p-4" style={{ borderTop: '1px solid var(--admin-border-soft)' }}>
                <p className="text-[10px] uppercase tracking-[0.16em] font-bold mb-2" style={{ color: 'var(--admin-text-faint)' }}>
                  {home.featuredCollectionTitle || 'Featured Collection'}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {featuredProducts.slice(0, 4).map((p) => (
                    <div key={p.id}>
                      <div className="h-24 rounded-lg overflow-hidden" style={{ background: 'var(--admin-surface-2)' }}>
                        {p.image && <img src={p.image} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <p className="text-[9px] font-bold truncate mt-1" style={{ color: 'var(--admin-text)' }}>{p.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
