import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Layers, Power, Package } from 'lucide-react';
import {
  Card, PageHeader, EmptyState, SearchInput, PrimaryButton, GhostButton,
  Field, Modal, ConfirmDialog, StatusBadge, inputStyle, inputClass, useToast,
} from '../../components/admin/ui/AdminUI';
import { useAdminData } from '../../context/AdminDataContext';
import { useProducts } from '../../context/ProductContext';

const emptyForm = { name: '', description: '', image: '', active: true, productIds: [] };

export default function AdminCollectionsPage() {
  const { collections, addCollection, updateCollection, deleteCollection } = useAdminData();
  const { products } = useProducts();
  const { pushToast, ToastViewport } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [errors, setErrors] = useState({});

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return collections;
    return collections.filter((c) => c.name?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q));
  }, [collections, searchTerm]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (col) => {
    setEditing(col);
    setForm({
      name: col.name || '',
      description: col.description || '',
      image: col.image || '',
      active: col.active !== false,
      productIds: col.productIds || [],
    });
    setErrors({});
    setModalOpen(true);
  };

  const toggleProduct = (pid) => {
    setForm((f) => ({
      ...f,
      productIds: f.productIds.includes(pid)
        ? f.productIds.filter((x) => x !== pid)
        : [...f.productIds, pid],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrors({ name: 'Collection name is required.' });
      return;
    }
    if (editing) {
      updateCollection(editing.id, {
        name: form.name.trim(),
        description: form.description.trim(),
        image: form.image,
        active: form.active,
        productIds: form.productIds,
      });
      pushToast('Collection updated.');
    } else {
      addCollection({
        name: form.name.trim(),
        description: form.description.trim(),
        image: form.image,
        active: form.active,
        productIds: form.productIds,
      });
      pushToast('Collection created.');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    deleteCollection(confirmDelete.id);
    pushToast(`"${confirmDelete.name}" deleted.`);
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-5">
      {ToastViewport}
      <PageHeader
        title="Collections"
        subtitle={collections.length ? `${collections.length} collection${collections.length !== 1 ? 's' : ''}` : 'Curate products into seasonal or themed collections'}
        breadcrumb={['Catalog']}
        actions={
          <PrimaryButton onClick={openAdd}>
            <Plus size={14} /> Add Collection
          </PrimaryButton>
        }
      />

      {collections.length === 0 ? (
        <Card>
          <EmptyState
            icon={Layers}
            title="No collections yet"
            description="Group products into collections — e.g. 'Resort 2026' or 'Bridal Edit' — to feature them together on the storefront."
            action={<PrimaryButton onClick={openAdd}><Plus size={14} /> Create Collection</PrimaryButton>}
          />
        </Card>
      ) : (
        <>
          <Card className="flex items-center justify-between gap-3">
            <SearchInput
              className="w-full sm:max-w-xs"
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search collections..."
              ariaLabel="Search collections"
            />
            <span className="text-xs hidden sm:block" style={{ color: 'var(--admin-text-muted)' }}>{filtered.length} shown</span>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((col) => (
              <Card key={col.id} padded={false} className="overflow-hidden">
                <div className="h-32 relative" style={{ background: 'var(--admin-surface-2)' }}>
                  {col.image ? (
                    <img src={col.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Layers size={22} style={{ color: 'var(--admin-text-faint)' }} />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <StatusBadge status={col.active !== false ? 'Active' : 'Inactive'} />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-serif text-sm font-bold truncate" style={{ color: 'var(--admin-text)' }}>{col.name}</h3>
                  <p className="text-xs mt-1.5 line-clamp-2 min-h-[2rem]" style={{ color: 'var(--admin-text-muted)' }}>
                    {col.description || 'No description.'}
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] mt-2" style={{ color: 'var(--admin-text-faint)' }}>
                    <Package size={10} />
                    {(col.productIds || []).length} assigned product{(col.productIds || []).length !== 1 ? 's' : ''}
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 pt-3" style={{ borderTop: '1px solid var(--admin-border-soft)' }}>
                    <button
                      onClick={() => openEdit(col)}
                      className="flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-colors hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center gap-1.5"
                      style={{ border: '1px solid var(--admin-border-soft)', color: 'var(--admin-text)' }}
                    >
                      <Edit2 size={11} /> Edit
                    </button>
                    <button
                      onClick={() => updateCollection(col.id, { active: col.active === false })}
                      className="p-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ border: '1px solid var(--admin-border-soft)', color: col.active !== false ? '#d97706' : '#16a34a' }}
                      title={col.active !== false ? 'Deactivate' : 'Activate'}
                      aria-label={col.active !== false ? 'Deactivate collection' : 'Activate collection'}
                    >
                      <Power size={12} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(col)}
                      className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                      style={{ border: '1px solid rgba(169,74,90,0.25)', color: '#A94A5A' }}
                      title="Delete collection"
                      aria-label="Delete collection"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Add/Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Collection' : 'New Collection'} width="max-w-xl">
        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-4">
            <Field label="Collection Name" required htmlFor="col-name">
              <input
                id="col-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Bridal Edit 2026"
                className={inputClass}
                style={{ ...inputStyle, borderColor: errors.name ? '#A94A5A' : inputStyle.border }}
              />
              {errors.name && <p className="text-[10px] mt-1" style={{ color: '#A94A5A' }}>{errors.name}</p>}
            </Field>

            <Field label="Description" htmlFor="col-desc">
              <textarea
                id="col-desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className={inputClass}
                style={inputStyle}
              />
            </Field>

            <Field label="Collection Image">
              <input
                type="text"
                value={form.image}
                onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                placeholder="Image URL (optional)"
                className={inputClass}
                style={inputStyle}
              />
            </Field>

            <Field label={`Assign Products (${form.productIds.length} selected)`}>
              {products.length === 0 ? (
                <p className="text-xs p-3 rounded-xl" style={{ background: 'var(--admin-surface-2)', color: 'var(--admin-text-muted)' }}>
                  No products in your catalog yet. <span className="font-semibold">Create products first</span>, then assign them here.
                </p>
              ) : (
                <div
                  className="max-h-44 overflow-y-auto rounded-xl admin-scroll space-y-1 p-2"
                  style={{ border: '1px solid var(--admin-border-soft)', background: 'var(--admin-surface-2)' }}
                >
                  {products.map((p) => (
                    <label
                      key={p.id}
                      className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-black/[0.03] dark:hover:bg-white/5"
                    >
                      <input
                        type="checkbox"
                        checked={form.productIds.includes(p.id)}
                        onChange={() => toggleProduct(p.id)}
                        className="w-4 h-4 accent-[#A94A5A]"
                      />
                      <div className="w-8 h-9 rounded-md overflow-hidden shrink-0" style={{ background: 'var(--admin-border-soft)' }}>
                        {p.image && <img src={p.image} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <span className="text-xs font-semibold truncate" style={{ color: 'var(--admin-text)' }}>{p.name}</span>
                      <span className="text-[10px] ml-auto shrink-0" style={{ color: 'var(--admin-text-faint)' }}>{p.sku || ''}</span>
                    </label>
                  ))}
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
            <PrimaryButton type="submit">{editing ? 'Save Changes' : 'Create Collection'}</PrimaryButton>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete collection?"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? This action cannot be undone.`}
        confirmLabel="Delete Collection"
      />
    </div>
  );
}
