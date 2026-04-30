import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Package, ChevronRight } from 'lucide-react';
import api from '../lib/api';

const STATUS_STYLES = {
  pending: { bg: '#fef3c7', color: '#92400e' },
  paid: { bg: '#e0e7ff', color: '#3730a3' },
  processing: { bg: '#dbeafe', color: '#1e40af' },
  shipped: { bg: '#cffafe', color: '#155e75' },
  delivered: { bg: '#dcfce7', color: '#166534' },
  cancelled: { bg: '#fee2e2', color: '#991b1b' },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get('/orders');
        setOrders(data);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center" style={{ backgroundColor: '#fefdf9' }}>
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4" style={{ backgroundColor: '#fefdf9' }}>
        <Package size={64} strokeWidth={1} className="text-gray-300 mb-6" />
        <h1 className="text-3xl font-semibold text-gray-900 mb-3" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
          No Orders Yet
        </h1>
        <p className="text-gray-500 mb-8">When you place an order it will appear here</p>
        <Link to="/design"
          className="inline-flex items-center gap-2 px-6 py-3 text-white font-medium rounded-xl"
          style={{ backgroundColor: '#808a65' }}>
          Start Designing
        </Link>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#fefdf9' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-8" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
          Your Orders
        </h1>

        <div className="space-y-3">
          {orders.map(order => {
            const style = STATUS_STYLES[order.status] || STATUS_STYLES.paid;
            return (
              <Link key={order._id} to={`/order/${order._id}`}
                className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-medium text-gray-900">{order.orderNumber}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full capitalize"
                        style={{ backgroundColor: style.bg, color: style.color }}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                      {' · '}{order.items.length} item{order.items.length === 1 ? '' : 's'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1 truncate">
                      {order.items.map(i => i.name).join(', ')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-gray-900">${order.total.toFixed(2)}</p>
                  </div>
                  <ChevronRight size={20} className="text-gray-300 mt-1.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
