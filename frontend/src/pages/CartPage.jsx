import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CartPage() {
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