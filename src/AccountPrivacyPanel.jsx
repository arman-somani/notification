import { useEffect, useState } from 'react'

const readList = (key) => {
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}

export default function AccountPrivacyPanel() {
  const [displayName, setDisplayName] = useState(() => localStorage.getItem('notification-display-name') || 'Your workspace')
  const [username, setUsername] = useState(() => localStorage.getItem('notification-username') || 'notification_user')
  const [bio, setBio] = useState(() => localStorage.getItem('notification-bio') || '')
  const [messagePrivacy, setMessagePrivacy] = useState(() => localStorage.getItem('notification-message-privacy') || 'everyone')
  const [lastSeenPrivacy, setLastSeenPrivacy] = useState(() => localStorage.getItem('notification-last-seen-privacy') || 'contacts')
  const [groupInvitePrivacy, setGroupInvitePrivacy] = useState(() => localStorage.getItem('notification-group-invite-privacy') || 'contacts')
  const [discoverable, setDiscoverable] = useState(() => localStorage.getItem('notification-discoverable') !== 'false')
  const [blockedHandles, setBlockedHandles] = useState(() => readList('notification-blocked-handles'))
  const [blockedInput, setBlockedInput] = useState('')
  const [storyText, setStoryText] = useState('')
  const [stories, setStories] = useState(() => readList('notification-stories').filter((story) => story.expiresAt > Date.now()))
  const [notice, setNotice] = useState('')

  useEffect(() => {
    localStorage.setItem('notification-display-name', displayName)
    localStorage.setItem('notification-username', username)
    localStorage.setItem('notification-bio', bio)
    localStorage.setItem('notification-message-privacy', messagePrivacy)
    localStorage.setItem('notification-last-seen-privacy', lastSeenPrivacy)
    localStorage.setItem('notification-group-invite-privacy', groupInvitePrivacy)
    localStorage.setItem('notification-discoverable', String(discoverable))
    localStorage.setItem('notification-blocked-handles', JSON.stringify(blockedHandles))
    localStorage.setItem('notification-stories', JSON.stringify(stories))
  }, [displayName, username, bio, messagePrivacy, lastSeenPrivacy, groupInvitePrivacy, discoverable, blockedHandles, stories])

  useEffect(() => {
    const interval = window.setInterval(() => {
      setStories((current) => current.filter((story) => story.expiresAt > Date.now()))
    }, 60000)
    return () => window.clearInterval(interval)
  }, [])

  const saveProfile = () => {
    const normalized = username.trim().toLowerCase().replace(/^@/, '')
    if (!/^[a-z0-9_]{3,20}$/.test(normalized)) {
      setNotice('Username must be 3–20 characters using letters, numbers or underscores.')
      return
    }
    setUsername(normalized)
    setDisplayName(displayName.trim() || 'Your workspace')
    setNotice('Profile saved on this device. Global username uniqueness will be enforced by Firebase.')
  }

  const addBlockedHandle = () => {
    const handle = blockedInput.trim().toLowerCase().replace(/^@/, '')
    if (!handle || !/^[a-z0-9_]{3,20}$/.test(handle)) {
      setNotice('Enter a valid username to block.')
      return
    }
    if (handle === username.toLowerCase()) {
      setNotice('You cannot block your own profile.')
      return
    }
    setBlockedHandles((items) => items.includes(handle) ? items : [...items, handle])
    setBlockedInput('')
    setNotice('Blocked list updated on this device only.')
  }

  const shareStory = () => {
    const value = storyText.trim()
    if (!value) return
    setStories((items) => [{ id: 'story-' + Date.now(), text: value, createdAt: Date.now(), expiresAt: Date.now() + 24 * 60 * 60 * 1000 }, ...items])
    setStoryText('')
    setNotice('Status added locally. It expires after 24 hours on this device.')
  }

  return (
    <section className="settings-section account-privacy-panel">
      <div className="settings-section-title"><strong>Profile & privacy</strong><span>Manage your public details, discoverability and contact preferences</span></div>
      <div className="account-fields-grid">
        <label className="account-field">Display name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={48} /></label>
        <label className="account-field">Username<input value={username} onChange={(event) => setUsername(event.target.value.replace(/^@/, ''))} maxLength={20} /><small>@username · 3–20 letters, numbers or underscores</small></label>
        <label className="account-field account-field-wide">Bio<textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={2} maxLength={160} placeholder="A little about you" /></label>
      </div>
      <div className="account-panel-actions"><button className="secondary-button" onClick={saveProfile}>Save profile</button><span className="account-handle-preview">@{username || 'username'}</span></div>
      <div className="account-divider" />
      <div className="account-privacy-grid">
        <label className="account-field">Who can message me<select value={messagePrivacy} onChange={(event) => setMessagePrivacy(event.target.value)}><option value="everyone">Everyone</option><option value="contacts">Contacts only</option><option value="nobody">Nobody</option></select></label>
        <label className="account-field">Who can see last seen<select value={lastSeenPrivacy} onChange={(event) => setLastSeenPrivacy(event.target.value)}><option value="everyone">Everyone</option><option value="contacts">Contacts only</option><option value="nobody">Nobody</option></select></label>
        <label className="account-field">Who can add me to groups<select value={groupInvitePrivacy} onChange={(event) => setGroupInvitePrivacy(event.target.value)}><option value="everyone">Everyone</option><option value="contacts">Contacts only</option><option value="nobody">Nobody</option></select></label>
      </div>
      <label className="account-discoverability"><input type="checkbox" checked={discoverable} onChange={(event) => setDiscoverable(event.target.checked)} /> Allow people to find me by username</label>
      <div className="account-divider" />
      <div className="account-subheading"><strong>Blocked usernames</strong><span>Blocked accounts cannot contact you once server enforcement is connected.</span></div>
      <div className="account-inline-input"><input value={blockedInput} onChange={(event) => setBlockedInput(event.target.value)} placeholder="Enter username to block" /><button className="secondary-button" onClick={addBlockedHandle}>Block</button></div>
      {blockedHandles.length > 0 ? <div className="blocked-handle-list">{blockedHandles.map((handle) => <span key={handle}>@{handle}<button onClick={() => setBlockedHandles((items) => items.filter((item) => item !== handle))} aria-label={'Unblock ' + handle}>×</button></span>)}</div> : <p className="account-muted">No blocked usernames saved.</p>}
      <div className="account-divider" />
      <div className="account-subheading"><strong>Stories & status</strong><span>Text status updates expire after 24 hours.</span></div>
      <div className="account-inline-input"><input value={storyText} onChange={(event) => setStoryText(event.target.value)} maxLength={180} placeholder="Share a short status…" /><button className="secondary-button" onClick={shareStory} disabled={!storyText.trim()}>Share</button></div>
      {stories.length > 0 && <div className="local-story-list">{stories.map((story) => <div key={story.id}><span>{story.text}</span><small>Expires {new Date(story.expiresAt).toLocaleString()}</small></div>)}</div>}
      <div className="verified-note"><span className="verified-label">✓ Verified accounts</span> are assigned by administrators after review. Verification cannot be self-selected.</div>
      {notice && <p className="account-notice" role="status">{notice}</p>}
      <p className="account-security-note">These settings currently stay in this browser. Firebase Authentication, uniqueness checks, blocking, contact privacy, stories visibility and verified badges need trusted server-side enforcement before public launch.</p>
    </section>
  )
}
