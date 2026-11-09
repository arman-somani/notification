import { useEffect, useState } from 'react'
import { addDoc, collection, getCountFromServer, getDocs, limit, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase/client'
import { ADMIN_EMAIL } from './adminConfig'
import './AdminDashboard.css'

const formatDate = (value) => {
  if (!value?.toDate) return 'Just now'
  return value.toDate().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}

export default function AdminDashboard({ onBack }) {
  const [stats, setStats] = useState({ users: null, reports: null, announcements: null })
  const [announcements, setAnnouncements] = useState([])
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadDashboard = async () => {
    if (!db) return
    setLoading(true)
    setError('')
    try {
      const [usersCount, reportsCount, announcementSnapshot] = await Promise.all([
        getCountFromServer(collection(db, 'users')),
        getCountFromServer(collection(db, 'reports')),
        getDocs(query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(8))),
      ])
      const latest = announcementSnapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
      setStats({ users: usersCount.data().count, reports: reportsCount.data().count, announcements: latest.length })
      setAnnouncements(latest)
    } catch (caught) {
      setError(caught?.code === 'permission-denied'
        ? 'Firebase denied admin access. Confirm this account has the admin claim and deploy the latest Firestore rules.'
        : caught?.message || 'Could not load the admin dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const publishAnnouncement = async (event) => {
    event.preventDefault()
    const cleanTitle = title.trim()
    const cleanMessage = message.trim()
    if (!cleanTitle || !cleanMessage || !auth?.currentUser || !db) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await addDoc(collection(db, 'announcements'), {
        title: cleanTitle,
        message: cleanMessage,
        createdBy: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      })
      setTitle('')
      setMessage('')
      setNotice('Announcement published.')
      await loadDashboard()
    } catch (caught) {
      setError(caught?.code === 'permission-denied'
        ? 'Only the designated admin can publish announcements. Refresh your sign-in token and try again.'
        : caught?.message || 'Could not publish the announcement.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="admin-page">
      {onBack && <button type="button" className="admin-mobile-back" onClick={onBack}>← Back to chats</button>}
      <header className="admin-page-header">
        <div>
          <div className="eyebrow">CONVERLY CONTROL</div>
          <h2>Admin dashboard</h2>
          <p>Platform overview and owner-only announcements.</p>
        </div>
        <span className="admin-access-pill"><span /> ADMIN ACCESS</span>
      </header>

      <div className="admin-identity-card">
        <span className="admin-identity-icon">C</span>
        <div><small>DESIGNATED ADMIN ACCOUNT</small><strong>{ADMIN_EMAIL}</strong></div>
        <span className="admin-verified-label">Verified admin</span>
      </div>

      <div className="admin-stat-grid">
        <article className="admin-stat-card"><span>Registered accounts</span><strong>{loading ? '—' : stats.users ?? '—'}</strong><small>Firebase user profiles</small></article>
        <article className="admin-stat-card"><span>Submitted reports</span><strong>{loading ? '—' : stats.reports ?? '—'}</strong><small>Items in the reports collection</small></article>
        <article className="admin-stat-card"><span>Recent announcements</span><strong>{loading ? '—' : stats.announcements ?? '—'}</strong><small>Latest eight shown below</small></article>
      </div>

      {error && <p className="admin-feedback admin-error" role="alert">{error}</p>}
      {notice && <p className="admin-feedback admin-success" role="status">{notice}</p>}

      <div className="admin-content-grid">
        <section className="admin-card">
          <div className="admin-card-heading"><div><span className="eyebrow">PLATFORM UPDATE</span><h3>Publish an announcement</h3></div></div>
          <form className="admin-announcement-form" onSubmit={publishAnnouncement}>
            <label>Announcement title<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={90} placeholder="A short, clear title" required /></label>
            <label>Message<textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={5} maxLength={1200} placeholder="Write an update for Converly users…" required /></label>
            <button type="submit" disabled={saving || !title.trim() || !message.trim()}>{saving ? 'Publishing…' : 'Publish announcement'}</button>
          </form>
        </section>

        <section className="admin-card">
          <div className="admin-card-heading"><div><span className="eyebrow">LATEST UPDATES</span><h3>Announcements</h3></div><button type="button" className="admin-refresh-button" onClick={loadDashboard} disabled={loading}>Refresh</button></div>
          {loading ? <p className="admin-muted">Loading announcements…</p> : announcements.length === 0 ? <p className="admin-muted">No announcements have been published yet.</p> : (
            <div className="admin-announcement-list">
              {announcements.map((item) => <article className="admin-announcement-item" key={item.id}><strong>{item.title || 'Announcement'}</strong><p>{item.message || item.body || ''}</p><time>{formatDate(item.createdAt)}</time></article>)}
            </div>
          )}
        </section>
      </div>
    </section>
  )
}
