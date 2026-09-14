import React, { useState, useEffect } from 'react';
import { Search, UserPlus, User as UserIcon } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';

const AddFriend = ({ currentUser, onContactAdded }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = async () => {
    setIsSearching(true);
    try {
      const usersRef = collection(db, 'users');
      // Simple exact match search for Firestore
      const q = query(usersRef, where('username', '==', searchQuery));
      const querySnapshot = await getDocs(q);
      const results = [];
      querySnapshot.forEach((docSnap) => {
        if (docSnap.id !== currentUser._id) {
          results.push({ _id: docSnap.id, ...docSnap.data() });
        }
      });
      setSearchResults(results);
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddContact = async (contactId) => {
    try {
      await updateDoc(doc(db, 'users', currentUser._id), {
        contacts: arrayUnion(contactId)
      });
      // Optionally add currentUser to the contact's friend list as well
      await updateDoc(doc(db, 'users', contactId), {
        contacts: arrayUnion(currentUser._id)
      });
      
      setSearchQuery('');
      setSearchResults([]);
      if (onContactAdded) {
        onContactAdded(contactId);
      }
    } catch (err) {
      console.error('Add contact failed', err);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'rgba(0,0,0,0.2)' }}>
      {/* Header */}
      <div style={{
        padding: '1.5rem 2rem',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <UserPlus size={24} color="var(--accent-primary)" />
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>Add Friend</h2>
      </div>

      {/* Main Content */}
      <div style={{ padding: '3rem 2rem', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: '700' }}>Add a Friend</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
          You can add friends with their exact username. Search below!
        </p>

        {/* Search Input */}
        <div 
          className={`glass-item ${isSearchFocused ? 'focused' : ''}`} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            borderRadius: '12px', 
            padding: '1rem 1.5rem',
            background: isSearchFocused ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.2)',
            border: isSearchFocused ? '1px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.1)',
            boxShadow: isSearchFocused ? '0 0 0 3px rgba(139, 92, 246, 0.2)' : 'none',
            transition: 'all 0.3s ease'
          }}
        >
          <Search size={20} color={isSearchFocused ? "var(--accent-primary)" : "var(--text-secondary)"} style={{ marginRight: '1rem', transition: 'color 0.3s ease' }} />
          <input 
            type="text" 
            placeholder="Search by username..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            style={{ 
              border: 'none', 
              background: 'transparent', 
              color: 'var(--text-primary)', 
              outline: 'none', 
              width: '100%', 
              fontSize: '1rem' 
            }}
          />
        </div>

        {/* Search Results */}
        <div style={{ marginTop: '2rem' }}>
          {isSearching ? (
            <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
              Searching...
            </div>
          ) : searchResults.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Results — {searchResults.length}
              </h4>
              {searchResults.map(result => (
                <div 
                  key={result._id} 
                  className="glass-item" 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '1rem 1.5rem', 
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    transition: 'all 0.2s',
                    cursor: 'default'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = ''}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img 
                      src={result.avatar || 'https://via.placeholder.com/40'} 
                      alt="avatar" 
                      style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} 
                    />
                    <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>{result.username}</span>
                  </div>
                  <button 
                    onClick={() => handleAddContact(result._id)}
                    style={{ 
                      background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '8px', 
                      padding: '0.5rem 1.25rem', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem', 
                      fontSize: '0.9rem', 
                      fontWeight: '600', 
                      boxShadow: '0 4px 15px var(--accent-glow)', 
                      transition: 'all 0.2s' 
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px var(--accent-glow)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 15px var(--accent-glow)';
                    }}
                  >
                    Send Request
                  </button>
                </div>
              ))}
            </div>
          ) : searchQuery.trim().length > 0 ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '1rem', 
              padding: '4rem 2rem',
              color: 'var(--text-secondary)'
            }}>
              <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }}>
                <Search size={40} opacity={0.5} />
              </div>
              <p>No users found matching "{searchQuery}"</p>
            </div>
          ) : (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '1rem', 
              padding: '4rem 2rem',
              color: 'var(--text-secondary)'
            }}>
              <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '50%' }}>
                <UserIcon size={40} opacity={0.5} />
              </div>
              <p>Wumpus is waiting. Search for friends to start chatting!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddFriend;
