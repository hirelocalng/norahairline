import { useState, useEffect } from 'react';
import { AdminLayout } from './AdminDashboard';
import api from '../../api';

const STATUS_COLORS = {
  pending:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
  shipped:   'bg-purple-100 text-purple-700 border-purple-200',
  delivered: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-600 border-red-200',
};

const STATUS_OPTIONS = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    api.get('/admin/orders')
      .then(res => setOrders(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (orderId, status) => {
    setUpdating(orderId);
    try {
      const res = await api.patch(`/admin/orders/${orderId}/status`, { status });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: res.data.status } : o));
    } catch {
      alert('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const formatDate = (ts) => new Date(ts).toLocaleString('en-NG', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Orders</h1>
          <p className="text-gray-500 text-sm mt-1">{orders.length} total orders</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-3">📋</div>
            <h3 className="text-lg font-semibold text-gray-600">No orders yet</h3>
            <p className="text-gray-400 text-sm mt-1">Orders from customers will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => {
              const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
              const isExpanded = expanded === order.id;

              return (
                <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Header row */}
                  <div
                    className="flex items-center gap-3 px-4 sm:px-5 py-4 cursor-pointer hover:bg-gray-50/60 transition-colors"
                    onClick={() => setExpanded(isExpanded ? null : order.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-800 text-sm">#{order.id}</span>
                        <span className="text-gray-400 text-xs">·</span>
                        <span className="text-sm text-gray-700">{order.customer_name}</span>
                        <span className="text-gray-400 text-xs hidden sm:inline">·</span>
                        <span className="text-xs text-gray-400 hidden sm:inline">{order.customer_phone}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">{formatDate(order.created_at)}</span>
                        <span className="text-xs font-bold text-gold-600">₦{Number(order.total).toLocaleString()}</span>
                        {order.payment_method === 'whatsapp' ? (
                          <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">WhatsApp</span>
                        ) : (
                          <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full">Korapay</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <select
                        value={order.status}
                        onChange={e => { e.stopPropagation(); handleStatusChange(order.id, e.target.value); }}
                        onClick={e => e.stopPropagation()}
                        disabled={updating === order.id}
                        className={`text-xs font-semibold border rounded-full px-3 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-400 ${STATUS_COLORS[order.status] || ''} disabled:opacity-60`}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-4 sm:px-5 pb-5 border-t border-gray-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Customer info */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Customer</p>
                        <div className="space-y-1 text-sm text-gray-700">
                          <p><span className="font-medium">Name:</span> {order.customer_name}</p>
                          <p><span className="font-medium">Phone:</span> {order.customer_phone}</p>
                          <p><span className="font-medium">State:</span> {order.customer_state}</p>
                          <p><span className="font-medium">Address:</span> {order.customer_address}</p>
                        </div>
                      </div>

                      {/* Items */}
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Items</p>
                        <div className="space-y-1">
                          {items.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm text-gray-700">
                              <span>{item.name} ×{item.quantity}</span>
                              <span className="font-medium text-gold-600">₦{(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                          <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between font-bold text-sm">
                            <span>Total</span>
                            <span className="text-gold-600">₦{Number(order.total).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
