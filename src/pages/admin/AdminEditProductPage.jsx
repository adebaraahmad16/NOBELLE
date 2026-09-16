import { useState, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Upload, X, Star, ArrowLeft as MoveLeft, ArrowRight as MoveRight,
  FileText, Banknote, Tag, PackagePlus, Info, PackageSearch,
} from 'lucide-react';
import {
  Card, PageHeader, PrimaryButton, GhostButton, Field, EmptyState, SkeletonLine,
  inputStyle, inputClass, useToast,
} from '../../components/admin/ui/AdminUI';
import { useProducts } from '../../context/ProductContext';
import { useAdminData } from '../../context/AdminDataContext';

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export default function AdminEditProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, updateProduct, deleteProduct } = useProducts();
  const { categories, collections, addActivityLog } = useAdminData();
  const { pushToast, ToastViewport } = useToast();

  const product = useMemo(() => products.find((p) => p.id === id), [products, id]);
  const [loading, setLoading] = useState(true);

  // Brief loading state so the skeleton shows on first paint.
  useState(() => {
    setTimeout(() => setLoading(false), 250);
  });

  // Initialize editable state from the loaded product (once).
  const [form, setForm] = useState(() =>
    product
      ? {
          name: product.name || '',
          description: product.description || '',
          category: product.category || '',
          collection: product.collection || '',
          price: product.price ?? '',
          salePrice: product.salePrice ?? '',
          costPrice: product.costPrice ?? '',
          sku: product.sku || '',
          stock: product.stock ?? 0,
          lowStockThreshold: product.lowStockThreshold ?? 5,
          trackStock: product.trackStock !== false,
          status: product.status || 'Active',
          featured: !!product.featured,
          variantPrice: product.variantPrice ?? '',
        }
      : null
  );
  const [sizes, setSizes] = useState(() => product?.sizes || []);
  const [colors, setColors] = useState(() => product?.colors || []);
  const [images, setImages] = useState(() =>
    (
      product?.images?.length
        ? product.images
        : product?.image
        ? [{ url: product.image }]
        : []
    ).map((im, i) => ({
      id: `img_${i}`,
      url: typeof im === 'string' ? im : im.url,
      name: typeof im === 'string' ? `image-${i + 1}` : im.name,
      isFeatured: i === 0,
    }))
  );
  const [errors, setErrors] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!product) {
    return (
      <Card>
        <EmptyState
          icon={PackageSearch}
          title="Product not found"
          description="This product may have been deleted. Return to the catalog to manage your products."
          action={<PrimaryButton onClick={() => navigate('/admin/products')}>Back to Products</PrimaryButton>}
        />
      </Card>
    );
  }

  const setField = (name, value) => setForm((f) => ({ ...f, [name]: value }));
  const toggleSize = (s) => setSizes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  const addColor = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const v = e.target.value.trim();
      if (!colors.includes(v)) setColors((c) => [...c, v]);
      e.target.value = '';
    }
  };
  const removeColor = (c) => setColors((prev) => prev.filter((x) => x !== c));

  const handleFiles = (files) => {
    const newImages = Array.from(files || []).map((file, idx) => ({
      id: `img_${Date.now()}_${idx}`,
      url: URL.createObjectURL(file),
      name: file.name,
      isFeatured: false,
    }));
    setImages((prev) => {
      const merged = [...prev, ...newImages];
      if (!merged.some((i) => i.isFeatured) && merged.length) merged[0].isFeatured = true;
      return merged;
    });
  };
  const removeImage = (imid) => {
    setImages((prev) => {
      const next = prev.filter((i) => i.id !== imid);
      if (next.length && !next.some((i) => i.isFeatured)) next[0].isFeatured = true;
      return next;
    });
  };
  const setFeatured = (imid) => setImages((prev) => prev.map((i) => ({ ...i, isFeatured: i.id === imid })));
  const moveImage = (idx, dir) => {
    const t = idx + dir;
    if (t < 0 || t >= images.length) return;
    const next = [...images];
    [next[idx], next[t]] = [next[t], next[idx]];
    setImages(next);
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Product name is required.';
    if (!form.price || Number(form.price) <= 0) errs.price = 'A valid regular price is required.';
    if (!form.category) errs.category = 'Select a category.';
    return errs;
  };

  const handleSave = (status) => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      pushToast('Please fix the highlighted fields.', 'error');
      return;
    }
    const featuredImg = images.find((i) => i.isFeatured) || images[0];
    updateProduct(product.id, {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      collection: form.collection,
      price: Number(form.price),
      salePrice: form.salePrice ? Number(form.salePrice) : null,
      costPrice: form.costPrice ? Number(form.costPrice) : null,
      sku: form.sku.trim(),
      sizes,
      colors,
      stock: Number(form.stock) || 0,
      lowStockThreshold: Number(form.lowStockThreshold) || 5,
      trackStock: form.trackStock,
      status: status || form.status,
      featured: form.featured,
      images: images.map((i) => ({ url: i.url, name: i.name })),
      image: featuredImg?.url || '',
    });
    addActivityLog('Product Updated', `Updated "${form.name}"`);
    pushToast('Product updated successfully.');
    setTimeout(() => navigate('/admin/products'), 500);
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <PageHeader title="Edit Product" breadcrumb={['Catalog', 'Products', 'Edit']} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => <SkeletonLine key={i} h={90} />)}
          </div>
          <SkeletonLine h={200} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">
      {ToastViewport}
      <PageHeader
        title="Edit Product"
        subtitle={product.name}
        breadcrumb={['Catalog', 'Products', 'Edit']}
        actions={
          <>
            <GhostButton onClick={() => navigate('/admin/products')}>Cancel</GhostButton>
            <PrimaryButton onClick={() => handleSave()}>Save Changes</PrimaryButton>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Basic info */}
          <Card>
            <h2 className="font-serif text-sm font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--admin-text)' }}>
              <FileText size={15} style={{ color: '#A94A5A' }} /> Basic Information
            </h2>
            <div className="space-y-4">
              <Field label="Product Name" required htmlFor="e-name">
                <input
                  id="e-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  className={inputClass}
                  style={{ ...inputStyle, borderColor: errors.name ? '#A94A5A' : inputStyle.border }}
                  aria-invalid={!!errors.name}
                />
                {errors.name && <p className="text-[10px] mt-1" style={{ color: '#A94A5A' }}>{errors.name}</p>}
              </Field>

              <Field label="Description" htmlFor="e-desc">
                <textarea
                  id="e-desc"
                  rows={5}
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Category" required htmlFor="e-cat">
                  <select
                    id="e-cat"
                    value={form.category}
                    onChange={(e) => setField('category', e.target.value)}
                    className={inputClass}
                    style={{ ...inputStyle, borderColor: errors.category ? '#A94A5A' : inputStyle.border }}
                  >
                    <option value="">Select category...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Collection" htmlFor="e-col">
                  <select
                    id="e-col"
                    value={form.collection}
                    onChange={(e) => setField('collection', e.target.value)}
                    className={inputClass}
                    style={inputStyle}
                  >
                    <option value="">None</option>
                    {collections.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>
          </Card>

          {/* Pricing */}
          <Card>
            <h2 className="font-serif text-sm font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--admin-text)' }}>
              <Banknote size={15} style={{ color: '#16a34a' }} /> Pricing
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Regular Price (₦)" required>
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => setField('price', e.target.value)}
                  className={inputClass}
                  style={{ ...inputStyle, borderColor: errors.price ? '#A94A5A' : inputStyle.border }}
                />
                {errors.price && <p className="text-[10px] mt-1" style={{ color: '#A94A5A' }}>{errors.price}</p>}
              </Field>
              <Field label="Sale Price (₦)">
                <input
                  type="number"
                  min="0"
                  value={form.salePrice}
                  onChange={(e) => setField('salePrice', e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                />
              </Field>
              <Field label="Cost Price (₦)">
                <input
                  type="number"
                  min="0"
                  value={form.costPrice}
                  onChange={(e) => setField('costPrice', e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                />
              </Field>
            </div>
          </Card>

          {/* Variants */}
          <Card>
            <h2 className="font-serif text-sm font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--admin-text)' }}>
              <Tag size={15} style={{ color: '#d97706' }} /> Variants
            </h2>
            <div className="space-y-4">
              <Field label="Sizes">
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_SIZES.map((s) => {
                    const on = sizes.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSize(s)}
                        aria-pressed={on}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${on ? 'text-white' : ''}`}
                        style={on
                          ? { background: '#A94A5A' }
                          : { background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border-soft)', color: 'var(--admin-text-muted)' }}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field label="Colours" hint="Type a colour and press Enter to add">
                <input
                  type="text"
                  onKeyDown={addColor}
                  placeholder="Add a colour..."
                  className={inputClass}
                  style={inputStyle}
                />
                {colors.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {colors.map((c) => (
                      <span
                        key={c}
                        className="text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1.5"
                        style={{ background: 'var(--admin-red-dim)', color: '#A94A5A' }}
                      >
                        {c}
                        <button type="button" onClick={() => removeColor(c)} aria-label={`Remove ${c}`}>
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </Field>

              <Field label="SKU">
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => setField('sku', e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                />
              </Field>
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Images */}
          <Card>
            <h2 className="font-serif text-sm font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--admin-text)' }}>
              <Upload size={15} style={{ color: '#A94A5A' }} /> Product Images
            </h2>

            <label
              className="block border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all hover:bg-black/[0.02] dark:hover:bg-white/5"
              style={{ borderColor: 'var(--admin-border)' }}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                className="sr-only"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <Upload size={20} className="mx-auto mb-2" style={{ color: '#A94A5A' }} />
              <p className="text-xs font-bold" style={{ color: 'var(--admin-text)' }}>Upload images</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--admin-text-muted)' }}>Click to browse — PNG, JPG, WEBP</p>
            </label>

            {images.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 mt-4">
                {images.map((img, idx) => (
                  <div
                    key={img.id}
                    className="relative rounded-xl overflow-hidden group"
                    style={{ border: img.isFeatured ? '2px solid #A94A5A' : '1px solid var(--admin-border)' }}
                  >
                    <img src={img.url} alt={img.name} className="w-full h-28 object-cover" />
                    {img.isFeatured && (
                      <span
                        className="absolute top-1.5 left-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded-md text-white flex items-center gap-1"
                        style={{ background: '#A94A5A' }}
                      >
                        <Star size={8} className="fill-white" /> MAIN
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                      <div className="flex justify-between">
                        <button type="button" onClick={() => setFeatured(img.id)} className="p-1.5 rounded-lg bg-white/20 text-white" title="Set as main image" aria-label="Set as main image">
                          <Star size={11} className={img.isFeatured ? 'fill-white' : ''} />
                        </button>
                        <button type="button" onClick={() => removeImage(img.id)} className="p-1.5 rounded-lg bg-white/20 text-white" title="Remove image" aria-label="Remove image">
                          <X size={11} />
                        </button>
                      </div>
                      <div className="flex justify-center gap-1.5">
                        {idx > 0 && (
                          <button type="button" onClick={() => moveImage(idx, -1)} className="p-1 rounded bg-black/50 text-white" title="Move earlier" aria-label="Move image earlier">
                            <MoveLeft size={11} />
                          </button>
                        )}
                        {idx < images.length - 1 && (
                          <button type="button" onClick={() => moveImage(idx, 1)} className="p-1 rounded bg-black/50 text-white" title="Move later" aria-label="Move image later">
                            <MoveRight size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-center mt-3" style={{ color: 'var(--admin-text-faint)' }}>
                No images yet — upload photos to display this product on the storefront.
              </p>
            )}
          </Card>

          {/* Inventory */}
          <Card>
            <h2 className="font-serif text-sm font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--admin-text)' }}>
              <PackagePlus size={15} style={{ color: '#2563eb' }} /> Inventory
            </h2>
            <div className="space-y-4">
              <Field label="Stock Quantity">
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setField('stock', e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                />
              </Field>
              <Field label="Low-Stock Threshold">
                <input
                  type="number"
                  min="0"
                  value={form.lowStockThreshold}
                  onChange={(e) => setField('lowStockThreshold', e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                />
              </Field>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.trackStock}
                  onChange={(e) => setField('trackStock', e.target.checked)}
                  className="w-4 h-4 accent-[#A94A5A]"
                />
                <span className="text-xs font-semibold" style={{ color: 'var(--admin-text)' }}>Track stock for this product</span>
              </label>
            </div>
          </Card>

          {/* Status */}
          <Card>
            <h2 className="font-serif text-sm font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--admin-text)' }}>
              <Info size={15} style={{ color: '#7c3aed' }} /> Product Status
            </h2>
            <Field label="Status">
              <div className="grid grid-cols-2 gap-2">
                {['Draft', 'Active', 'Out of Stock', 'Archived'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setField('status', s)}
                    aria-pressed={form.status === s}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${form.status === s ? 'text-white' : ''}`}
                    style={form.status === s
                      ? { background: '#A94A5A' }
                      : { background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border-soft)', color: 'var(--admin-text-muted)' }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Field>

            <div className="flex items-center gap-2.5 mt-4">
              <input
                type="checkbox"
                id="e-featured"
                checked={form.featured}
                onChange={(e) => setField('featured', e.target.checked)}
                className="w-4 h-4 accent-[#A94A5A]"
              />
              <label htmlFor="e-featured" className="text-xs font-semibold cursor-pointer" style={{ color: 'var(--admin-text)' }}>
                Feature on homepage
              </label>
            </div>

            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full mt-5 py-2 rounded-xl text-xs font-bold transition-colors hover:bg-red-500/10"
              style={{ border: '1px solid rgba(169,74,90,0.3)', color: '#A94A5A' }}
            >
              Delete Product
            </button>
          </Card>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setConfirmDelete(false)} />
          <div
            className="relative max-w-sm w-full rounded-2xl p-6 dropdown-enter"
            style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)' }}
            role="dialog"
            aria-modal="true"
          >
            <h3 className="font-serif text-base font-bold" style={{ color: 'var(--admin-text)' }}>Delete product?</h3>
            <p className="text-xs mt-1.5" style={{ color: 'var(--admin-text-muted)' }}>
              Are you sure you want to delete "{product.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <GhostButton onClick={() => setConfirmDelete(false)}>Cancel</GhostButton>
              <button
                onClick={() => {
                  deleteProduct(product.id);
                  addActivityLog('Product Deleted', `Deleted "${product.name}"`);
                  navigate('/admin/products');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white"
                style={{ background: '#A94A5A' }}
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
