import React, { useState, useEffect, useRef } from 'react';
import { Send, Hash, MessageSquare, Reply, Edit2, Trash2, X, Check, CheckCheck, MoreHorizontal, Menu, Smile, UserMinus } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, deleteDoc, arrayUnion, getDocs } from 'firebase/firestore';

const MessageArea = ({ currentRoom, user, onOpenSidebar }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [hoveredMessage, setHoveredMessage] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);

  const messagesEndRef = useRef(null);

  const isDM = currentRoom.startsWith('dm_');
  const roomDisplayName = isDM ? 'Direct Message' : currentRoom;

  useEffect(() => {
    setReplyingTo(null);
    setEditingMessage(null);
    setTypingUsers(new Set());
    
    const messagesRef = collection(db, 'messages');
    const q = query(messagesRef, where('room', '==', currentRoom), orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach((docSnap) => {
        msgs.push({ _id: docSnap.id, ...docSnap.data() });
      });
      setMessages(msgs);
      scrollToBottom();
    }, (error) => {
      console.error("Error fetching messages:", error);
    });

    return () => unsubscribe();
  }, [currentRoom]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
  };

  const handleReaction = async (emojiObject, messageId) => {
    try {
      const msgRef = doc(db, 'messages', messageId);
      // Simplify: add a single array of objects for reactions
      await updateDoc(msgRef, {
        reactions: arrayUnion({ emoji: emojiObject.emoji, users: [user._id] })
      });
    } catch(err) {
      console.error(err);
    }
    setShowEmojiPicker(null);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    if (editingMessage) {
      try {
        await updateDoc(doc(db, 'messages', editingMessage._id), {
          content: newMessage,
          isEdited: true
        });
      } catch (err) {
        console.error(err);
      }
      setEditingMessage(null);
    } else {
      try {
        await addDoc(collection(db, 'messages'), {
          sender: { _id: user._id, username: user.username, avatar: user.avatar },
          content: newMessage,
          room: currentRoom,
          replyTo: replyingTo ? { _id: replyingTo._id, content: replyingTo.content, sender: replyingTo.sender } : null,
          createdAt: new Date().toISOString(),
          isDeleted: false,
          readBy: [user._id]
        });
      } catch (err) {
        console.error(err);
      }
      setReplyingTo(null);
    }

    setNewMessage('');
  };

  const handleDelete = async (messageId) => {
    try {
      await updateDoc(doc(db, 'messages', messageId), {
        isDeleted: true,
        content: 'This message was deleted'
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearChat = async () => {
    if (window.confirm("Are you sure you want to clear this entire chat history?")) {
      try {
        const q = query(collection(db, 'messages'), where('room', '==', currentRoom));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(async (docSnap) => {
          await deleteDoc(doc(db, 'messages', docSnap.id));
        });
        setMessages([]);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleUnfriend = async () => {
    if (window.confirm("Are you sure you want to remove this user from your contacts?")) {
      alert("Unfriending is not fully supported in this serverless preview yet.");
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'transparent', position: 'relative', width: '100%', overflow: 'hidden' }}>
      <style>
        {`
          .msg-action-bar {
            opacity: 0;
            pointer-events: none;
            transform: translateY(5px);
            transition: all 0.2s ease;
          }
          .msg-container:hover .msg-action-bar,
          .msg-container.active .msg-action-bar {
            opacity: 1;
            pointer-events: auto;
            transform: translateY(0);
          }
          .typing-dot {
            width: 6px;
            height: 6px;
            background: var(--text-secondary);
            border-radius: 50%;
            animation: typing 1.4s infinite ease-in-out;
          }
          .typing-dot:nth-child(1) { animation-delay: 0s; }
          .typing-dot:nth-child(2) { animation-delay: 0.2s; }
          .typing-dot:nth-child(3) { animation-delay: 0.4s; }
          @keyframes typing {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }
        `}
      </style>

      {/* Header */}
      <div className="msg-area-header" style={{ padding: '1.5rem 2.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.02)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button className="mobile-only" onClick={onOpenSidebar} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', marginRight: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <Menu size={24} />
          </button>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: '600' }}>
            {isDM ? <MessageSquare size={22} color="var(--accent-primary)" /> : <Hash size={22} color="var(--accent-primary)" />}
            {roomDisplayName}
          </h3>
        </div>
        
        {isDM && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={handleClearChat}
              title="Clear Chat History"
              style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}
            >
              <Trash2 size={18} />
            </button>
            <button 
              onClick={handleUnfriend}
              title="Remove Contact"
              style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}
            >
              <UserMinus size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="msg-area-messages" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {messages.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-secondary)', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={36} color="var(--accent-primary)" style={{ opacity: 0.8 }} />
            </div>
            <p style={{ fontSize: '1.1rem' }}>This is the start of your conversation in <strong>{roomDisplayName}</strong>.</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender?._id === user?._id;
            
            return (
              <div 
                key={index} 
                className={`msg-container message-item ${hoveredMessage === msg._id ? 'active' : ''}`}
                data-id={msg._id}
                data-sender={msg.sender?._id}
                data-readby={JSON.stringify(msg.readBy || [])}
                onMouseEnter={() => setHoveredMessage(msg._id)}
                onMouseLeave={() => setHoveredMessage(null)}
                onClick={(e) => {
                  // Prevent click from bubbling if we're clicking the action bar itself
                  if (!e.target.closest('.msg-action-bar')) {
                    setHoveredMessage(hoveredMessage === msg._id ? null : msg._id);
                  }
                }}
                style={{ 
                  display: 'flex', 
                  gap: '1rem',
                  flexDirection: isMe ? 'row-reverse' : 'row',
                  alignItems: 'flex-end',
                  animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  position: 'relative'
                }}
              >
                <img 
                  src={msg.sender?.avatar} 
                  alt={msg.sender?.username} 
                  style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.05)' }}
                  title={msg.sender?.username}
                />
                
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '75%',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.4rem', padding: '0 0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '500', color: isMe ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {isMe ? 'You' : msg.sender?.username}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                  
                  {/* Action Bar */}
                  <div className="msg-action-bar" style={{
                    position: 'absolute',
                    top: '-15px',
                    [isMe ? 'left' : 'right']: 0,
                    background: 'var(--bg-secondary)',
                    borderRadius: '8px',
                    padding: '4px',
                    display: 'flex',
                    gap: '4px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                    zIndex: 10
                  }}>
                    {!msg.isDeleted && (
                      <button onClick={() => setShowEmojiPicker(showEmojiPicker === msg._id ? null : msg._id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }} title="React">
                        <Smile size={14} />
                      </button>
                    )}
                    <button onClick={() => setReplyingTo(msg)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }} title="Reply">
                      <Reply size={14} />
                    </button>
                    {isMe && !msg.isDeleted && (
                      <>
                        <button onClick={() => { setEditingMessage(msg); setNewMessage(msg.content); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }} title="Edit">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(msg._id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }} title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>

                  {showEmojiPicker === msg._id && (
                    <div style={{ position: 'absolute', top: '-350px', [isMe ? 'right' : 'left']: '0', zIndex: 100, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                      <EmojiPicker 
                        onEmojiClick={(emoji) => handleReaction(emoji, msg._id)}
                        theme="dark"
                        lazyLoadEmojis={true}
                      />
                    </div>
                  )}

                  <div style={{ 
                    padding: '0.85rem 1.25rem', 
                    borderRadius: '1.2rem',
                    borderBottomRightRadius: isMe ? '4px' : '1.2rem',
                    borderBottomLeftRadius: !isMe ? '4px' : '1.2rem',
                    background: msg.isDeleted ? 'transparent' : (isMe ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : 'rgba(255,255,255,0.06)'),
                    color: msg.isDeleted ? 'var(--text-secondary)' : 'white',
                    boxShadow: (isMe && !msg.isDeleted) ? '0 8px 20px rgba(139, 92, 246, 0.3)' : '0 4px 15px rgba(0,0,0,0.2)',
                    border: msg.isDeleted ? '1px dashed rgba(255,255,255,0.2)' : (isMe ? 'none' : '1px solid rgba(255,255,255,0.05)'),
                    lineHeight: '1.5',
                    fontSize: '0.95rem',
                    wordBreak: 'break-word',
                    backdropFilter: isMe ? 'none' : 'blur(10px)',
                    fontStyle: msg.isDeleted ? 'italic' : 'normal',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}>
                    {/* Reply Quote Block */}
                    {msg.replyTo && (
                      <div style={{ 
                        background: 'rgba(0,0,0,0.15)', 
                        borderLeft: `3px solid ${isMe ? 'rgba(255,255,255,0.5)' : 'var(--accent-primary)'}`,
                        padding: '0.5rem 0.75rem',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        color: isMe ? 'rgba(255,255,255,0.9)' : 'var(--text-secondary)'
                      }}>
                        <span style={{ fontWeight: '600', display: 'block', marginBottom: '2px' }}>{msg.replyTo?.sender?.username || 'Unknown'}</span>
                        <span style={{ opacity: 0.9 }}>{msg.replyTo.isDeleted ? 'This message was deleted' : (msg.replyTo.content ? msg.replyTo.content.substring(0, 50) + (msg.replyTo.content.length > 50 ? '...' : '') : '')}</span>
                      </div>
                    )}

                    <div>
                      {msg.content}
                      {msg.isEdited && !msg.isDeleted && <span style={{ fontSize: '0.7rem', opacity: 0.6, marginLeft: '8px' }}>(edited)</span>}
                    </div>

                    {msg.reactions && msg.reactions.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                        {msg.reactions.map((r, i) => {
                          const hasReacted = r.users.includes(user._id);
                          return (
                            <button 
                              key={i} 
                              onClick={() => handleReaction({ emoji: r.emoji }, msg._id)}
                              style={{
                                background: hasReacted ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.08)',
                                border: hasReacted ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                padding: '2px 6px',
                                fontSize: '0.8rem',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <span>{r.emoji}</span>
                              <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>{r.users.length}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Read Receipts for DMs */}
                  {isMe && isDM && (
                    <div style={{ marginTop: '4px', paddingRight: '4px' }}>
                      {msg.readBy && msg.readBy.length > 0 ? (
                        <CheckCheck size={14} color="#38bdf8" />
                      ) : (
                        <Check size={14} color="var(--text-secondary)" />
                      )}
                    </div>
                  )}

                </div>
              </div>
            );
          })
        )}
        
        {/* Typing Indicator */}
        {typingUsers.size > 0 && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', animation: 'fadeIn 0.2s' }}>
             <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <MoreHorizontal size={20} color="var(--text-secondary)" />
             </div>
             <div style={{ background: 'rgba(255,255,255,0.06)', padding: '0.75rem 1rem', borderRadius: '1.2rem', borderBottomLeftRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <div className="typing-dot"></div>
               <div className="typing-dot"></div>
               <div className="typing-dot"></div>
             </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="msg-area-input" style={{ padding: '1.5rem 2.5rem', background: 'transparent', display: 'flex', flexDirection: 'column' }}>
        
        {/* Reply/Edit Banner */}
        {(replyingTo || editingMessage) && (
          <div style={{ 
            background: 'var(--bg-secondary)', 
            borderTopLeftRadius: 'var(--border-radius-lg)', 
            borderTopRightRadius: 'var(--border-radius-lg)', 
            padding: '0.75rem 1.25rem',
            border: '1px solid rgba(255,255,255,0.05)',
            borderBottom: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            animation: 'fadeIn 0.2s'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {editingMessage ? <Edit2 size={16} color="var(--accent-primary)" /> : <Reply size={16} color="var(--accent-primary)" />}
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {editingMessage ? 'Editing Message' : `Replying to ${replyingTo.sender.username}`}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {editingMessage ? editingMessage.content : replyingTo.content}
                </div>
              </div>
            </div>
            <button onClick={() => { setReplyingTo(null); setEditingMessage(null); setNewMessage(''); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>
        )}

        <form onSubmit={handleSend} className="glass-item" style={{ 
          display: 'flex', 
          gap: '1rem', 
          padding: '0.6rem', 
          borderRadius: (replyingTo || editingMessage) ? '0 0 var(--border-radius-lg) var(--border-radius-lg)' : 'var(--border-radius-lg)',
          borderTopLeftRadius: (replyingTo || editingMessage) ? '0' : 'var(--border-radius-lg)',
          borderTopRightRadius: (replyingTo || editingMessage) ? '0' : 'var(--border-radius-lg)',
        }}>
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder={editingMessage ? "Edit your message..." : `Message ${roomDisplayName}...`}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              padding: '0.5rem 1rem',
              fontSize: '1rem',
              outline: 'none'
            }}
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim()}
            style={{ 
              background: newMessage.trim() ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : 'rgba(255,255,255,0.1)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
              transition: 'all var(--transition-fast)',
              boxShadow: newMessage.trim() ? '0 4px 15px rgba(139, 92, 246, 0.4)' : 'none'
            }}
          >
            {editingMessage ? <Check size={18} /> : <Send size={18} style={{ transform: 'translateX(-1px) translateY(1px)' }} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MessageArea;
