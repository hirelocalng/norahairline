import { useState, useEffect, useRef } from 'react';
import { AdminLayout } from './AdminDashboard';
import { getAdminGallery, uploadGalleryItem, deleteGalleryItem } from '../../api';

export default function AdminGallery() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => { load(); }, []);

  const load = () => {
    setLoading(true);
    getAdminGallery()
      .then(res => setItems(res.data))
      .catch(() => setError('Failed to load gallery'))
      .finally(() => setLoading(false));
  };

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    setError('');
    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res = await uploadGalleryItem(fd);
        setItems(prev => [res.data, ...prev]);
      } catch (err) {
        const msg = err.response?.data?.error || err.message || `Failed to upload ${file.name}`;
        setError(`Upload failed: ${msg}`);
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item from the gallery?')) return;
    try {
      await deleteGalleryItem(id);
      setItems(prev => prev.filter(item => item.id !== id));
    } catch {
      setError('Failed to delete item');
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Gallery</h1>
            <p className="text-gray-500 text-sm mt-1">
              Nora Hair Queens — {items.length} item{items.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/quicktime"
              multiple
              className="hidden"
              onChange={handleFiles}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 bg-burgundy-500 hover:bg-burgundy-600 text-white font-semibold py-2.5 px-5 rounded-full text-sm transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {uploading ? 'Uploading…' : 'Upload Photos / Videos'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <svg className="w-14 h-14 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="font-medium">No gallery items yet</p>
            <p className="text-sm mt-1">Upload photos or videos above</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map(item => (
              <div key={item.id} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100">
                {item.media_type === 'video' ? (
                  <>
                    <video
                      src={`${item.file_url}#t=0.5`}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/25 pointer-events-none">
                      <svg className="w-9 h-9 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </>
                ) : (
                  <img src={item.file_url} alt="" className="w-full h-full object-cover" />
                )}
                <button
                  onClick={() => handleDelete(item.id)}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                  aria-label="Delete"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
