import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, Loader2, Plus, Minus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import AuthModal from '../app/components/ui/AuthModal';

export default function CartPage() {
  const { isGuest } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  async function fetchCart() {
    try {
      const data = await api.get('/cart');
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function removeItem(id) {
    try {
      await api.delete(`/cart/${id}`);
      setItems(prev => prev.filter(i => i._id !== id));
    } catch {
      alert('Failed to remove item');
    }
  }

  async function updateQty(id, qty) {
    if (qty < 1) return;
    try {
      await api.put(`/cart/${id}`, { quantity: qty });
      setItems(prev => prev.map(i => i._id === id ? { ...i, quantity: qty } : i));
    } catch {
      // ignore
    }
  }

  function getItemName(item) {
    if (item.itemType === 'template' && item.template) return item.template.name;
    if (item.itemType === 'project' && item.project) return item.project.title;
    return 'Album';
  }

  function getItemImage(item) {
    if (item.itemType === 'template' && item.template) return item.template.image;
    return null;
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center" style={{ backgroundColor: '#fefdf9' }}>
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4" style={{ backgroundColor: '#fefdf9' }}>
        <ShoppingCart size={64} strokeWidth={1} className="text-gray-300 mb-6" />
        <h1 className="text-3xl font-semibold text-gray-900 mb-3" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
          Your Cart is Empty
        </h1>
        <p className="text-gray-500 mb-8">Start designing to add items to your cart</p>
        <Link to="/design" className="inline-flex items-center gap-2 px-6 py-3 text-white font-medium rounded-xl" style={{ backgroundColor: '#808a65' }}>
          Start Creating
        </Link>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#fefdf9' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-8" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
          Your Cart
        </h1>

        <div className="space-y-4 mb-8">
          {items.map(item => (
            <div key={item._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
              {getItemImage(item) && (
                <img src={getItemImage(item)} alt="" className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900 truncate">{getItemName(item)}</h3>
                <p className="text-sm text-gray-500 capitalize">{item.itemType}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQty(item._id, item.quantity - 1)}
                  className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                <button onClick={() => updateQty(item._id, item.quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">
                  <Plus size={14} />
                </button>
              </div>
              <span className="text-lg font-semibold text-gray-900 w-24 text-right">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
              <button onClick={() => removeItem(item._id)}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600">Subtotal</span>
            <span className="text-xl font-bold text-gray-900">${subtotal.toFixed(2)}</span>
          </div>
          <button
            onClick={() => {
              if (isGuest) {
                setShowAuth(true);
              } else {
                navigate('/checkout');
              }
            }}
            className="w-full py-3 text-white font-medium rounded-xl text-base"
            style={{ backgroundColor: '#808a65' }}
          >
            {isGuest ? 'Sign In to Checkout' : 'Proceed to Checkout'}
          </button>
          {isGuest && (
            <p className="text-center text-sm text-gray-400 mt-3">
              Your cart will be saved when you create an account
            </p>
          )}
        </div>
      </div>

      {showAuth && (
        <AuthModal
          onClose={() => {
            setShowAuth(false);
            fetchCart();
            if (localStorage.getItem('token')) navigate('/checkout');
          }}
          initialMode="register"
          message="Create an account to complete your purchase. Your cart and projects will be saved."
        />
      )}
    </div>
  );
}
