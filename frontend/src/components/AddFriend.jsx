import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, UserPlus, CheckCircle, Users } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { SpotlightCard } from './ui/Animated';

const getGradient = (id = '') => {
  const gradients = [
    ['#0f172a', '#334155'], ['#6366f1', '#a855f7'], ['#3b82f6', '#06b6d4'],
    ['#10b981', '#34d399'], ['#f59e0b', '#f97316'], ['#ec4899', '#f472b6'],
  ];
  const h = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return gradients[h % gradients.length];
};

const AddFriend = ({ currentUser, onContactAdded }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [addedIds, setAddedIds] = useState(new Set());

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 0) performSearch();
      else setSearchResults([]);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = async () => {
    setIsSearching(true);
    try {
      const snap = await getDocs(query(collection(db, 'users'), where('username', '==', searchQuery.trim())));
      const res = [];
      snap.forEach(d => { if (d.id !== currentUser._id) res.push({ _id: d.id, ...d.data() }); });
      setSearchResults(res);
    } catch (e) { console.error(e); }
    finally { setIsSearching(false); }
  };

  const handleAdd = async (contactId) => {
    try {
      await updateDoc(doc(db, 'users', currentUser._id), { contacts: arrayUnion(contactId) });
      await updateDoc(doc(db, 'users', contactId), { contacts: arrayUnion(currentUser._id) });
      setAddedIds(prev => new Set([...prev, contactId]));
      setTimeout(() => {
        setSearchQuery('');
        setSearchResults([]);
        if (onContactAdded) onContactAdded(contactId);
      }, 600);
    } catch (e) { console.error(e); }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{
        padding: '0.85rem 1.5rem',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg)',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        flexShrink: 0,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 'var(--radius-sm)',
          background: 'var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        >
          <UserPlus size={16} color="white" strokeWidth={2} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-heading)' }}>Add a Friend</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>Search by exact username</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 1.75rem' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ textAlign: 'center', marginBottom: '2rem' }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🤝</div>
            <h2 style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--text-heading)', marginBottom: '0.4rem' }}>Find Friends</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Type the exact username to find and add someone</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              background: 'var(--bg)',
              borderRadius: 'var(--radius-lg)',
              border: `1px solid ${isSearchFocused ? 'var(--accent)' : 'var(--border)'}`,
              padding: '0.9rem 1rem',
              transition: 'border-color 0.15s',
            }}
          >
            <div style={{ flexShrink: 0 }}>
              <Search size={20} color={isSearchFocused ? 'var(--accent)' : 'var(--text-dim)'} strokeWidth={2} />
            </div>
            <input
              type="text"
              placeholder="Search by username…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              style={{
                flex: 1, border: 'none', background: 'transparent', outline: 'none',
                color: 'var(--text-heading)', fontSize: '1rem', fontWeight: 600,
                fontFamily: 'var(--font-sans)',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                style={{
                  background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99,102,241,0.15)',
                  borderRadius: 'var(--radius-sm)', width: 28, height: 28, cursor: 'pointer',
                  color: 'var(--accent)', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >✕</button>
            )}
          </motion.div>

          <div style={{ marginTop: '1.5rem' }}>
            {isSearching ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🔍</div>
                <p style={{ fontWeight: 700 }}>Searching…</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>
                {searchResults.map((r) => {
                  const [c1, c2] = getGradient(r._id);
                  const wasAdded = addedIds.has(r._id);
                  return (
                    <motion.div
                      key={r._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <SpotlightCard className="surface-card" style={{ padding: '1rem 1.25rem', borderRadius: 20, border: wasAdded ? '1px solid rgba(16, 185, 129, 0.2)' : undefined, border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          {r.avatar
                            ? <img src={r.avatar} alt="" style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid var(--border)' }} />
                            : <div style={{
                                width: 40, height: 40, borderRadius: '50%',
                                background: `linear-gradient(135deg, ${c1}, ${c2})`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontWeight: 800, fontSize: '1.1rem',
                                border: '1px solid var(--border)',
                              }}>{r.username?.[0]?.toUpperCase()}</div>}
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-heading)' }}>{r.username}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>{r.email || 'Nexus member'}</div>
                          </div>
                        </div>

                        {wasAdded ? (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)',
                            borderRadius: 50, padding: '0.4rem 1rem',
                            color: 'var(--success)', fontWeight: 800, fontSize: '0.8rem',
                          }}
                          >
                            <CheckCircle size={15} strokeWidth={2} /> Added
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAdd(r._id)}
                            style={{
                              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                              color: 'white', border: 'none', borderRadius: 50,
                              padding: '0.5rem 1.1rem', fontSize: '0.8rem', fontWeight: 700,
                              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.4,
                            }}
                          >
                            <UserPlus size={14} strokeWidth={2} /> Add
                          </button>
                        )}
                      </SpotlightCard>
                    </motion.div>
                  );
                })}
              </div>
            ) : searchQuery.trim().length > 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔍</div>
                <p style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: '0.95rem' }}>
                  No users found for <strong style={{ color: 'var(--primary)' }}>"{searchQuery}"</strong>
                </p>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', fontWeight: 600, marginTop: '0.4rem' }}>Search is case-sensitive and exact</p>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>👥</div>
                <p style={{ color: 'var(--text-heading)', fontWeight: 700, fontSize: '0.95rem' }}>Search for friends above!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddFriend;
