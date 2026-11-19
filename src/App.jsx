import { useEffect, useMemo, useRef, useState } from 'react'
import { getIdToken, signOut } from 'firebase/auth'
import { arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, runTransaction, serverTimestamp, setDoc, Timestamp, updateDoc, where, writeBatch } from 'firebase/firestore'
import { onDisconnect, onValue, push, ref, serverTimestamp as realtimeServerTimestamp, set as setRealtimeValue } from 'firebase/database'
import { auth, db, realtimeDb } from './firebase/client'
import { countUnreadMessages, mapGroupConversation, normalizeMessage, timestampToMillis } from './firebase/chatModel.js'
import './App.css'
import AccountPrivacyPanel from './AccountPrivacyPanel'
import AdminDashboard from './AdminDashboard'
import { isDesignatedAdminEmail } from './adminConfig'

const MESSAGE_RETENTION_MS = 86400000

const getConversationActivity = (conversation) => {
  if (!conversation || typeof conversation !== 'object') return 0
  if (Number.isFinite(conversation.lastActivityAt)) return conversation.lastActivityAt
  const messages = Array.isArray(conversation.messages) ? conversation.messages : []
  const lastMessageId = messages[messages.length - 1]?.id || ''
  const timestampMatch = String(lastMessageId).match(/(?:m|img|voice|fwd|poll)-(\d+)/)
  return timestampMatch ? Number(timestampMatch[1]) : 0
}

// Treat every audio-backed message as a voice message, even if its type metadata differs.

const composerEmojiOptions = ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😍','🥰','😘','😋','😎','🤩','🥳','🤔','🤗','🤭','😴','😭','😢','😡','😮','😱','🙏','👏','👍','👎','👌','✌️','🤝','🙌','💪','❤️','🧡','💛','💚','💙','💜','🖤','🤍','💯','🔥','✨','🎉','🎂','🌹','☀️','🌙','⭐','☕','🍕','🎈','💡','✅','❌']

const reactionOptions = [
  { emoji: '👍', label: 'Like' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '😂', label: 'Laugh' },
  { emoji: '😮', label: 'Wow' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '🙏', label: 'Thanks' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '🎉', label: 'Celebrate' },
  { emoji: '👏', label: 'Clap' },
  { emoji: '😍', label: 'Heart eyes' },
  { emoji: '🤔', label: 'Thinking' },
  { emoji: '🙌', label: 'Praise' },
  { emoji: '💯', label: '100' },
  { emoji: '👎', label: 'Dislike' },
  { emoji: '😡', label: 'Angry' },
  { emoji: '🤝', label: 'Handshake' },
]

const avatarOptions = [
  { id: 'male-01', gender: 'male', label: 'Classic', skin: '#d3d3d0', hair: '#292929', shirt: '#666663', back: 'M14 31C12 13 21 5 32 5s20 8 18 26l-5 8H19Z', front: 'M15 25C16 11 23 7 32 7c10 0 17 8 17 19-5-2-9-6-11-11-6 6-13 9-23 10Z' },
  { id: 'male-02', gender: 'male', label: 'Curly', skin: '#bdbdb9', hair: '#444440', shirt: '#555552', back: 'M13 30C7 20 15 9 22 10c2-8 12-9 16-4 8-3 16 5 13 13 7 5 3 15-2 19H17Z', front: 'M13 25c-2-8 4-12 8-13 2-7 9-7 12-3 6-5 14 1 14 7 4 3 4 8 2 12-6-3-9-7-11-11-7 7-15 10-25 8Z' },
  { id: 'male-03', gender: 'male', label: 'Side part', skin: '#dededb', hair: '#343432', shirt: '#777773', back: 'M15 30C12 13 21 6 33 6c12 0 19 9 16 25l-5 8H19Z', front: 'M15 25C15 12 23 7 34 7c8 0 14 5 15 15-6-3-10-7-12-11-4 5-11 8-22 9Z' },
  { id: 'male-04', gender: 'male', label: 'Buzz cut', skin: '#c9c9c5', hair: '#555550', shirt: '#454542', back: 'M17 27C17 14 23 9 32 9s15 5 15 18l-4 7H21Z', front: 'M17 23C18 13 24 9 32 9s14 5 15 14c-7-3-22-3-30 0Z' },
  { id: 'male-05', gender: 'male', label: 'Wavy', skin: '#e0e0dc', hair: '#3b3b38', shirt: '#888884', back: 'M14 31C10 16 19 5 32 5s22 10 18 27l-5 9H19Z', front: 'M14 25c-1-8 4-13 9-14 2-6 10-7 13-3 7-3 14 3 13 11-5-1-8-5-11-8-6 7-14 11-24 14Z' },
  { id: 'female-01', gender: 'female', label: 'Soft bob', skin: '#d7d7d3', hair: '#343431', shirt: '#666662', back: 'M13 31C10 12 19 4 32 4s22 10 19 29l-1 21c-5 5-9 0-10-8H24c-1 8-5 13-10 8Z', front: 'M14 25C14 10 22 5 32 5s18 7 18 21c-6-4-10-8-13-13-5 6-12 10-23 12Z' },
  { id: 'female-02', gender: 'female', label: 'Long hair', skin: '#c2c2be', hair: '#4a4a46', shirt: '#777773', back: 'M12 32C9 12 20 3 32 3s23 9 20 30l-2 27h-9l-2-17H25l-2 17h-9Z', front: 'M14 25C14 10 22 5 32 5s18 7 18 21c-5-3-9-8-12-13-6 7-14 11-24 12Z' },
  { id: 'female-03', gender: 'female', label: 'Curly', skin: '#e0e0dd', hair: '#292927', shirt: '#555552', back: 'M13 32C5 22 12 9 20 10c2-8 11-10 15-5 8-5 17 3 16 11 7 7 2 18-3 22l-2 18h-8l-1-12H26l-2 12h-9l-1-18Z', front: 'M13 26c-3-9 3-15 8-15 2-7 10-7 13-3 7-4 14 2 13 9l-2 11c-3-8-7-11-11-14-5 7-12 11-21 12Z' },
  { id: 'female-04', gender: 'female', label: 'Ponytail', skin: '#c9c9c5', hair: '#555550', shirt: '#70706c', back: 'M16 30C12 12 21 5 32 5s19 8 17 25l-2 19c-2 5-8 2-8-5H25c-1 8-7 10-9 4Z', front: 'M15 25C15 11 23 6 33 6c10 0 16 8 16 19-6-3-10-7-13-12-5 6-12 10-21 12Z', pony: 'M44 24c10 0 13 8 11 17-1 6-5 10-10 12l-3-4c5-7 5-15 2-25Z' },
  { id: 'female-05', gender: 'female', label: 'Pixie', skin: '#bcbcb8', hair: '#3c3c39', shirt: '#858580', back: 'M16 29C14 13 21 6 32 6s18 8 16 24l-4 8H20Z', front: 'M15 26C14 12 22 6 33 6c9 0 16 6 16 18-6-2-9-6-12-10-4 7-12 11-22 12Z' },
]

function AvatarArtwork({ avatarId }) {
  const avatar = avatarOptions.find((option) => option.id === avatarId)
  if (!avatar) return null

  return (
    <svg className="avatar-art" viewBox="0 0 64 64" role="img" aria-label={avatar.gender + ' ' + avatar.label + ' avatar'}>
      <circle cx="32" cy="32" r="32" fill="#e9e9e6" />
      {avatar.pony && <path d={avatar.pony} fill={avatar.hair} />}
      <path d={avatar.back} fill={avatar.hair} />
      <path d="M5 66c1-12 8-18 19-20h16c11 2 18 8 19 20Z" fill={avatar.shirt} />
      <path d="M26 39h12v12H26Z" fill={avatar.skin} />
      <ellipse cx="18.5" cy="30" rx="2.8" ry="4.2" fill={avatar.skin} />
      <ellipse cx="45.5" cy="30" rx="2.8" ry="4.2" fill={avatar.skin} />
      <ellipse cx="32" cy="29" rx="13.2" ry="16.2" fill={avatar.skin} />
      <path d={avatar.front} fill={avatar.hair} />
      <path d="M24 30h.1m15.8 0h.1" stroke="#383836" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M29 37c1.8 1.4 4.2 1.4 6 0" stroke="#656560" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M32 31.5v2.5" stroke="#999994" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

const iconPaths = {
  message: <><path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-5.5A7.5 7.5 0 1 1 20 11.5Z" /><path d="M7.5 10h.01M12 10h.01M16.5 10h.01" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="9.5" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  star: <path d="m12 3 2.7 5.47 6.03.88-4.36 4.25 1.03 6.01L12 16.77l-5.4 2.84 1.03-6.01-4.36-4.25 6.03-.88L12 3Z" />,
  archive: <><rect x="3" y="4" width="18" height="4" rx="1" /><path d="M5 8v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8M10 12h4" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.7-1.4-2.4L7.3 15a8 8 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.7-1L11 7.4h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.7 1.4 2.4-1.4 1.1a8 8 0 0 1-.1 2Z" /></>,
  search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  moon: <path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
  more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.4 2.8a2 2 0 0 1-.6 1.7L7.1 10a16 16 0 0 0 6 6l1.8-1.8a2 2 0 0 1 1.7-.6l2.8.4a2 2 0 0 1 1.6 1.9Z" />,
  video: <><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></>,
  paperclip: <path d="m21.4 11.1-8.9 8.9a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5" />,
  smile: <><circle cx="12" cy="12" r="9" /><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" /></>,
  send: <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>,
  mic: <><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10v2a7 7 0 0 0 14 0v-2m-7 9v3m-4 0h8" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  checkDouble: <><path d="m2 12 4 4L16 6" /><path d="m9 12 4 4 9-10" /></>,
  pin: <><path d="m16 3 5 5-4 1-4 4-1 5-2-2-2 2-1-1 2-2-2-2 5-1 4-4 1-4Z" /><path d="m8 16-5 5" /></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
  shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.6 9a2.5 2.5 0 1 1 4.4 1.6c-.9 1-2 1.2-2 2.9m0 3h.01" /></>,
  chevron: <path d="m7 10 5 5 5-5" />,
  arrowLeft: <><path d="m15 18-6-6 6-6" /><path d="M9 12h12" /></>,
  close: <><path d="m18 6-12 12M6 6l12 12" /></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>,
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8m-8 4h8" /></>,
  edit: <><path d="m16 4 4 4L8 20l-5 1 1-5Z" /><path d="m14 6 4 4" /></>,
  trash: <><path d="M3 6h18m-2 0-.9 14H5.9L5 6m4 0V4h6v2m-5 4v6m4-6v6" /></>,
  logout: <><path d="M10 17l5-5-5-5m5 5H3" /><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" /></>,
  filter: <><path d="M4 6h16M7 12h10m-7 6h4" /></>,
  spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" /></>,
}

function Icon({ name, size = 18, strokeWidth = 2, className = '' }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconPaths[name] || iconPaths.message}
    </svg>
  )
}

function Avatar({ person, size = 'md', showStatus = false }) {
  return (
    <span className={'avatar avatar-' + size + (person.avatarId ? ' avatar-illustrated' : ' avatar-tone-' + (person.tone || 1))}>
      {person.avatarId
        ? <AvatarArtwork avatarId={person.avatarId} />
        : <span>{person.initials || person.name?.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span>}
      {showStatus && person.status === 'online' && <i className="presence-dot" />}
    </span>
  )
}

// Shared identity UI keeps direct chats and groups visually consistent.
function ConversationIdentity({ person, subtitle, subtitleClass = '', size = 'header', showStatus = true, className = 'conversation-identity' }) {
  return (
    <div className={className}>
      <Avatar person={person} size={size} showStatus={showStatus} />
      <span><strong>{person.name}</strong>{subtitle && <small className={subtitleClass}>{subtitle}</small>}</span>
    </div>
  )
}

function ConversationListItem({ conversation, active, onSelect }) {
  return (
    <div className={'conversation-item-wrap' + (active ? ' active' : '')}>
      <button type="button" className={'conversation-item' + (active ? ' active' : '')} onClick={onSelect}>
        <Avatar person={conversation} size="lg" showStatus />
        <span className="conversation-copy">
          <span className="conversation-topline"><strong>{conversation.name}</strong><time>{conversation.time}</time></span>
          <span className="conversation-bottomline"><span className="conversation-preview">{conversation.preview}</span>{conversation.unread > 0 && <i className="unread-count">{conversation.unread}</i>}</span>
        </span>
      </button>
    </div>
  )
}

function BrandGlyph({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 5.5h10.8A3.2 3.2 0 0 1 19 8.7v5.1a3.2 3.2 0 0 1-3.2 3.2H11l-4.5 3v-3.1h-1A3.5 3.5 0 0 1 2 13.4V9a3.5 3.5 0 0 1 3-3.5Z" />
      <path d="M8 9.5h7m-7 3h4.5" />
    </svg>
  )
}


function VoiceMessagePlayer({ src, className = '' }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return undefined
    const updateTime = () => setCurrentTime(audio.currentTime || 0)
    const updateDuration = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onEnded = () => { setPlaying(false); setCurrentTime(0); audio.currentTime = 0 }
    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('durationchange', updateDuration)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    updateDuration()
    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('durationchange', updateDuration)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
    }
  }, [src])
  const formatTime = (value) => {
    const safe = Math.max(0, Math.floor(value || 0))
    return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`
  }
  const togglePlayback = async () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      try { await audio.play() } catch { setPlaying(false) }
    } else audio.pause()
  }
  const seek = (event) => {
    const next = Number(event.target.value)
    if (audioRef.current && Number.isFinite(next)) {
      audioRef.current.currentTime = next
      setCurrentTime(next)
    }
  }
  return (
    <div className={`custom-voice-player ${className}`}>
      <audio ref={audioRef} src={src} preload="metadata" controls={false} controlsList="nodownload noplaybackrate" disablePictureInPicture onContextMenu={(event) => event.preventDefault()} />
      <button type="button" className="voice-play-toggle" onClick={togglePlayback} aria-label={playing ? 'Pause voice message' : 'Play voice message'}>{playing ? 'Ⅱ' : '▶'}</button>
      <input className="voice-progress" type="range" min="0" max={duration || 0} step="0.1" value={Math.min(currentTime, duration || 0)} onChange={seek} aria-label="Voice message position" />
      <span className="voice-time">{formatTime(playing || currentTime ? currentTime : duration)}</span>
    </div>
  )
}

const normalizeDisplayName = (value, fallback = 'Converly user') => {
  const name = String(value || '').trim()
  return name || fallback
}

const directConversationId = (uid, otherUid) => [uid, otherUid].sort().join('__')

const normalizeConversationMessages = (messages) => {
  if (!Array.isArray(messages)) return []
  return messages.filter((message) => message && typeof message === 'object').map((message) => {
    const normalized = {
      ...message,
      text: typeof message.text === 'string' ? message.text : '',
      reactions: Array.isArray(message.reactions) ? message.reactions.filter((reaction) => typeof reaction === 'string') : [],
    }
    if (message.type === 'poll') {
      const poll = message.poll && typeof message.poll === 'object' ? message.poll : {}
      normalized.poll = {
        question: typeof poll.question === 'string' ? poll.question : 'Poll',
        options: Array.isArray(poll.options) ? poll.options.filter((option) => typeof option === 'string') : [],
        votes: poll.votes && typeof poll.votes === 'object' && !Array.isArray(poll.votes) ? poll.votes : {},
      }
    }
    return normalized
  })
}

function App({ profile, isAdmin = false }) {
  const canAccessAdmin = isAdmin && isDesignatedAdminEmail(auth?.currentUser?.email) && auth?.currentUser?.emailVerified === true
  const [theme, setTheme] = useState(() => localStorage.getItem('notification-theme') || 'light')
  const [conversations, setConversations] = useState([])
  const [hiddenConversationIds, setHiddenConversationIds] = useState([])
  const [deletingConversationId, setDeletingConversationId] = useState('')
  const [activeId, setActiveId] = useState('')
  const [view, setView] = useState('messages')
  const [loggingOut, setLoggingOut] = useState(false)
  const [search, setSearch] = useState('')
  const [listFilter, setListFilter] = useState('all')
  const [messageText, setMessageText] = useState('')
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
  const [selectedMessageId, setSelectedMessageId] = useState(null)
  const [reactionPickerMessageId, setReactionPickerMessageId] = useState(null)
  const [replyTarget, setReplyTarget] = useState(null)
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [forwardMessageId, setForwardMessageId] = useState(null)
  const [messageSearchOpen, setMessageSearchOpen] = useState(false)
  const [messageSearch, setMessageSearch] = useState('')
  const [viewOnceImage, setViewOnceImage] = useState(null)
  const [recording, setRecording] = useState(false)
  const [recordingElapsed, setRecordingElapsed] = useState(0)
  const [recordingPreview, setRecordingPreview] = useState(null)
  const [waveformLevels, setWaveformLevels] = useState(() => Array(24).fill(3))
  const [showNewChat, setShowNewChat] = useState(false)
  const [newChatSearch, setNewChatSearch] = useState('')
  const [discoveredUsers, setDiscoveredUsers] = useState([])
  const [friendContacts, setFriendContacts] = useState([])
  const [typingUsers, setTypingUsers] = useState([])
  const [composerFocused, setComposerFocused] = useState(false)
  const typingPublishedRef = useRef(false)
  const [incomingFriendRequests, setIncomingFriendRequests] = useState([])
  const [friendRequestError, setFriendRequestError] = useState('')
  const [showFriendRequests, setShowFriendRequests] = useState(false)
  const [outgoingFriendRequests, setOutgoingFriendRequests] = useState([])
  const [discoveryLoading, setDiscoveryLoading] = useState(false)
  const [discoveryError, setDiscoveryError] = useState('')
  const [friendActionBusy, setFriendActionBusy] = useState('')
  const [showGroupCreator, setShowGroupCreator] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupMemberIds, setGroupMemberIds] = useState([])
  const [showPollComposer, setShowPollComposer] = useState(false)
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOptions, setPollOptions] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [showChatMenu, setShowChatMenu] = useState(false)
  const [toast, setToast] = useState('')
  const [mobileChatOpen, setMobileChatOpen] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => typeof Notification !== 'undefined' && Notification.permission === 'granted')
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('notification-sound-enabled') === 'true')
  const [compactMode, setCompactMode] = useState(() => localStorage.getItem('notification-compact-mode') === 'true')
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const mediaRecorderRef = useRef(null)
  const recordingHoldRef = useRef(false)
  const recordingStreamRef = useRef(null)
  const recordingChunksRef = useRef([])
  const recordingStartedAtRef = useRef(0)
  const recordingCancelledRef = useRef(false)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const waveformFrameRef = useRef(null)
  const [profileName, setProfileName] = useState(() => profile?.displayName || localStorage.getItem('notification-display-name') || 'Your workspace')
  const [profileAvatar, setProfileAvatar] = useState(() => profile?.avatarId || localStorage.getItem('notification-profile-avatar') || 'male-01')
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [savingAvatar, setSavingAvatar] = useState(false)
  const [draftAvatar, setDraftAvatar] = useState(() => profile?.avatarId || localStorage.getItem('notification-profile-avatar') || 'male-01')
  const [avatarPickerGender, setAvatarPickerGender] = useState(() => (profile?.avatarId || localStorage.getItem('notification-profile-avatar') || 'male-01').startsWith('female') ? 'female' : 'male')
  const messageInputRef = useRef(null)
  const fileInputRef = useRef(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (!recording) return undefined
    const timer = window.setInterval(() => {
      setRecordingElapsed(Math.floor((Date.now() - recordingStartedAtRef.current) / 1000))
    }, 200)
    return () => window.clearInterval(timer)
  }, [recording])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('notification-theme', theme)
  }, [theme])

  useEffect(() => {
    if (!profile) return
    setProfileName(profile.displayName || 'Your workspace')
    setProfileAvatar(profile.avatarId || 'male-01')
    localStorage.setItem('notification-display-name', profile.displayName || 'Your workspace')
    localStorage.setItem('notification-username', profile.username || '')
    localStorage.setItem('notification-username-locked', 'true')
  }, [profile])

  useEffect(() => {
    const syncProfile = (event) => {
      const nextName = event.detail?.displayName
      if (typeof nextName === 'string' && nextName.trim()) setProfileName(nextName.trim())
    }
    window.addEventListener('notification-profile-updated', syncProfile)
    return () => window.removeEventListener('notification-profile-updated', syncProfile)
  }, [])

  useEffect(() => {
    const uid = auth?.currentUser?.uid
    if (!uid || !db) return undefined
    return onSnapshot(collection(db, 'users', uid, 'inbox'), (snapshot) => {
      setHiddenConversationIds(snapshot.docs.filter((item) => item.data().hidden === true).map((item) => item.id))
    }, (error) => {
      showToast(error?.message || 'Could not sync your hidden chats.')
    })
  }, [auth?.currentUser?.uid])

  useEffect(() => {
    const uid = auth?.currentUser?.uid
    if (!uid || !db) return undefined
    let active = true
    setFriendRequestError('')
    const requestsQuery = query(
      collection(db, 'friendRequests'),
      where('recipientId', '==', uid),
      where('status', '==', 'pending'),
    )
    const unsubscribe = onSnapshot(requestsQuery, async (snapshot) => {
      try {
        const incoming = await Promise.all(snapshot.docs.map(async (item) => {
          const request = { id: item.id, ...item.data() }
          const senderSnapshot = await getDoc(doc(db, 'users', request.senderId))
          const sender = senderSnapshot.exists() ? senderSnapshot.data() : {}
          return {
            ...request,
            senderName: sender.displayName || sender.username || 'New user',
            senderUsername: sender.username,
            senderAvatarId: sender.avatarId,
          }
        }))
        if (active) {
          setIncomingFriendRequests(incoming)
          setFriendRequestError('')
        }
      } catch (error) {
        if (active) setFriendRequestError(error?.message || 'Could not load friend request details.')
      }
    }, (error) => {
      if (active) setFriendRequestError(error?.code === 'permission-denied'
        ? 'Firestore rules denied access to incoming friend requests. Deploy the latest firestore.rules.'
        : error?.message || 'Could not load friend requests.')
    })
    return () => {
      active = false
      unsubscribe()
    }
  }, [auth?.currentUser?.uid])

  useEffect(() => {
    if (!auth?.currentUser || !db) return undefined
    let cancelled = false
    const loadPeopleAndRequests = async () => {
      setDiscoveryLoading(true)
      setDiscoveryError('')
      try {
        const uid = auth.currentUser.uid
        const usernameTerm = newChatSearch.trim().toLowerCase().replace(/^@/, '')
        const [outgoingSnapshot, incomingAcceptedSnapshot] = await Promise.all([
          getDocs(query(collection(db, 'friendRequests'), where('senderId', '==', uid))),
          getDocs(query(collection(db, 'friendRequests'), where('recipientId', '==', uid), where('status', '==', 'accepted'))),
        ])
        const outgoingRequests = outgoingSnapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
        const outgoing = outgoingRequests.filter((item) => item.status === 'pending')
        // Accepted friend requests are the source of truth for the friend list.
        // This avoids relying on reciprocal contact documents being created by both clients.
        const acceptedRequests = [
          ...outgoingRequests.filter((item) => item.status === 'accepted'),
          ...incomingAcceptedSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
        ]
        const contactIds = [...new Set(acceptedRequests.map((request) =>
          request.senderId === uid ? request.recipientId : request.senderId
        ).filter(Boolean))]
        const contacts = await Promise.all(contactIds.map(async (contactUid) => {
          const profileSnapshot = await getDoc(doc(db, 'users', contactUid))
          if (!profileSnapshot.exists()) return null
          const data = profileSnapshot.data()
          return { id: contactUid, name: normalizeDisplayName(data.displayName || data.username), username: data.username, avatarId: data.avatarId, privacy: data.privacy || {}, initials: (data.displayName || data.username || '?').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(), status: 'offline', tone: 2 }
        }))
        let matches = []
        if (showNewChat && usernameTerm.length >= 3) {
          const peopleSnapshot = await getDocs(query(
            collection(db, 'users'),
            where('username', '>=', usernameTerm),
            where('username', '<=', usernameTerm + '\uf8ff'),
            limit(15),
          ))
          matches = peopleSnapshot.docs
            .filter((item) => item.id !== uid && item.data().privacy?.discoverable !== false)
            .map((item) => {
              const data = item.data()
              const name = normalizeDisplayName(data.displayName || data.username)
              return { id: item.id, name, username: data.username, avatarId: data.avatarId, initials: name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(), status: 'offline', tone: 2 }
            })
        }
        if (!cancelled) {
          const validContacts = contacts.filter(Boolean)
          setOutgoingFriendRequests(outgoing)
          setFriendContacts(validContacts)
          setDiscoveredUsers(matches)
          // Keep the inbox backed by accepted Firebase friendships, not demo data.
          setConversations((current) => {
            const byId = new Map(current.map((item) => [item.id, item]))
            validContacts.forEach((person) => {
              if (!byId.has(person.id)) byId.set(person.id, {
                ...person,
                preview: 'Start a conversation',
                time: '',
                unread: 0,
                pinned: false,
                favorite: false,
                archived: false,
                messages: [],
              })
            })
            return [...byId.values()]
          })
        }
      } catch (error) {
        if (!cancelled) setDiscoveryError(error?.code === 'permission-denied'
          ? 'Firestore denied access while loading people or sent requests. Deploy the latest firestore.rules and retry.'
          : error?.message || 'Could not load people. Please try again.')
      } finally {
        if (!cancelled) setDiscoveryLoading(false)
      }
    }
    loadPeopleAndRequests()
    return () => { cancelled = true }
  }, [showNewChat, showFriendRequests, newChatSearch, auth?.currentUser?.uid])



  // Keep group conversations backed by Firestore membership, not browser-only state.
  useEffect(() => {
    const uid = auth?.currentUser?.uid
    if (!uid || !db) return undefined
    const groupsQuery = query(collection(db, 'conversations'), where('memberIds', 'array-contains', uid))
    return onSnapshot(groupsQuery, (snapshot) => {
      const groups = snapshot.docs
        .map((item) => ({ id: item.id, data: item.data() }))
        .filter((item) => item.data.type === 'group')
        .map((item) => mapGroupConversation(item.id, item.data, uid))
      setConversations((current) => {
        const previousGroups = new Map(current.filter((item) => item.status === 'group').map((item) => [item.id, item]))
        const nextGroups = groups.map((group) => ({
          ...previousGroups.get(group.id),
          ...group,
          messages: previousGroups.get(group.id)?.messages || [],
          unread: previousGroups.get(group.id)?.unread || 0,
          favorite: previousGroups.get(group.id)?.favorite || false,
          archived: previousGroups.get(group.id)?.archived || false,
          muted: previousGroups.get(group.id)?.muted || false,
          pinned: previousGroups.get(group.id)?.pinned || false,
        }))
        return [...current.filter((item) => item.status !== 'group'), ...nextGroups]
      })
    }, (error) => {
      showToast(error?.code === 'permission-denied'
        ? 'Group access was denied. Deploy the updated Firestore rules.'
        : error?.message || 'Could not sync your groups.')
    })
  }, [auth?.currentUser?.uid])

  // Publish one connection record per browser tab; Firebase removes stale records on disconnect.
  useEffect(() => {
    const uid = auth?.currentUser?.uid
    if (!uid || !realtimeDb) return undefined
    let active = true
    let connectionRef = null
    const connectedRef = ref(realtimeDb, '.info/connected')
    const unsubscribe = onValue(connectedRef, (snapshot) => {
      if (!active || snapshot.val() !== true) return
      connectionRef = push(ref(realtimeDb, 'presence/' + uid))
      const offlineValue = { state: 'offline', lastChanged: realtimeServerTimestamp() }
      onDisconnect(connectionRef).set(offlineValue).then(() => {
        if (active) return setRealtimeValue(connectionRef, { state: 'online', lastChanged: realtimeServerTimestamp() })
        return undefined
      }).catch((error) => console.warn('[Converly] Could not publish presence:', error))
    })
    return () => {
      active = false
      unsubscribe()
      if (connectionRef) {
        onDisconnect(connectionRef).cancel().catch(() => {})
        setRealtimeValue(connectionRef, { state: 'offline', lastChanged: realtimeServerTimestamp() }).catch(() => {})
      }
    }
  }, [auth?.currentUser?.uid])

  // Friends can see presence only when the profile privacy setting permits it.
  useEffect(() => {
    const uid = auth?.currentUser?.uid
    if (!uid || !realtimeDb || friendContacts.length === 0) return undefined
    const friends = friendContacts
    const unsubscribers = friends.map((person) => onValue(ref(realtimeDb, 'presence/' + person.id), (snapshot) => {
      const presence = snapshot.val() || {}
      const isOnline = Object.values(presence).some((entry) => entry?.state === 'online')
      const canSeePresence = person.privacy?.whoCanSeeLastSeen !== 'nobody'
      const status = canSeePresence && isOnline ? 'online' : 'offline'
      setFriendContacts((items) => items.map((item) => item.id === person.id ? { ...item, status } : item))
      setConversations((items) => items.map((item) => item.id === person.id ? { ...item, status } : item))
    }))
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe())
  }, [friendContacts.map((person) => person.id).join('|'), auth?.currentUser?.uid])

  // Listen to each account's own block documents so the menu reflects persisted state.
  useEffect(() => {
    const uid = auth?.currentUser?.uid
    if (!uid || !db || friendContacts.length === 0) return undefined
    const unsubscribers = friendContacts.map((person) => onSnapshot(
      doc(db, 'users', uid, 'blocks', person.id),
      (snapshot) => setConversations((items) => items.map((item) => item.id === person.id
        ? { ...item, blocked: snapshot.exists() }
        : item)),
      (error) => console.warn('[Converly] Block status could not be synced:', error),
    ))
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe())
  }, [friendContacts.map((person) => person.id).join('|'), auth?.currentUser?.uid])

  // Each account mirrors only its own accepted friendships; RTDB requires both sides.
  useEffect(() => {
    const uid = auth?.currentUser?.uid
    if (!uid || !realtimeDb || friendContacts.length === 0) return undefined
    friendContacts.forEach((person) => {
      setRealtimeValue(ref(realtimeDb, 'friendships/' + uid + '/' + person.id), true)
        .catch((error) => console.warn('[Converly] Could not publish friend presence access:', error))
    })
    return undefined
  }, [friendContacts.map((person) => person.id).join('|'), auth?.currentUser?.uid])

  // Keep group previews and unread counts synchronized even when a group is not open.
  const groupConversationIds = conversations.filter((item) => item.status === 'group').map((item) => item.firebaseConversationId || item.id).join('|')
  useEffect(() => {
    const uid = auth?.currentUser?.uid
    if (!uid || !db || !groupConversationIds) return undefined
    const ids = groupConversationIds.split('|').filter(Boolean)
    const unsubscribers = ids.map((conversationId) => onSnapshot(
      query(collection(db, 'conversations', conversationId, 'messages'), orderBy('createdAt', 'desc'), limit(100)),
      (snapshot) => {
        const latestDocument = snapshot.docs.find((messageDocument) => {
          const expiry = messageDocument.data().expiresAt
          return !expiry || expiry.toMillis() > Date.now()
        })
        const latest = latestDocument?.data()
        const unread = activeId === conversationId ? 0 : countUnreadMessages(snapshot.docs, uid)
        const preview = latest
          ? latest.deletedAt ? 'Message deleted' : latest.type === 'image' ? 'Photo' : latest.text || 'Message'
          : 'Group created'
        const latestAt = latest?.createdAt?.toDate ? latest.createdAt.toDate().getTime() : 0
        setConversations((items) => items.map((item) => item.id === conversationId ? {
          ...item,
          unread,
          preview,
          time: latestAt ? new Date(latestAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : item.time,
          lastActivityAt: latestAt || item.lastActivityAt || 0,
        } : item))
      },
      (error) => showToast(error?.message || 'Could not sync group activity.'),
    ))
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe())
  }, [groupConversationIds, activeId, auth?.currentUser?.uid])

  useEffect(() => {
    localStorage.setItem('notification-sound-enabled', String(soundEnabled))
  }, [soundEnabled])

  useEffect(() => {
    localStorage.setItem('notification-compact-mode', String(compactMode))
  }, [compactMode])

  // Remove conversation snapshots saved by the old sample-data preview.
  // Conversations now load only from the signed-in user's Firebase friendships.
  useEffect(() => {
    localStorage.removeItem('notification-conversations')
  }, [])

  useEffect(() => {
    setReplyTarget(null); setEditingMessageId(null); setSelectedMessageId(null)
    setMessageSearch(''); setMessageSearchOpen(false)
  }, [activeId])

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = Date.now()
      setConversations((items) => {
        let changed = false
        const next = items.map((conversation) => {
          const messages = (Array.isArray(conversation.messages) ? conversation.messages : []).map((message) => {
            return message
          }).filter((message) => { const keep = !message.expiresAt || message.expiresAt > now; if (!keep) changed = true; return keep })
          return messages.length === conversation.messages.length && !messages.some((message, index) => message !== conversation.messages[index]) ? conversation : { ...conversation, messages }
        })
        return changed ? next : items
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [])

  const activeConversationRecord = conversations.find((conversation) => conversation?.id === activeId)
  // Keep the chat renderer safe when older or partially-written records omit messages.
  const activeConversation = activeConversationRecord
    ? {
      ...activeConversationRecord,
      name: typeof activeConversationRecord.name === 'string' ? activeConversationRecord.name : 'Conversation',
      messages: normalizeConversationMessages(activeConversationRecord.messages),
      memberIds: Array.isArray(activeConversationRecord.memberIds) ? activeConversationRecord.memberIds : [],
      admins: Array.isArray(activeConversationRecord.admins) ? activeConversationRecord.admins : [],
      moderators: Array.isArray(activeConversationRecord.moderators) ? activeConversationRecord.moderators : [],
    }
    : null
  useEffect(() => {
    const uid = auth?.currentUser?.uid
    const isGroup = activeConversationRecord?.status === 'group'
    const friend = friendContacts.find((person) => person.id === activeId)
    if (!uid || !db || (!friend && !isGroup)) return undefined

    const conversationId = isGroup
      ? (activeConversationRecord.firebaseConversationId || activeId)
      : directConversationId(uid, friend.id)
    const messagesQuery = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(300),
    )
    let snapshotGeneration = 0
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const generation = ++snapshotGeneration
      const documents = snapshot.docs
      const messages = documents
        .map((messageDoc) => normalizeMessage(messageDoc.id, messageDoc.data(), uid))
        .filter((message) => !message.expiresAt || message.expiresAt > Date.now())
      if (generation !== snapshotGeneration) return

      // Read state is stored per recipient and shared with every device.
      const unreadIncoming = documents.filter((messageDoc) => {
        const data = messageDoc.data()
        const expiryMillis = data.expiresAt?.toMillis ? data.expiresAt.toMillis() : 0
        return data.senderId !== uid
          && !data.deletedAt
          && (!expiryMillis || expiryMillis > Date.now())
          && !(Array.isArray(data.readBy) && data.readBy.includes(uid))
      })
      if (unreadIncoming.length) {
        const batch = writeBatch(db)
        unreadIncoming.forEach((messageDoc) => {
          const data = messageDoc.data()
          const patch = { readBy: arrayUnion(uid) }
          if (!data.readAt) {
            patch.readAt = serverTimestamp()
            patch.expiresAt = Timestamp.fromMillis(Date.now() + MESSAGE_RETENTION_MS)
          } else if (!data.expiresAt) {
            const readAtMillis = timestampToMillis(data.readAt)
            patch.expiresAt = Timestamp.fromMillis((readAtMillis || Date.now()) + MESSAGE_RETENTION_MS)
          }
          batch.update(messageDoc.ref, patch)
        })
        batch.commit().catch((error) => showToast(error?.code === 'permission-denied'
          ? 'Read receipts were denied. Deploy the updated Firestore rules.'
          : error?.message || 'Could not update read receipts.'))
      }

      const latestMessage = messages[messages.length - 1]
      const preview = latestMessage
        ? latestMessage.deleted ? 'Message deleted' : latestMessage.type === 'image' ? 'Photo' : latestMessage.text || 'Message'
        : (isGroup ? 'Group created' : 'Start a conversation')
      const unread = isGroup ? 0 : 0
      setConversations((items) => {
        const exists = items.some((item) => item.id === activeId)
        if (!exists && !isGroup) return items
        const targetId = isGroup ? conversationId : activeId
        const currentGroup = items.find((item) => item.id === targetId)
        const nextItem = currentGroup || (isGroup ? mapGroupConversation(conversationId, activeConversationRecord, uid) : null)
        return isGroup && !currentGroup
          ? [...items, { ...nextItem, firebaseConversationId: conversationId, messages, preview, unread, time: latestMessage?.time || '' }]
          : items.map((item) => (item.id === targetId
            ? { ...item, firebaseConversationId: conversationId, messages, preview, unread, time: latestMessage?.time || item.time, lastActivityAt: latestMessage?.createdAt || item.lastActivityAt || 0 }
            : item))
      })
    }, (error) => {
      setToast(error?.code === 'permission-denied'
        ? 'Message sync permission denied. Deploy the latest Firestore rules.'
        : error?.message || 'Could not sync messages.')
    })

    return unsubscribe
  }, [activeId, activeConversationRecord?.status, activeConversationRecord?.firebaseConversationId, friendContacts, auth?.currentUser?.uid])

  // Firestore typing records inherit conversation membership rules, including for groups.
  useEffect(() => {
    const uid = auth?.currentUser?.uid
    const isGroup = activeConversationRecord?.status === 'group'
    const friend = friendContacts.find((person) => person.id === activeId)
    if (!uid || !db || (!isGroup && !friend)) {
      setTypingUsers([])
      return undefined
    }
    const conversationId = isGroup
      ? (activeConversationRecord.firebaseConversationId || activeId)
      : directConversationId(uid, friend.id)
    const typingQuery = query(collection(db, 'conversations', conversationId, 'typing'), where('isTyping', '==', true))
    const unsubscribe = onSnapshot(typingQuery, (snapshot) => {
      const now = Date.now()
      const users = snapshot.docs
        .map((typingDocument) => {
          const data = typingDocument.data()
          return { uid: typingDocument.id, updatedAt: timestampToMillis(data.updatedAt) || now }
        })
        .filter((user) => user.uid !== uid && now - user.updatedAt < 12000)
      setTypingUsers(users)
    }, (error) => {
      if (error?.code !== 'permission-denied') console.warn('[Converly] Typing status could not be read:', error)
      setTypingUsers([])
    })
    const staleTimer = window.setInterval(() => {
      setTypingUsers((users) => users.filter((user) => Date.now() - user.updatedAt < 12000))
    }, 4000)
    return () => {
      unsubscribe()
      window.clearInterval(staleTimer)
    }
  }, [activeId, activeConversationRecord?.status, activeConversationRecord?.firebaseConversationId, friendContacts, auth?.currentUser?.uid])

  useEffect(() => {
    const uid = auth?.currentUser?.uid
    if (!uid || !db || friendContacts.length === 0) return undefined

    const unsubscribers = friendContacts.map((person) => {
      const conversationId = directConversationId(uid, person.id)
      const latestMessageQuery = query(
        collection(db, 'conversations', conversationId, 'messages'),
        orderBy('createdAt', 'desc'),
        limit(100),
      )

      return onSnapshot(latestMessageQuery, (snapshot) => {
        const latestDocument = snapshot.docs.find((messageDocument) => {
          const expiry = messageDocument.data().expiresAt
          return !expiry || expiry.toMillis() > Date.now()
        })
        const latest = latestDocument?.data()
        const createdAt = latest?.createdAt?.toDate ? latest.createdAt.toDate() : null
        const preview = latest
          ? latest.deletedAt ? 'Message deleted' : latest.type === 'image' ? 'Photo' : latest.type === 'voice' ? 'Voice message' : latest.text || 'Message'
          : 'Start a conversation'
        const unread = activeId === person.id ? 0 : countUnreadMessages(snapshot.docs, uid)

        setConversations((items) => items.map((item) => item.id === person.id ? {
          ...item,
          firebaseConversationId: conversationId,
          preview,
          time: createdAt ? createdAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : item.time,
          lastActivityAt: createdAt ? createdAt.getTime() : item.lastActivityAt || 0,
          unread,
        } : item))
      }, (error) => {
        if (error?.code === 'permission-denied') {
          showToast('Firestore denied inbox message reads. Check conversation membership and deploy the latest firestore.rules.')
        } else {
          showToast(error?.message || 'Could not update the inbox.')
        }
      })
    })

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe())
  }, [friendContacts, activeId, auth?.currentUser?.uid])


  const directory = useMemo(() => [
    ...conversations.filter((item) => !item.archived && item.status !== 'group'),
    ...friendContacts.filter((person) => !conversations.some((item) => item.id === person.id)),
  ], [conversations, friendContacts])

  const visibleConversations = useMemo(() => {
    let items = conversations
    if (view === 'starred') items = items.filter((item) => item.favorite && !item.archived)
    else if (view === 'archive') items = items.filter((item) => item.archived)
    else if (view === 'contacts') items = directory
    else items = items.filter((item) => !item.archived)

    if (listFilter === 'unread') items = items.filter((item) => item.unread > 0)
    const query = search.trim().toLowerCase()
    if (query) items = items.filter((item) => String(item.name || 'Converly user').toLowerCase().includes(query) || (item.preview || '').toLowerCase().includes(query))
    const uid = auth?.currentUser?.uid
    items = items.filter((item) => !hiddenConversationIds.includes(item.firebaseConversationId || (uid && item.id ? directConversationId(uid, item.id) : item.id)))
    return [...items].sort((a, b) => getConversationActivity(b) - getConversationActivity(a))
  }, [conversations, directory, hiddenConversationIds, listFilter, search, view])

  const deleteConversation = async (conversation) => {
    const uid = auth?.currentUser?.uid
    if (!uid || !db || !conversation?.id || deletingConversationId) return
    const conversationId = conversation.firebaseConversationId || directConversationId(uid, conversation.id)
    setDeletingConversationId(conversationId)
    try {
      // Ensure an empty accepted-friend chat has a member-verified parent before writing its private inbox marker.
      if (friendContacts.some((person) => person.id === conversation.id)) {
        await runTransaction(db, async (transaction) => {
          const conversationRef = doc(db, 'conversations', conversationId)
          const snapshot = await transaction.get(conversationRef)
          if (!snapshot.exists()) {
            transaction.set(conversationRef, { createdBy: uid, memberIds: [uid, conversation.id].sort(), createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
          } else if (!snapshot.data().memberIds?.includes(uid)) {
            throw new Error('You are not a member of this conversation.')
          }
        })
        await setDoc(doc(db, 'users', uid, 'inbox', conversationId), { hidden: true, otherUid: conversation.id, updatedAt: serverTimestamp() }, { merge: true })
        setHiddenConversationIds((ids) => ids.includes(conversationId) ? ids : [...ids, conversationId])
      }
      setConversations((items) => items.filter((item) => item?.id !== conversation.id))
      if (activeId === conversation.id) {
        // Close transient chat UI before removing the active record. This guarantees
        // the main panel returns to its empty state instead of retaining stale overlays.
        setActiveId('')
        setMobileChatOpen(false)
        setEmojiPickerOpen(false)
        setShowDetails(false)
        setShowChatMenu(false)
        setMessageSearchOpen(false)
        setMessageSearch('')
        setSelectedMessageId(null)
        setReactionPickerMessageId(null)
        setReplyTarget(null)
        setEditingMessageId(null)
        setForwardMessageId(null)
        setMessageText('')
      }
      showToast('Chat deleted from your inbox. The other person still has their chat.')
    } catch (error) {
      showToast(error?.code === 'permission-denied' ? 'Firebase denied this action. Check the latest Firestore rules.' : error?.message || 'Could not delete this chat.')
    } finally {
      setDeletingConversationId('')
    }
  }

  const handleLogout = async () => {
    if (!auth || !auth.currentUser || loggingOut) return
    setLoggingOut(true)
    try {
      await signOut(auth)
      localStorage.removeItem('notification-conversations')
      setConversations([])
      setActiveId('')
      setView('messages')
      setMobileChatOpen(false)
    } catch (error) {
      showToast(error?.message || 'Could not log out. Please try again.')
    } finally {
      setLoggingOut(false)
    }
  }

  const showToast = (message) => {
    setToast(message)
    window.clearTimeout(showToast.timeout)
    showToast.timeout = window.setTimeout(() => setToast(''), 2600)
  }

  const openAvatarPicker = () => {
    const currentAvatar = profileAvatar || profile?.avatarId || 'male-01'
    setDraftAvatar(currentAvatar)
    setAvatarPickerGender(currentAvatar.startsWith('female') ? 'female' : 'male')
    setProfileMenuOpen(false)
    setShowAvatarPicker(true)
  }

  const saveAvatarSelection = async () => {
    const uid = auth?.currentUser?.uid
    if (!uid || !db || savingAvatar) {
      showToast('Please sign in again before changing your avatar.')
      return
    }
    setSavingAvatar(true)
    try {
      await setDoc(doc(db, 'users', uid), { avatarId: draftAvatar, updatedAt: serverTimestamp() }, { merge: true })
      setProfileAvatar(draftAvatar)
      localStorage.setItem('notification-profile-avatar', draftAvatar)
      setShowAvatarPicker(false)
      showToast('Your avatar has been updated')
    } catch (error) {
      showToast(error?.code === 'permission-denied' ? 'Firebase denied the avatar update. Check the deployed Firestore rules.' : error?.message || 'Could not update your avatar. Please try again.')
    } finally {
      setSavingAvatar(false)
    }
  }

  useEffect(() => {
    const handleGlobalKeys = (event) => {
      if (event.key === 'Escape') {
        setShowAvatarPicker(false)
        setShowNewChat(false)
        setShowChatMenu(false)
        setShowDetails(false)
        setProfileMenuOpen(false)
      }
      const target = event.target
      const isTyping = target instanceof HTMLElement && (
        target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
      )
      if (event.key === '/' && !isTyping && !showAvatarPicker && !showNewChat) {
        event.preventDefault()
        document.querySelector('.inbox-panel:not(.hidden-mobile) .search-box input')?.focus()
      }
    }
    window.addEventListener('keydown', handleGlobalKeys)
    return () => window.removeEventListener('keydown', handleGlobalKeys)
  }, [showAvatarPicker, showNewChat])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [activeId, activeConversation?.messages?.length])

  // A message's fixed 24-hour retention clock starts only when its recipient sees it.
  // This browser preview can mark incoming messages as seen when their conversation opens.
  useEffect(() => {
    const seenAt = Date.now()
    setConversations((items) => items.map((item) => {
      if (item.id !== activeId) return item
      let conversationChanged = item.unread !== 0
      const messages = (Array.isArray(item.messages) ? item.messages : []).map((message) => {
        const wasSeenByRecipient = message.from === 'me' && message.read === true
        const isReceivedHere = message.from !== 'me'
        if (message.seenAt || (!wasSeenByRecipient && !isReceivedHere)) return message
        conversationChanged = true
        return { ...message, seenAt, expiresAt: seenAt + MESSAGE_RETENTION_MS }
      })
      return conversationChanged ? { ...item, unread: 0, messages } : item
    }))
  }, [activeId])

  const selectConversation = (id) => {
    setActiveId(id)
    setMobileChatOpen(true)
    setShowDetails(false)
    setShowChatMenu(false)
    if (view === 'settings') setView('messages')
  }

  const insertComposerEmoji = (emoji) => {
    if (typeof emoji !== 'string' || !emoji) return
    const input = messageInputRef.current
    const start = Number.isInteger(input?.selectionStart) ? input.selectionStart : messageText.length
    const end = Number.isInteger(input?.selectionEnd) ? input.selectionEnd : messageText.length
    const nextText = messageText.slice(0, start) + emoji + messageText.slice(end)
    setMessageText(nextText)
    setEmojiPickerOpen(false)
    // Keep insertion safe even if the textarea was unmounted between the click
    // and the next paint (for example, while a recording preview is active).
    window.requestAnimationFrame(() => {
      const currentInput = messageInputRef.current
      if (!currentInput || typeof currentInput.setSelectionRange !== 'function') return
      const cursor = start + emoji.length
      currentInput.focus()
      try { currentInput.setSelectionRange(cursor, cursor) } catch { /* Some mobile keyboards temporarily reject selection updates. */ }
    })
  }

  const getActiveConversationId = (uid = auth?.currentUser?.uid) => {
    if (!uid || !activeConversation) return ''
    return activeConversation.status === 'group'
      ? (activeConversation.firebaseConversationId || activeId)
      : (activeConversation.firebaseConversationId || directConversationId(uid, activeId))
  }

  const publishTyping = (isTyping, force = false) => {
    const uid = auth?.currentUser?.uid
    const conversationId = getActiveConversationId(uid)
    const nextState = Boolean(isTyping)
    if (!uid || !db || !conversationId) return
    if (!force && typingPublishedRef.current === nextState) return
    typingPublishedRef.current = nextState
    setDoc(doc(db, 'conversations', conversationId, 'typing', uid), {
      uid,
      isTyping: nextState,
      updatedAt: serverTimestamp(),
    }, { merge: true }).catch((error) => console.warn('[Converly] Could not update typing state:', error))
  }

  useEffect(() => {
    const isTyping = Boolean(messageText.trim()) && composerFocused
    if (!isTyping) {
      publishTyping(false)
      return undefined
    }
    publishTyping(true, true)
    const heartbeat = window.setInterval(() => publishTyping(true, true), 5000)
    return () => {
      window.clearInterval(heartbeat)
      publishTyping(false)
    }
  }, [Boolean(messageText.trim()), composerFocused, activeId])

  const handleSend = async (event) => {
    event?.preventDefault()
    const text = messageText.trim()
    if (!text || !activeConversation) return
    const uid = auth?.currentUser?.uid
    const isGroup = activeConversation.status === 'group'
    const isAcceptedFriend = friendContacts.some((person) => person.id === activeId)
    if (!uid || !db || (!isGroup && !isAcceptedFriend)) {
      showToast('This conversation is not connected to your Firebase account.')
      return
    }
    if (activeConversation.blocked) {
      showToast('Unblock this user before sending messages.')
      return
    }

    if (!isGroup) {
      try {
        const [myBlock, theirBlock, recipientSnapshot] = await Promise.all([
          getDoc(doc(db, 'users', uid, 'blocks', activeId)),
          getDoc(doc(db, 'users', activeId, 'blocks', uid)),
          getDoc(doc(db, 'users', activeId)),
        ])
        if (myBlock.exists()) { showToast('You blocked this user. Unblock them before sending messages.'); return }
        if (theirBlock.exists()) { showToast('You cannot send messages because this user has blocked you.'); return }
        const messagePrivacy = recipientSnapshot.data()?.privacy?.whoCanMessage
        if (messagePrivacy === 'nobody') { showToast('This person is not accepting messages right now.'); return }
      } catch (error) {
        showToast(error?.code === 'permission-denied' ? 'Could not verify this chat’s block or privacy status. Please try again.' : error?.message || 'Could not verify this chat. Please try again.')
        return
      }
    }

    const conversationId = getActiveConversationId(uid)
    if (!conversationId) { showToast('This conversation is not available.'); return }

    if (editingMessageId) {
      try {
        await updateDoc(doc(db, 'conversations', conversationId, 'messages', editingMessageId), {
          text,
          editedAt: serverTimestamp(),
        })
        setEditingMessageId(null)
        setMessageText('')
        publishTyping(false)
        messageInputRef.current?.focus()
      } catch (error) {
        showToast(error?.code === 'permission-denied' ? 'Only the message author can edit this message. Deploy the latest Firestore rules if the error continues.' : error?.message || 'Could not save this edit.')
      }
      return
    }

    let sendStage = 'checking conversation membership'
    try {
      if (isGroup) {
        const groupSnapshot = await getDoc(doc(db, 'conversations', conversationId))
        const groupData = groupSnapshot.data()
        if (!groupSnapshot.exists() || groupData?.type !== 'group' || !Array.isArray(groupData.memberIds) || !groupData.memberIds.includes(uid)) {
          throw new Error('You are no longer a member of this group.')
        }
      } else {
        await runTransaction(db, async (transaction) => {
          const conversationRef = doc(db, 'conversations', conversationId)
          const snapshot = await transaction.get(conversationRef)
          if (!snapshot.exists()) {
            transaction.set(conversationRef, {
              createdBy: uid,
              memberIds: [uid, activeId].sort(),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            })
          } else if (!snapshot.data().memberIds?.includes(uid) || !snapshot.data().memberIds?.includes(activeId)) {
            throw new Error('This conversation does not have the expected members.')
          }
        })
      }

      sendStage = 'writing the message'
      const messageRef = doc(collection(db, 'conversations', conversationId, 'messages'))
      await setDoc(messageRef, {
        senderId: uid,
        senderName: profile?.displayName || profile?.username || 'Converly user',
        type: 'text',
        text,
        readBy: [uid],
        reactions: {},
        createdAt: serverTimestamp(),
        ...(replyTarget ? { replyToId: replyTarget.id, replyToText: replyTarget.text || 'Message' } : {}),
      })
      setMessageText('')
      setReplyTarget(null)
      publishTyping(false)
      messageInputRef.current?.focus()
    } catch (error) {
      const details = error?.code === 'permission-denied'
        ? 'Firestore denied ' + sendStage + '. Deploy the latest firestore.rules to notification-32ea1.'
        : error?.message || 'Could not send the message. Please try again.'
      showToast(details)
    }
  }


  const getMediaApiUrl = () => (String(import.meta.env.VITE_NOTIFICATION_API_URL || '').trim() || 'https://notification-api.mediatoolkit.workers.dev').replace(/\/+$/, '')

  const openSharedImage = async (message) => {
    const apiUrl = getMediaApiUrl()
    const user = auth?.currentUser
    if (!apiUrl || !user || !activeConversation) {
      showToast('Image service is not configured or you are signed out.')
      return
    }
    if (!message.attachmentPath) {
      showToast('This image does not have a saved ImageKit path. Send it again after updating the Worker.')
      return
    }

    try {
      const idToken = await getIdToken(user)
      const response = await fetch(apiUrl + '/media/open', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + idToken,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: activeConversation.firebaseConversationId || directConversationId(user.uid, activeId),
          messageId: message.id,
        }),
      })
      if (!response.ok) {
        const result = await response.json().catch(() => ({}))
        if (response.status === 410 || result.code === 'image_already_opened') {
          setConversations((items) => items.map((item) => item.id === activeId
            ? { ...item, messages: item.messages.map((entry) => entry.id === message.id ? { ...entry, viewed: true } : entry) }
            : item))
        }
        throw new Error(result.error || 'The image could not be opened.')
      }

      const imageBlob = await response.blob()
      const objectUrl = URL.createObjectURL(imageBlob)
      const senderView = message.from === 'me'
      setViewOnceImage({ id: message.id, src: objectUrl, senderView })
      if (!senderView) {
        setConversations((items) => items.map((item) => item.id === activeId
          ? { ...item, messages: item.messages.map((entry) => entry.id === message.id ? { ...entry, viewed: true } : entry) }
          : item))
      }
    } catch (error) {
      showToast(error?.message || 'Could not open this shared image.')
    }
  }

  const closeViewOnceImage = () => {
    if (!viewOnceImage) return
    if (viewOnceImage.src?.startsWith('blob:')) URL.revokeObjectURL(viewOnceImage.src)
    if (!viewOnceImage.senderView) {
      const openedId = viewOnceImage.id
      setConversations((items) => items.map((item) => item.id === activeId
        ? { ...item, messages: item.messages.map((message) => message.id === openedId ? { ...message, viewed: true } : message) }
        : item))
    }
    setViewOnceImage(null)
  }

  const handleFile = async (event) => {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file || !activeConversation) return
    input.value = ''

    if (!/^image\/(jpeg|png|webp|gif)$/i.test(file.type)) {
      showToast('Choose a JPG, PNG, WEBP or GIF image.')
      return
    }
    if (file.size < 1 || file.size > 3 * 1024 * 1024) {
      showToast('Choose an image up to 3 MB.')
      return
    }

    const uid = auth?.currentUser?.uid
    const apiUrl = getMediaApiUrl()
    const isGroup = activeConversation.status === 'group'
    const isAcceptedFriend = friendContacts.some((person) => person.id === activeId)
    if (!uid || !db) {
      showToast('Sign in again before sharing an image.')
      return
    }
    if (!isGroup && !isAcceptedFriend) {
      showToast('Only accepted friends and current group members can share images.')
      return
    }

    const conversationId = getActiveConversationId(uid)
    const messageRef = doc(collection(db, 'conversations', conversationId, 'messages'))

    try {
      if (isGroup) {
        const groupSnapshot = await getDoc(doc(db, 'conversations', conversationId))
        if (!groupSnapshot.exists() || groupSnapshot.data()?.type !== 'group' || !groupSnapshot.data()?.memberIds?.includes(uid)) {
          throw new Error('You are no longer a member of this group.')
        }
      } else {
        await runTransaction(db, async (transaction) => {
          const conversationRef = doc(db, 'conversations', conversationId)
          const snapshot = await transaction.get(conversationRef)
          if (!snapshot.exists()) {
            transaction.set(conversationRef, {
              createdBy: uid,
              memberIds: [uid, activeId].sort(),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            })
          } else if (!snapshot.data().memberIds?.includes(uid) || !snapshot.data().memberIds?.includes(activeId)) {
            throw new Error('This conversation does not have the expected members.')
          }
        })
      }

      const idToken = await getIdToken(auth.currentUser)
      const uploadForm = new FormData()
      uploadForm.append('conversationId', conversationId)
      uploadForm.append('messageId', messageRef.id)
      uploadForm.append('file', file, file.name)

      const uploadResponse = await fetch(apiUrl + '/media/upload', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + idToken },
        body: uploadForm,
      })
      const uploadResult = await uploadResponse.json().catch(() => ({}))
      if (!uploadResponse.ok || !uploadResult.filePath) {
        throw new Error(uploadResult.error || 'The image upload service rejected this file.')
      }

      await setDoc(messageRef, {
        senderId: uid,
        senderName: profile?.displayName || profile?.username || 'Converly user',
        type: 'image',
        attachmentPath: uploadResult.filePath,
        viewOnce: true,
        readBy: [uid],
        reactions: {},
        createdAt: serverTimestamp(),
        ...(replyTarget ? { replyToId: replyTarget.id, replyToText: replyTarget.text || 'Message' } : {}),
      })

      setConversations((items) => items.map((item) => item.id === activeId
        ? {
          ...item,
          firebaseConversationId: conversationId,
          preview: 'Photo',
          time: 'Now',
          lastActivityAt: Date.now(),
        }
        : item))
      setReplyTarget(null)
      showToast('View-once photo sent.')
    } catch (error) {
      showToast(error?.message || 'Could not send the image. Please try again.')
    }
  }

  const stopVoiceWaveform = () => {
    if (waveformFrameRef.current !== null) window.cancelAnimationFrame(waveformFrameRef.current)
    waveformFrameRef.current = null
    analyserRef.current = null
    const audioContext = audioContextRef.current
    audioContextRef.current = null
    if (audioContext && audioContext.state !== 'closed') audioContext.close().catch(() => {})
    setWaveformLevels(Array(24).fill(3))
  }

  const startVoiceWaveform = (stream) => {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext
    if (!AudioContextConstructor) return

    try {
      const audioContext = new AudioContextConstructor()
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 512
      analyser.smoothingTimeConstant = 0.78
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)
      audioContextRef.current = audioContext
      analyserRef.current = analyser
      if (audioContext.state === 'suspended') audioContext.resume().catch(() => {})

      const frequencyData = new Uint8Array(analyser.frequencyBinCount)
      let lastPaint = 0
      const drawWaveform = (timestamp) => {
        if (audioContextRef.current !== audioContext || mediaRecorderRef.current?.state !== 'recording') return
        waveformFrameRef.current = window.requestAnimationFrame(drawWaveform)
        if (timestamp - lastPaint < 45) return
        lastPaint = timestamp
        analyser.getByteFrequencyData(frequencyData)
        const nextLevels = Array.from({ length: 24 }, (_, index) => {
          const start = Math.floor(index * frequencyData.length / 24)
          const end = Math.max(start + 1, Math.floor((index + 1) * frequencyData.length / 24))
          let peak = 0
          for (let bin = start; bin < end; bin += 1) peak = Math.max(peak, frequencyData[bin])
          return Math.round(3 + Math.sqrt(peak / 255) * 24)
        })
        setWaveformLevels(nextLevels)
      }
      waveformFrameRef.current = window.requestAnimationFrame(drawWaveform)
    } catch {
      // Recording still works in browsers where live audio analysis is unavailable.
      stopVoiceWaveform()
    }
  }

  const startVoiceRecording = async () => {
    if (recordingHoldRef.current || recording || recordingPreview) return
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { showToast('Voice recording is not supported in this browser'); return }

    recordingHoldRef.current = true
    recordingCancelledRef.current = false
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (!recordingHoldRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      const recorder = new MediaRecorder(stream)
      recordingStreamRef.current = stream
      recordingChunksRef.current = []
      recorder.ondataavailable = (event) => { if (event.data.size) recordingChunksRef.current.push(event.data) }
      recorder.onstop = () => {
        const chunks = recordingChunksRef.current
        const durationSeconds = Math.max(1, Math.round((Date.now() - recordingStartedAtRef.current) / 1000))
        stream.getTracks().forEach((track) => track.stop())
        recordingStreamRef.current = null
        stopVoiceWaveform()

        if (!recordingCancelledRef.current && chunks.length) {
          const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
          const url = URL.createObjectURL(blob)
          setRecordingPreview({ url, durationSeconds })
        } else if (!recordingCancelledRef.current) {
          showToast('No audio was captured. Please try recording again.')
        }

        recordingCancelledRef.current = false
        recordingHoldRef.current = false
        mediaRecorderRef.current = null
        setRecording(false)
        setRecordingElapsed(0)
      }

      mediaRecorderRef.current = recorder
      recordingStartedAtRef.current = Date.now()
      recorder.start(150)
      setRecording(true)
      setRecordingElapsed(0)
      setWaveformLevels(Array(24).fill(3))
      startVoiceWaveform(stream)
    } catch {
      recordingHoldRef.current = false
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop())
      recordingStreamRef.current = null
      stopVoiceWaveform()
      setRecording(false)
      showToast('Microphone permission was not granted')
    }
  }

  const stopVoiceRecording = () => {
    recordingHoldRef.current = false
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
  }

  const cancelVoiceRecording = () => {
    recordingCancelledRef.current = true
    recordingHoldRef.current = false
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    } else {
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop())
      recordingStreamRef.current = null
      setRecording(false)
    }
  }

  const discardVoicePreview = () => {
    if (recordingPreview?.url) URL.revokeObjectURL(recordingPreview.url)
    setRecordingPreview(null)
  }

  const sendVoicePreview = () => {
    if (!recordingPreview) return
    const message = {
      id: 'voice-' + Date.now(),
      from: 'me',
      type: 'audio',
      mediaUrl: recordingPreview.url,
      durationSeconds: recordingPreview.durationSeconds,
      time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      status: 'sent',
    }
    setConversations((items) => items.map((item) => item.id === activeId
      ? { ...item, messages: [...item.messages, message], preview: 'Voice message', time: 'Now', lastActivityAt: Date.now() }
      : item))
    setRecordingPreview(null)
  }

  const beginReply = (message) => { setReplyTarget(message); setEditingMessageId(null); setMessageText(''); setSelectedMessageId(null); messageInputRef.current?.focus() }
  const beginEdit = (message) => { setEditingMessageId(message.id); setReplyTarget(null); setMessageText(message.text || ''); setSelectedMessageId(null); messageInputRef.current?.focus() }
  const deleteMessage = async (messageId) => {
    const uid = auth?.currentUser?.uid
    const conversationId = getActiveConversationId(uid)
    if (!uid || !db || !conversationId || !messageId) return
    try {
      await updateDoc(doc(db, 'conversations', conversationId, 'messages', messageId), {
        text: '',
        deletedAt: serverTimestamp(),
      })
      setSelectedMessageId(null)
      showToast('Message deleted for everyone.')
    } catch (error) {
      showToast(error?.code === 'permission-denied' ? 'Only the message author can delete this message. Deploy the latest Firestore rules if needed.' : error?.message || 'Could not delete this message.')
    }
  }

  const toggleMessageReaction = async (messageId, emoji) => {
    const uid = auth?.currentUser?.uid
    const conversationId = getActiveConversationId(uid)
    const message = activeConversation?.messages?.find((entry) => entry.id === messageId)
    if (!uid || !db || !conversationId || !message || !emoji) return
    try {
      const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId)
      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(messageRef)
        if (!snapshot.exists() || snapshot.data().deletedAt) throw new Error('This message is no longer available.')
        const reactions = { ...(snapshot.data().reactions || {}) }
        if (reactions[uid] === emoji) delete reactions[uid]
        else reactions[uid] = emoji
        transaction.update(messageRef, { reactions })
      })
      setSelectedMessageId(null)
      setReactionPickerMessageId(null)
    } catch (error) {
      showToast(error?.code === 'permission-denied' ? 'Firestore denied this reaction. Deploy the latest Firestore rules.' : error?.message || 'Could not sync this reaction.')
    }
  }

  const forwardMessageTo = (message, targetId) => {
    if (!targetId) return
    setConversations((items) => items.map((item) => item.id === targetId ? { ...item, messages: [...item.messages, { id: 'fwd-' + Date.now(), from: 'me', type: 'text', text: message.text || (message.type === 'image' ? 'Image' : (message.type === 'audio' || message.type === 'voice' || message.type === 'voice-message' || message.type === 'recording' || Boolean(message.mediaUrl) || Boolean(message.audioUrl) || Boolean(message.mimeType?.startsWith('audio/'))) ? 'Voice message' : 'Message'), forwarded: true, time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), status: 'sent' }], preview: 'Forwarded message', time: 'Now', lastActivityAt: Date.now() } : item))
    setForwardMessageId(null); setSelectedMessageId(null); showToast('Message forwarded in this browser preview')
  }

  const createGroup = async () => {
    const uid = auth?.currentUser?.uid
    const title = groupName.trim()
    const selected = friendContacts.filter((person) => groupMemberIds.includes(person.id))
    if (!uid || !db) { showToast('Sign in again before creating a group.'); return }
    if (!title || title.length > 48) { showToast('Enter a group name up to 48 characters.'); return }
    if (!selected.length) { showToast('Choose at least one accepted friend.'); return }
    if (selected.length > 49) { showToast('A group can contain up to 50 members.'); return }
    const restricted = selected.find((person) => person.privacy?.whoCanAddToGroups === 'nobody')
    if (restricted) { showToast(restricted.name + ' does not accept group invitations.'); return }

    const initialMemberIds = [uid, selected[0].id]
    const groupRef = doc(collection(db, 'conversations'))
    const initialBatch = writeBatch(db)
    initialBatch.set(groupRef, {
      type: 'group',
      title,
      createdBy: uid,
      memberIds: initialMemberIds,
      adminIds: [uid],
      moderatorIds: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    initialMemberIds.forEach((memberUid) => {
      initialBatch.set(doc(db, 'conversations', groupRef.id, 'members', memberUid), {
        uid: memberUid,
        role: memberUid === uid ? 'admin' : 'member',
        createdAt: serverTimestamp(),
      })
    })

    try {
      await initialBatch.commit()
    } catch (error) {
      showToast(error?.code === 'permission-denied'
        ? 'Group creation was denied. Confirm the first invitee is an accepted friend and deploy the latest Firestore rules.'
        : error?.message || 'Could not create this group.')
      return
    }

    const group = {
      id: groupRef.id,
      firebaseConversationId: groupRef.id,
      name: title,
      initials: title.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
      status: 'group',
      members: '2 members',
      memberIds: initialMemberIds,
      adminIds: [uid],
      admins: ['you'],
      moderatorIds: [],
      moderators: [],
      preview: 'Group created',
      time: 'Now',
      unread: 0,
      pinned: false,
      favorite: false,
      archived: false,
      muted: false,
      messages: [],
    }
    setConversations((items) => [group, ...items.filter((item) => item.id !== group.id)])
    setActiveId(group.id)
    setView('messages')
    setMobileChatOpen(true)
    setShowGroupCreator(false)
    setShowNewChat(false)
    setGroupName('')
    setGroupMemberIds([])

    let addedCount = 2
    for (const person of selected.slice(1)) {
      const memberBatch = writeBatch(db)
      memberBatch.update(groupRef, {
        memberIds: arrayUnion(person.id),
        updatedAt: serverTimestamp(),
      })
      memberBatch.set(doc(db, 'conversations', groupRef.id, 'members', person.id), {
        uid: person.id,
        role: 'member',
        createdAt: serverTimestamp(),
      })
      try {
        await memberBatch.commit()
        addedCount += 1
      } catch (error) {
        showToast('Group created with ' + addedCount + ' members. Could not add ' + person.name + ': ' + (error?.message || 'permission denied.'))
        return
      }
    }
    showToast('Group created and synced with all ' + addedCount + ' members.')
  }

  const toggleGroupModerator = async (memberUid) => {
    const uid = auth?.currentUser?.uid
    const conversationId = getActiveConversationId(uid)
    if (!uid || !db || !activeConversation || !activeConversation.adminIds?.includes(uid) || !memberUid) return
    const isModerator = (activeConversation.moderatorIds || []).includes(memberUid)
    try {
      await updateDoc(doc(db, 'conversations', conversationId), {
        moderatorIds: isModerator ? arrayRemove(memberUid) : arrayUnion(memberUid),
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      showToast(error?.code === 'permission-denied' ? 'Only group admins can change moderator roles.' : error?.message || 'Could not update this role.')
    }
  }

  const addGroupMember = async (memberUid) => {
    const uid = auth?.currentUser?.uid
    const conversationId = getActiveConversationId(uid)
    const person = friendContacts.find((entry) => entry.id === memberUid)
    if (!uid || !db || !activeConversation || activeConversation.status !== 'group' || !activeConversation.adminIds?.includes(uid) || !person) {
      showToast('Only an admin can add an accepted friend to this group.')
      return
    }
    if (person.privacy?.whoCanAddToGroups === 'nobody') {
      showToast(person.name + ' does not accept group invitations.')
      return
    }
    if (activeConversation.memberIds.includes(memberUid)) return
    const batch = writeBatch(db)
    batch.update(doc(db, 'conversations', conversationId), {
      memberIds: arrayUnion(memberUid),
      updatedAt: serverTimestamp(),
    })
    batch.set(doc(db, 'conversations', conversationId, 'members', memberUid), {
      uid: memberUid,
      role: 'member',
      createdAt: serverTimestamp(),
    })
    try {
      await batch.commit()
      showToast(person.name + ' was added to the group.')
    } catch (error) {
      showToast(error?.code === 'permission-denied' ? 'Group membership change denied. Deploy the latest Firestore rules and confirm this person is your accepted friend.' : error?.message || 'Could not add this member.')
    }
  }

  const createPoll = () => {
    const question = pollQuestion.trim()
    const options = [...new Set(pollOptions.split('\n').map((option) => option.trim()).filter(Boolean))]
    if (activeConversation?.status !== 'group') { showToast('Polls are available in group chats'); return }
    if (!question || options.length < 2) { showToast('Add a question and at least two options'); return }
    const message = { id: 'poll-' + Date.now(), from: 'me', type: 'poll', poll: { question, options, votes: {} }, time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), status: 'sent' }
    setConversations((items) => items.map((item) => item.id === activeId ? { ...item, messages: [...item.messages, message], preview: 'Poll: ' + question, time: 'Now', lastActivityAt: Date.now() } : item))
    setPollQuestion(''); setPollOptions(''); setShowPollComposer(false)
  }

  const voteOnPoll = (messageId, option) => {
    setConversations((items) => items.map((item) => item.id === activeId ? {
      ...item, messages: item.messages.map((message) => message.id === messageId ? { ...message, poll: { ...message.poll, votes: { ...message.poll.votes, you: option } } } : message),
    } : item))
  }

  const markAllRead = async () => {
    const uid = auth?.currentUser?.uid
    if (!uid || !db) return
    let marked = 0
    try {
      // Keep each batch scoped to one conversation so Firestore rule lookups
      // for that parent are reused and stay within the access-call limit.
      for (const conversation of conversations) {
        if (!conversation.unread) continue
        const conversationId = conversation.status === 'group'
          ? (conversation.firebaseConversationId || conversation.id)
          : (conversation.firebaseConversationId || directConversationId(uid, conversation.id))
        const snapshot = await getDocs(query(
          collection(db, 'conversations', conversationId, 'messages'),
          orderBy('createdAt', 'desc'),
          limit(100),
        ))
        const batch = writeBatch(db)
        let pendingWrites = 0
        for (const messageDocument of snapshot.docs) {
          const data = messageDocument.data()
          const expiryMillis = timestampToMillis(data.expiresAt)
          if (data.senderId === uid || data.deletedAt || (expiryMillis && expiryMillis <= Date.now()) || (Array.isArray(data.readBy) && data.readBy.includes(uid))) continue
          const patch = { readBy: arrayUnion(uid) }
          if (!data.readAt) {
            patch.readAt = serverTimestamp()
            patch.expiresAt = Timestamp.fromMillis(Date.now() + MESSAGE_RETENTION_MS)
          } else if (!data.expiresAt) {
            patch.expiresAt = Timestamp.fromMillis((timestampToMillis(data.readAt) || Date.now()) + MESSAGE_RETENTION_MS)
          }
          batch.update(messageDocument.ref, patch)
          pendingWrites += 1
          marked += 1
        }
        if (pendingWrites) await batch.commit()
      }
      setConversations((items) => items.map((item) => ({ ...item, unread: 0 })))
      showToast(marked ? 'Marked ' + marked + ' messages as read.' : 'All messages are already read.')
    } catch (error) {
      showToast(error?.code === 'permission-denied' ? 'Firestore denied bulk read receipts. Deploy the latest Firestore rules.' : error?.message || 'Could not mark all messages as read.')
    }
  }

  const toggleDesktopNotifications = async () => {
    if (!notificationsEnabled && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { showToast('Browser notification permission was not granted'); return }
    }
    if (!notificationsEnabled && typeof Notification === 'undefined') { showToast('Browser notifications are not supported'); return }
    setNotificationsEnabled((enabled) => !enabled)
  }

  const toggleFavorite = () => {
    setConversations((items) => items.map((item) => item.id === activeId ? { ...item, favorite: !item.favorite } : item))
    showToast(activeConversation.favorite ? 'Removed from starred' : 'Added to starred')
  }

  const toggleBlockContact = async () => {
    if (!activeConversation || activeConversation.status === 'group') return
    const uid = auth?.currentUser?.uid
    if (!uid || !db) { showToast('Sign in again before changing your block list.'); return }
    const targetUid = activeConversation.id
    const blockRef = doc(db, 'users', uid, 'blocks', targetUid)
    const nextBlocked = !activeConversation.blocked
    try {
      if (nextBlocked) {
        await setDoc(blockRef, {
          uid: targetUid,
          username: activeConversation.username || targetUid,
          createdAt: serverTimestamp(),
        })
      } else {
        await deleteDoc(blockRef)
      }
      setConversations((items) => items.map((item) => item.id === activeId ? { ...item, blocked: nextBlocked } : item))
      showToast(nextBlocked ? 'User blocked on your account.' : 'User unblocked.')
    } catch (error) {
      showToast(error?.code === 'permission-denied' ? 'Firebase denied this block change. Deploy the latest Firestore rules.' : error?.message || 'Could not update the block list.')
    }
  }

  const archiveConversation = () => {
    setConversations((items) => items.map((item) => item.id === activeId ? { ...item, archived: !item.archived } : item))
    setShowChatMenu(false)
    setView('messages')
    showToast(activeConversation.archived ? 'Conversation restored' : 'Conversation archived')
  }

  const leaveGroup = async () => {
    const uid = auth?.currentUser?.uid
    const conversationId = getActiveConversationId(uid)
    if (!uid || !db || !activeConversation || activeConversation.status !== 'group' || !conversationId) return
    const remainingIds = activeConversation.memberIds.filter((memberUid) => memberUid !== uid)
    const wasAdmin = (activeConversation.adminIds || []).includes(uid)
    const promotedUid = wasAdmin ? remainingIds[0] : ''
    const nextAdminIds = wasAdmin
      ? [...(activeConversation.adminIds || []).filter((memberUid) => memberUid !== uid && memberUid !== promotedUid), ...(promotedUid ? [promotedUid] : [])]
      : (activeConversation.adminIds || [])
    const batch = writeBatch(db)
    batch.delete(doc(db, 'conversations', conversationId, 'members', uid))
    batch.update(doc(db, 'conversations', conversationId), {
      memberIds: arrayRemove(uid),
      adminIds: nextAdminIds,
      moderatorIds: arrayRemove(uid),
      updatedAt: serverTimestamp(),
    })
    if (promotedUid) {
      batch.set(doc(db, 'conversations', conversationId, 'members', promotedUid), {
        role: 'admin',
      }, { merge: true })
    }
    try {
      await batch.commit()
      setConversations((items) => items.filter((item) => item.id !== conversationId))
      setActiveId('')
      setShowChatMenu(false)
      setShowDetails(false)
      setMobileChatOpen(false)
      setView('messages')
      showToast('You left ' + activeConversation.name + '.')
    } catch (error) {
      showToast(error?.code === 'permission-denied' ? 'Could not leave this group. Deploy the latest Firestore rules.' : error?.message || 'Could not leave this group.')
    }
  }


  const sendFriendRequest = async (person) => {
    const uid = auth?.currentUser?.uid
    if (!uid || !db || !person?.id) return
    const requestId = uid + '_' + person.id
    setFriendActionBusy(person.id)
    try {
      await setDoc(doc(db, 'friendRequests', requestId), {
        senderId: uid,
        recipientId: person.id,
        status: 'pending',
        createdAt: serverTimestamp(),
      })
      setOutgoingFriendRequests((items) => [...items, { id: requestId, senderId: uid, recipientId: person.id, status: 'pending' }])
      showToast('Friend request sent to @' + person.username)
    } catch (error) {
      showToast(error?.message || 'Could not send friend request.')
    } finally {
      setFriendActionBusy('')
    }
  }

  const respondToFriendRequest = async (request, accept) => {
    const uid = auth?.currentUser?.uid
    if (!uid || !db) return
    setFriendActionBusy(request.id)
    try {
      await runTransaction(db, async (transaction) => {
        const requestRef = doc(db, 'friendRequests', request.id)
        const snapshot = await transaction.get(requestRef)
        if (!snapshot.exists() || snapshot.data().recipientId !== uid || snapshot.data().status !== 'pending') {
          throw new Error('This friend request is no longer available.')
        }
        transaction.update(requestRef, { status: accept ? 'accepted' : 'rejected', respondedAt: serverTimestamp() })
      })
      setIncomingFriendRequests((items) => items.filter((item) => item.id !== request.id))
      if (accept) {
        const senderProfile = await getDoc(doc(db, 'users', request.senderId))
        if (senderProfile.exists()) {
          const data = senderProfile.data()
          const name = normalizeDisplayName(data.displayName || data.username)
          setFriendContacts((items) => [...items.filter((item) => item.id !== request.senderId), { id: request.senderId, name, username: data.username, avatarId: data.avatarId, privacy: data.privacy || {}, initials: name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(), status: 'offline', tone: 2 }])
        }
        showToast('Friend request accepted')
      } else {
        showToast('Friend request declined')
      }
    } catch (error) {
      showToast(error?.message || 'Could not update friend request.')
    } finally {
      setFriendActionBusy('')
    }
  }

  const startConversation = async (person) => {
    const uid = auth?.currentUser?.uid
    if (!uid || !db || !friendContacts.some((friend) => friend.id === person.id)) {
      showToast('You can start a synced conversation after becoming friends.')
      return
    }
    const conversationId = directConversationId(uid, person.id)
    try {
      await runTransaction(db, async (transaction) => {
        const conversationRef = doc(db, 'conversations', conversationId)
        const snapshot = await transaction.get(conversationRef)
        if (!snapshot.exists()) {
          transaction.set(conversationRef, {
            createdBy: uid,
            memberIds: [uid, person.id].sort(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        } else if (!snapshot.data().memberIds?.includes(uid) || !snapshot.data().memberIds?.includes(person.id)) {
          throw new Error('This conversation does not have the expected members.')
        }
      })
      await setDoc(doc(db, 'users', uid, 'inbox', conversationId), { hidden: false, otherUid: person.id, updatedAt: serverTimestamp() }, { merge: true })
      const existing = conversations.find((item) => item.id === person.id)
      if (existing) {
        setConversations((items) => items.map((item) => item.id === person.id ? { ...item, firebaseConversationId: conversationId } : item))
      } else {
        setConversations((items) => [{
          ...person,
          firebaseConversationId: conversationId,
          preview: 'Start a conversation',
          time: 'Now',
          lastActivityAt: Date.now(),
          unread: 0,
          pinned: false,
          favorite: false,
          archived: false,
          messages: [],
        }, ...items])
      }
      setActiveId(person.id)
      setView('messages')
      setMobileChatOpen(true)
      setShowNewChat(false)
      setNewChatSearch('')
    } catch (error) {
      showToast(error?.code === 'permission-denied'
        ? 'Firebase denied conversation setup. Deploy the latest Firestore rules and try again.'
        : error?.message || 'Could not open this conversation.')
    }
  }

  const knownFriendIds = new Set(friendContacts.map((person) => person.id))
  const outgoingRequestIds = new Set(outgoingFriendRequests.map((request) => request.recipientId))
  const incomingRequestIds = new Set(incomingFriendRequests.map((request) => request.senderId))

  const sidebarTitle = view === 'starred' ? 'Starred' : view === 'archive' ? 'Archive' : view === 'contacts' ? 'Contacts' : 'Messages'
  const sidebarDescription = view === 'starred' ? 'Your saved conversations' : view === 'archive' ? 'Out of sight, not gone' : view === 'contacts' ? 'People you can reach' : 'Stay close to your people'

  return (
    <div className={'app-shell' + (mobileChatOpen ? ' mobile-chat-open' : '') + (compactMode ? ' compact-mode' : '')}>
      <aside className="nav-rail">
        <button className="brand-mark" aria-label="Converly home" onClick={() => { setView('messages'); setMobileChatOpen(false) }}>
          <span className="brand-mark-shape"><BrandGlyph size={22} /></span>
        </button>
        <div className="rail-divider" />
        <nav className="rail-nav" aria-label="Main navigation">
          <button className={view === 'messages' ? 'rail-button active' : 'rail-button'} onClick={() => { setView('messages'); setMobileChatOpen(false) }} aria-label="Messages" title="Messages">
            <Icon name="message" />
            <i className="rail-indicator" />
          </button>
          <button className={view === 'contacts' ? 'rail-button active' : 'rail-button'} onClick={() => { setView('contacts'); setMobileChatOpen(false) }} aria-label="Contacts" title="Contacts"><Icon name="users" /></button>
          <button className={view === 'starred' ? 'rail-button active' : 'rail-button'} onClick={() => { setView('starred'); setMobileChatOpen(false) }} aria-label="Starred" title="Starred"><Icon name="star" /></button>
          <button className={view === 'archive' ? 'rail-button active' : 'rail-button'} onClick={() => { setView('archive'); setMobileChatOpen(false) }} aria-label="Archive" title="Archive"><Icon name="archive" /></button>
          {canAccessAdmin && <button className={view === 'admin' ? 'rail-button active' : 'rail-button'} onClick={() => { setView('admin'); setMobileChatOpen(false) }} aria-label="Admin" title="Admin"><Icon name="shield" /></button>}
        </nav>
        <div className="rail-bottom">
          <button className={view === 'settings' ? 'rail-button active' : 'rail-button'} onClick={() => { setView('settings'); setMobileChatOpen(false) }} aria-label="Settings" title="Settings"><Icon name="settings" /></button>
          <div className="rail-divider" />
          <button className="rail-profile" onClick={() => setProfileMenuOpen((open) => !open)} aria-label="Open profile menu">
            <Avatar person={{ avatarId: profileAvatar, initials: profileName.split(' ').map((part) => part[0]).join('').slice(0, 2) || 'Y', status: 'online' }} size="rail" showStatus />
          </button>
          {profileMenuOpen && (
            <div className="profile-popover">
              <strong>{profileName}</strong>
              <span>Available</span>
              <span className="profile-avatar-lock"><Icon name="shield" size={13} /> Preset profile avatar</span>
              <button onClick={() => { setView('settings'); setProfileMenuOpen(false) }}>Account settings</button><button onClick={handleLogout} disabled={loggingOut}><Icon name="logout" size={14} /> {loggingOut ? 'Signing out…' : 'Sign out'}</button>
            </div>
          )}
        </div>
      </aside>

      <aside className={'inbox-panel' + (mobileChatOpen ? ' hidden-mobile' : '')}>
        <div className="inbox-topbar">
          <div className="wordmark">
            <span className="wordmark-icon"><BrandGlyph size={19} /></span>
            <span>converly<span className="wordmark-period">.</span></span>
          </div>
          <button className="icon-button new-chat-button" onClick={() => setShowNewChat(true)} aria-label="Start a new chat" title="New chat"><Icon name="plus" size={19} /></button>
        </div>

        <div className="inbox-heading">
          <div>
            <div className="eyebrow">YOUR SPACE</div>
            <h1>{sidebarTitle}<span className="title-count">{visibleConversations.length}</span></h1>
            <p>{sidebarDescription}</p>
          </div>
          <button className="icon-button subtle-button" onClick={() => setListFilter((filter) => filter === 'all' ? 'unread' : 'all')} aria-label="Toggle unread filter" title="Filter unread"><Icon name="filter" size={17} /></button>
        </div>

        <label className="search-box">
          <Icon name="search" size={17} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search messages" aria-label="Search conversations" />
          <kbd>/</kbd>
        </label>

        <div className="filter-row inbox-filter-row">
          <button className={listFilter === 'all' ? 'filter-chip selected' : 'filter-chip'} onClick={() => setListFilter('all')}>All <span>{conversations.filter((item) => !item.archived).length}</span></button>
          <button className={listFilter === 'unread' ? 'filter-chip selected' : 'filter-chip'} onClick={() => setListFilter('unread')}>Unread <span>{conversations.filter((item) => item.unread > 0 && !item.archived).length}</span></button>
          <button
            className={showFriendRequests ? 'filter-chip request-filter-chip selected' : 'filter-chip request-filter-chip'}
            onClick={() => { setShowFriendRequests((open) => !open); setListFilter('all') }}
            aria-expanded={showFriendRequests}
            aria-label="Friend requests"
          >
            <Icon name="user-plus" size={13} /> Requests <span className={incomingFriendRequests.length ? 'request-count has-requests' : 'request-count'}>{incomingFriendRequests.length}</span>
          </button>
        </div>
        {showFriendRequests && (
          <div className="friend-section sidebar-friend-section">
            <div className="friend-section-heading">FRIEND REQUESTS <span>{incomingFriendRequests.length}</span></div>
            {discoveryLoading && <div className="directory-empty">Loading friend requests…</div>}
            {friendRequestError && <div className="directory-empty friend-error">{friendRequestError}</div>}
            {!discoveryLoading && !friendRequestError && incomingFriendRequests.length === 0 && <div className="directory-empty">No pending friend requests. New requests will appear here automatically.</div>}
            {incomingFriendRequests.map((request) => (
              <div className="friend-request-row" key={request.id}>
                <Avatar person={{ name: request.senderName || 'New user', avatarId: request.senderAvatarId }} size="md" />
                <span className="friend-request-copy"><strong>{request.senderName || 'New friend request'}</strong><small>@{request.senderUsername || request.senderId.slice(0, 8) + '…'}</small></span>
                <button className="friend-action-button" disabled={friendActionBusy === request.id} onClick={() => respondToFriendRequest(request, true)}>Accept</button>
                <button className="friend-decline-button" disabled={friendActionBusy === request.id} onClick={() => respondToFriendRequest(request, false)}>Reject</button>
              </div>
            ))}
          </div>
        )}

        {view !== 'archive' && view !== 'starred' && (
          <div className="online-section">
            <div className="section-label"><span>YOUR FRIENDS</span><span className="online-count">{friendContacts.length}</span></div>
            <div className="online-people">
              {friendContacts.slice(0, 4).map((person) => (
                <button className="online-person" key={person.id} onClick={() => startConversation(person)} title={person.name}>
                  <Avatar person={person} size="online" showStatus />
                  <span>{String(person.name || 'Friend').split(' ')[0]}</span>
                </button>
              ))}
              {friendContacts.length > 4 && <button className="online-more" onClick={() => { setView('contacts'); setListFilter('all') }}>+{friendContacts.length - 4}</button>}
              {friendContacts.length === 0 && <span className="online-empty">Your accepted friends will appear here.</span>}
            </div>
          </div>
        )}

        <div className="conversation-list-wrap">
          <div className="section-label list-section-label">
            <span>{view === 'starred' ? 'SAVED CHATS' : view === 'archive' ? 'ARCHIVED' : view === 'contacts' ? 'ALL PEOPLE' : 'RECENT'}</span>
            <span className="list-actions">{view === 'messages' && <button onClick={markAllRead}>Mark all read</button>}<button onClick={() => setShowNewChat(true)}>New chat <Icon name="plus" size={13} /></button></span>
          </div>
          <div className="conversation-list">
            {visibleConversations.length === 0 ? (
              <div className="empty-list">
                <span className="empty-icon"><Icon name="search" size={20} /></span>
                <strong>Nothing here yet</strong>
                <span>Try another search or start a new chat.</span>
                <button onClick={() => { setSearch(''); setListFilter('all'); setShowNewChat(true) }}>Start a conversation</button>
              </div>
            ) : visibleConversations.map((conversation) => (
              <ConversationListItem key={conversation.id} conversation={conversation} active={activeId === conversation.id} onSelect={() => friendContacts.some((person) => person.id === conversation.id) ? startConversation(conversation) : selectConversation(conversation.id)} />
            ))}
          </div>
        </div>

        <nav className={'mobile-nav-bar' + (canAccessAdmin ? ' admin-mobile-nav' : '')} aria-label="Mobile navigation">
          <button className={view === 'messages' ? 'selected' : ''} onClick={() => setView('messages')}><Icon name="message" size={17} /><span>Chats</span></button>
          <button className={view === 'contacts' ? 'selected' : ''} onClick={() => setView('contacts')}><Icon name="users" size={17} /><span>Contacts</span></button>
          <button className={view === 'starred' ? 'selected' : ''} onClick={() => setView('starred')}><Icon name="star" size={17} /><span>Starred</span></button>
          <button className={view === 'archive' ? 'selected' : ''} onClick={() => setView('archive')}><Icon name="archive" size={17} /><span>Archive</span></button>
          <button className={view === 'settings' ? 'selected' : ''} onClick={() => { setView('settings'); setMobileChatOpen(true) }}><Icon name="settings" size={17} /><span>Settings</span></button>
          {canAccessAdmin && <button className={view === 'admin' ? 'selected' : ''} onClick={() => { setView('admin'); setMobileChatOpen(true) }}><Icon name="shield" size={17} /><span>Admin</span></button>}
        </nav>

        <div className="inbox-footer">
          <button className="footer-profile" onClick={() => { setView("settings"); setMobileChatOpen(false) }} aria-label="Open profile settings">
            <Avatar person={{ avatarId: profileAvatar, initials: profileName.split(' ').map((part) => part[0]).join('').slice(0, 2) || 'Y' }} size="footer" />
            <span><strong>{profileName}</strong><small>Account profile</small></span>
          </button>
          <button className="icon-button subtle-button" onClick={() => setTheme((current) => current === 'light' ? 'dark' : 'light')} aria-label="Toggle color theme" title="Toggle theme"><Icon name={theme === 'light' ? 'moon' : 'sun'} size={17} /></button>
        </div>
      </aside>

      <main className={'main-panel' + (mobileChatOpen ? ' mobile-visible' : '')}>
        {view === 'admin' && canAccessAdmin ? (
          <AdminDashboard />
        ) : view === 'settings' ? (
          <section className="settings-view">
            <button className="settings-mobile-back" onClick={() => setMobileChatOpen(false)}><Icon name="arrowLeft" size={16} /> Back to chats</button>
            <div className="settings-header">
              <div className="eyebrow">PREFERENCES</div>
              <h2>Settings</h2>
              <p>Make Converly feel like yours.</p>
            </div>
            <div className="settings-content">
              <div className="settings-section settings-account-actions">
                <div className="settings-section-title"><strong>Profile</strong><span>Personalize how people see you on Converly</span></div>
                <div className="setting-row profile-avatar-setting">
                  <Avatar person={{ avatarId: profileAvatar }} size="lg" />
                  <span className="setting-copy"><strong>Profile avatar</strong><small>Choose a different illustration anytime</small></span>
                  <button className="settings-logout-button" type="button" onClick={openAvatarPicker}>Change avatar</button>
                </div>
                <div className="settings-section-title"><strong>Account</strong><span>Manage your Converly session</span></div>
                <div className="setting-row">
                  <span className="setting-icon"><Icon name="logout" /></span>
                  <span className="setting-copy"><strong>Log out</strong><small>Sign out of this account on this device</small></span>
                  <button className="settings-logout-button" type="button" onClick={handleLogout} disabled={loggingOut}>
                    <Icon name="logout" size={15} /> {loggingOut ? 'Logging out…' : 'Log out'}
                  </button>
                </div>
              </div>
              <AccountPrivacyPanel profile={profile} />
              <div className="settings-section">
                <div className="settings-section-title"><strong>Appearance</strong><span>How Converly looks on your device</span></div>
                <div className="setting-row">
                  <span className="setting-icon"><Icon name="sun" /></span>
                  <span className="setting-copy"><strong>Color theme</strong><small>Choose a look that feels right</small></span>
                  <div className="theme-switch">
                    <button className={theme === 'light' ? 'selected' : ''} onClick={() => setTheme('light')}><Icon name="sun" size={15} /> Light</button>
                    <button className={theme === 'dark' ? 'selected' : ''} onClick={() => setTheme('dark')}><Icon name="moon" size={15} /> Dark</button>
                  </div>
                </div>
                <div className="setting-row">
                  <span className="setting-icon"><Icon name="message" /></span>
                  <span className="setting-copy"><strong>Compact messages</strong><small>Reduce spacing between conversations</small></span>
                  <button className={'toggle-switch' + (compactMode ? ' on' : '')} onClick={() => setCompactMode((value) => !value)} aria-pressed={compactMode}><i /></button>
                </div>
              </div>
              <div className="settings-section">
                <div className="settings-section-title"><strong>Notifications</strong><span>Stay in the loop without the noise</span></div>
                <div className="setting-row">
                  <span className="setting-icon"><Icon name="bell" /></span>
                  <span className="setting-copy"><strong>Desktop notifications</strong><small>Use this browser's notification permission on this device</small></span>
                  <button className={'toggle-switch' + (notificationsEnabled ? ' on' : '')} onClick={toggleDesktopNotifications} aria-pressed={notificationsEnabled}><i /></button>
                </div>
                <div className="setting-row">
                  <span className="setting-icon"><Icon name="mic" /></span>
                  <span className="setting-copy"><strong>Notification sounds</strong><small>Play a subtle sound for new messages</small></span>
                  <button className={'toggle-switch' + (soundEnabled ? ' on' : '')} onClick={() => setSoundEnabled((value) => !value)} aria-pressed={soundEnabled}><i /></button>
                </div>
              </div>
              <div className="settings-section settings-security">
                <div className="settings-section-title"><strong>Privacy & security</strong><span>Your conversations should feel personal and protected</span></div>
                <div className="setting-row">
                  <span className="setting-icon"><Icon name="shield" /></span>
                  <span className="setting-copy"><strong>Security center</strong><small>Authentication and privacy controls will be available here</small></span>
                  <span className="coming-soon">COMING SOON</span>
                </div>
              </div>
              <div className="demo-note"><Icon name="info" size={16} /><span>Profile and privacy settings sync to your account. Appearance, sound and compact-view preferences stay on this device.</span></div>
            </div>
          </section>
        ) : activeConversation ? (
          <section className="chat-view">
            <header className="chat-header">
              <button className="mobile-back icon-button" onClick={() => setMobileChatOpen(false)} aria-label="Back to conversations"><Icon name="arrowLeft" /></button>
              <ConversationIdentity
                className="chat-person"
                person={activeConversation}
                size="header"
                showStatus
                subtitle={typingUsers.length > 0 ? 'Typing…' : activeConversation.status === 'online' ? 'Active now' : activeConversation.status === 'group' ? (activeConversation.members || 'Group conversation') : 'Last seen recently'}
                subtitleClass={typingUsers.length > 0 ? 'chat-status-typing' : activeConversation.status === 'online' ? 'chat-status-online' : activeConversation.status === 'group' ? 'chat-status-group' : 'chat-status-offline'}
              />
              <div className="chat-header-actions">
                <button className="icon-button" onClick={() => setMessageSearchOpen((open) => !open)} aria-label="Search messages" title="Search messages"><Icon name="search" /></button>
                <button className="icon-button" onClick={() => setShowDetails((open) => !open)} aria-label="Conversation details" title="Conversation details"><Icon name="info" /></button>
                <div className="menu-anchor">
                  <button className="icon-button" onClick={() => setShowChatMenu((open) => !open)} aria-label="More conversation actions" title="More"><Icon name="more" /></button>
                  {showChatMenu && (
                    <div className="chat-menu">
                      <button onClick={toggleFavorite}><Icon name="star" size={16} />{activeConversation.favorite ? 'Remove from starred' : 'Add to starred'}</button>
                      <button onClick={() => { setConversations((items) => items.map((item) => item.id === activeId ? { ...item, unread: 1 } : item)); setShowChatMenu(false); showToast('Marked as unread') }}><Icon name="message" size={16} />Mark as unread</button>
                      <button onClick={() => { setConversations((items) => items.map((item) => item.id === activeId ? { ...item, muted: !item.muted } : item)); setShowChatMenu(false); showToast(activeConversation.muted ? 'Conversation unmuted' : 'Conversation muted') }}><Icon name="bell" size={16} />{activeConversation.muted ? 'Unmute conversation' : 'Mute conversation'}</button>
                      <button onClick={archiveConversation}><Icon name="archive" size={16} />{activeConversation.archived ? 'Restore conversation' : 'Archive conversation'}</button>
                      <button className="danger-menu-item" onClick={() => { setShowChatMenu(false); deleteConversation(activeConversation) }}><Icon name="trash" size={16} />Delete chat</button>
                      {activeConversation.status === 'group' && <button className="danger-menu-item" onClick={leaveGroup}><Icon name="logout" size={16} />Leave group</button>}
                    </div>
                  )}
                </div>
              </div>
            </header>

            <div className="conversation-context">
              <span className="context-line" />
              <span>Today</span>
              <span className="context-line" />
            </div>

            {messageSearchOpen && <div className="message-search-bar"><Icon name="search" size={16} /><input autoFocus value={messageSearch} onChange={(event) => setMessageSearch(event.target.value)} placeholder="Search in this conversation" /><button type="button" onClick={() => { setMessageSearch(''); setMessageSearchOpen(false) }} aria-label="Close message search"><Icon name="close" size={15} /></button></div>}
            <div className="messages-scroll">
              <div className="message-history">
                {activeConversation.messages.length === 0 ? (
                  <div className="chat-empty-state">
                    <div className="empty-avatar"><Avatar person={activeConversation} size="xl" /></div>
                    <strong>Say hello to {String(activeConversation.name || 'your friend').split(' ')[0]}</strong>
                    <span>This is the beginning of your conversation.</span>
                  </div>
                ) : activeConversation.messages.filter((message) => !messageSearch.trim() || (message.text || message.fileName || '').toLowerCase().includes(messageSearch.trim().toLowerCase())).length === 0 ? (
                  <div className="chat-empty-state"><strong>No matching messages</strong><span>Try another search term.</span></div>
                ) : activeConversation.messages.filter((message) => !messageSearch.trim() || (message.text || message.fileName || '').toLowerCase().includes(messageSearch.trim().toLowerCase())).map((message) => (
                  <div key={message.id} className={'message-row ' + (message.from === 'me' ? 'message-outgoing' : 'message-incoming')}>
                    {message.from !== 'me' && <Avatar person={activeConversation.status === 'group' && message.sender ? (directory.find((person) => person.name === message.sender) || { name: message.sender, initials: message.sender.split(' ').map((part) => part[0]).join('').slice(0, 2), tone: 2 }) : activeConversation} size="message" showStatus={activeConversation.status !== 'group'} />}
                    <div className="message-content">
                      {message.sender && <span className="message-sender">{message.sender}</span>}
                      {message.replyToText && <div className="reply-context"><strong>Replying to</strong><span>{message.replyToText}</span></div>}
                      {message.deleted ? (
                        <div className="message-bubble message-deleted">This message was deleted</div>
                      ) : message.type === 'poll' ? (
                        <div className="poll-card"><strong>{message.poll.question}</strong>{message.poll.options.map((option) => { const votes = Object.values(message.poll.votes || {}).filter((vote) => vote === option).length; return <button type="button" key={option} onClick={() => voteOnPoll(message.id, option)} className={message.poll.votes?.you === option ? 'voted' : ''}><span>{option}</span><small>{votes} vote{votes === 1 ? '' : 's'}</small></button> })}</div>
                      ) : message.type === 'image' ? (
                        message.from === 'me' ? (
                          <button type="button" className="image-message image-view-once image-locked" disabled={!message.attachmentPath} onClick={() => openSharedImage(message)}>
                            <span className="image-lock-art"><Icon name="image" size={22} /><i><Icon name="shield" size={11} /></i></span>
                            <strong>Your sent image</strong>
                            <small>{message.attachmentPath ? 'Preview your sent image' : 'Image file is unavailable'}</small>
                          </button>
                        ) : message.viewed ? (
                          <div className="image-message image-view-once image-consumed"><Icon name="check" size={16} /><span>Opened · image unavailable</span></div>
                        ) : (
                          <button type="button" className="image-message image-view-once image-locked" disabled={!message.attachmentPath} onClick={() => openSharedImage(message)}>
                            <span className="image-lock-art"><Icon name="image" size={22} /><i><Icon name="shield" size={11} /></i></span>
                            <strong>Image waiting for you</strong>
                            <small>{message.attachmentPath ? 'Open once · it cannot be reopened after closing' : 'Image file is unavailable'}</small>
                          </button>
                        )
                      ) : (message.type === 'audio' || message.type === 'voice' || message.type === 'voice-message' || message.type === 'recording' || Boolean(message.mediaUrl) || Boolean(message.audioUrl) || Boolean(message.mimeType?.startsWith('audio/'))) ? (
                        message.mediaUrl ? <VoiceMessagePlayer className="voice-message-player" src={message.mediaUrl} /> : <div className="media-unavailable">Voice message preview expired after refresh</div>
                      ) : message.type === 'file' ? (
                        <div className="file-message">
                          <span className="file-icon"><Icon name="file" size={21} /></span>
                          <span className="file-copy"><strong>{message.fileName}</strong><small>{message.fileMeta}</small></span>
                          
                        </div>
                      ) : (
                        <div className="message-bubble">{message.text}</div>
                      )}
                      {message.reactions?.length > 0 && <div className="message-reactions">{message.reactions.map((reaction) => <span key={reaction}>{reaction}</span>)}</div>}
                      <span className="message-meta">{message.editedAt ? 'Edited · ' : ''}{message.time}{message.from === 'me' && <Icon name={message.status === 'read' ? 'checkDouble' : 'check'} size={13} className={message.status === 'read' ? 'read-check is-read' : 'read-check'} />}{message.pinned && <Icon name="pin" size={12} />}</span>
                      {!(message.type === 'audio' || message.type === 'voice' || message.type === 'voice-message' || message.type === 'recording' || Boolean(message.mediaUrl) || Boolean(message.audioUrl) || Boolean(message.mimeType?.startsWith('audio/'))) && <>
                        <button type="button" className="message-more-trigger" onClick={() => setSelectedMessageId((current) => current === message.id ? null : message.id)} aria-label="Message actions"><Icon name="more" size={15} /></button>
                        {selectedMessageId === message.id && <div className="message-action-row">
                        <button type="button" onClick={() => beginReply(message)}>Reply</button>
                        <button type="button" onClick={() => setReactionPickerMessageId((current) => current === message.id ? null : message.id)}>😊 React</button>
                        {reactionPickerMessageId === message.id && (
                          <div className="message-reaction-picker" aria-label="Choose a reaction">
                            {reactionOptions.map(({ emoji, label }) => (
                              <button key={emoji} type="button" title={label} aria-label={`React with ${label}`} onClick={() => toggleMessageReaction(message.id, emoji)}>{emoji}</button>
                            ))}
                          </div>
                        )}
                        {message.from === 'me' && message.type === 'text' && <button type="button" onClick={() => beginEdit(message)}>Edit</button>}
                        <button type="button" onClick={() => setConversations((items) => items.map((item) => item.id === activeId ? { ...item, messages: item.messages.map((entry) => entry.id === message.id ? { ...entry, pinned: !entry.pinned } : entry) } : item))}>{message.pinned ? 'Unpin' : 'Pin'}</button>
                        <button type="button" onClick={() => setForwardMessageId((current) => current === message.id ? null : message.id)}>Forward</button>
                        {message.from === 'me' && <button type="button" onClick={() => deleteMessage(message.id)}>Delete</button>}
                      </div>}
                      </>}
                      {!(message.type === 'audio' || message.type === 'voice' || message.type === 'voice-message' || message.type === 'recording' || Boolean(message.mediaUrl) || Boolean(message.audioUrl) || Boolean(message.mimeType?.startsWith('audio/'))) && forwardMessageId === message.id && <div className="forward-inline"><select defaultValue="" onChange={(event) => forwardMessageTo(message, event.target.value)}><option value="" disabled>Forward to…</option>{conversations.filter((item) => item.id !== activeId && !item.archived).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>}
                    </div>
                  </div>
                ))}
                {typingUsers.length > 0 && (
                  <div className="message-row message-incoming typing-row" aria-label={typingUsers.length === 1 ? 'A member is typing' : typingUsers.length + ' members are typing'}>
                    <Avatar person={directory.find((person) => person.id === typingUsers[0].uid) || activeConversation} size="message" />
                    <div className="typing-indicator-bubble" role="status" aria-live="polite" aria-label="Typing">
                      <span />
                      <span />
                      <span />
                    </div>
                    <span className="typing-label">{typingUsers.length === 1 ? 'typing' : typingUsers.length + ' typing'}</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <form className="composer-wrap" onSubmit={handleSend}>
              {(replyTarget || editingMessageId) && <div className="composer-context"><span>{editingMessageId ? 'Editing message' : 'Replying to ' + (replyTarget?.sender || activeConversation.name)}</span><strong>{editingMessageId ? 'Update your message' : (replyTarget?.text || 'Message')}</strong><button type="button" onClick={() => { setReplyTarget(null); setEditingMessageId(null); setMessageText('') }} aria-label="Cancel reply or edit"><Icon name="close" size={14} /></button></div>}
              {showPollComposer && <div className="poll-composer"><input value={pollQuestion} onChange={(event) => setPollQuestion(event.target.value)} placeholder="Ask a question" /><textarea value={pollOptions} onChange={(event) => setPollOptions(event.target.value)} placeholder={'Option one\nOption two'} rows={3} /><div><button type="button" onClick={() => setShowPollComposer(false)}>Cancel</button><button type="button" onClick={createPoll}>Create poll</button></div></div>}
              <div className="composer-options">{activeConversation.status === 'group' && <button type="button" className="view-once-toggle" onClick={() => setShowPollComposer((show) => !show)}>Create poll</button>}<span className="retention-policy-note"><Icon name="shield" size={12} /> Messages disappear 24 hours after they are seen</span></div>
              <div className="composer">
                {recordingPreview ? (
                  <div className="composer-voice-preview" aria-label="Voice message preview">
                    <VoiceMessagePlayer className="voice-preview-player" src={recordingPreview.url} />
                    <button type="button" className="voice-discard-button" onClick={discardVoicePreview} aria-label="Discard voice recording" title="Discard recording"><Icon name="trash" size={16} /></button>
                    <button type="button" className="send-button voice-preview-send" onClick={sendVoicePreview} aria-label="Send voice message" title="Send voice message"><Icon name="send" size={17} /></button>
                  </div>
                ) : recording ? (
                  <div className="composer-recording-input" role="status" aria-live="polite" aria-label="Voice recording in progress">
                    <span className="composer-recording-badge"><i /> REC</span>
                    <span className="voice-waveform" aria-hidden="true">
                      {waveformLevels.map((level, index) => <i key={index} style={{ height: level + 'px' }} />)}
                    </span>
                    <strong>{Math.floor(recordingElapsed / 60)}:{String(recordingElapsed % 60).padStart(2, '0')}</strong>
                    <small>Release to finish</small>
                  </div>
                ) : (
                  <>
                    <textarea ref={messageInputRef} rows="1" value={messageText} onChange={(event) => setMessageText(event.target.value)} onFocus={() => setComposerFocused(true)} onBlur={() => setComposerFocused(false)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); handleSend(event) } }} placeholder="Write a message..." aria-label="Write a message" />
                    <span className="composer-hint">Enter to send · Shift + Enter for new line</span>
                  </>
                )}
                {!recordingPreview && <span className="emoji-picker-control">
                  <span className="emoji-picker-tooltip">Choose an emoji</span>
                  <button type="button" className={'composer-action emoji-action' + (emojiPickerOpen ? ' active' : '')} onClick={(event) => { event.preventDefault(); event.stopPropagation(); setEmojiPickerOpen((open) => !open) }} aria-label={emojiPickerOpen ? 'Close emoji picker' : 'Open emoji picker'} aria-expanded={emojiPickerOpen} aria-controls="converly-composer-emoji-picker" title="Choose an emoji"><Icon name="smile" size={19} /></button>
                  {emojiPickerOpen && <div id="converly-composer-emoji-picker" className="composer-emoji-picker" role="dialog" aria-label="Choose an emoji">
                    <div className="composer-emoji-picker-heading"><strong>Choose an emoji</strong><button type="button" onClick={() => setEmojiPickerOpen(false)} aria-label="Close emoji picker"><Icon name="close" size={14} /></button></div>
                    <div className="composer-emoji-grid">
                      {composerEmojiOptions.map((emoji, index) => <button type="button" key={emoji + index} onClick={() => insertComposerEmoji(emoji)} aria-label={'Insert ' + emoji}>{emoji}</button>)}
                    </div>
                  </div>}
                </span>}
                {!recordingPreview && <span className="voice-record-control">
                  <span className="voice-record-tooltip">{recording ? 'Release to finish' : recordingPreview ? 'Send or discard your recording' : 'Hold to record'}</span>
                  <button
                    type="button"
                    className={'composer-action voice-record-button' + (recording ? ' recording' : '')}
                    disabled={Boolean(recordingPreview)}
                    onPointerDown={(event) => {
                      if (event.pointerType === 'mouse' && event.button !== 0) return
                      event.preventDefault()
                      event.currentTarget.setPointerCapture?.(event.pointerId)
                      startVoiceRecording()
                    }}
                    onPointerUp={stopVoiceRecording}
                    onPointerCancel={cancelVoiceRecording}
                    onKeyDown={(event) => {
                      if (event.key === ' ' || event.key === 'Enter') {
                        event.preventDefault()
                        startVoiceRecording()
                      }
                    }}
                    onKeyUp={(event) => {
                      if (event.key === ' ' || event.key === 'Enter') {
                        event.preventDefault()
                        stopVoiceRecording()
                      }
                    }}
                    onContextMenu={(event) => event.preventDefault()}
                    aria-label={recording ? 'Recording. Release to finish' : 'Hold to record a voice message'}
                  ><Icon name="mic" size={19} /></button>
                </span>}
                {!recordingPreview && <button type="submit" className="send-button" disabled={!messageText.trim()} aria-label="Send message"><Icon name="send" size={17} /></button>}
              </div>
              <div className="composer-footnote"><span>{recording ? 'Recording voice message… release to finish' : recordingPreview ? 'Preview your recording, then send or discard it' : 'Messages are sent when you press send'}</span><span><Icon name="shield" size={12} /> Text messages sync across devices</span></div>
            </form>
          </section>
        ) : (
          <div className="main-empty"><Icon name="message" size={28} /><h2>Your conversations, all in one place.</h2><p>Choose a person to start chatting.</p><button className="primary-button" onClick={() => setShowNewChat(true)}><Icon name="plus" size={16} /> New conversation</button></div>
        )}
      {showDetails && activeConversation && (
        <aside className="details-panel" aria-label="User information panel">
          <div className="details-header"><div><span className="eyebrow">PROFILE</span><strong>Contact information</strong></div><button className="icon-button" onClick={() => setShowDetails(false)} aria-label="Close details"><Icon name="close" /></button></div>
          <div className="details-person">
            <ConversationIdentity
              className="details-person-identity"
              person={activeConversation}
              size="profile"
              showStatus
              subtitle={activeConversation.status === 'online' ? 'Active now' : activeConversation.status === 'group' ? (activeConversation.members || 'Group conversation') : 'Offline'}
              subtitleClass="details-status"
            />
            <div className="details-actions">
              <button onClick={toggleFavorite}><Icon name="star" size={17} />{activeConversation.favorite ? 'Starred' : 'Star'}</button>
            </div>
          </div>
          <div className="details-block details-user-info">
            <span className="section-label">USER INFORMATION</span>
            <div><small>Display name</small><strong>{activeConversation.name}</strong></div>
            <div><small>Username / profile ID</small><strong>@{activeConversation.username || activeConversation.id}</strong></div>
            <div><small>Account type</small><strong>{activeConversation.status === 'group' ? 'Group' : 'Personal account'}</strong></div>
            <div><small>Presence</small><strong>{activeConversation.status === 'online' ? 'Online now' : activeConversation.status === 'group' ? (activeConversation.members || 'Group') : 'Last seen recently'}</strong></div>
          </div>
          {activeConversation.status !== 'group' && <div className="details-block details-block-action">
            <button className={activeConversation.blocked ? 'details-block-button is-blocked' : 'details-block-button'} onClick={toggleBlockContact}>
              <Icon name="shield" size={16} />{activeConversation.blocked ? 'Unblock user' : 'Block user'}
            </button>
            <small>{activeConversation.blocked ? 'This user is blocked on this device. Unblock to send messages.' : 'Blocking is stored locally in this prototype. Server-side enforcement requires Firebase.'}</small>
          </div>}
          {activeConversation.status === 'group' && <div className="details-block group-management-block"><span className="section-label">GROUP MEMBERS · {(activeConversation.memberIds || []).length}</span>
            {(activeConversation.memberIds || []).filter((id) => id !== 'you').map((memberId) => { const member = directory.find((person) => person.id === memberId); if (!member) return null; return <div className="group-member-row" key={memberId}><Avatar person={member} size="sm" /><span>{member.name}<small>{(activeConversation.admins || []).includes(memberId) ? 'Admin' : (activeConversation.moderators || []).includes(memberId) ? 'Moderator' : 'Member'}</small></span>{(activeConversation.admins || []).includes('you') && <button onClick={() => toggleGroupModerator(memberId)}>{(activeConversation.moderators || []).includes(memberId) ? 'Remove mod' : 'Make mod'}</button>}</div> })}
            {(activeConversation.admins || []).includes('you') && <select className="group-add-member" defaultValue="" onChange={(event) => { const memberUid = event.target.value; event.target.value = ''; if (memberUid) addGroupMember(memberUid) }}><option value="" disabled>Add a friend…</option>{friendContacts.filter((person) => !(activeConversation.memberIds || []).includes(person.id)).map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select>}
          </div>}
          <div className="details-foot"><Icon name="shield" size={15} /> Your conversations stay yours.</div>
        </aside>
      )}
      </main>

      {viewOnceImage && (
        <div className="view-once-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeViewOnceImage() }}>
          <section className="view-once-viewer" role="dialog" aria-modal="true" aria-label="View-once image">
            <div className="view-once-viewer-header"><span><Icon name="shield" size={14} /> View-once image</span><button type="button" onClick={closeViewOnceImage} aria-label="Close image"><Icon name="close" size={19} /></button></div>
            <img src={viewOnceImage.src} alt="Opened view-once image" />
            <p>This image can only be opened once in Converly. Close it to finish viewing.</p>
          </section>
        </div>
      )}



      {showAvatarPicker && (
        <div className="modal-backdrop avatar-picker-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowAvatarPicker(false) }}>
          <section className="avatar-picker-modal" role="dialog" aria-modal="true" aria-labelledby="avatar-picker-title">
            <div className="modal-heading">
              <div>
                <div className="eyebrow">YOUR PROFILE</div>
                <h2 id="avatar-picker-title">Choose your avatar</h2>
                <p>Select one of 10 built-in illustrations. Profile photo uploads are not available.</p>
              </div>
              <button className="icon-button" onClick={() => setShowAvatarPicker(false)} aria-label="Close avatar picker"><Icon name="close" /></button>
            </div>
            <div className="avatar-gender-tabs" role="group" aria-label="Avatar style">
              <button className={avatarPickerGender === 'male' ? 'selected' : ''} onClick={() => { setAvatarPickerGender('male'); if (!draftAvatar.startsWith('male')) setDraftAvatar('male-01') }}>Male avatars <span>5</span></button>
              <button className={avatarPickerGender === 'female' ? 'selected' : ''} onClick={() => { setAvatarPickerGender('female'); if (!draftAvatar.startsWith('female')) setDraftAvatar('female-01') }}>Female avatars <span>5</span></button>
            </div>
            <div className="avatar-choice-grid">
              {avatarOptions.filter((avatar) => avatar.gender === avatarPickerGender).map((avatar) => (
                <button key={avatar.id} className={'avatar-choice' + (draftAvatar === avatar.id ? ' selected' : '')} onClick={() => setDraftAvatar(avatar.id)} aria-pressed={draftAvatar === avatar.id}>
                  <Avatar person={{ avatarId: avatar.id }} size="picker" />
                  <span>{avatar.label}</span>
                  {draftAvatar === avatar.id && <i><Icon name="check" size={12} /></i>}
                </button>
              ))}
            </div>
            <div className="avatar-picker-note"><Icon name="shield" size={15} /> Choose from the 10 preset avatars. You can change your selection anytime.</div>
            <div className="avatar-picker-actions">
              <button className="secondary-button" onClick={() => setShowAvatarPicker(false)}>Cancel</button>
              <button className="primary-button" onClick={saveAvatarSelection} disabled={savingAvatar}>{savingAvatar ? 'Saving…' : <><Icon name="check" size={15} /> Use this avatar</>}</button>
            </div>
          </section>
        </div>
      )}

      {showGroupCreator && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowGroupCreator(false) }}>
          <section className="new-chat-modal group-create-modal" role="dialog" aria-modal="true" aria-labelledby="group-create-title">
            <div className="modal-heading"><div><div className="eyebrow">GROUP CHAT</div><h2 id="group-create-title">Create a group</h2><p>Choose a name and at least one person.</p></div><button className="icon-button" onClick={() => setShowGroupCreator(false)} aria-label="Close group creator"><Icon name="close" /></button></div>
            <label className="group-name-field">Group name<input value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="e.g. Weekend plans" maxLength={48} /></label>
            <div className="group-member-picker"><strong>Add people</strong>{directory.filter((person) => person.status !== 'group').map((person) => <label key={person.id}><input type="checkbox" checked={groupMemberIds.includes(person.id)} onChange={(event) => setGroupMemberIds((ids) => event.target.checked ? [...ids, person.id] : ids.filter((id) => id !== person.id))} /><Avatar person={person} size="sm" /><span>{person.name}</span></label>)}</div>
            <div className="avatar-picker-actions"><button className="secondary-button" onClick={() => setShowGroupCreator(false)}>Cancel</button><button className="primary-button" onClick={createGroup}>Create group</button></div>
            <div className="modal-footnote">Groups sync with Firebase. You can invite accepted friends and manage members from group details.</div>
          </section>
        </div>
      )}

      {showNewChat && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowNewChat(false) }}>
          <section className="new-chat-modal" role="dialog" aria-modal="true" aria-labelledby="new-chat-title">
            <div className="modal-heading">
              <div><div className="eyebrow">MAKE A CONNECTION</div><h2 id="new-chat-title">New conversation</h2><p>Who would you like to talk to?</p></div>
              <button className="icon-button" onClick={() => setShowNewChat(false)} aria-label="Close new conversation"><Icon name="close" /></button>
            </div>
            <button className="create-group-launch" onClick={() => { setShowNewChat(false); setShowGroupCreator(true) }}><Icon name="users" size={16} /> Create a group</button>
            <label className="search-box modal-search"><Icon name="search" size={17} /><input autoFocus value={newChatSearch} onChange={(event) => setNewChatSearch(event.target.value.replace(/[^a-zA-Z0-9_@]/g, '').slice(0, 24))} placeholder="Find people by @username" /></label>
            {incomingFriendRequests.length > 0 && (
              <div className="friend-section">
                <div className="friend-section-heading">FRIEND REQUESTS <span>{incomingFriendRequests.length}</span></div>
                {incomingFriendRequests.map((request) => (
                  <div className="friend-request-row" key={request.id}>
                    <Avatar person={{ name: request.senderName || 'New user', avatarId: request.senderAvatarId }} size="md" /><span className="friend-request-copy"><strong>{request.senderName || 'New friend request'}</strong><small>@{request.senderUsername || request.senderId.slice(0, 8) + '…'}</small></span>
                    <button className="friend-action-button" disabled={friendActionBusy === request.id} onClick={() => respondToFriendRequest(request, true)}>Accept</button>
                    <button className="friend-decline-button" disabled={friendActionBusy === request.id} onClick={() => respondToFriendRequest(request, false)}>Decline</button>
                  </div>
                ))}
              </div>
            )}
            {newChatSearch.trim().replace(/^@/, '').length < 3 && (
              <div className="directory-empty">Enter at least 3 characters of someone's username to find them.</div>
            )}
            {discoveryLoading && <div className="directory-empty">Searching for people…</div>}
            {discoveryError && <div className="directory-empty friend-error">{discoveryError}</div>}
            {!discoveryLoading && newChatSearch.trim().replace(/^@/, '').length >= 3 && (
              <div className="directory-list">
                {discoveredUsers.length ? discoveredUsers.map((person) => (
                  <div className="friend-discovery-row" key={person.id}>
                    <Avatar person={person} size="lg" />
                    <span className="friend-discovery-copy"><strong>{person.name}</strong><small>@{person.username}</small></span>
                    {knownFriendIds.has(person.id)
                      ? <span className="friend-status-label">Friends</span>
                      : incomingRequestIds.has(person.id)
                        ? <span className="friend-status-label">Request received</span>
                        : outgoingRequestIds.has(person.id)
                          ? <span className="friend-status-label">Request sent</span>
                          : <button className="friend-action-button" disabled={friendActionBusy === person.id} onClick={() => sendFriendRequest(person)}>{friendActionBusy === person.id ? 'Sending…' : 'Add friend'}</button>}
                  </div>
                )) : <div className="directory-empty">No discoverable user found for that username.</div>}
              </div>
            )}
            {friendContacts.length > 0 && (
              <div className="friend-section">
                <div className="friend-section-heading">YOUR FRIENDS <span>{friendContacts.length}</span></div>
                <div className="directory-list">
                  {friendContacts.map((person) => (
                    <button className="directory-person" key={person.id} onClick={() => { startConversation(person) }}>
                      <Avatar person={person} size="lg" />
                      <span><strong>{person.name}</strong><small>@{person.username}</small></span>
                      <Icon name="arrowLeft" size={16} className="directory-arrow" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="modal-footnote">Search uses permanent usernames. Friend requests and accepted contacts are stored in Firebase.</div>
          </section>
        </div>
      )}

      {toast && <div className="toast-message"><span className="toast-check"><Icon name="check" size={14} /></span>{toast}</div>}
    </div>
  )
}

export default App
