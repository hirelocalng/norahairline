import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminProducts, deleteProduct, toggleAvailability } from '../../api';
import { AdminLayout } from './AdminDashboard';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState('');

  const fetchProducts = () => {
    setLoading(true);
    getAdminProducts()
      .then(res => setProducts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleToggle = async (id, current) => {
    try {
      await toggleAvailability(id, !current);
      setProducts(prev => prev.map(p => p.id === id ? { ...p, available: !current } : p));
    } catch (err) {
      alert('Failed to update availability');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      setDeleteId(null);
    } catch (err) {
      alert('Failed to delete product');
    }
  };

  const filtered = search.trim()
    ? products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
      )
    : products;

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Products</h1>
            <p className="text-gray-500 text-sm mt-1">{products.length} total products</p>
          </div>
          <Link
            to="/admin/products/new"
            className="flex items-center gap-2 bg-burgundy-500 hover:bg-burgundy-600 text-white font-semibold py-2.5 px-5 rounded-full text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-burgundy-500 bg-white"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border-b border-gray-50 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-3">📦</div>
            <h3 className="text-lg font-semibold text-gray-600">No products found</h3>
            {search ? (
              <p className="text-gray-400 text-sm mt-1">No results for "{search}"</p>
            ) : (
              <Link to="/admin/products/new" className="inline-block mt-4 btn-teal text-sm">
                Add Your First Product
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <div className="col-span-5">Product</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2">Price</div>
              <div className="col-span-1 text-center">Status</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {filtered.map((product, idx) => (
              <div
                key={product.id}
                className={`grid grid-cols-1 md:grid-cols-12 gap-4 px-5 py-4 items-center border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50/30'}`}
              >
                {/* Product */}
                <div className="col-span-5 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {product.primary_image ? (
                      <img src={product.primary_image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-burgundy-50">
                        <span className="text-burgundy-400 text-xs">No img</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{product.name}</p>
                    <p className="text-gray-400 text-xs">ID #{product.id}</p>
                  </div>
                </div>

                {/* Category */}
                <div className="col-span-2">
                  <span className="text-xs bg-burgundy-50 text-burgundy-700 border border-burgundy-100 px-2 py-1 rounded-full">{product.category}</span>
                </div>

                {/* Price */}
                <div className="col-span-2">
                  <span className="font-semibold text-gold-600 text-sm">₦{Number(product.price).toLocaleString()}</span>
                </div>

                {/* Status toggle */}
                <div className="col-span-1 flex justify-center">
                  <button
                    onClick={() => handleToggle(product.id, product.available)}
                    title={product.available ? 'Click to mark unavailable' : 'Click to mark available'}
                    className={`relative w-10 h-6 rounded-full transition-colors duration-300 focus:outline-none ${product.available ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${product.available ? 'left-5' : 'left-1'}`}></span>
                  </button>
                </div>

                {/* Actions */}
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <Link
                    to={`/admin/products/${product.id}/edit`}
                    className="text-xs font-medium text-burgundy-600 hover:text-burgundy-800 bg-burgundy-50 hover:bg-burgundy-100 px-3 py-1.5 rounded-full transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => setDeleteId(product.id)}
                    className="text-xs font-medium text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full">
            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-800 text-lg">Delete Product?</h3>
              <p className="text-gray-500 text-sm mt-1">This action cannot be undone. All images will also be deleted.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold py-2.5 rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

