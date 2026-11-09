import { useEffect, useMemo, useRef, useState } from 'react'
import { collection, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query, runTransaction, serverTimestamp, setDoc, where } from 'firebase/firestore'
import { auth, db } from './firebase/client'
import './App.css'
import AccountPrivacyPanel from './AccountPrivacyPanel'

const initialConversations = [
  {
    id: 'alex',
    avatarId: 'male-03',
    name: 'Alex Morgan',
    initials: 'AM',
    tone: 2,
    status: 'online',
    typing: true,
    preview: 'Perfect. I’ll review everything this afternoon.',
    time: '10:42',
    unread: 2,
    pinned: true,
    favorite: true,
    archived: false,
    messages: [
      { id: 'a1', from: 'them', text: 'Hey! I’ve been refining the first concepts for the new project.', time: '9:18 AM' },
      { id: 'a2', from: 'them', text: 'Just shared the updated direction with the team. Would love your thoughts when you have a moment.', time: '9:19 AM' },
      { id: 'a3', from: 'me', text: 'These are looking great. The spacing feels much clearer now.', time: '9:24 AM', read: true },
      { id: 'a4', from: 'them', type: 'file', fileName: 'Brand exploration.fig', fileMeta: 'Figma file · 4.8 MB', time: '9:26 AM' },
      { id: 'a5', from: 'them', text: 'I’ve also added a few variations to the final page.', time: '9:27 AM' },
      { id: 'a6', from: 'me', text: 'Perfect. I’ll review everything this afternoon and send over notes.', time: '9:31 AM', read: true },
    ],
  },
  {
    id: 'olivia',
    avatarId: 'female-02',
    name: 'Olivia Rhye',
    initials: 'OR',
    tone: 4,
    status: 'online',
    preview: 'That works for me. See you there!',
    time: '10:18',
    unread: 1,
    pinned: true,
    favorite: false,
    archived: false,
    messages: [
      { id: 'o1', from: 'them', text: 'Are we still on for the coffee catch-up tomorrow?', time: '10:02 AM' },
      { id: 'o2', from: 'me', text: 'Absolutely. I’ll send you the location in a bit.', time: '10:08 AM', read: true },
      { id: 'o3', from: 'them', text: 'That works for me. See you there!', time: '10:18 AM' },
    ],
  },
  {
    id: 'noah',
    avatarId: 'male-01',
    name: 'Noah Williams',
    initials: 'NW',
    tone: 1,
    status: 'offline',
    preview: 'Sent you the updated notes.',
    time: 'Yesterday',
    unread: 0,
    pinned: false,
    favorite: false,
    archived: false,
    messages: [
      { id: 'n1', from: 'them', text: 'I went through the feedback and made the changes we discussed.', time: 'Yesterday' },
      { id: 'n2', from: 'them', text: 'Sent you the updated notes.', time: 'Yesterday' },
    ],
  },
  {
    id: 'emma',
    avatarId: 'female-01',
    name: 'Emma Thompson',
    initials: 'ET',
    tone: 3,
    status: 'online',
    preview: 'Could you take a look at this when free?',
    time: 'Yesterday',
    unread: 0,
    pinned: false,
    favorite: true,
    archived: false,
    messages: [
      { id: 'e1', from: 'them', text: 'I have a small update to share with you.', time: 'Yesterday' },
      { id: 'e2', from: 'them', text: 'Could you take a look at this when free?', time: 'Yesterday' },
    ],
  },
  {
    id: 'studio',
    name: 'Studio Circle',
    initials: 'SC',
    tone: 5,
    status: 'group',
    members: '8 members',
    preview: 'Mia: Added the final assets to the folder.',
    time: 'Tue',
    unread: 0,
    pinned: false,
    favorite: false,
    archived: false,
    messages: [
      { id: 's1', from: 'them', sender: 'Mia Chen', text: 'Added the final assets to the folder.', time: 'Tuesday' },
      { id: 's2', from: 'me', text: 'Thanks, I’ll take a look.', time: 'Tuesday', read: true },
    ],
  },
  {
    id: 'james',
    avatarId: 'male-05',
    name: 'James Miller',
    initials: 'JM',
    tone: 6,
    status: 'offline',
    preview: 'Voice message · 0:24',
    time: 'Mon',
    unread: 0,
    pinned: false,
    favorite: false,
    archived: false,
    messages: [
      { id: 'j1', from: 'them', text: 'Voice message · 0:24', time: 'Monday' },
    ],
  },
  {
    id: 'sophia',
    avatarId: 'female-03',
    name: 'Sophia Bennett',
    initials: 'SB',
    tone: 2,
    status: 'offline',
    preview: 'Thank you so much!',
    time: 'Sun',
    unread: 0,
    pinned: false,
    favorite: false,
    archived: true,
    messages: [
      { id: 'sb1', from: 'them', text: 'Thank you so much!', time: 'Sunday' },
    ],
  },
]

const MESSAGE_RETENTION_MS = 86400000

const getConversationActivity = (conversation) => {
  if (Number.isFinite(conversation.lastActivityAt)) return conversation.lastActivityAt
  const lastMessageId = conversation.messages?.[conversation.messages.length - 1]?.id || ''
  const timestampMatch = String(lastMessageId).match(/(?:m|img|voice|fwd|poll)-(\\d+)/)
  return timestampMatch ? Number(timestampMatch[1]) : 0
}

// Treat every audio-backed message as a voice message, even if its type metadata differs.
const isAudioMessage = (message) => message?.type === 'audio' || Boolean(message?.mediaUrl) || Boolean(message?.mimeType?.startsWith('audio/'))

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

const directoryPeople = [
  { id: 'nina', avatarId: 'female-04', name: 'Nina Patel', initials: 'NP', tone: 3, status: 'online' },
  { id: 'daniel', avatarId: 'male-02', name: 'Daniel Kim', initials: 'DK', tone: 1, status: 'offline' },
  { id: 'maya', avatarId: 'female-05', name: 'Maya Chen', initials: 'MC', tone: 4, status: 'online' },
  { id: 'ethan', avatarId: 'male-04', name: 'Ethan Brooks', initials: 'EB', tone: 5, status: 'offline' },
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
    <button type="button" className={'conversation-item' + (active ? ' active' : '')} onClick={onSelect}>
      <Avatar person={conversation} size="lg" showStatus />
      <span className="conversation-copy">
        <span className="conversation-topline"><strong>{conversation.name}</strong><time>{conversation.time}</time></span>
        <span className="conversation-bottomline"><span className="conversation-preview">{conversation.preview}</span>{conversation.unread > 0 && <i className="unread-count">{conversation.unread}</i>}</span>
      </span>
    </button>
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

const directConversationId = (uid, otherUid) => [uid, otherUid].sort().join('__')

function App({ profile, onLogout }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('notification-theme') || 'light')
  const [conversations, setConversations] = useState(() => {
    // Authenticated accounts must never see sample conversations or another
    // browser's cached conversation data as if it were real chat history.
    if (auth?.currentUser?.uid) return []
    try { const saved = localStorage.getItem('notification-conversations'); return saved ? JSON.parse(saved) : initialConversations } catch { return initialConversations }
  })
  const [activeId, setActiveId] = useState(() => auth?.currentUser?.uid ? '' : 'alex')
  const [view, setView] = useState('messages')
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
  const [draftAvatar, setDraftAvatar] = useState(() => localStorage.getItem('notification-profile-avatar') || 'male-01')
  const [avatarPickerGender, setAvatarPickerGender] = useState(() => (localStorage.getItem('notification-profile-avatar') || 'male-01').startsWith('female') ? 'female' : 'male')
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
          return { id: contactUid, name: data.displayName || data.username, username: data.username, avatarId: data.avatarId, initials: (data.displayName || data.username || '?').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(), status: 'offline', tone: 2 }
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
              const name = data.displayName || data.username
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


  useEffect(() => {
    localStorage.setItem('notification-sound-enabled', String(soundEnabled))
  }, [soundEnabled])

  useEffect(() => {
    localStorage.setItem('notification-compact-mode', String(compactMode))
  }, [compactMode])

  // Browser preview persistence only; binary media is deliberately session-only.
  useEffect(() => {
    try {
      const safeConversations = conversations.map((conversation) => ({
        ...conversation,
        messages: conversation.messages.map(({ imageData, mediaUrl, ...message }) => message),
      }))
      localStorage.setItem('notification-conversations', JSON.stringify(safeConversations))
    } catch { showToast('Local storage is full. Some recent changes may not persist.') }
  }, [conversations])

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
          const messages = conversation.messages.map((message) => {
            return message
          }).filter((message) => { const keep = !message.expiresAt || message.expiresAt > now; if (!keep) changed = true; return keep })
          return messages.length === conversation.messages.length && !messages.some((message, index) => message !== conversation.messages[index]) ? conversation : { ...conversation, messages }
        })
        return changed ? next : items
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [])

  const activeConversation = conversations.find((conversation) => conversation.id === activeId)
  useEffect(() => {
    const uid = auth?.currentUser?.uid
    const friend = friendContacts.find((person) => person.id === activeId)
    if (!uid || !db || !friend) return undefined
    const conversationId = directConversationId(uid, friend.id)
    const messagesQuery = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(300),
    )
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messages = snapshot.docs.map((messageDoc) => {
        const data = messageDoc.data()
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date()
        return {
          id: messageDoc.id,
          from: data.senderId === uid ? 'me' : 'them',
          senderId: data.senderId,
          type: data.type || 'text',
          text: data.text || '',
          replyToId: data.replyToId,
          replyToText: data.replyToText,
          editedAt: data.editedAt ? (data.editedAt.toDate ? data.editedAt.toDate().getTime() : data.editedAt) : null,
          time: createdAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
          status: data.senderId === uid ? 'sent' : 'received',
        }
      })
      setConversations((items) => {
        const exists = items.some((item) => item.id === activeId)
        if (!exists) return items
        return items.map((item) => item.id === activeId
          ? { ...item, firebaseConversationId: conversationId, messages, preview: messages[messages.length - 1]?.text || 'Start a conversation', time: messages[messages.length - 1]?.time || item.time }
          : item)
      })
    }, (error) => {
      setToast(error?.code === 'permission-denied'
        ? 'Message sync permission denied. Deploy the latest Firestore rules.'
        : error?.message || 'Could not sync messages.')
    })
    return unsubscribe
  }, [activeId, friendContacts, auth?.currentUser?.uid])
  useEffect(() => {
    const uid = auth?.currentUser?.uid
    if (!uid || !db || friendContacts.length === 0) return undefined
    const unsubscribers = friendContacts.map((person) => {
      const conversationId = directConversationId(uid, person.id)
      return onSnapshot(doc(db, 'conversations', conversationId), (snapshot) => {
        if (!snapshot.exists()) return
        const data = snapshot.data()
        const lastMessageAt = data.lastMessageAt?.toDate ? data.lastMessageAt.toDate() : null
        setConversations((items) => items.map((item) => item.id === person.id ? {
          ...item,
          firebaseConversationId: conversationId,
          preview: data.lastMessagePreview || item.preview || 'Start a conversation',
          time: lastMessageAt ? lastMessageAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : item.time,
          lastActivityAt: lastMessageAt ? lastMessageAt.getTime() : item.lastActivityAt || 0,
        } : item))
      }, (error) => {
        if (error?.code !== 'permission-denied') showToast(error?.message || 'Could not update the inbox.')
      })
    })
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe())
  }, [friendContacts, auth?.currentUser?.uid])

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
    if (query) items = items.filter((item) => item.name.toLowerCase().includes(query) || (item.preview || '').toLowerCase().includes(query))
    return [...items].sort((a, b) => getConversationActivity(b) - getConversationActivity(a))
  }, [conversations, directory, listFilter, search, view])

  const showToast = (message) => {
    setToast(message)
    window.clearTimeout(showToast.timeout)
    showToast.timeout = window.setTimeout(() => setToast(''), 2600)
  }

  const openAvatarPicker = () => {
    setProfileMenuOpen(false)
    showToast('Profile avatars are preset and cannot be changed.')
  }

  const saveAvatarSelection = () => {
    setProfileAvatar(draftAvatar)
    localStorage.setItem('notification-profile-avatar', draftAvatar)
    setShowAvatarPicker(false)
    showToast('Your avatar has been updated')
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
      const messages = item.messages.map((message) => {
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

  const handleSend = async (event) => {
    event?.preventDefault()
    const text = messageText.trim()
    if (!text || !activeConversation) return
    if (activeConversation.blocked) { showToast('Unblock this user before sending messages.'); return }
    if (editingMessageId) {
      setConversations((items) => items.map((item) => item.id === activeId ? { ...item, messages: item.messages.map((message) => message.id === editingMessageId ? { ...message, text, editedAt: Date.now() } : message) } : item))
      setEditingMessageId(null); setMessageText(''); messageInputRef.current?.focus(); return
    }

    const uid = auth?.currentUser?.uid
    const isAcceptedFriend = uid && db && friendContacts.some((person) => person.id === activeId)
    if (isAcceptedFriend) {
      const conversationId = activeConversation.firebaseConversationId || directConversationId(uid, activeId)
      try {
        // A conversation document must exist before either member can read or
        // write its messages. Repair older/missing conversations on first send.
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
        const messageRef = doc(collection(db, 'conversations', conversationId, 'messages'))
        await setDoc(messageRef, {
          senderId: uid,
          type: 'text',
          text,
          createdAt: serverTimestamp(),
          ...(replyTarget ? { replyToId: replyTarget.id, replyToText: replyTarget.text || 'Message' } : {}),
        })
        await setDoc(doc(db, 'conversations', conversationId), {
          lastMessageAt: serverTimestamp(),
          lastMessagePreview: text.slice(0, 160),
          updatedAt: serverTimestamp(),
        }, { merge: true })
        setMessageText('')
        setReplyTarget(null)
        messageInputRef.current?.focus()
      } catch (error) {
        showToast(error?.code === 'permission-denied'
          ? 'Firebase denied this message. Check that the latest Firestore rules are deployed.'
          : error?.message || 'Could not send message. Please try again.')
      }
      return
    }

    const message = {
      id: 'm-' + Date.now(), from: 'me', type: 'text', text,
      time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      status: 'sent',
      ...(replyTarget ? { replyToId: replyTarget.id, replyToText: replyTarget.text || 'Message' } : {}),
    }
    setConversations((items) => items.map((item) => item.id === activeId ? { ...item, messages: [...item.messages, message], preview: text, time: 'Now', lastActivityAt: Date.now() } : item))
    setMessageText(''); setReplyTarget(null); messageInputRef.current?.focus()
  }

  const handleFile = (event) => {
    const file = event.target.files?.[0]
    if (!file || !activeConversation) return
    event.target.value = ''
    if (!file.type.startsWith('image/')) { showToast('Only image sharing is available here'); return }
    if (file.size > 3 * 1024 * 1024) { showToast('Choose an image smaller than 3 MB'); return }
    const reader = new FileReader()
    reader.onload = () => {
      const message = { id: 'img-' + Date.now(), from: 'me', type: 'image', imageData: reader.result, viewOnce: true, viewed: false, time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), status: 'sent' }
      setConversations((items) => items.map((item) => item.id === activeId ? { ...item, messages: [...item.messages, message], preview: 'View-once image', time: 'Now', lastActivityAt: Date.now() } : item))
    }
    reader.onerror = () => showToast('Could not read that image')
    reader.readAsDataURL(file)
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
  const deleteMessage = (messageId) => {
    setConversations((items) => items.map((item) => item.id === activeId ? { ...item, messages: item.messages.filter((message) => message.id !== messageId) } : item))
    setSelectedMessageId(null); showToast('Message removed from this browser preview')
  }
  const toggleMessageReaction = (messageId, emoji) => {
    setConversations((items) => items.map((item) => item.id === activeId ? {
      ...item,
      messages: item.messages.map((message) => {
        if (message.id !== messageId) return message
        const reactions = message.reactions || []
        return { ...message, reactions: reactions.includes(emoji) ? reactions.filter((reaction) => reaction !== emoji) : [...reactions, emoji] }
      }),
    } : item))
    setSelectedMessageId(null)
    setReactionPickerMessageId(null)
  }
  const forwardMessageTo = (message, targetId) => {
    if (!targetId) return
    setConversations((items) => items.map((item) => item.id === targetId ? { ...item, messages: [...item.messages, { id: 'fwd-' + Date.now(), from: 'me', type: 'text', text: message.text || (message.type === 'image' ? 'Image' : isAudioMessage(message) ? 'Voice message' : 'Message'), forwarded: true, time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), status: 'sent' }], preview: 'Forwarded message', time: 'Now', lastActivityAt: Date.now() } : item))
    setForwardMessageId(null); setSelectedMessageId(null); showToast('Message forwarded in this browser preview')
  }

  const createGroup = () => {
    const title = groupName.trim()
    const selected = directory.filter((person) => groupMemberIds.includes(person.id))
    if (!title) { showToast('Enter a group name'); return }
    if (!selected.length) { showToast('Choose at least one group member'); return }
    const id = 'group-' + Date.now()
    const group = { id, name: title, initials: title.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(), tone: 6, status: 'group', members: (selected.length + 1) + ' members', memberIds: ['you', ...selected.map((person) => person.id)], admins: ['you'], moderators: [], preview: 'Group created', time: 'Now', unread: 0, pinned: false, favorite: false, archived: false, muted: false, messages: [] }
    setConversations((items) => [group, ...items])
    setActiveId(id); setView('messages'); setMobileChatOpen(true)
    setShowGroupCreator(false); setShowNewChat(false); setGroupName(''); setGroupMemberIds([])
    showToast('Group created in this browser preview')
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

  const markAllRead = () => { setConversations((items) => items.map((item) => ({ ...item, unread: 0 }))); showToast('All conversations marked as read') }

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

  const toggleBlockContact = () => {
    if (!activeConversation || activeConversation.status === 'group') return
    const nextBlocked = !activeConversation.blocked
    setConversations((items) => items.map((item) => item.id === activeId ? { ...item, blocked: nextBlocked } : item))
    const handle = String(activeConversation.username || activeConversation.id || '').replace(/^@/, '').toLowerCase()
    try {
      const saved = JSON.parse(localStorage.getItem('notification-blocked-users') || '[]')
      const updated = nextBlocked ? [...new Set([...saved, handle])] : saved.filter((value) => value !== handle)
      localStorage.setItem('notification-blocked-users', JSON.stringify(updated))
    } catch { /* Keep the conversation-level block state available in this prototype. */ }
    showToast(nextBlocked ? 'User blocked on this device' : 'User unblocked')
  }

  const archiveConversation = () => {
    setConversations((items) => items.map((item) => item.id === activeId ? { ...item, archived: !item.archived } : item))
    setShowChatMenu(false)
    setView('messages')
    showToast(activeConversation.archived ? 'Conversation restored' : 'Conversation archived')
  }

  const leaveGroup = () => {
    if (!activeConversation || activeConversation.status !== 'group') return
    const groupName = activeConversation.name
    const remaining = conversations.filter((item) => item.id !== activeId)
    setConversations(remaining)
    setActiveId(remaining.find((item) => !item.archived)?.id || remaining[0]?.id || '')
    setShowChatMenu(false)
    setShowDetails(false)
    setMobileChatOpen(false)
    setView('messages')
    showToast(`You left ${groupName}`)
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
          const name = data.displayName || data.username
          setFriendContacts((items) => [...items.filter((item) => item.id !== request.senderId), { id: request.senderId, name, username: data.username, avatarId: data.avatarId, initials: name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(), status: 'offline', tone: 2 }])
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
        <button className="brand-mark" aria-label="Notification home" onClick={() => { setView('messages'); setMobileChatOpen(false) }}>
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
              <button onClick={() => { setView('settings'); setProfileMenuOpen(false) }}>Account settings</button>{onLogout && <button onClick={onLogout}><Icon name="logout" size={14} /> Sign out</button>}
            </div>
          )}
        </div>
      </aside>

      <aside className={'inbox-panel' + (mobileChatOpen ? ' hidden-mobile' : '')}>
        <div className="inbox-topbar">
          <div className="wordmark">
            <span className="wordmark-icon"><BrandGlyph size={19} /></span>
            <span>notification<span className="wordmark-period">.</span></span>
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
                  <span>{person.name.split(' ')[0]}</span>
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

        <nav className="mobile-nav-bar" aria-label="Mobile navigation">
          <button className={view === 'messages' ? 'selected' : ''} onClick={() => setView('messages')}><Icon name="message" size={17} /><span>Chats</span></button>
          <button className={view === 'contacts' ? 'selected' : ''} onClick={() => setView('contacts')}><Icon name="users" size={17} /><span>Contacts</span></button>
          <button className={view === 'starred' ? 'selected' : ''} onClick={() => setView('starred')}><Icon name="star" size={17} /><span>Starred</span></button>
          <button className={view === 'archive' ? 'selected' : ''} onClick={() => setView('archive')}><Icon name="archive" size={17} /><span>Archive</span></button>
          <button className={view === 'settings' ? 'selected' : ''} onClick={() => { setView('settings'); setMobileChatOpen(true) }}><Icon name="settings" size={17} /><span>Settings</span></button>
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
        {view === 'settings' ? (
          <section className="settings-view">
            <button className="settings-mobile-back" onClick={() => setMobileChatOpen(false)}><Icon name="arrowLeft" size={16} /> Back to chats</button>
            <div className="settings-header">
              <div className="eyebrow">PREFERENCES</div>
              <h2>Settings</h2>
              <p>Make Notification feel like yours.</p>
            </div>
            <div className="settings-content">
              <AccountPrivacyPanel profile={profile} />
              <div className="settings-section">
                <div className="settings-section-title"><strong>Appearance</strong><span>How Notification looks on your device</span></div>
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
                subtitle={activeConversation.typing ? 'Typing…' : activeConversation.status === 'online' ? 'Active now' : activeConversation.status === 'group' ? (activeConversation.members || 'Group conversation') : 'Last seen recently'}
                subtitleClass={activeConversation.typing ? 'chat-status-typing' : activeConversation.status === 'online' ? 'chat-status-online' : activeConversation.status === 'group' ? 'chat-status-group' : 'chat-status-offline'}
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
                    <strong>Say hello to {activeConversation.name.split(' ')[0]}</strong>
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
                      {message.type === 'poll' ? (
                        <div className="poll-card"><strong>{message.poll.question}</strong>{message.poll.options.map((option) => { const votes = Object.values(message.poll.votes || {}).filter((vote) => vote === option).length; return <button type="button" key={option} onClick={() => voteOnPoll(message.id, option)} className={message.poll.votes?.you === option ? 'voted' : ''}><span>{option}</span><small>{votes} vote{votes === 1 ? '' : 's'}</small></button> })}</div>
                      ) : message.type === 'image' ? (
                        message.from === 'me' ? (
                          message.senderViewed ? (
                            <div className="image-message image-view-once image-consumed"><Icon name="check" size={16} /><span>You opened this image · unavailable</span></div>
                          ) : (
                            <button type="button" className="image-message image-view-once image-locked" disabled={!message.imageData} onClick={() => {
                              if (!message.imageData || message.senderViewed) return
                              setViewOnceImage({ id: message.id, src: message.imageData, senderView: true })
                              setConversations((items) => items.map((item) => item.id === activeId ? {
                                ...item,
                                messages: item.messages.map((entry) => entry.id === message.id ? { ...entry, senderViewed: true, senderOpenedAt: Date.now() } : entry),
                              } : item))
                            }}>
                              <span className="image-lock-art"><Icon name="image" size={22} /><i><Icon name="shield" size={11} /></i></span>
                              <strong>{message.imageData ? 'Your sent image' : 'Image unavailable'}</strong>
                              <small>{message.imageData ? 'Open once · you cannot reopen it after closing' : 'Image bytes are not stored in this browser preview'}</small>
                            </button>
                          )
                        ) : message.viewed ? (
                          <div className="image-message image-view-once image-consumed"><Icon name="check" size={16} /><span>Opened · image unavailable</span></div>
                        ) : (
                          <button type="button" className="image-message image-view-once image-locked" disabled={!message.imageData} onClick={() => {
                            if (!message.imageData || message.viewed) return
                            setViewOnceImage({ id: message.id, src: message.imageData })
                            setConversations((items) => items.map((item) => item.id === activeId ? {
                              ...item,
                              messages: item.messages.map((entry) => entry.id === message.id ? { ...entry, viewed: true, openedAt: Date.now() } : entry),
                            } : item))
                          }}>
                            <span className="image-lock-art"><Icon name="image" size={22} /><i><Icon name="shield" size={11} /></i></span>
                            <strong>{message.imageData ? 'Image waiting for you' : 'Image unavailable in this preview'}</strong>
                            <small>{message.imageData ? 'Open once · it cannot be reopened after closing' : 'Image bytes are not stored in this browser preview'}</small>
                          </button>
                        )
                      ) : isAudioMessage(message) ? (
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
                      <span className="message-meta">{message.editedAt ? 'Edited · ' : ''}{message.time}{message.from === 'me' && <Icon name="checkDouble" size={13} className="read-check" />}{message.pinned && <Icon name="pin" size={12} />}</span>
                      {!isAudioMessage(message) && <>
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
                      {!isAudioMessage(message) && forwardMessageId === message.id && <div className="forward-inline"><select defaultValue="" onChange={(event) => forwardMessageTo(message, event.target.value)}><option value="" disabled>Forward to…</option>{conversations.filter((item) => item.id !== activeId && !item.archived).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>}
                    </div>
                  </div>
                ))}
                {activeConversation.typing && (
                  <div className="message-row message-incoming typing-row" aria-label={activeConversation.name + ' is typing'}>
                    <Avatar person={activeConversation} size="message" />
                    <div className="typing-indicator-bubble" role="status" aria-live="polite" aria-label="Typing">
                      <span />
                      <span />
                      <span />
                    </div>
                    <span className="typing-label">typing</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <form className="composer-wrap" onSubmit={handleSend}>
              {(replyTarget || editingMessageId) && <div className="composer-context"><span>{editingMessageId ? 'Editing message' : 'Replying to ' + (replyTarget?.sender || activeConversation.name)}</span><strong>{editingMessageId ? 'Update your message' : (replyTarget?.text || 'Message')}</strong><button type="button" onClick={() => { setReplyTarget(null); setEditingMessageId(null); setMessageText('') }} aria-label="Cancel reply or edit"><Icon name="close" size={14} /></button></div>}
              {showPollComposer && <div className="poll-composer"><input value={pollQuestion} onChange={(event) => setPollQuestion(event.target.value)} placeholder="Ask a question" /><textarea value={pollOptions} onChange={(event) => setPollOptions(event.target.value)} placeholder={'Option one\nOption two'} rows={3} /><div><button type="button" onClick={() => setShowPollComposer(false)}>Cancel</button><button type="button" onClick={createPoll}>Create poll</button></div></div>}
              <div className="composer-options">{activeConversation.status === 'group' && <button type="button" className="view-once-toggle" onClick={() => setShowPollComposer((show) => !show)}>Create poll</button>}<span className="retention-policy-note"><Icon name="shield" size={12} /> Messages disappear 24 hours after they are seen</span><span className="image-policy-note"><Icon name="image" size={12} /> All shared images can be opened once by the recipient</span></div>
              <div className="composer">
                <input ref={fileInputRef} type="file" accept="image/*" className="visually-hidden" onChange={handleFile} />
                {!recordingPreview && <button type="button" className="composer-action" onClick={() => fileInputRef.current?.click()} aria-label="Share an image" title="Share an image"><Icon name="image" size={19} /></button>}
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
                    <textarea ref={messageInputRef} rows="1" value={messageText} onChange={(event) => setMessageText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); handleSend(event) } }} placeholder="Write a message..." aria-label="Write a message" />
                    <span className="composer-hint">Enter to send · Shift + Enter for new line</span>
                  </>
                )}
                {!recordingPreview && <span className="emoji-picker-control">
                  <span className="emoji-picker-tooltip">Choose an emoji</span>
                  <button type="button" className={'composer-action emoji-action' + (emojiPickerOpen ? ' active' : '')} onClick={() => setEmojiPickerOpen((open) => !open)} aria-label="Open emoji picker" aria-expanded={emojiPickerOpen} title="Choose an emoji"><Icon name="smile" size={19} /></button>
                  {emojiPickerOpen && <div className="composer-emoji-picker" role="dialog" aria-label="Choose an emoji">
                    <div className="composer-emoji-picker-heading"><strong>Choose an emoji</strong><button type="button" onClick={() => setEmojiPickerOpen(false)} aria-label="Close emoji picker"><Icon name="close" size={14} /></button></div>
                    <div className="composer-emoji-grid">
                      {composerEmojiOptions.map((emoji, index) => <button type="button" key={emoji + index} onClick={() => { setMessageText((text) => text + emoji); setEmojiPickerOpen(false); messageInputRef.current?.focus() }} aria-label={'Insert ' + emoji}>{emoji}</button>)}
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
            {(activeConversation.memberIds || []).filter((id) => id !== 'you').map((memberId) => { const member = directory.find((person) => person.id === memberId); if (!member) return null; return <div className="group-member-row" key={memberId}><Avatar person={member} size="sm" /><span>{member.name}<small>{(activeConversation.admins || []).includes(memberId) ? 'Admin' : (activeConversation.moderators || []).includes(memberId) ? 'Moderator' : 'Member'}</small></span>{(activeConversation.admins || []).includes('you') && <button onClick={() => setConversations((items) => items.map((item) => item.id === activeId ? { ...item, moderators: (item.moderators || []).includes(memberId) ? (item.moderators || []).filter((id) => id !== memberId) : [...(item.moderators || []), memberId] } : item))}>{(activeConversation.moderators || []).includes(memberId) ? 'Remove mod' : 'Make mod'}</button>}</div> })}
            {(activeConversation.admins || []).includes('you') && <select className="group-add-member" defaultValue="" onChange={(event) => { const memberId = event.target.value; if (memberId) setConversations((items) => items.map((item) => item.id === activeId ? { ...item, memberIds: [...new Set([...(item.memberIds || []), memberId])], members: (new Set([...(item.memberIds || []), memberId])).size + ' members' } : item)) }}><option value="" disabled>Add a member…</option>{directory.filter((person) => !(activeConversation.memberIds || []).includes(person.id)).map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select>}
          </div>}<div className="details-block"><span className="section-label">ABOUT</span><p>Available for thoughtful conversations and good ideas.</p></div>
          <div className="details-block"><span className="section-label">SHARED FILES</span><div className="shared-file"><Icon name="file" size={18} /><span><strong>Brand exploration.fig</strong><small>Shared today</small></span></div></div>
          <div className="details-foot"><Icon name="shield" size={15} /> Your conversations stay yours.</div>
        </aside>
      )}
      </main>

      {viewOnceImage && (
        <div className="view-once-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) {
          const openedId = viewOnceImage.id
          if (!viewOnceImage.senderView) setConversations((items) => items.map((item) => item.id === activeId ? { ...item, messages: item.messages.map((message) => message.id === openedId ? { ...message, imageData: null } : message) } : item))
          setViewOnceImage(null)
        } }}>
          <section className="view-once-viewer" role="dialog" aria-modal="true" aria-label="View-once image">
            <div className="view-once-viewer-header"><span><Icon name="shield" size={14} /> View-once image</span><button type="button" onClick={() => {
              const openedId = viewOnceImage.id
              if (!viewOnceImage.senderView) setConversations((items) => items.map((item) => item.id === activeId ? { ...item, messages: item.messages.map((message) => message.id === openedId ? { ...message, imageData: null } : message) } : item))
              setViewOnceImage(null)
            }} aria-label="Close image"><Icon name="close" size={19} /></button></div>
            <img src={viewOnceImage.src} alt="Opened view-once image" />
            <p>This image can only be opened once in Notification. Close it to finish viewing.</p>
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
              <button className="primary-button" onClick={saveAvatarSelection}><Icon name="check" size={15} /> Use this avatar</button>
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
            <div className="modal-footnote">Group creation is local-only until Firebase membership services are connected.</div>
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
            {discoveryLoading && <div className="directory-empty">Searching Notification…</div>}
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
