import React, { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from '../components/layout/Sidebar';
import MessageArea from '../components/chat/MessageArea';
import AddFriend from '../components/chat/AddFriend';
import ThemeCustomizer from '../components/common/ThemeCustomizer';
import { db } from '../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

const Chat = () => {
  const { user, loading, isLocalDev } = useContext(AuthContext);
  const [currentRoom, setCurrentRoom] = useState('add_friend');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    if (!user?._id || IS_LOCAL_CHECK()) return;
    const q = query(collection(db, 'users'), where('online', '==', true));
    const unsub = onSnapshot(q, (snap) => {
      const ids = new Set();
      snap.forEach(d => ids.add(d.id));
      setOnlineUsers(ids);
    });
    return () => unsub();
  }, [user]);

  const IS_LOCAL_CHECK = () => typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  if (loading || !user) {
    return (
      <div style={{
        display: 'flex', height: '100vh', width: '100vw',
        alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-body)', fontFamily: 'var(--font-sans)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💬</div>
          <p style={{ fontWeight: 600, color: 'var(--text-heading)' }}>Loading NexusChat…</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="chat-layout"
      style={{ display: 'flex', height: '100vh', width: '100vw', padding: '0.75rem', boxSizing: 'border-box' }}
    >
      {isLocalDev && (
        <div className="dev-banner">
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
          Local Dev Mode — guest & messages use localStorage
        </div>
      )}
      <div style={{
        display: 'flex', width: '100%', height: '100%',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        border: '1px solid var(--border)',
        background: 'var(--bg)',
        position: 'relative',
      }}>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mobile-only"
            onClick={() => setIsSidebarOpen(false)}
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(4px)', zIndex: 95,
            }}
          />
        )}

        <Sidebar
          currentRoom={currentRoom}
          setCurrentRoom={(room) => { setCurrentRoom(room); setIsSidebarOpen(false); }}
          onlineUsers={onlineUsers}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <AnimatePresence mode="wait">
            {currentRoom === 'add_friend' ? (
              <motion.div
                key="add-friend"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
              >
                <AddFriend
                  currentUser={user}
                  onContactAdded={(contactId) => {
                    const sortedIds = [user._id, contactId].sort();
                    setCurrentRoom(`dm_${sortedIds[0]}_${sortedIds[1]}`);
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key={currentRoom}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
              >
                <MessageArea
                  currentRoom={currentRoom}
                  user={user}
                  onOpenSidebar={() => setIsSidebarOpen(true)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={() => setIsThemeOpen(true)}
          title="Theme Settings"
          style={{
            position: 'absolute', bottom: 20, right: 20,
            width: 40, height: 40, borderRadius: '50%',
            background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-body)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 50,
          }}
        >
          <Settings size={18} strokeWidth={2} />
        </button>
      </div>

      <ThemeCustomizer isOpen={isThemeOpen} onClose={() => setIsThemeOpen(false)} />
      <ToastContainer theme="dark" />
    </motion.div>
  );
};

export default Chat;
