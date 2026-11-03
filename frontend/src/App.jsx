import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { motion } from 'motion/react';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Chat from './pages/Chat';

// Protected Route Component
const PrivateRoute = ({ children }) => {
  const { user, loading } = React.useContext(AuthContext);

  if (loading) return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      height: '100vh', width: '100vw',
      background: 'var(--bg-secondary)',
      color: 'var(--text-heading)',
      fontFamily: 'var(--font-sans)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          style={{
            width: 48, height: 48, borderRadius: '10px',
            background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            color: 'white', fontWeight: 900, fontSize: '1.5rem',
          }}
        >N</motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: '1.1rem', marginBottom: '0.5rem' }}
        >
          NexusChat
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ delay: 0.4, duration: 1.8, repeat: Infinity }}
          style={{ fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.9rem' }}
        >
          Loading…
        </motion.p>
      </div>
    </div>
  );

  if (!user) return <Landing />;

  return children;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            
            {/* Protected Route */}
            <Route path="/chat" element={
              <PrivateRoute>
                <Chat />
              </PrivateRoute>
            } />

            {/* Catch-all redirect to landing page */}
            <Route path="*" element={<Landing />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
