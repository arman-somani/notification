import React, { useState, useEffect, useContext } from 'react';
import { LogOut, Hash, Search, UserPlus, MessageSquare, User as UserIcon } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import UserDashboard from './UserDashboard';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const Sidebar = ({ currentRoom, setCurrentRoom, isOpen, onClose, onlineUsers }) => {
  const { user, logout, login } = useContext(AuthContext);
  const [contacts, setContacts] = useState([]);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);

  const fetchContacts = async () => {
    if (!user?._id) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', user._id));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const contactIds = userData.contacts || [];
        if (contactIds.length > 0) {
          const contactsData = [];
          for (const id of contactIds) {
            const contactDoc = await getDoc(doc(db, 'users', id));
            if (contactDoc.exists()) {
              contactsData.push({ _id: id, ...contactDoc.data() });
            }
          }
          setContacts(contactsData);
        } else {
          setContacts([]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch contacts', err);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [user]);



  const openDM = (contactId) => {
    const sortedIds = [user._id, contactId].sort();
    setCurrentRoom(`dm_${sortedIds[0]}_${sortedIds[1]}`);
  };

  return (
    <div className={`sidebar-container ${isOpen ? 'open' : ''}`} style={{ 
      width: '280px', 
      background: 'transparent', 
      borderRight: '1px solid rgba(255,255,255,0.08)',
      display: 'flex',
      flexDirection: 'column',
      padding: '2rem 0',
    }}>
      {isOpen && (
        <button onClick={onClose} className="mobile-only glass-item" style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ✕
        </button>
      )}
      <style>
        {`
          .nav-btn {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1.25rem;
            background: transparent;
            color: var(--text-secondary);
            border: none;
            border-radius: var(--border-radius-md);
            cursor: pointer;
            text-align: left;
            font-size: 0.95rem;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            position: relative;
            overflow: hidden;
            margin-bottom: 4px;
          }
          
          .nav-btn::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            width: 3px;
            background: var(--accent-primary);
            transform: scaleY(0);
            transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            border-radius: 0 4px 4px 0;
          }
          
          .nav-btn:hover {
            background: rgba(255, 255, 255, 0.05);
            color: var(--text-primary);
            transform: translateX(4px);
          }
          
          .nav-btn.active {
            background: rgba(139, 92, 246, 0.15);
            color: var(--accent-primary);
            font-weight: 500;
            box-shadow: inset 0 0 20px rgba(139, 92, 246, 0.05);
          }
          
          .nav-btn.active::before {
            transform: scaleY(1);
          }
          
          .nav-btn.active .nav-icon {
            color: var(--accent-primary);
            animation: bounce 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          }
          
          .stagger-item {
            opacity: 0;
            animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          
          .search-wrapper {
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            border: 1px solid rgba(255,255,255,0.08);
          }
          
          .search-wrapper.focused {
            border-color: var(--accent-primary);
            box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
            background: rgba(255, 255, 255, 0.05);
          }
          
          @keyframes slideInRight {
            from { opacity: 0; transform: translateX(-15px); }
            to { opacity: 1; transform: translateX(0); }
          }
          
          @keyframes bounce {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-3px) scale(1.1); }
          }
        `}
      </style>

      <div style={{ padding: '0 1.5rem', marginBottom: '2.5rem' }}>
        <h2 className="stagger-item" style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0, animationDelay: '0ms' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', boxShadow: '0 4px 15px var(--accent-glow)' }}>
            N
          </div>
          <span className="text-gradient" style={{ fontWeight: '700' }}>Notification</span>
        </h2>
      </div>

      <div style={{ flex: 1, padding: '0 0.75rem', overflowY: 'auto' }}>
        <button
          onClick={() => setCurrentRoom('add_friend')}
          className={`nav-btn stagger-item ${currentRoom === 'add_friend' ? 'active' : ''}`}
          style={{ animationDelay: '100ms', width: '100%', marginBottom: '2rem' }}
        >
          <UserPlus size={18} className="nav-icon" color={currentRoom === 'add_friend' ? 'var(--accent-primary)' : 'var(--text-secondary)'} />
          Add Friend
        </button>

        <h4 className="stagger-item" style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem', paddingLeft: '1rem', animationDelay: '300ms' }}>
          Direct Messages
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {contacts.length === 0 ? (
            <p className="stagger-item" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', paddingLeft: '1rem', fontStyle: 'italic', animationDelay: '350ms' }}>No contacts yet.</p>
          ) : (
            contacts.map((contact, i) => {
              const dmRoom = `dm_${[user._id, contact._id].sort().join('_')}`;
              const isSelected = currentRoom === dmRoom;
              return (
                <button
                  key={contact._id}
                  onClick={() => openDM(contact._id)}
                  className={`nav-btn stagger-item ${isSelected ? 'active' : ''}`}
                  style={{ animationDelay: `${350 + (i * 30)}ms` }}
                >
                  <div style={{ position: 'relative' }}>
                    <img src={contact.avatar} alt="avatar" style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                    <div style={{ 
                      position: 'absolute', 
                      bottom: -2, 
                      right: -2, 
                      width: '10px', 
                      height: '10px', 
                      borderRadius: '50%', 
                      background: (onlineUsers && onlineUsers.has(contact._id)) ? 'var(--success)' : 'var(--danger)', 
                      border: '2px solid var(--bg-dark)' 
                    }}></div>
                  </div>
                  {contact.username}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* User Profile Footer */}
      <div 
        className="stagger-item glass-item" 
        onClick={() => setIsDashboardOpen(true)}
        style={{ 
          padding: '1.25rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
          animationDelay: '600ms', cursor: 'pointer',
          background: 'rgba(255,255,255,0.02)', transition: 'background 0.2s'
        }}
        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
        onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src={user?.avatar} alt="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: '500', color: 'var(--text-primary)' }}>{user?.username}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 5px var(--success)' }}></div> Online
            </span>
          </div>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); logout(); }} 
          style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.6rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Logout"
        >
          <LogOut size={16} style={{ transform: 'translateX(-1px)' }} />
        </button>
      </div>

      {isDashboardOpen && (
        <UserDashboard 
          user={user} 
          onClose={() => setIsDashboardOpen(false)} 
          onUpdateUser={(updatedUser) => {
            // Need token? The API doesn't return a new token. 
            // LocalStorage might just need user updated.
            const token = localStorage.getItem('token');
            login(updatedUser, token);
          }} 
        />
      )}
    </div>
  );
};

export default Sidebar;
