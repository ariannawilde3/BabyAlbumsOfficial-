import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import AuthModal from '../app/components/ui/AuthModal';

export default function FavoritesPage() {
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isGuest) {
      fetchFavorites();
    } else {
      setLoading(false);
    }
  }, [isGuest]);

  async function fetchFavorites() {
    try {
      const data = await api.get('/favorites');
      setFavorites(data);
    } catch {
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }

  async function removeFav(templateId) {
    try {
      await api.post(`/favorites/${templateId}`);
      setFavorites(prev => prev.filter(f => f._id !== templateId));
    } catch {
      // ignore
    }
  }

  if (isGuest) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4" style={{ backgroundColor: '#fefdf9' }}>
        <Heart size={64} strokeWidth={1} className="text-gray-300 mb-6" />
        <h1 className="text-3xl font-semibold text-gray-900 mb-3" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
          Sign In to View Favorites
        </h1>
        <p className="text-gray-500 mb-8">Create an account to save your favorite photobook templates</p>
        <button onClick={() => setShowAuth(true)}
          className="inline-flex items-center gap-2 px-6 py-3 text-white font-medium rounded-xl" style={{ backgroundColor: '#808a65' }}>
          Sign In
        </button>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center" style={{ backgroundColor: '#fefdf9' }}>
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4" style={{ backgroundColor: '#fefdf9' }}>
        <Heart size={64} strokeWidth={1} className="text-gray-300 mb-6" />
        <h1 className="text-3xl font-semibold text-gray-900 mb-3" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
          No Favorites Yet
        </h1>
        <p className="text-gray-500 mb-8">Browse templates and tap the heart to save your favorites</p>
        <button onClick={() => navigate('/templates')}
          className="inline-flex items-center gap-2 px-6 py-3 text-white font-medium rounded-xl" style={{ backgroundColor: '#808a65' }}>
          Browse Templates
        </button>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#fefdf9' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-8" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
          Your Favorites
        </h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map(t => (
            <div key={t._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-all">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src={t.image} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <button onClick={() => removeFav(t._id)}
                  className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center bg-white/90 rounded-full shadow-sm hover:bg-white">
                  <Heart size={16} className="fill-red-500 text-red-500" />
                </button>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>{t.name}</h3>
                  <span className="text-lg font-semibold text-gray-900">${t.price?.toFixed(2)}</span>
                </div>
                <p className="text-sm text-gray-500 mb-4">{t.description}</p>
                <button onClick={() => navigate(`/design?templateId=${t._id}`)}
                  className="w-full py-2.5 text-white text-sm font-medium rounded-xl" style={{ backgroundColor: '#808a65' }}>
                  Use Template
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
