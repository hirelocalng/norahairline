import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createProduct, updateProduct, getAdminProduct } from '../../api';
import { AdminLayout } from './AdminDashboard';

const CATEGORIES = [
  'Wigs',
  'Frontals',
  'Closures',
  '360 Illusion Frontal',
  'Bundles',
  'Vietnam Bone Straight',
  'Pixie Curls',
  'Curly Hair',
  'Hair Products',
];

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: '',
    price: '',
    original_price: '',
    category: CATEGORIES[0],
    description: '',
    available: true,
  });
  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [deleteImageIds, setDeleteImageIds] = useState([]);
  const [existingVideoUrl, setExistingVideoUrl] = useState(null);
  const [newVideoFile, setNewVideoFile] = useState(null);
  const [deleteVideo, setDeleteVideo] = useState(false);
  const [videoError, setVideoError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    getAdminProduct(id)
      .then(res => {
        const p = res.data;
        setForm({
          name: p.name,
          price: p.price,
          original_price: p.original_price || '',
          category: p.category,
          description: p.description || '',
          available: p.available,
        });
        setExistingImages(p.images || []);
        setExistingVideoUrl(p.video_url || null);
      })
      .catch(() => setError('Failed to load product'))
      .finally(() => setFetchLoading(false));
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    setNewFiles(prev => [...prev, ...files]);
    const urls = files.map(f => URL.createObjectURL(f));
    setPreviewUrls(prev => [...prev, ...urls]);
  };

  const removeNewFile = (index) => {
    URL.revokeObjectURL(previewUrls[index]);
    setNewFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const toggleDeleteExisting = (imgId) => {
    setDeleteImageIds(prev =>
      prev.includes(imgId) ? prev.filter(i => i !== imgId) : [...prev, imgId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.price || !form.category) {
      setError('Name, price, and category are required');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('name', form.name.trim());
    formData.append('price', form.price);
    formData.append('original_price', form.original_price || '');
    formData.append('category', form.category);
    formData.append('description', form.description);
    formData.append('available', form.available ? 'true' : 'false');

    if (isEdit && deleteImageIds.length > 0) {
      formData.append('deleteImageIds', JSON.stringify(deleteImageIds));
    }
    if (isEdit && deleteVideo) {
      formData.append('deleteVideo', 'true');
    }

    newFiles.forEach(file => formData.append('images', file));
    if (newVideoFile) formData.append('video', newVideoFile);

    try {
      if (isEdit) {
        await updateProduct(id, formData);
      } else {
        await createProduct(formData);
      }
      navigate('/admin/products');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="p-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
          <p className="text-gray-500 text-sm mt-1">{isEdit ? 'Update product details' : 'Fill in the details to add a new product'}</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">Product Details</h2>
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                  placeholder="e.g. Brazilian Body Wave Wig"
                />
              </div>

              {/* Price, Original Price & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Price (₦) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    placeholder="25000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Original Price (₦)
                    <span className="ml-1.5 text-gray-400 font-normal text-xs">— set only if on sale</span>
                  </label>
                  <input
                    type="number"
                    name="original_price"
                    value={form.original_price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    placeholder="30000"
                  />
                </div>
              </div>
              {form.original_price && Number(form.original_price) <= Number(form.price) && (
                <p className="text-xs text-amber-500">Original price should be higher than the sale price.</p>
              )}

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 bg-white"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 resize-none"
                  placeholder="Describe the product — texture, length, care instructions..."
                />
              </div>

              {/* Available toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, available: !prev.available }))}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none ${form.available ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${form.available ? 'left-6' : 'left-1'}`}></span>
                </button>
                <span className="text-sm font-medium text-gray-700">
                  {form.available ? 'Available for purchase' : 'Not available'}
                </span>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-700 mb-4 pb-3 border-b border-gray-100">Product Photos</h2>

            {/* Existing images (edit mode) */}
            {isEdit && existingImages.length > 0 && (
              <div className="mb-5">
                <p className="text-xs text-gray-500 font-medium mb-3">Current Photos (click to mark for removal)</p>
                <div className="flex flex-wrap gap-3">
                  {existingImages.map(img => (
                    <div key={img.id} className="relative">
                      <img
                        src={img.image_url}
                        alt="Product"
                        className={`w-20 h-20 object-cover rounded-xl border-2 cursor-pointer transition-all ${
                          deleteImageIds.includes(img.id)
                            ? 'border-red-400 opacity-40 grayscale'
                            : 'border-gray-200 hover:border-red-300'
                        }`}
                        onClick={() => toggleDeleteExisting(img.id)}
                      />
                      {img.is_primary && !deleteImageIds.includes(img.id) && (
                        <span className="absolute -top-1 -right-1 bg-gold-500 text-white text-xs px-1.5 py-0.5 rounded-full">★</span>
                      )}
                      {deleteImageIds.includes(img.id) && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-red-500 text-2xl">✕</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {deleteImageIds.length > 0 && (
                  <p className="text-xs text-red-500 mt-2">{deleteImageIds.length} photo(s) will be deleted on save.</p>
                )}
              </div>
            )}

            {/* New image previews */}
            {previewUrls.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 font-medium mb-3">New Photos to Upload</p>
                <div className="flex flex-wrap gap-3">
                  {previewUrls.map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt="Preview" className="w-20 h-20 object-cover rounded-xl border-2 border-teal-200" />
                      {i === 0 && !isEdit && (
                        <span className="absolute -top-1 -right-1 bg-gold-500 text-white text-xs px-1.5 py-0.5 rounded-full">★</span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeNewFile(i)}
                        className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs items-center justify-center hidden group-hover:flex"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload area */}
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-8 cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-all">
              <svg className="w-10 h-10 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-gray-600 font-medium">Click to upload photos</p>
              <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP — up to 10MB each, max 10 files</p>
              <p className="text-xs text-teal-500 mt-1">★ First photo becomes the primary image</p>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFiles}
                className="hidden"
              />
            </label>
          </div>

          {/* Video */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-700 mb-1 pb-3 border-b border-gray-100">
              Product Video <span className="text-gray-400 font-normal text-xs ml-1">optional</span>
            </h2>
            <p className="text-xs text-gray-400 mb-4">Any video format (MP4, MOV, AVI, WebM…) — max 100MB</p>

            {/* Existing video (edit mode) */}
            {isEdit && existingVideoUrl && !deleteVideo && !newVideoFile && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 font-medium mb-2">Current Video</p>
                <video
                  src={existingVideoUrl}
                  controls
                  className="w-full max-w-sm rounded-xl border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => setDeleteVideo(true)}
                  className="mt-2 text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  ✕ Remove video
                </button>
              </div>
            )}

            {isEdit && deleteVideo && !newVideoFile && (
              <div className="mb-4 flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <span className="text-sm text-red-500">Video will be removed on save.</span>
                <button
                  type="button"
                  onClick={() => setDeleteVideo(false)}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Undo
                </button>
              </div>
            )}

            {/* New video preview */}
            {newVideoFile && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 font-medium mb-2">New Video to Upload</p>
                <video
                  src={URL.createObjectURL(newVideoFile)}
                  controls
                  className="w-full max-w-sm rounded-xl border border-teal-200"
                />
                <button
                  type="button"
                  onClick={() => { setNewVideoFile(null); setVideoError(''); }}
                  className="mt-2 text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  ✕ Remove
                </button>
              </div>
            )}

            {videoError && (
              <p className="text-xs text-red-500 mb-3">{videoError}</p>
            )}

            {/* Upload area — hide if video already selected */}
            {!newVideoFile && (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-6 cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-all">
                <svg className="w-9 h-9 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
                <p className="text-sm text-gray-600 font-medium">Click to upload video</p>
                <p className="text-xs text-gray-400 mt-1">Any video format — max 100MB</p>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    if (file.size > 100 * 1024 * 1024) {
                      setVideoError('Video exceeds 100MB limit');
                      e.target.value = '';
                      return;
                    }
                    setVideoError('');
                    setDeleteVideo(false);
                    setNewVideoFile(file);
                  }}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white font-semibold py-3 px-6 rounded-full transition-colors"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {isEdit ? 'Saving...' : 'Adding...'}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {isEdit ? 'Save Changes' : 'Add Product'}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="text-gray-500 hover:text-gray-700 font-medium py-3 px-5 rounded-full hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
