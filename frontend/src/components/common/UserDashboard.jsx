import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Edit2, Calendar, User as UserIcon, Check } from 'lucide-react';
import { db } from '../../firebase';
import { doc, updateDoc } from 'firebase/firestore';

const AVATAR_BANKS = {
  male: [
    '/avatars/avatar_m_new_1.png',
    '/avatars/avatar_m_new_2.png',
    '/avatars/avatar_m_new_3.png',
    '/avatars/avatar_m_new_4.png',
    '/avatars/avatar_m_new_5.png',
  ],
  female: [
    '/avatars/avatar_f_new_1.png',
    '/avatars/avatar_f_new_2.png',
    '/avatars/avatar_f_new_3.png',
    '/avatars/avatar_f_new_4.png',
    '/avatars/avatar_f_new_5.png',
  ],
  other: [
    '/avatars/avatar_o_new_1.png',
    '/avatars/avatar_o_new_2.png',
  ]
};

const UserDashboard = ({ user, onClose, onUpdateUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const [gender, setGender] = useState((!user?.gender || user?.gender === 'unspecified') ? 'other' : user.gender);
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditing && gender !== user?.gender) {
      setAvatar(AVATAR_BANKS[gender][0]);
    }
  }, [gender, isEditing]);

  const handleSave = async () => {
    if (!username.trim()) return setError('Username is required');
    setLoading(true);
    setError('');
    try {
      const userRef = doc(db, 'users', user._id);
      await updateDoc(userRef, { username, gender, avatar });
      onUpdateUser({ ...user, username, gender, avatar });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.2)',
      padding: '1rem'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        className="surface-card"
        style={{
          width: '100%', maxWidth: '480px', borderRadius: 'var(--radius-xl)', overflow: 'hidden',
          border: '1px solid var(--border)',
          background: 'var(--bg)',
        }}
      >
        <div style={{
          padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h2 style={{ margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-heading)' }}>
            <UserIcon size={18} color="var(--primary)" strokeWidth={2} />
            {isEditing ? 'Edit Profile' : 'User Dashboard'}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {error && (
            <div style={{
              padding: '0.85rem', borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)',
              color: '#ef4444', fontSize: '0.85rem', textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          {!isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ position: 'relative' }}>
                <img src={user?.avatar} alt="Avatar" style={{ width: '110px', height: '110px', borderRadius: '50%', border: '2px solid var(--border)' }} />
                <div style={{ position: 'absolute', bottom: 4, right: 4, width: 16, height: 16, borderRadius: '50%', background: 'var(--success)', border: '2px solid var(--bg)' }}></div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.75rem', margin: '0 0 0.5rem', color: 'var(--text-heading)', fontWeight: 800 }}>{user?.username}</h3>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem', fontWeight: 600 }}>
                  <Calendar size={16} strokeWidth={2} /> Member since {formatDate(user?.createdAt)}
                </div>
              </div>

              <button
                onClick={() => setIsEditing(true)}
                style={{
                  marginTop: '0.5rem', padding: '0.85rem 1.75rem', borderRadius: 'var(--radius-lg)',
                  background: 'var(--primary)',
                  color: 'white', border: 'none', fontWeight: 700, fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                <Edit2 size={16} strokeWidth={2} /> Edit Profile
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-body)', marginBottom: '0.5rem' }}>Username</label>
                <input
                  type="text" value={username} onChange={e => setUsername(e.target.value)}
                  style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-heading)', outline: 'none', fontFamily: 'var(--font-sans)', fontSize: '0.95rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-body)', marginBottom: '0.5rem' }}>Gender</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {['male', 'female', 'other'].map(g => (
                    <label key={g} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="radio" name="gender" checked={gender === g} onChange={() => setGender(g)} style={{ accentColor: 'var(--primary)' }} />
                      <span style={{ textTransform: 'capitalize', color: gender === g ? 'var(--text-heading)' : 'var(--text-dim)' }}>{g}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-body)', marginBottom: '0.5rem' }}>Avatar</label>
                <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                  {AVATAR_BANKS[gender].map(url => (
                    <img
                      key={url} src={url} alt="avatar"
                      onClick={() => setAvatar(url)}
                      style={{
                        width: 52, height: 52, borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                        background: 'var(--bg-secondary)',
                        border: avatar === url ? '2px solid var(--primary)' : '2px solid var(--border)',
                        opacity: avatar === url ? 1 : 0.6,
                        transition: 'all 0.15s',
                        flexShrink: 0
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  onClick={() => setIsEditing(false)}
                  style={{ flex: 1, padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-heading)', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave} disabled={loading}
                  style={{ flex: 1, padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: 'none', background: 'linear-gradient(135deg, var(--primary), var(--accent))', color: 'white', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Saving…' : <><Check size={16} strokeWidth={2} /> Save Changes</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default UserDashboard;
