import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './app/components/ui/Navbar';
import HomePage from './pages/HomePage';
import TemplatesPage from './pages/TemplatesPage';
import DesignPage from './pages/DesignPage';
import FavoritesPage from './pages/FavoritesPage';
import CartPage from './pages/CartPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen font-sans flex flex-col" style={{ backgroundColor: '#fefdf9' }}>
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/templates" element={<TemplatesPage />} />
              <Route path="/design" element={<DesignPage />} />
              <Route path="/ai-create" element={<DesignPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/cart" element={<CartPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none" style={{ color: '#6b7455' }}>
                <rect x="2" y="4" width="18" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <rect x="8" y="4" width="18" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
              <span className="text-lg font-semibold" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>Baby Albums</span>
            </div>
            <p className="text-sm text-gray-500">Create beautiful photo albums your way. Digital or physical.</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 text-sm">Create</h4>
            <div className="space-y-2">
              <a href="/design" className="block text-sm text-gray-500 hover:text-gray-700">Design Your Own</a>
              <a href="/templates" className="block text-sm text-gray-500 hover:text-gray-700">Templates</a>
              <a href="/ai-create" className="block text-sm text-gray-500 hover:text-gray-700">AI Creator</a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 text-sm">Products</h4>
            <div className="space-y-2">
              <span className="block text-sm text-gray-500">Digital Albums</span>
              <span className="block text-sm text-gray-500">Physical Albums</span>
              <span className="block text-sm text-gray-500">Pricing</span>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 text-sm">Support</h4>
            <div className="space-y-2">
              <span className="block text-sm text-gray-500">Help Center</span>
              <span className="block text-sm text-gray-500">Contact Us</span>
              <span className="block text-sm text-gray-500">Privacy Policy</span>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100 mt-8 pt-8 text-center text-sm text-gray-400">
          &copy; 2026 Baby Albums. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
