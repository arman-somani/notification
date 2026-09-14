import React, { useState, useEffect } from 'react';
import { X, Edit2, Calendar, User as UserIcon, Check } from 'lucide-react';

const AVATAR_BANKS = {
  male: [
    '/avatars/avatar_m_new_1.png',
    '/avatars/avatar_m_new_2.png',
    '/avatars/avatar_m_new_3.png',
    '/avatars/avatar_m_new_4.png',
    '/avatars/avatar_m_new_5.png',
    '/avatars/avatar_m_new_6.png',
    '/avatars/avatar_m_new_7.png',
    '/avatars/avatar_m_new_8.png',
    '/avatars/avatar_m_new_9.png',
    '/avatars/avatar_m_new_10.png'
  ],
  female: [
    '/avatars/avatar_f_new_1.png',
    '/avatars/avatar_f_new_2.png',
    '/avatars/avatar_f_new_3.png',
    '/avatars/avatar_f_new_4.png',
    '/avatars/avatar_f_new_5.png',
    '/avatars/avatar_f_new_6.png',
    '/avatars/avatar_f_new_7.png',
    '/avatars/avatar_f_new_8.png',
    '/avatars/avatar_f_new_9.png'
  ],
  other: [
    '/avatars/avatar_o_new_1.png',
    '/avatars/avatar_o_new_2.png'
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
    // If they change gender and their avatar isn't in the new list, 
    // maybe pick the first one from the new list (only when editing)
    if (isEditing && gender !== user?.gender) {
      setAvatar(AVATAR_BANKS[gender][0]);
    }
  }, [gender]);

  const handleSave = async () => {
    if (!username.trim()) return setError('Username is required');
    
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, username, gender, avatar })
      });
      
      const data = await res.json();
      if (res.ok) {
        onUpdateUser(data);
        setIsEditing(false);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('Network error');
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
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
      padding: '1rem'
    }}>
      <div className="glass-panel" style={{
        width: '100%', maxWidth: '500px', borderRadius: '24px', overflow: 'hidden',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
        animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Header Header */}
        <div style={{
          padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(255,255,255,0.02)'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <UserIcon size={20} color="var(--accent-primary)" />
            {isEditing ? 'Edit Profile' : 'User Dashboard'}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {error && (
            <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.9rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {!isEditing ? (
            // VIEW MODE
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ position: 'relative' }}>
                <img src={user?.avatar} alt="Avatar" style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '4px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }} />
                <div style={{ position: 'absolute', bottom: '5px', right: '5px', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--success)', border: '4px solid var(--bg-dark)' }}></div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '2rem', margin: '0 0 0.5rem', fontWeight: '700' }}>{user?.username}</h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                  <Calendar size={16} /> Member since {formatDate(user?.createdAt)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
                  <span style={{ textTransform: 'capitalize' }}>Gender: {user?.gender === 'unspecified' ? 'Not specified' : user?.gender}</span>
                </div>
              </div>

              <button 
                onClick={() => setIsEditing(true)}
                className="glass-item"
                style={{
                  marginTop: '1rem', padding: '0.75rem 2rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}
              >
                <Edit2 size={16} /> Edit Profile
              </button>
            </div>
          ) : (
            // EDIT MODE
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Username</label>
                <input 
                  type="text" value={username} onChange={e => setUsername(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Gender</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {['male', 'female', 'other'].map(g => (
                    <label key={g} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="radio" name="gender" checked={gender === g} onChange={() => setGender(g)} style={{ accentColor: 'var(--accent-primary)' }} />
                      <span style={{ textTransform: 'capitalize', color: gender === g ? 'white' : 'var(--text-secondary)' }}>{g}</span>
                    </label>
                  ))}
                </div>
              </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Choose Avatar</label>
                  <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    {AVATAR_BANKS[gender].map(url => (
                      <img 
                        key={url} src={url} alt="avatar option" 
                        onClick={() => setAvatar(url)}
                        style={{
                          width: '60px', height: '60px', borderRadius: '12px', cursor: 'pointer',
                          background: 'rgba(255,255,255,0.05)',
                          border: avatar === url ? '2px solid var(--accent-primary)' : '2px solid transparent',
                          opacity: avatar === url ? 1 : 0.6,
                          transition: 'all 0.2s',
                          flexShrink: 0
                        }}
                      />
                    ))}
                  </div>
                </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button 
                  onClick={() => setIsEditing(false)}
                  style={{ flex: 1, padding: '0.85rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave} disabled={loading}
                  style={{ flex: 1, padding: '0.85rem', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', border: 'none', color: 'white', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '500', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Saving...' : <><Check size={18} /> Save Changes</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
