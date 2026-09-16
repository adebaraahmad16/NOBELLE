import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, FolderTree, Upload, X, FolderPlus, Power } from 'lucide-react';
import {
  Card, PageHeader, EmptyState, SearchInput, PrimaryButton, GhostButton,
  Field, Modal, ConfirmDialog, StatusBadge, TableSkeleton, inputStyle, inputClass, useToast,
} from '../../components/admin/ui/AdminUI';
import { useAdminData } from '../../context/AdminDataContext';
import { useProducts } from '../../context/ProductContext';

const emptyForm = { name: '', description: '', image: null, imageName: '', active: true };

export default function AdminCategoriesPage() {
  const { categories, addCategory, updateCategory, deleteCategory } = useAdminData();
  const { products } = useProducts();
  const { pushToast, ToastViewport } = useToast();

  const [loading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [errors, setErrors] = useState({});

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q));
  }, [categories, searchTerm]);

  const productCount = (catId) => products.filter((p) => p.category === catId).length;

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({
      name: cat.name || '',
      description: cat.description || '',
      image: cat.image || '',
      imageName: cat.imageName || '',
      active: cat.active !== false,
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm((f) => ({ ...f, image: URL.createObjectURL(file), imageName: file.name }));
    }
  };

  const clearImage = () => setForm((f) => ({ ...f, image: '', imageName: '' }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Category name is required.';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    if (editing) {
      updateCategory(editing.id, {
        name: form.name.trim(),
        description: form.description.trim(),
        image: form.image,
        imageName: form.imageName,
        active: form.active,
      });
      pushToast('Category updated.');
    } else {
      addCategory({
        name: form.name.trim(),
        description: form.description.trim(),
        image: form.image,
        imageName: form.imageName,
        active: form.active,
      });
      pushToast('Category created.');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    deleteCategory(confirmDelete.id);
    pushToast(`"${confirmDelete.name}" deleted.`);
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-5">
      {ToastViewport}
      <PageHeader
        title="Categories"
        subtitle={categories.length ? `${categories.length} categor${categories.length !== 1 ? 'ies' : 'y'}` : 'Organise your catalog into collections of styles'}
        breadcrumb={['Catalog']}
        actions={
          <PrimaryButton onClick={openAdd}>
            <Plus size={14} /> Add Category
          </PrimaryButton>
        }
      />

      {loading ? (
        <Card padded={false}><TableSkeleton rows={4} cols={4} /></Card>
      ) : categories.length === 0 ? (
        <Card>
          <EmptyState
            icon={FolderTree}
            title="No categories yet"
            description="Create your first category — like Ready-to-Wear, Bridal or Occasion — to structure your products."
            action={<PrimaryButton onClick={openAdd}><FolderPlus size={14} /> Create Category</PrimaryButton>}
          />
        </Card>
      ) : (
        <>
          <Card className="flex items-center justify-between gap-3">
            <SearchInput
              className="w-full sm:max-w-xs"
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search categories..."
              ariaLabel="Search categories"
            />
            <span className="text-xs hidden sm:block" style={{ color: 'var(--admin-text-muted)' }}>
              {filtered.length} shown
            </span>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((cat) => (
              <Card key={cat.id} padded={false} className="overflow-hidden">
                <div className="h-32 relative" style={{ background: 'var(--admin-surface-2)' }}>
                  {cat.image ? (
                    <img src={cat.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FolderTree size={22} style={{ color: 'var(--admin-text-faint)' }} />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <StatusBadge status={cat.active !== false ? 'Active' : 'Inactive'} />
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-serif text-sm font-bold truncate" style={{ color: 'var(--admin-text)' }}>{cat.name}</h3>
                      <p className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--admin-text-faint)' }}>{cat.id}</p>
                    </div>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: 'var(--admin-red-dim)', color: '#A94A5A' }}
                    >
                      {productCount(cat.id)} products
                    </span>
                  </div>
                  <p className="text-xs mt-2 line-clamp-2 min-h-[2rem]" style={{ color: 'var(--admin-text-muted)' }}>
                    {cat.description || 'No description.'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-3 pt-3" style={{ borderTop: '1px solid var(--admin-border-soft)' }}>
                    <button
                      onClick={() => openEdit(cat)}
                      className="flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-colors hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center gap-1.5"
                      style={{ border: '1px solid var(--admin-border-soft)', color: 'var(--admin-text)' }}
                    >
                      <Edit2 size={11} /> Edit
                    </button>
                    <button
                      onClick={() => updateCategory(cat.id, { active: cat.active === false })}
                      className="p-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ border: '1px solid var(--admin-border-soft)', color: cat.active !== false ? '#d97706' : '#16a34a' }}
                      title={cat.active !== false ? 'Deactivate category' : 'Activate category'}
                      aria-label={cat.active !== false ? 'Deactivate category' : 'Activate category'}
                    >
                      <Power size={12} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(cat)}
                      className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                      style={{ border: '1px solid rgba(169,74,90,0.25)', color: '#A94A5A' }}
                      title="Delete category"
                      aria-label="Delete category"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filtered.length === 0 && (
            <Card>
              <EmptyState
                icon={FolderTree}
                title="No categories match your search"
                description={`Nothing found for "${searchTerm}".`}
                action={<GhostButton onClick={() => setSearchTerm('')}>Clear search</GhostButton>}
              />
            </Card>
          )}
        </>
      )}

      {/* Add/Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Category' : 'New Category'}>
        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-4">
            <Field label="Category Name" required htmlFor="c-name">
              <input
                id="c-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Ready-to-Wear"
                className={inputClass}
                style={{ ...inputStyle, borderColor: errors.name ? '#A94A5A' : inputStyle.border }}
                aria-invalid={!!errors.name}
              />
              {errors.name && <p className="text-[10px] mt-1" style={{ color: '#A94A5A' }}>{errors.name}</p>}
            </Field>

            <Field label="Description" htmlFor="c-desc">
              <textarea
                id="c-desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Describe this category's style and positioning..."
                className={inputClass}
                style={inputStyle}
              />
            </Field>

            <Field label="Category Image">
              <label
                className="flex items-center justify-center gap-2 border-2 border-dashed rounded-xl p-4 cursor-pointer text-xs transition-colors hover:bg-black/[0.02] dark:hover:bg-white/5"
                style={{ borderColor: 'var(--admin-border)', color: 'var(--admin-text-muted)' }}
              >
                <input type="file" accept="image/*" className="sr-only" onChange={handleFile} />
                <Upload size={14} style={{ color: '#A94A5A' }} />
                {form.imageName || form.image ? (form.imageName || 'Image selected — click to replace') : 'Upload category image'}
              </label>
              {form.image && (
                <div className="mt-3 relative rounded-xl overflow-hidden" style={{ border: '1px solid var(--admin-border)' }}>
                  <img src={form.image} alt="Category preview" className="w-full h-28 object-cover" />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white"
                    title="Remove image"
                    aria-label="Remove category image"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </Field>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                className="w-4 h-4 accent-[#A94A5A]"
              />
              <span className="text-xs font-semibold" style={{ color: 'var(--admin-text)' }}>Active (visible on storefront)</span>
            </label>
          </div>

          <div className="px-5 py-4 flex justify-end gap-2" style={{ borderTop: '1px solid var(--admin-border-soft)' }}>
            <GhostButton type="button" onClick={() => setModalOpen(false)}>Cancel</GhostButton>
            <PrimaryButton type="submit">{editing ? 'Save Changes' : 'Create Category'}</PrimaryButton>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete category?"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete Category"
      />
    </div>
  );
}
