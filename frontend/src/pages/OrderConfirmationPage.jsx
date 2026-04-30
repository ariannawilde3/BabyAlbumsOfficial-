import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, Package, ArrowRight } from 'lucide-react';
import api from '../lib/api';

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get(`/orders/${id}`);
        setOrder(data);
      } catch {
        navigate('/');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center" style={{ backgroundColor: '#fefdf9' }}>
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  if (!order) return null;

  const placedAt = new Date(order.createdAt).toLocaleString();

  return (
    <div style={{ backgroundColor: '#fefdf9' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: '#e8f0d6' }}>
            <CheckCircle2 size={36} color="#5d6d3f" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
            Thank you for your order!
          </h1>
          <p className="text-gray-500">
            Order <span className="font-mono font-medium text-gray-700">{order.orderNumber}</span> placed {placedAt}
          </p>
          <p className="text-gray-500 text-sm mt-1">A confirmation has been emailed to {order.shippingAddress.email}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
            <Package size={18} /> Order Items
          </h2>
          <div className="divide-y divide-gray-100">
            {order.items.map((item, i) => (
              <div key={i} className="py-3 flex items-center gap-3">
                {item.image ? (
                  <img src={item.image} alt="" className="w-14 h-14 rounded-lg object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300">
                    <Package size={20} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{item.itemType} &middot; Qty {item.quantity}</p>
                </div>
                <span className="font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-4 pt-4 space-y-2 text-sm">
            <Row label="Subtotal" value={`$${order.subtotal.toFixed(2)}`} />
            <Row label="Shipping" value={order.shipping === 0 ? 'Free' : `$${order.shipping.toFixed(2)}`} />
            <Row label="Tax" value={`$${order.tax.toFixed(2)}`} />
            <div className="border-t border-gray-100 pt-2 flex justify-between">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="text-xl font-bold text-gray-900">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Shipping To</h3>
            <p className="text-sm text-gray-700">{order.shippingAddress.fullName}</p>
            <p className="text-sm text-gray-500">{order.shippingAddress.addressLine1}</p>
            {order.shippingAddress.addressLine2 && <p className="text-sm text-gray-500">{order.shippingAddress.addressLine2}</p>}
            <p className="text-sm text-gray-500">
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
            </p>
            <p className="text-sm text-gray-500">{order.shippingAddress.country}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment</h3>
            <p className="text-sm text-gray-700">{order.payment.brand} ending in {order.payment.last4}</p>
            <p className="text-sm text-gray-500">{order.payment.cardName}</p>
            <p className="text-sm text-green-600 mt-2 capitalize">Status: {order.status}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/orders"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50">
            View All Orders
          </Link>
          <Link to="/"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-white font-medium rounded-xl"
            style={{ backgroundColor: '#808a65' }}>
            Continue Shopping <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-gray-600">
      <span>{label}</span>
      <span className="text-gray-900 font-medium">{value}</span>
    </div>
  );
}
