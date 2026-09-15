import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from '../components/Sidebar';
import MessageArea from '../components/MessageArea';
import AddFriend from '../components/AddFriend';

const Chat = () => {
  const { user, loading } = useContext(AuthContext);
  const [currentRoom, setCurrentRoom] = useState('add_friend');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [onlineUsers] = useState(new Set()); 

  if (loading || !user) {
    return <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Loading...</div>;
  }

  return (
    <div className="chat-layout" style={{ display: 'flex', height: '100vh', width: '100vw', padding: '1rem', boxSizing: 'border-box' }}>
      <div className="glass-panel" style={{ 
        display: 'flex', 
        width: '100%', 
        height: '100%', 
        borderRadius: 'var(--border-radius-lg)', 
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.08)',
        position: 'relative'
      }}>
        {isSidebarOpen && (
          <div 
            className="mobile-only" 
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 90 }}
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        <Sidebar 
          currentRoom={currentRoom} 
          setCurrentRoom={(room) => { setCurrentRoom(room); setIsSidebarOpen(false); }} 
          onlineUsers={onlineUsers}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        {currentRoom === 'add_friend' ? (
          <AddFriend 
            currentUser={user} 
            onContactAdded={(contactId) => {
              const sortedIds = [user._id, contactId].sort();
              setCurrentRoom(`dm_${sortedIds[0]}_${sortedIds[1]}`);
            }} 
          />
        ) : (
          <MessageArea 
            currentRoom={currentRoom} 
            user={user} 
            onOpenSidebar={() => setIsSidebarOpen(true)}
          />
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default Chat;
