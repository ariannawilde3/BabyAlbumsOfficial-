import { Heart } from 'lucide-react';

export default function FavoritesPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4" style={{ backgroundColor: '#fefdf9' }}>
      <Heart size={64} strokeWidth={1} className="text-gray-300 mb-6" />
      <h1 className="text-3xl font-semibold text-gray-900 mb-3" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
        Sign In to View Favorites
      </h1>
      <p className="text-gray-500 mb-8">Create an account to save your favorite photobook templates</p>
      <button className="inline-flex items-center gap-2 px-6 py-3 text-white font-medium rounded-xl" style={{ backgroundColor: '#808a65' }}>
        Sign In
      </button>
    </div>
  );
}