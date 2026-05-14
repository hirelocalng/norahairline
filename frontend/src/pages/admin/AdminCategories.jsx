import { useState, useEffect } from 'react';
import { AdminLayout } from './AdminDashboard';
import { getAdminCategories, createCategory, updateCategory, deleteCategory } from '../../api';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    getAdminCategories()
      .then(res => setCategories(res.data))
      .catch(() => setError('Failed to load categories'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', description: '' });
    setImageFile(null);
    setImagePreview(null);
    setError('');
    setShowForm(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description || '' });
    setImageFile(null);
    setImagePreview(null);
    setError('');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Category name is required'); return; }
    setSaving(true);
    setError('');
    const fd = new FormData();
    fd.append('name', form.name.trim());
    fd.append('description', form.description);
    if (imageFile) fd.append('image', imageFile);
    try {
      if (editing) {
        await updateCategory(editing.id, fd);
      } else {
        await createCategory(fd);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete "${cat.name}"? Products in this category will not be deleted.`)) return;
    setDeletingId(cat.id);
    try {
      await deleteCategory(cat.id);
      setCategories(prev => prev.filter(c => c.id !== cat.id));
      if (editing?.id === cat.id) setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete category');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Categories</h1>
            <p className="text-gray-500 text-sm mt-1">Manage product categories and their images</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2.5 px-5 rounded-full text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Category
          </button>
        </div>

        {/* Inline form */}
        {showForm && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
            <h2 className="font-semibold text-gray-700 mb-5">
              {editing ? `Edit — ${editing.name}` : 'New Category'}
            </h2>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    placeholder="e.g. Hair Products"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    placeholder="Short description shown on homepage"
                  />
                </div>
              </div>

              {/* Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category Image</label>

                {editing?.image_url && !imagePreview && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-400 mb-1.5">Current image</p>
                    <img
                      src={editing.image_url}
                      alt={editing.name}
                      className="w-28 h-28 object-cover rounded-xl border-2 border-gray-200"
                    />
                  </div>
                )}

                {imagePreview && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-400 mb-1.5">New image preview</p>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-28 h-28 object-cover rounded-xl border-2 border-teal-200"
                    />
                  </div>
                )}

                <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-teal-600 hover:text-teal-800 border border-teal-300 hover:border-teal-500 px-4 py-2 rounded-xl transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {imageFile ? 'Change Image' : editing?.image_url ? 'Replace Image' : 'Upload Image'}
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageChange} className="hidden" />
                </label>
                <p className="text-xs text-gray-400 mt-1.5">JPEG, PNG, WebP — shown on homepage category cards</p>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white font-semibold py-2.5 px-6 rounded-full text-sm transition-colors"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : editing ? 'Save Changes' : 'Add Category'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-gray-700 font-medium py-2.5 px-5 rounded-full hover:bg-gray-100 text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Global error (outside form) */}
        {!showForm && error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Category grid */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16 text-gray-400">No categories yet. Add one above.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {categories.map(cat => (
              <div key={cat.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group">
                <div className="aspect-square bg-gray-100 overflow-hidden">
                  {cat.image_url ? (
                    <img
                      src={cat.image_url}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-teal-50 to-teal-100">
                      <svg className="w-10 h-10 text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-teal-400 text-xs mt-1">No image</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-gray-800 text-sm truncate">{cat.name}</h3>
                  {cat.description && (
                    <p className="text-gray-400 text-xs mt-0.5 truncate">{cat.description}</p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => openEdit(cat)}
                      className="flex-1 text-xs text-teal-600 border border-teal-300 hover:bg-teal-50 py-1.5 rounded-lg transition-colors font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      disabled={deletingId === cat.id}
                      className="flex-1 text-xs text-red-500 border border-red-200 hover:bg-red-50 py-1.5 rounded-lg transition-colors font-medium disabled:opacity-50"
                    >
                      {deletingId === cat.id ? '...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
