import React, { useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Hash, MessageSquare, Reply, Edit2, Trash2, X, Check, CheckCheck, Smile, Menu } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, deleteDoc, arrayUnion, getDocs } from 'firebase/firestore';
import { AuthContext } from '../context/AuthContext';

const getGradient = (id = '') => {
  const gradients = [
    ['#0f172a', '#334155'],
    ['#6366f1', '#a855f7'],
    ['#3b82f6', '#06b6d4'],
    ['#10b981', '#34d399'],
    ['#f59e0b', '#f97316'],
  ];
  const h = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return gradients[h % gradients.length];
};

const Avatar = ({ src, username, size = 32 }) => {
  const [c1, c2] = getGradient(username);
  return src
    ? <img src={src} alt={username} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }} />
    : <div style={{
        width: size, height: size, borderRadius: '50%',
        background: `linear-gradient(135deg, ${c1}, ${c2})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontWeight: 700, fontSize: size * 0.4,
        border: '1px solid var(--border)', flexShrink: 0,
      }}>
        {username?.[0]?.toUpperCase() || '?'}
      </div>;
};

const MessageArea = ({ currentRoom, user, onOpenSidebar }) => {
  const { isLocalDev, localMessages, setLocalMessages, addLocalMessage, clearLocalMessages, getLocalMessages } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const isDM = currentRoom?.startsWith('dm_');
  const roomDisplay = isDM ? 'Direct Message' : `#${currentRoom}`;
  const [myC1, myC2] = getGradient(user?._id);

  useEffect(() => {
    if (isLocalDev && currentRoom) {
      setMessages(getLocalMessages(currentRoom));
    }
  }, [isLocalDev, currentRoom, getLocalMessages]);

  useEffect(() => {
    if (!isLocalDev && currentRoom) {
      setReplyingTo(null);
      setEditingMessage(null);

      const q = query(
        collection(db, 'messages'),
        where('room', '==', currentRoom),
        orderBy('createdAt', 'asc')
      );

      const unsub = onSnapshot(q, (snap) => {
        const msgs = [];
        snap.forEach(d => msgs.push({ _id: d.id, ...d.data() }));
        setMessages(msgs);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
      }, err => console.error('Messages error:', err));

      return () => unsub();
    }
  }, [isLocalDev, currentRoom]);

  const handleReaction = async (emojiObj, messageId) => {
    if (isLocalDev) {
      const existing = getLocalMessages(currentRoom);
      const next = existing.map(m => {
        if (m._id !== messageId) return m;
        const reactions = m.reactions ? [...m.reactions] : [];
        reactions.push({ emoji: emojiObj.emoji, users: [user._id] });
        return { ...m, reactions };
      });
      setMessages(next);
      setLocalMessages(currentRoom, next);
      setShowEmojiPicker(null);
      return;
    }
    try {
      await updateDoc(doc(db, 'messages', messageId), {
        reactions: arrayUnion({ emoji: emojiObj.emoji, users: [user._id] })
      });
    } catch (e) { console.error(e); }
    setShowEmojiPicker(null);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;
    setIsSending(true);

    const messageDoc = {
      sender: { _id: user._id, username: user.username, avatar: user.avatar || null },
      content: newMessage,
      room: currentRoom,
      replyTo: replyingTo
        ? { _id: replyingTo._id, content: replyingTo.content, sender: replyingTo.sender }
        : null,
      createdAt: new Date().toISOString(),
      isDeleted: false,
      readBy: [user._id],
    };

    if (isLocalDev) {
      try {
        addLocalMessage(currentRoom, { ...messageDoc, _id: `local_${Date.now()}` });
        setNewMessage('');
        setReplyingTo(null);
        setEditingMessage(null);
        inputRef.current?.focus();
      } finally {
        setIsSending(false);
      }
      return;
    }

    if (editingMessage) {
      try {
        await updateDoc(doc(db, 'messages', editingMessage._id), { content: newMessage, isEdited: true });
      } catch (e) { console.error(e); }
      setEditingMessage(null);
    } else {
      try {
        await addDoc(collection(db, 'messages'), messageDoc);
      } catch (e) { console.error(e); }
      setReplyingTo(null);
    }

    setNewMessage('');
    setIsSending(false);
    inputRef.current?.focus();
  };

  const handleDelete = async (id) => {
    if (isLocalDev) {
      const existing = getLocalMessages(currentRoom);
      const next = existing.map(m => m._id === id ? { ...m, isDeleted: true, content: 'This message was deleted' } : m);
      setMessages(next);
      setLocalMessages(currentRoom, next);
      return;
    }
    try {
      await updateDoc(doc(db, 'messages', id), { isDeleted: true, content: 'This message was deleted' });
    } catch (e) { console.error(e); }
  };

  const handleClearChat = async () => {
    if (!window.confirm('Clear all messages in this chat?')) return;
    if (isLocalDev) {
      setMessages([]);
      clearLocalMessages(currentRoom);
      return;
    }
    try {
      const snap = await getDocs(query(collection(db, 'messages'), where('room', '==', currentRoom)));
      snap.forEach(async d => await deleteDoc(doc(db, 'messages', d.id)));
      setMessages([]);
    } catch (e) { console.error(e); }
  };

  const formatTime = (s) => {
    if (!s) return '';
    return new Date(s).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: 'transparent', position: 'relative', overflow: 'hidden', minWidth: 0,
    }}>
      {/* Header */}
      <div className="msg-area-header" style={{
        padding: '0.85rem 1.5rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="mobile-only" onClick={onOpenSidebar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-body)', padding: 4 }}>
            <Menu size={20} strokeWidth={2} />
          </button>
          <div style={{
            width: 34, height: 34, borderRadius: 'var(--radius-sm)',
            background: isDM ? 'var(--primary)' : 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid var(--border)',
            flexShrink: 0,
          }}
          >
            {isDM ? <MessageSquare size={16} color="white" strokeWidth={2} /> : <Hash size={16} color="white" strokeWidth={2} />}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-heading)' }}>{roomDisplay}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>{messages.length} messages</div>
          </div>
        </div>

        {isDM && (
          <button
            onClick={handleClearChat}
            className="btn btn-danger btn-sm"
            style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem' }}
          >
            <Trash2 size={13} strokeWidth={2} /> Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="msg-area-messages chat-wallpaper" style={{
        flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem',
        display: 'flex', flexDirection: 'column', gap: '0.6rem',
      }}>
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
              color: 'var(--text-muted)',
            }}
          >
            <div style={{ fontSize: '3rem' }}>💬</div>
            <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-heading)' }}>Start the conversation!</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Say hi in {roomDisplay}</p>
          </motion.div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender?._id === user?._id;
            const [sC1] = getGradient(msg.sender?._id);

            return (
              <motion.div
                key={msg._id || i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                className="msg-wrap"
                style={{
                  display: 'flex',
                  flexDirection: isMe ? 'row-reverse' : 'row',
                  gap: '0.55rem', alignItems: 'flex-end',
                  position: 'relative',
                }}
              >
                <Avatar src={msg.sender?.avatar} username={msg.sender?.username} size={32} />

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '72%', position: 'relative' }}>
                  <div className="msg-action-bar" style={{
                    position: 'absolute', top: -32,
                    [isMe ? 'left' : 'right']: 0,
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '3px 5px', display: 'flex', gap: 2,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)', zIndex: 20,
                  }}>
                    {!msg.isDeleted && (
                      <button className="action-icon-btn" onClick={() => setShowEmojiPicker(showEmojiPicker === msg._id ? null : msg._id)} title="React">
                        <Smile size={14} strokeWidth={2} />
                      </button>
                    )}
                    <button className="action-icon-btn" onClick={() => { setReplyingTo(msg); inputRef.current?.focus(); }} title="Reply">
                      <Reply size={14} strokeWidth={2} />
                    </button>
                    {isMe && !msg.isDeleted && (
                      <>
                        <button className="action-icon-btn" onClick={() => { setEditingMessage(msg); setNewMessage(msg.content); inputRef.current?.focus(); }} title="Edit">
                          <Edit2 size={14} strokeWidth={2} />
                        </button>
                        <button className="action-icon-btn" onClick={() => handleDelete(msg._id)} title="Delete" style={{ color: 'var(--danger)' }}>
                          <Trash2 size={14} strokeWidth={2} />
                        </button>
                      </>
                    )}
                  </div>

                  <AnimatePresence>
                    {showEmojiPicker === msg._id && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: -320 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          position: 'absolute', top: 0,
                          [isMe ? 'right' : 'left']: 0, zIndex: 100,
                          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                          borderRadius: 'var(--radius)', overflow: 'hidden',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <EmojiPicker onEmojiClick={(em) => handleReaction(em, msg._id)} theme="light" lazyLoadEmojis />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.2rem', padding: '0 0.4rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isMe ? 'var(--primary)' : sC1 }}>
                      {isMe ? 'You' : msg.sender?.username}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{formatTime(msg.createdAt)}</span>
                    {msg.isEdited && !msg.isDeleted && <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>(edited)</span>}
                  </div>

                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="msg-bubble"
                    style={{
                      padding: '0.65rem 1rem',
                      borderRadius: 'var(--radius)',
                      borderBottomRightRadius: isMe ? '2px' : 'var(--radius)',
                      borderBottomLeftRadius: isMe ? 'var(--radius)' : '2px',
                      background: msg.isDeleted
                        ? 'rgba(15, 23, 42, 0.05)'
                        : isMe
                          ? `linear-gradient(135deg, ${myC1}, ${myC2})`
                          : 'var(--bg-secondary)',
                      color: msg.isDeleted ? 'var(--text-dim)' : isMe ? 'white' : 'var(--text-heading)',
                      border: msg.isDeleted
                        ? '1px dashed rgba(99,102,241,0.2)'
                        : isMe ? '1px solid var(--primary)' : '1px solid var(--border)',
                      fontSize: '0.9rem', lineHeight: 1.6, fontWeight: 500,
                      wordBreak: 'break-word',
                      display: 'flex', flexDirection: 'column', gap: '0.3rem',
                    }}
                  >
                    {msg.replyTo && (
                      <div style={{
                        background: isMe ? 'rgba(255,255,255,0.7)' : 'rgba(99,102,241,0.08)',
                        borderLeft: `3px solid ${isMe ? 'var(--text-heading)' : 'var(--accent)'}`,
                        borderRadius: 'var(--radius-sm)', padding: '0.35rem 0.6rem', fontSize: '0.8rem',
                        color: isMe ? 'var(--text-body)' : 'var(--text-body)',
                      }}>
                        <div style={{ fontWeight: 700, marginBottom: 2 }}>{msg.replyTo.sender?.username}</div>
                        <div style={{ opacity: 0.8 }}>
                          {msg.replyTo.isDeleted ? 'Message deleted' : (msg.replyTo.content?.substring(0, 60) + (msg.replyTo.content?.length > 60 ? '…' : ''))}
                        </div>
                      </div>
                    )}

                    {msg.content}

                    {msg.reactions?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                        {msg.reactions.map((r, ri) => {
                          const reacted = r.users.includes(user._id);
                          return (
                            <motion.button
                              key={ri}
                              whileHover={{ scale: 1.1 }}
                              className="reaction-btn"
                              onClick={() => handleReaction({ emoji: r.emoji }, msg._id)}
                              style={{
                                background: reacted ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                                border: reacted ? '1px solid var(--accent)' : '1px solid var(--border)',
                                borderRadius: 10, padding: '2px 7px', fontSize: '0.8rem',
                                color: isMe ? 'white' : 'var(--text-heading)',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
                                fontFamily: 'var(--font-sans)', fontWeight: 600,
                              }}
                            >
                              {r.emoji} <span style={{ fontSize: '0.7rem' }}>{r.users.length}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>

                  {isMe && isDM && !msg.isDeleted && (
                    <div style={{ marginTop: 3, paddingRight: 4 }}>
                      {msg.readBy?.length > 1
                        ? <CheckCheck size={14} color="var(--primary)" strokeWidth={2} />
                        : <Check size={14} color="var(--text-dim)" strokeWidth={2} />}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="msg-area-input" style={{
        padding: '0.85rem 1.5rem',
        background: 'var(--bg)',
        borderTop: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <AnimatePresence>
          {(replyingTo || editingMessage) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(99, 102, 241, 0.05)',
                border: '1px solid rgba(99, 102, 241, 0.1)',
                borderRadius: 'var(--radius) var(--radius) 0 0',
                padding: '0.5rem 0.85rem', marginBottom: -1,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {editingMessage ? <Edit2 size={14} color="var(--primary)" strokeWidth={2} /> : <Reply size={14} color="var(--primary)" strokeWidth={2} />}
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {editingMessage ? 'Editing message' : `Replying to ${replyingTo.sender.username}`}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-body)', marginTop: 1 }}>
                      {editingMessage ? editingMessage.content : replyingTo.content?.substring(0, 60)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { setReplyingTo(null); setEditingMessage(null); setNewMessage(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 4, borderRadius: 6 }}
                >
                  <X size={15} strokeWidth={2} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSend} style={{
          display: 'flex', gap: '0.65rem', alignItems: 'center',
          background: 'var(--bg-secondary)',
          borderRadius: (replyingTo || editingMessage) ? `0 0 var(--radius) var(--radius)` : 'var(--radius)',
          border: `1px solid ${isFocused ? 'var(--border-focus)' : 'var(--border)'}`,
          padding: '0.45rem 0.5rem 0.45rem 1rem',
          transition: 'border-color 0.15s',
        }}>
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={editingMessage ? 'Edit your message…' : `Message ${roomDisplay}…`}
            style={{
              flex: 1, background: 'transparent', border: 'none',
              color: 'var(--text-heading)', fontSize: '0.95rem', outline: 'none',
              fontFamily: 'var(--font-sans)', fontWeight: 500,
            }}
          />
          <motion.button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            whileHover={newMessage.trim() ? { scale: 1.05 } : {}}
            whileTap={newMessage.trim() ? { scale: 0.95 } : {}}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{
              width: 38, height: 38, borderRadius: 'var(--radius-sm)',
              border: 'none', flexShrink: 0,
              background: newMessage.trim() ? `linear-gradient(135deg, ${myC1}, ${myC2})` : 'rgba(99,102,241,0.08)',
              color: newMessage.trim() ? 'white' : 'var(--text-dim)',
              cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {editingMessage ? <Check size={18} strokeWidth={2} /> : <Send size={18} strokeWidth={2} style={{ transform: 'translateX(1px)' }} />}
          </motion.button>
        </form>
      </div>
    </div>
  );
};

export default MessageArea;
