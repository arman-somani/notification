import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AuthContext } from '../context/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  ArrowRight, Eye, EyeOff, Mail, Lock, UserPlus, AlertCircle,
  Loader2, ShieldCheck, Sparkles, Users, User
} from 'lucide-react';
import { RevealOnScroll } from '../components/ui/Animated';

const Login = () => {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { loginUser, registerUser, loginAsGuest, loginWithProvider, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/chat');
  }, [user, navigate]);

  const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (!validateEmail(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (mode === 'register' && username.trim().length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'register') {
        const name = username.trim() || email.split('@')[0];
        await registerUser(email.trim(), password, name);
        toast.success('Account created. Welcome to NexusChat.');
      } else {
        await loginUser(email.trim(), password);
      }
      navigate('/chat');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuest = async () => {
    setIsLoading(true);
    setError('');
    try {
      await loginAsGuest();
      navigate('/chat');
    } catch (err) {
      setError(err.message || 'Guest sign-in is not available.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '0.9rem 1rem', borderRadius: 'var(--radius)',
    border: '1px solid var(--border)', background: 'var(--bg)',
    color: 'var(--text-heading)', outline: 'none',
    fontFamily: 'var(--font-sans)', fontSize: '0.95rem', fontWeight: 500,
    transition: 'border-color 0.15s',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', position: 'relative' }}>
      <button
        onClick={() => navigate('/')}
        style={{
          position: 'absolute', top: '1.5rem', left: '1.5rem',
          background: 'transparent', border: 'none', color: 'var(--text-dim)',
          cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '0.9rem', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} /> Back to home
      </button>

      <RevealOnScroll direction="up" style={{ width: '100%', maxWidth: 420 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="surface-card"
          style={{ padding: '2.5rem 2rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}
        >
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '16px',
              background: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 800, fontSize: '1.5rem',
              margin: '0 auto 1rem',
              border: '1px solid var(--border)',
            }}>N</div>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              {mode === 'login' ? 'Sign in to continue your conversations.' : 'Set up your profile and start messaging.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 6, marginBottom: '1.75rem' }}>
            {[
              { id: 'login', label: 'Sign in', icon: <Mail size={16} strokeWidth={2} /> },
              { id: 'register', label: 'Register', icon: <UserPlus size={16} strokeWidth={2} /> },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={`nav-item ${mode === m.id ? 'active' : ''}`}
                style={{ flex: 1, padding: '0.7rem', borderRadius: 'var(--radius)', justifyContent: 'center', width: 'auto' }}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <AnimatePresence initial={false}>
              {mode === 'register' && (
                <motion.div
                  key="username-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden', marginBottom: '1rem' }}
                >
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-body)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={16} strokeWidth={2} /> Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    style={inputStyle}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-body)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={16} strokeWidth={2} /> Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-body)', marginBottom: '0.5rem' }}>
                <Lock size={16} strokeWidth={2} /> Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ ...inputStyle, paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                >
                  {showPassword ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)',
                background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)',
                marginBottom: '1.25rem',
              }}
              >
                <AlertCircle size={16} color="#ef4444" strokeWidth={2} style={{ flexShrink: 0 }} />
                <p style={{ color: '#ef4444', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginBottom: '1.25rem' }}
            >
              {isLoading ? (
                <><Loader2 size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> Signing in…</>
              ) : (
                <>
                  {mode === 'login' ? 'Sign in' : 'Create account'}
                  <ArrowRight size={18} strokeWidth={2} />
                </>
              )}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem', fontWeight: 600 }}>Or</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            <button
              type="button"
              onClick={handleGuest}
              disabled={isLoading}
              className="btn btn-secondary btn-lg"
              style={{ width: '100%' }}
            >
              <Users size={18} strokeWidth={2} /> Continue as guest
            </button>

            <div style={{ marginTop: '1.5rem', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem', fontWeight: 600 }}>Or continue with</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => loginWithProvider('google').catch(e => setError(e.message || 'Google sign-in failed'))}
                  disabled={isLoading}
                  className="btn btn-secondary btn-sm ripple"
                  style={{ flex: 1 }}
                >
                  <span style={{ fontWeight: 700, color: 'var(--text-heading)' }}>Google</span>
                </button>
                <button
                  type="button"
                  onClick={() => loginWithProvider('facebook').catch(e => setError(e.message || 'Facebook sign-in failed'))}
                  disabled={isLoading}
                  className="btn btn-secondary btn-sm ripple"
                  style={{ flex: 1 }}
                >
                  <span style={{ fontWeight: 700, color: 'var(--text-heading)' }}>Facebook</span>
                </button>
                <button
                  type="button"
                  onClick={() => loginWithProvider('github').catch(e => setError(e.message || 'GitHub sign-in failed'))}
                  disabled={isLoading}
                  className="btn btn-secondary btn-sm ripple"
                  style={{ flex: 1 }}
                >
                  <span style={{ fontWeight: 700, color: 'var(--text-heading)' }}>GitHub</span>
                </button>
              </div>
            </div>
          </form>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={14} strokeWidth={2} /> Secure
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={14} strokeWidth={2} /> Free
            </span>
          </div>
        </motion.div>
        <ToastContainer theme="dark" />
      </RevealOnScroll>
    </div>
  );
};

export default Login;
