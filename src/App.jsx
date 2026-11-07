import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const initialConversations = [
  {
    id: 'alex',
    name: 'Alex Morgan',
    initials: 'AM',
    tone: 2,
    status: 'online',
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

const directoryPeople = [
  { id: 'nina', name: 'Nina Patel', initials: 'NP', tone: 3, status: 'online' },
  { id: 'daniel', name: 'Daniel Kim', initials: 'DK', tone: 1, status: 'offline' },
  { id: 'maya', name: 'Maya Chen', initials: 'MC', tone: 4, status: 'online' },
  { id: 'ethan', name: 'Ethan Brooks', initials: 'EB', tone: 5, status: 'offline' },
]

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

function Icon({ name, size = 18, strokeWidth = 1.8, className = '' }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconPaths[name] || iconPaths.message}
    </svg>
  )
}

function Avatar({ person, size = 'md', showStatus = false }) {
  return (
    <span className={'avatar avatar-' + size + ' avatar-tone-' + (person.tone || 1)}>
      <span>{person.initials || person.name?.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span>
      {showStatus && person.status === 'online' && <i className="presence-dot" />}
    </span>
  )
}

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('notification-theme') || 'light')
  const [conversations, setConversations] = useState(initialConversations)
  const [activeId, setActiveId] = useState('alex')
  const [view, setView] = useState('messages')
  const [search, setSearch] = useState('')
  const [listFilter, setListFilter] = useState('all')
  const [messageText, setMessageText] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const [newChatSearch, setNewChatSearch] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [showChatMenu, setShowChatMenu] = useState(false)
  const [toast, setToast] = useState('')
  const [mobileChatOpen, setMobileChatOpen] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [compactMode, setCompactMode] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const messageInputRef = useRef(null)
  const fileInputRef = useRef(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('notification-theme', theme)
  }, [theme])

  const activeConversation = conversations.find((conversation) => conversation.id === activeId) || conversations[0]

  const visibleConversations = useMemo(() => {
    let items = conversations
    if (view === 'starred') items = items.filter((item) => item.favorite && !item.archived)
    else if (view === 'archive') items = items.filter((item) => item.archived)
    else items = items.filter((item) => !item.archived)

    if (listFilter === 'unread') items = items.filter((item) => item.unread > 0)
    const query = search.trim().toLowerCase()
    if (query) items = items.filter((item) => item.name.toLowerCase().includes(query) || item.preview.toLowerCase().includes(query))
    return [...items].sort((a, b) => Number(b.pinned) - Number(a.pinned))
  }, [conversations, listFilter, search, view])

  const showToast = (message) => {
    setToast(message)
    window.clearTimeout(showToast.timeout)
    showToast.timeout = window.setTimeout(() => setToast(''), 2600)
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [activeId, activeConversation?.messages?.length])

  const selectConversation = (id) => {
    setActiveId(id)
    setMobileChatOpen(true)
    setShowDetails(false)
    setShowChatMenu(false)
    setConversations((items) => items.map((item) => item.id === id ? { ...item, unread: 0 } : item))
    if (view === 'settings') setView('messages')
  }

  const handleSend = (event) => {
    event?.preventDefault()
    const text = messageText.trim()
    if (!text || !activeConversation) return
    const message = {
      id: 'm-' + Date.now(),
      from: 'me',
      text,
      time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      read: false,
    }
    setConversations((items) => items.map((item) => item.id === activeId
      ? { ...item, messages: [...item.messages, message], preview: text, time: 'Now' }
      : item))
    setMessageText('')
    messageInputRef.current?.focus()
  }

  const handleFile = (event) => {
    const file = event.target.files?.[0]
    if (!file || !activeConversation) return
    const message = {
      id: 'f-' + Date.now(),
      from: 'me',
      type: 'file',
      fileName: file.name,
      fileMeta: file.type || 'Attached file',
      time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    }
    setConversations((items) => items.map((item) => item.id === activeId
      ? { ...item, messages: [...item.messages, message], preview: 'Attachment: ' + file.name, time: 'Now' }
      : item))
    event.target.value = ''
    showToast('Attachment added to this demo conversation')
  }

  const toggleFavorite = () => {
    setConversations((items) => items.map((item) => item.id === activeId ? { ...item, favorite: !item.favorite } : item))
    showToast(activeConversation.favorite ? 'Removed from starred' : 'Added to starred')
  }

  const archiveConversation = () => {
    setConversations((items) => items.map((item) => item.id === activeId ? { ...item, archived: !item.archived } : item))
    setShowChatMenu(false)
    setView('messages')
    showToast(activeConversation.archived ? 'Conversation restored' : 'Conversation archived')
  }

  const startConversation = (person) => {
    const exists = conversations.find((item) => item.id === person.id)
    if (!exists) {
      const newConversation = {
        ...person,
        preview: 'Start a conversation',
        time: 'Now',
        unread: 0,
        pinned: false,
        favorite: false,
        archived: false,
        messages: [],
      }
      setConversations((items) => [newConversation, ...items])
    }
    setActiveId(person.id)
    setView('messages')
    setMobileChatOpen(true)
    setShowNewChat(false)
    setNewChatSearch('')
  }

  const directory = [...conversations.filter((item) => !item.archived), ...directoryPeople.filter((person) => !conversations.some((item) => item.id === person.id))]
  const filteredDirectory = directory.filter((person) => person.name.toLowerCase().includes(newChatSearch.toLowerCase()))

  const sidebarTitle = view === 'starred' ? 'Starred' : view === 'archive' ? 'Archive' : view === 'contacts' ? 'Contacts' : 'Messages'
  const sidebarDescription = view === 'starred' ? 'Your saved conversations' : view === 'archive' ? 'Out of sight, not gone' : view === 'contacts' ? 'People you can reach' : 'Stay close to your people'

  return (
    <div className={'app-shell' + (mobileChatOpen ? ' mobile-chat-open' : '') + (compactMode ? ' compact-mode' : '')}>
      <aside className="nav-rail">
        <button className="brand-mark" aria-label="Notification home" onClick={() => { setView('messages'); setMobileChatOpen(false) }}>
          <span className="brand-mark-shape"><Icon name="message" size={21} strokeWidth={2.2} /></span>
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
            <span className="profile-avatar">Y</span>
            <i className="presence-dot" />
          </button>
          {profileMenuOpen && (
            <div className="profile-popover">
              <strong>Your profile</strong>
              <span>Available</span>
              <button onClick={() => { setView('settings'); setProfileMenuOpen(false) }}>Account settings</button>
            </div>
          )}
        </div>
      </aside>

      <aside className={'inbox-panel' + (mobileChatOpen ? ' hidden-mobile' : '')}>
        <div className="inbox-topbar">
          <div className="wordmark">
            <span className="wordmark-icon"><Icon name="message" size={16} strokeWidth={2.2} /></span>
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

        <div className="filter-row">
          <button className={listFilter === 'all' ? 'filter-chip selected' : 'filter-chip'} onClick={() => setListFilter('all')}>All <span>{conversations.filter((item) => !item.archived).length}</span></button>
          <button className={listFilter === 'unread' ? 'filter-chip selected' : 'filter-chip'} onClick={() => setListFilter('unread')}>Unread <span>{conversations.filter((item) => item.unread > 0 && !item.archived).length}</span></button>
        </div>

        {view !== 'archive' && view !== 'starred' && (
          <div className="online-section">
            <div className="section-label"><span>ONLINE NOW</span><span className="online-count">04</span></div>
            <div className="online-people">
              {[initialConversations[0], initialConversations[1], initialConversations[3], directoryPeople[2]].map((person) => (
                <button className="online-person" key={person.id} onClick={() => startConversation(person)} title={person.name}>
                  <Avatar person={person} size="online" showStatus />
                  <span>{person.name.split(' ')[0]}</span>
                </button>
              ))}
              <button className="online-more" onClick={() => { setView('contacts'); setListFilter('all') }}>+3</button>
            </div>
          </div>
        )}

        <div className="conversation-list-wrap">
          <div className="section-label list-section-label">
            <span>{view === 'starred' ? 'SAVED CHATS' : view === 'archive' ? 'ARCHIVED' : view === 'contacts' ? 'ALL PEOPLE' : 'RECENT'}</span>
            <button onClick={() => setShowNewChat(true)}>New chat <Icon name="plus" size={13} /></button>
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
              <button key={conversation.id} className={'conversation-item' + (activeId === conversation.id ? ' active' : '')} onClick={() => selectConversation(conversation.id)}>
                <Avatar person={conversation} size="lg" showStatus />
                <span className="conversation-copy">
                  <span className="conversation-topline"><strong>{conversation.name}</strong><time>{conversation.time}</time></span>
                  <span className="conversation-bottomline"><span className="conversation-preview">{conversation.preview}</span>{conversation.unread > 0 && <i className="unread-count">{conversation.unread}</i>}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="inbox-footer">
          <div className="footer-profile">
            <span className="profile-avatar footer-avatar">Y</span>
            <span><strong>Your workspace</strong><small>Personal account</small></span>
          </div>
          <button className="icon-button subtle-button" onClick={() => setTheme((current) => current === 'light' ? 'dark' : 'light')} aria-label="Toggle color theme" title="Toggle theme"><Icon name={theme === 'light' ? 'moon' : 'sun'} size={17} /></button>
        </div>
      </aside>

      <main className={'main-panel' + (mobileChatOpen ? ' mobile-visible' : '')}>
        {view === 'settings' ? (
          <section className="settings-view">
            <div className="settings-header">
              <div className="eyebrow">PREFERENCES</div>
              <h2>Settings</h2>
              <p>Make Notification feel like yours.</p>
            </div>
            <div className="settings-content">
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
                  <span className="setting-copy"><strong>Desktop notifications</strong><small>Show a notification when a new message arrives</small></span>
                  <button className={'toggle-switch' + (notificationsEnabled ? ' on' : '')} onClick={() => setNotificationsEnabled((value) => !value)} aria-pressed={notificationsEnabled}><i /></button>
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
              <div className="demo-note"><Icon name="info" size={16} /><span>Phase 1 preview: preferences are stored locally in this browser. Account sync will arrive with the Firebase integration.</span></div>
            </div>
          </section>
        ) : activeConversation ? (
          <section className="chat-view">
            <header className="chat-header">
              <button className="mobile-back icon-button" onClick={() => setMobileChatOpen(false)} aria-label="Back to conversations"><Icon name="arrowLeft" /></button>
              <div className="chat-person">
                <Avatar person={activeConversation} size="header" showStatus />
                <span><strong>{activeConversation.name}</strong><small>{activeConversation.status === 'online' ? 'Active now' : activeConversation.status === 'group' ? (activeConversation.members || 'Group conversation') : 'Last seen recently'}</small></span>
              </div>
              <div className="chat-header-actions">
                <button className="icon-button" onClick={() => showToast('Voice calls will be available in a later phase')} aria-label="Start voice call" title="Voice call"><Icon name="phone" /></button>
                <button className="icon-button" onClick={() => showToast('Video calls will be available in a later phase')} aria-label="Start video call" title="Video call"><Icon name="video" /></button>
                <span className="action-divider" />
                <button className="icon-button" onClick={() => setShowDetails((open) => !open)} aria-label="Conversation details" title="Conversation details"><Icon name="info" /></button>
                <div className="menu-anchor">
                  <button className="icon-button" onClick={() => setShowChatMenu((open) => !open)} aria-label="More conversation actions" title="More"><Icon name="more" /></button>
                  {showChatMenu && (
                    <div className="chat-menu">
                      <button onClick={toggleFavorite}><Icon name="star" size={16} />{activeConversation.favorite ? 'Remove from starred' : 'Add to starred'}</button>
                      <button onClick={() => { setConversations((items) => items.map((item) => item.id === activeId ? { ...item, unread: 1 } : item)); setShowChatMenu(false); showToast('Marked as unread') }}><Icon name="message" size={16} />Mark as unread</button>
                      <button onClick={archiveConversation}><Icon name="archive" size={16} />{activeConversation.archived ? 'Restore conversation' : 'Archive conversation'}</button>
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

            <div className="messages-scroll">
              <div className="message-history">
                {activeConversation.messages.length === 0 ? (
                  <div className="chat-empty-state">
                    <div className="empty-avatar"><Avatar person={activeConversation} size="xl" /></div>
                    <strong>Say hello to {activeConversation.name.split(' ')[0]}</strong>
                    <span>This is the beginning of your conversation.</span>
                  </div>
                ) : activeConversation.messages.map((message) => (
                  <div key={message.id} className={'message-row ' + (message.from === 'me' ? 'message-outgoing' : 'message-incoming')}>
                    {message.from !== 'me' && <Avatar person={{ ...activeConversation, initials: message.sender ? message.sender.split(' ').map((part) => part[0]).join('') : activeConversation.initials, tone: activeConversation.tone }} size="message" />}
                    <div className="message-content">
                      {message.sender && <span className="message-sender">{message.sender}</span>}
                      {message.type === 'file' ? (
                        <div className="file-message">
                          <span className="file-icon"><Icon name="file" size={21} /></span>
                          <span className="file-copy"><strong>{message.fileName}</strong><small>{message.fileMeta}</small></span>
                          <button aria-label="Download attachment" onClick={() => showToast('File downloads will be connected in a later phase')}><Icon name="more" size={17} /></button>
                        </div>
                      ) : (
                        <div className="message-bubble">{message.text}</div>
                      )}
                      <span className="message-meta">{message.time}{message.from === 'me' && <Icon name="checkDouble" size={13} className="read-check" />}</span>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <form className="composer-wrap" onSubmit={handleSend}>
              <div className="composer">
                <input ref={fileInputRef} type="file" className="visually-hidden" onChange={handleFile} />
                <button type="button" className="composer-action" onClick={() => fileInputRef.current?.click()} aria-label="Attach a file" title="Attach file"><Icon name="paperclip" size={19} /></button>
                <textarea ref={messageInputRef} rows="1" value={messageText} onChange={(event) => setMessageText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); handleSend(event) } }} placeholder="Write a message..." aria-label="Write a message" />
                <span className="composer-hint">Enter to send · Shift + Enter for new line</span>
                <button type="button" className="composer-action emoji-action" onClick={() => setMessageText((text) => text + ' :)')} aria-label="Add a smile" title="Add a smile"><Icon name="smile" size={19} /></button>
                <button type="submit" className="send-button" disabled={!messageText.trim()} aria-label="Send message"><Icon name="send" size={17} /></button>
              </div>
              <div className="composer-footnote"><span>Messages are shown here as a local preview</span><span><Icon name="shield" size={12} /> Private by design</span></div>
            </form>
          </section>
        ) : (
          <div className="main-empty"><Icon name="message" size={28} /><h2>Your conversations, all in one place.</h2><p>Choose a person to start chatting.</p><button className="primary-button" onClick={() => setShowNewChat(true)}><Icon name="plus" size={16} /> New conversation</button></div>
        )}
      </main>

      {showDetails && activeConversation && (
        <aside className="details-panel">
          <div className="details-header"><strong>Contact details</strong><button className="icon-button" onClick={() => setShowDetails(false)} aria-label="Close details"><Icon name="close" /></button></div>
          <div className="details-person">
            <Avatar person={activeConversation} size="profile" showStatus />
            <strong>{activeConversation.name}</strong>
            <span>{activeConversation.status === 'online' ? 'Active now' : 'Notification member'}</span>
            <div className="details-actions">
              <button onClick={() => showToast('Voice calls are coming soon')}><Icon name="phone" size={17} />Call</button>
              <button onClick={toggleFavorite}><Icon name="star" size={17} />{activeConversation.favorite ? 'Starred' : 'Star'}</button>
            </div>
          </div>
          <div className="details-block"><span className="section-label">ABOUT</span><p>Available for thoughtful conversations and good ideas.</p></div>
          <div className="details-block"><span className="section-label">SHARED FILES</span><div className="shared-file"><Icon name="file" size={18} /><span><strong>Brand exploration.fig</strong><small>Shared today</small></span></div></div>
          <div className="details-foot"><Icon name="shield" size={15} /> Your conversations stay yours.</div>
        </aside>
      )}

      {showNewChat && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowNewChat(false) }}>
          <section className="new-chat-modal" role="dialog" aria-modal="true" aria-labelledby="new-chat-title">
            <div className="modal-heading">
              <div><div className="eyebrow">MAKE A CONNECTION</div><h2 id="new-chat-title">New conversation</h2><p>Who would you like to talk to?</p></div>
              <button className="icon-button" onClick={() => setShowNewChat(false)} aria-label="Close new conversation"><Icon name="close" /></button>
            </div>
            <label className="search-box modal-search"><Icon name="search" size={17} /><input autoFocus value={newChatSearch} onChange={(event) => setNewChatSearch(event.target.value)} placeholder="Find someone by name" /></label>
            <div className="directory-list">
              {filteredDirectory.length ? filteredDirectory.map((person) => (
                <button className="directory-person" key={person.id} onClick={() => startConversation(person)}>
                  <Avatar person={person} size="lg" showStatus />
                  <span><strong>{person.name}</strong><small>{person.status === 'online' ? 'Active now' : 'Available to chat'}</small></span>
                  <Icon name="arrowLeft" size={16} className="directory-arrow" />
                </button>
              )) : <div className="directory-empty">No people found. Try another name.</div>}
            </div>
            <div className="modal-footnote">Demo contacts are local sample data. Real people will appear after account setup.</div>
          </section>
        </div>
      )}

      {toast && <div className="toast-message"><span className="toast-check"><Icon name="check" size={14} /></span>{toast}</div>}
    </div>
  )
}

export default App
