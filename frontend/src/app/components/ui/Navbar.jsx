import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, ShoppingCart, User, LogOut, Package } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import AuthModal from './AuthModal';

export default function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/templates', label: 'Templates' },
    { to: '/design', label: 'Design Your Own' },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-gray-100" style={{ backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2.5">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ color: '#6b7455' }}>
                <rect x="2" y="4" width="18" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <rect x="8" y="4" width="18" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
              <span className="text-xl font-semibold text-gray-900" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>Baby Albums</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {navLinks.map(({ to, label }) => (
                <Link key={to} to={to}
                  className="text-sm font-medium transition-colors"
                  style={{ color: location.pathname === to ? '#6b7455' : '#4b5563' }}>
                  {label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Link to="/favorites" className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors">
                <Heart size={20} />
              </Link>
              <Link to="/cart" className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors">
                <ShoppingCart size={20} />
              </Link>

              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{ backgroundColor: '#808a65' }}>
                        {user.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="hidden sm:block text-sm font-medium text-gray-700">{user.name?.split(' ')[0]}</span>
                  </button>

                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <Link to="/orders" onClick={() => setShowMenu(false)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <Package size={16} /> My Orders
                      </Link>
                      <button
                        onClick={() => { logout(); setShowMenu(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button onClick={() => setShowAuth(true)}
                  className="flex items-center gap-2 pl-3 pr-4 py-2 rounded-xl text-white text-sm font-medium"
                  style={{ backgroundColor: '#808a65' }}>
                  <User size={16} /> Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
