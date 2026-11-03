import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, UserPlus, X } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import UserDashboard from '../common/UserDashboard';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

const getGradient = (id) => {
  const gradients = [
    ['#0f172a', '#334155'], ['#6366f1', '#a855f7'], ['#3b82f6', '#06b6d4'],
    ['#10b981', '#34d399'], ['#f59e0b', '#f97316'], ['#ec4899', '#f472b6'],
  ];
  const hash = (id || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
};

const AvatarCircle = ({ src, emoji, username, size = 36, isOnline }) => {
  const [c1, c2] = getGradient(username || '');
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {src
        ? <img src={src} alt={username} style={{
            width: size, height: size, borderRadius: '50%', objectFit: 'cover',
            border: '2px solid var(--border)',
          }} />
        : <div style={{
            width: size, height: size, borderRadius: '50%',
            background: `linear-gradient(135deg, ${c1}, ${c2})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: size * 0.4, color: 'white', fontWeight: 700,
            border: '1px solid var(--border)',
          }}>
            {emoji || (username?.[0]?.toUpperCase() || '?')}
          </div>
      }
      {isOnline !== undefined && (
        <div style={{
          position: 'absolute', bottom: 0, right: 0,
          width: 10, height: 10, borderRadius: '50%',
          background: isOnline ? 'var(--success)' : 'var(--text-dim)',
          border: '2px solid var(--bg)',
          boxShadow: isOnline ? '0 0 8px rgba(34,197,94,0.4)' : 'none',
        }} />
      )}
    </div>
  );
};

const Sidebar = ({ currentRoom, setCurrentRoom, isOpen, onClose, onlineUsers }) => {
  const { user, logout, updateUser } = useContext(AuthContext);
  const [contacts, setContacts] = useState([]);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);

  const fetchContacts = async () => {
    if (!user?._id) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', user._id));
      if (userDoc.exists()) {
        const contactIds = userDoc.data().contacts || [];
        if (contactIds.length > 0) {
          const data = [];
          for (const id of contactIds) {
            const cd = await getDoc(doc(db, 'users', id));
            if (cd.exists()) data.push({ _id: id, ...cd.data() });
          }
          setContacts(data);
        } else {
          setContacts([]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch contacts', err);
    }
  };

  useEffect(() => { fetchContacts(); }, [user]);

  const openDM = (contactId) => {
    const sorted = [user._id, contactId].sort();
    setCurrentRoom(`dm_${sorted[0]}_${sorted[1]}`);
    if (onClose) onClose();
  };

  return (
    <div
      className={`sidebar-container ${isOpen ? 'open' : ''}`}
      style={{
        width: 260, flexShrink: 0,
        background: 'var(--bg)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        padding: '1.25rem 0',
        position: 'relative',
      }}
    >
      {isOpen && (
        <button
          onClick={onClose}
          className="mobile-only"
          style={{
            position: 'absolute', top: 12, right: 12,
            background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: '50%', width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 10, color: 'var(--text-body)',
          }}
        >
          <X size={16} strokeWidth={2} />
        </button>
      )}

      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        style={{ padding: '0 1.25rem', marginBottom: '1.5rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 'var(--radius)',
            background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 800, fontSize: '1.2rem',
            border: '1px solid var(--border)',
            flexShrink: 0,
          }}>N</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-heading)' }}>
              NexusChat
            </div>
            <div className="badge badge-success" style={{ fontSize: '0.68rem', padding: '2px 8px', marginTop: 2 }}>
              ● Online
            </div>
          </div>
        </div>
      </motion.div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 0.75rem' }}>
        <motion.button
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { setCurrentRoom('add_friend'); if (onClose) onClose(); }}
          className={`nav-item ${currentRoom === 'add_friend' ? 'active' : ''}`}
          style={{ marginBottom: '1rem', width: '100%' }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: 'var(--radius-sm)',
            background: currentRoom === 'add_friend' ? 'var(--accent)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <UserPlus size={16} color={currentRoom === 'add_friend' ? 'white' : 'var(--accent)'} strokeWidth={2} />
          </div>
          Add Friend
        </motion.button>

        <div style={{ marginBottom: '0.5rem', padding: '0 0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(99,102,241,0.1), transparent)' }} />
            <span style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>
              Direct Messages
            </span>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, rgba(99,102,241,0.1), transparent)' }} />
          </div>

          {contacts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{
                padding: '1.5rem 1rem', textAlign: 'center',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
              <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', lineHeight: 1.5 }}>
                No friends yet.<br />Add some to get started.
              </p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {contacts.map((contact, i) => {
                const dmRoom = `dm_${[user._id, contact._id].sort().join('_')}`;
                const isSelected = currentRoom === dmRoom;
                const online = onlineUsers && onlineUsers.has(contact._id);

                return (
                  <motion.button
                    key={contact._id}
                    layout
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => openDM(contact._id)}
                    className={`nav-item ${isSelected ? 'active' : ''}`}
                    style={{ width: '100%' }}
                  >
                    <AvatarCircle
                      src={contact.avatar}
                      username={contact.username}
                      size={34}
                      isOnline={online}
                    />
                    <div style={{ flex: 1, textAlign: 'left', overflow: 'hidden' }}>
                      <div style={{
                        fontWeight: 700, fontSize: '0.9rem',
                        color: isSelected ? 'var(--accent)' : 'var(--text-heading)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {contact.username}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: online ? 'var(--success)' : 'var(--text-dim)',
                        fontWeight: 600,
                      }}>
                        {online ? 'Online' : 'Offline'}
                      </div>
                    </div>
                    {isSelected && (
                      <motion.div
                        layoutId="sidebar-active-dot"
                        style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: 'var(--accent)', flexShrink: 0,
                          boxShadow: '0 0 8px rgba(99,102,241,0.3)',
                        }} />
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ padding: '0 0.75rem', marginTop: '0.75rem' }}
      >
        <motion.div
          onClick={() => setIsDashboardOpen(true)}
          whileHover={{ borderColor: 'rgba(99,102,241,0.2)', y: -1 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.75rem 0.85rem',
            background: 'transparent',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            cursor: 'pointer',
          }}
        >
          <AvatarCircle
            src={user?.avatar}
            username={user?.username}
            emoji="👤"
            size={34}
            isOnline={true}
          />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{
              fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-heading)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {user?.username}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>
              Edit profile
            </div>
          </div>
          <motion.button
            onClick={(e) => { e.stopPropagation(); logout(); }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.1)',
              borderRadius: 'var(--radius-sm)', width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--danger)', flexShrink: 0,
            }}
            title="Logout"
          >
            <LogOut size={14} strokeWidth={2} />
          </motion.button>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {isDashboardOpen && (
          <UserDashboard
            user={user}
            onClose={() => setIsDashboardOpen(false)}
            onUpdateUser={(updated) => updateUser(updated)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Sidebar;
