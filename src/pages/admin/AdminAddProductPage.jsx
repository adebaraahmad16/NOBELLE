import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Upload, X, Star, ArrowLeft as MoveLeft, ArrowRight as MoveRight,
  FileText, Banknote, Tag, Layers, PackagePlus, Info,
} from 'lucide-react';
import {
  Card, PageHeader, PrimaryButton, GhostButton, Field, inputStyle, inputClass, useToast,
} from '../../components/admin/ui/AdminUI';
import { useProducts } from '../../context/ProductContext';
import { useAdminData } from '../../context/AdminDataContext';
import { formatNaira } from '../../utils/currency';

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const initialForm = {
  name: '',
  description: '',
  category: '',
  collection: '',
  price: '',
  salePrice: '',
  costPrice: '',
  sku: '',
  stock: '',
  lowStockThreshold: 5,
  trackStock: true,
  status: 'Active',
  featured: false,
};

export default function AdminAddProductPage() {
  const navigate = useNavigate();
  const { addProduct } = useProducts();
  const { categories, collections, addActivityLog } = useAdminData();
  const { pushToast, ToastViewport } = useToast();

  const [form, setForm] = useState(initialForm);
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);
  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

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

  // Real file upload: object URLs for preview, names kept for later backend wiring.
  const handleFiles = (files) => {
    const newImages = Array.from(files || []).map((file, idx) => ({
      id: `img_${Date.now()}_${idx}`,
      url: URL.createObjectURL(file),
      name: file.name,
      isFeatured: images.length === 0 && idx === 0,
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
    if (form.salePrice && Number(form.salePrice) >= Number(form.price)) errs.salePrice = 'Sale price must be lower than regular price.';
    if (!form.category) errs.category = 'Select a category.';
    return errs;
  };

  const handleSubmit = (status) => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      pushToast('Please fix the highlighted fields.', 'error');
      return;
    }

    setSaving(true);
    const featuredImg = images.find((i) => i.isFeatured) || images[0];
    const payload = {
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
      status,
      featured: form.featured,
      images: images.map((i) => ({ url: i.url, name: i.name })),
      image: featuredImg?.url || '',
      dateAdded: new Date().toISOString(),
    };

    try {
      addProduct(payload);
      addActivityLog(status === 'Draft' ? 'Draft Saved' : 'Product Published', `Added "${payload.name}" (${status})`);
      pushToast(status === 'Draft' ? 'Draft saved.' : 'Product published.');
      setTimeout(() => navigate('/admin/products'), 500);
    } catch (e) {
      pushToast('Could not save the product. Please try again.', 'error');
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 pb-10">
      {ToastViewport}
      <PageHeader
        title="Add Product"
        breadcrumb={['Catalog', 'Products', 'New']}
        actions={
          <>
            <GhostButton onClick={() => navigate('/admin/products')}>Cancel</GhostButton>
            <GhostButton onClick={() => handleSubmit('Draft')} disabled={saving}>Save as Draft</GhostButton>
            <PrimaryButton onClick={() => handleSubmit('Active')} disabled={saving}>Publish Product</PrimaryButton>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left: main details ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Basic info */}
          <Card>
            <h2 className="font-serif text-sm font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--admin-text)' }}>
              <FileText size={15} style={{ color: '#A94A5A' }} /> Basic Information
            </h2>
            <div className="space-y-4">
              <Field label="Product Name" required htmlFor="p-name">
                <input
                  id="p-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  placeholder="e.g. Handwoven Aso-Oke Gown"
                  className={inputClass}
                  style={{ ...inputStyle, borderColor: errors.name ? '#A94A5A' : inputStyle.border }}
                  aria-invalid={!!errors.name}
                />
                {errors.name && <p className="text-[10px] mt-1" style={{ color: '#A94A5A' }}>{errors.name}</p>}
              </Field>

              <Field label="Description" htmlFor="p-desc">
                <textarea
                  id="p-desc"
                  rows={5}
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  placeholder="Describe the fabric, silhouette, fit and styling notes..."
                  className={inputClass}
                  style={inputStyle}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Category" required htmlFor="p-cat">
                  <select
                    id="p-cat"
                    value={form.category}
                    onChange={(e) => setField('category', e.target.value)}
                    className={inputClass}
                    style={{ ...inputStyle, borderColor: errors.category ? '#A94A5A' : inputStyle.border }}
                    aria-invalid={!!errors.category}
                  >
                    <option value="">Select category...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {errors.category && <p className="text-[10px] mt-1" style={{ color: '#A94A5A' }}>{errors.category}</p>}
                  {categories.length === 0 && (
                    <p className="text-[10px] mt-1" style={{ color: 'var(--admin-text-faint)' }}>
                      No categories yet — <Link to="/admin/categories" className="underline" style={{ color: '#A94A5A' }}>create one first</Link>.
                    </p>
                  )}
                </Field>

                <Field label="Collection" htmlFor="p-col">
                  <select
                    id="p-col"
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
              <Field label="Regular Price (₦)" required htmlFor="p-price">
                <input
                  id="p-price"
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => setField('price', e.target.value)}
                  placeholder="25000"
                  className={inputClass}
                  style={{ ...inputStyle, borderColor: errors.price ? '#A94A5A' : inputStyle.border }}
                  aria-invalid={!!errors.price}
                />
                {errors.price && <p className="text-[10px] mt-1" style={{ color: '#A94A5A' }}>{errors.price}</p>}
              </Field>
              <Field label="Sale Price (₦)" htmlFor="p-sale">
                <input
                  id="p-sale"
                  type="number"
                  min="0"
                  value={form.salePrice}
                  onChange={(e) => setField('salePrice', e.target.value)}
                  placeholder="Optional"
                  className={inputClass}
                  style={{ ...inputStyle, borderColor: errors.salePrice ? '#A94A5A' : inputStyle.border }}
                />
                {errors.salePrice && <p className="text-[10px] mt-1" style={{ color: '#A94A5A' }}>{errors.salePrice}</p>}
              </Field>
              <Field label="Cost Price (₦)" htmlFor="p-cost" hint="For margin tracking only">
                <input
                  id="p-cost"
                  type="number"
                  min="0"
                  value={form.costPrice}
                  onChange={(e) => setField('costPrice', e.target.value)}
                  placeholder="Optional"
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
                  placeholder="e.g. Emerald, Wine, Gold"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="SKU" htmlFor="p-sku">
                  <input
                    id="p-sku"
                    type="text"
                    value={form.sku}
                    onChange={(e) => setField('sku', e.target.value)}
                    placeholder="e.g. NOB-ASO-001"
                    className={inputClass}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Variant Price (₦)" hint="Leave blank to use regular price">
                  <input
                    type="number"
                    min="0"
                    value={form.variantPrice || ''}
                    onChange={(e) => setField('variantPrice', e.target.value)}
                    placeholder="Optional"
                    className={inputClass}
                    style={inputStyle}
                  />
                </Field>
              </div>
            </div>
          </Card>
        </div>

        {/* ── Right: images, inventory, status ── */}
        <div className="space-y-5">
          {/* Images */}
          <Card>
            <h2 className="font-serif text-sm font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--admin-text)' }}>
              <Upload size={15} style={{ color: '#A94A5A' }} /> Product Images
            </h2>

            <label
              className="block border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all hover:bg-black/[0.02] dark:hover:bg-white/5"
              style={{ borderColor: 'var(--admin-border)', color: 'var(--admin-text-muted)' }}
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
              <p className="text-[10px] mt-0.5">Click to browse — PNG, JPG, WEBP</p>
            </label>

            {images.length > 0 && (
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
            )}
            {images.length === 0 && (
              <p className="text-[10px] text-center mt-3" style={{ color: 'var(--admin-text-faint)' }}>
                No images uploaded yet — the first image becomes the main product photo.
              </p>
            )}
          </Card>

          {/* Inventory */}
          <Card>
            <h2 className="font-serif text-sm font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--admin-text)' }}>
              <PackagePlus size={15} style={{ color: '#2563eb' }} /> Inventory
            </h2>
            <div className="space-y-4">
              <Field label="Stock Quantity" htmlFor="p-stock">
                <input
                  id="p-stock"
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setField('stock', e.target.value)}
                  placeholder="0"
                  className={inputClass}
                  style={inputStyle}
                />
              </Field>
              <Field label="Low-Stock Threshold" htmlFor="p-threshold">
                <input
                  id="p-threshold"
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
            <label className="flex items-center gap-2.5 cursor-pointer mt-4">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setField('featured', e.target.checked)}
                className="w-4 h-4 accent-[#A94A5A]"
              />
              <span className="text-xs font-semibold" style={{ color: 'var(--admin-text)' }}>Feature on homepage</span>
            </label>
          </Card>
        </div>
      </div>
    </div>
  );
}
