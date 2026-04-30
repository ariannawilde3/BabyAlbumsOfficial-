import { useState } from 'react';
import { X, Mail, Lock, User as UserIcon } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../../context/AuthContext';

export default function AuthModal({ onClose, initialMode = 'signin', message }) {
  const { loginWithGoogle, loginWithEmail, register } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleGoogleSuccess(response) {
    try {
      await loginWithGoogle(response.credential);
      onClose();
    } catch {
      setError('Google sign-in failed. Please try again.');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setSubmitting(false);
          return;
        }
        await register(name, email, password);
      } else {
        await loginWithEmail(email, password);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
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
          {mode === 'register' ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          {message || (mode === 'register'
            ? 'Create an account to save your projects and place orders'
            : 'Sign in to access your projects and favorites')}
        </p>

        {error && (
          <div className="mb-4 px-4 py-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          {mode === 'register' && (
            <div className="relative">
              <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b5bda2] focus:border-transparent"
              />
            </div>
          )}
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b5bda2] focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b5bda2] focus:border-transparent"
            />
          </div>
          {mode === 'register' && (
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#b5bda2] focus:border-transparent"
              />
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 text-white font-medium rounded-lg text-sm transition-opacity disabled:opacity-60"
            style={{ backgroundColor: '#808a65' }}
          >
            {submitting ? 'Please wait...' : mode === 'register' ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 text-gray-400" style={{ backgroundColor: '#fefdf9' }}>or</span>
          </div>
        </div>

        <div className="flex justify-center mb-6">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google sign-in failed. Please try again.')}
            theme="outline"
            size="large"
            width="350"
            text="signin_with"
            shape="pill"
          />
        </div>

        <p className="text-center text-sm text-gray-500">
          {mode === 'register' ? (
            <>Already have an account?{' '}
              <button onClick={() => { setMode('signin'); setError(''); }} className="font-medium" style={{ color: '#6b7455' }}>Sign in</button>
            </>
          ) : (
            <>Don&apos;t have an account?{' '}
              <button onClick={() => { setMode('register'); setError(''); }} className="font-medium" style={{ color: '#6b7455' }}>Create one</button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
