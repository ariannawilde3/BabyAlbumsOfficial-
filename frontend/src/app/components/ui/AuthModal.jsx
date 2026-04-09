import { X } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../../context/AuthContext';

export default function AuthModal({ onClose }) {
  const { loginWithGoogle } = useAuth();

  async function handleGoogleSuccess(response) {
    try {
      await loginWithGoogle(response.credential);
      onClose();
    } catch {
      alert('Sign-in failed. Please try again.');
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(17,24,39,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 p-8 rounded-2xl shadow-2xl" style={{ backgroundColor: '#fefdf9' }}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors">
          <X size={20} />
        </button>

        <h2 className="text-2xl font-semibold text-gray-900 mb-2" style={{ fontFamily: '"Playfair Display", Georgia, serif' }}>
          Welcome to Baby Albums
        </h2>
        <p className="text-gray-500 text-sm mb-8">
          Sign in to save your projects, manage favorites, and create beautiful photobooks
        </p>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => alert('Google sign-in failed. Please try again.')}
            theme="outline"
            size="large"
            width="350"
            text="signin_with"
            shape="pill"
          />
        </div>
      </div>
    </div>
  );
}
