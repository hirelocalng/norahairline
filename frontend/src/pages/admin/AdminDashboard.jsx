import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDashboard } from '../../api';

const NAV_ITEMS = [
  { to: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/admin/orders', icon: '🧾', label: 'Orders' },
  { to: '/admin/products', icon: '📦', label: 'Products' },
  { to: '/admin/products/new', icon: '➕', label: 'Add Product' },
  { to: '/admin/settings', icon: '⚙️', label: 'Settings' },
];

function AdminLayout({ children }) {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-56 bg-teal-600 text-white flex flex-col z-30 transition-transform duration-300
          lg:static lg:translate-x-0 lg:flex-shrink-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-5 border-b border-teal-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">Nora Hair Line</p>
              <p className="text-teal-200 text-xs italic">Admin</p>
            </div>
          </div>
          {/* Close button (mobile only) */}
          <button
            onClick={closeSidebar}
            className="lg:hidden text-teal-200 hover:text-white p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="p-3 flex-1">
          <p className="text-teal-300 text-xs uppercase tracking-wider font-medium px-3 mb-2">Menu</p>
          {NAV_ITEMS.map(({ to, icon, label }) => {
            const active = location.pathname === to || (to === '/admin/products' && location.pathname.startsWith('/admin/products/') && to !== '/admin/products/new');
            return (
              <Link
                key={to}
                to={to}
                onClick={closeSidebar}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-1 transition-colors ${
                  active
                    ? 'bg-teal-500 text-white font-semibold'
                    : 'text-teal-100 hover:bg-teal-500 hover:text-white'
                }`}
              >
                <span>{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-teal-500">
          <div className="px-3 py-2 mb-2">
            <p className="text-teal-200 text-xs truncate">{admin?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-teal-100 hover:bg-red-500 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
          <Link
            to="/"
            target="_blank"
            onClick={closeSidebar}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-teal-100 hover:bg-teal-500 hover:text-white transition-colors mt-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View Site
          </Link>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-600 hover:text-teal-600 p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center">
              <span className="text-white font-bold text-xs">N</span>
            </div>
            <span className="font-bold text-teal-700 text-sm">Nora Hair Line</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export { AdminLayout };

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Overview of your store</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : stats ? (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
                <p className="text-gray-500 text-sm mb-1">Total Products</p>
                <p className="text-3xl font-bold text-teal-700">{stats.total}</p>
              </div>
              <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
                <p className="text-gray-500 text-sm mb-1">Available</p>
                <p className="text-3xl font-bold text-green-600">{stats.available}</p>
              </div>
              <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
                <p className="text-gray-500 text-sm mb-1">Unavailable</p>
                <p className="text-3xl font-bold text-red-500">{stats.total - stats.available}</p>
              </div>
            </div>

            {/* By category */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-5">Products by Category</h2>
              {stats.byCategory.length === 0 ? (
                <p className="text-gray-400 text-sm">No products yet.</p>
              ) : (
                <div className="space-y-3">
                  {stats.byCategory.map((cat) => {
                    const pct = stats.total > 0 ? (cat.count / stats.total) * 100 : 0;
                    return (
                      <div key={cat.category}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700">{cat.category}</span>
                          <span className="text-gray-500">{cat.count} product{cat.count !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-teal-500 rounded-full transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/admin/products/new"
                className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2.5 px-5 rounded-full text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add New Product
              </Link>
              <Link
                to="/admin/products"
                className="flex items-center gap-2 border border-teal-500 text-teal-600 hover:bg-teal-50 font-semibold py-2.5 px-5 rounded-full text-sm transition-colors"
              >
                View All Products
              </Link>
            </div>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}
