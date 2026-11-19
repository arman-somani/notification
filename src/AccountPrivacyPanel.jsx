import { useEffect, useState } from 'react'
import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { ref, set as setRealtimeValue } from 'firebase/database'
import { auth, db, realtimeDb } from './firebase/client'

const readList = (key) => {
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}

export default function AccountPrivacyPanel({ profile }) {
  const [displayName, setDisplayName] = useState(() => profile?.displayName || localStorage.getItem('notification-display-name') || 'Your workspace')
  const [username, setUsername] = useState(() => profile?.username || localStorage.getItem('notification-username') || 'notification_user')
  const [usernameLocked, setUsernameLocked] = useState(() => Boolean(profile?.username) || localStorage.getItem('notification-username-locked') === 'true' || Boolean(localStorage.getItem('notification-username')))
  const [bio, setBio] = useState(() => profile?.bio || localStorage.getItem('notification-bio') || '')
  const [messagePrivacy, setMessagePrivacy] = useState(() => profile?.privacy?.whoCanMessage || localStorage.getItem('notification-message-privacy') || 'everyone')
  const [lastSeenPrivacy, setLastSeenPrivacy] = useState(() => profile?.privacy?.whoCanSeeLastSeen || localStorage.getItem('notification-last-seen-privacy') || 'contacts')
  const [groupInvitePrivacy, setGroupInvitePrivacy] = useState(() => profile?.privacy?.whoCanAddToGroups || localStorage.getItem('notification-group-invite-privacy') || 'contacts')
  const [discoverable, setDiscoverable] = useState(() => profile?.privacy?.discoverable ?? (localStorage.getItem('notification-discoverable') !== 'false'))
  const [blockedHandles, setBlockedHandles] = useState(() => readList('notification-blocked-handles'))
  const [blockedLoading, setBlockedLoading] = useState(false)
  const [blockedInput, setBlockedInput] = useState('')
  const [notice, setNotice] = useState('')
  const [reportUsername, setReportUsername] = useState('')
  const [reportReason, setReportReason] = useState('spam')
  const [reportDetails, setReportDetails] = useState('')
  const [reports, setReports] = useState(() => readList('notification-local-reports'))

  useEffect(() => {
    const uid = auth?.currentUser?.uid
    if (!uid || !db) return undefined
    let active = true
    setBlockedLoading(true)
    getDocs(collection(db, 'users', uid, 'blocks')).then((snapshot) => {
      if (active) setBlockedHandles(snapshot.docs.map((item) => item.data().username).filter(Boolean))
    }).catch((error) => {
      if (active) setNotice(error?.message || 'Could not load your blocked accounts.')
    }).finally(() => { if (active) setBlockedLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!profile) return
    setDisplayName(profile.displayName || 'Your workspace')
    setUsername(profile.username || 'notification_user')
    setUsernameLocked(Boolean(profile.username))
    setBio(profile.bio || '')
    setMessagePrivacy(profile.privacy?.whoCanMessage || 'everyone')
    setLastSeenPrivacy(profile.privacy?.whoCanSeeLastSeen || 'contacts')
    setGroupInvitePrivacy(profile.privacy?.whoCanAddToGroups || 'contacts')
    setDiscoverable(profile.privacy?.discoverable ?? true)
  }, [profile])

  useEffect(() => {
    localStorage.setItem('notification-message-privacy', messagePrivacy)
    localStorage.setItem('notification-last-seen-privacy', lastSeenPrivacy)
    localStorage.setItem('notification-group-invite-privacy', groupInvitePrivacy)
    localStorage.setItem('notification-discoverable', String(discoverable))
    localStorage.setItem('notification-blocked-handles', JSON.stringify(blockedHandles))
    localStorage.setItem('notification-local-reports', JSON.stringify(reports))
  }, [messagePrivacy, lastSeenPrivacy, groupInvitePrivacy, discoverable, blockedHandles, reports])

  const saveProfile = async () => {
    const normalized = (profile?.username || username).trim().toLowerCase().replace(/^@/, '')
    const cleanDisplayName = displayName.trim()
    if (!cleanDisplayName) {
      setNotice('Please enter a display name.')
      return
    }
    if (!/^[a-z0-9_]{3,20}$/.test(normalized)) {
      setNotice('Your account username is invalid. Please contact support.')
      return
    }
    const uid = auth?.currentUser?.uid
    if (!uid || !db) {
      setNotice('Your account is not connected. Sign in again and retry.')
      return
    }
    try {
      const privacy = {
        whoCanMessage: messagePrivacy,
        whoCanSeeLastSeen: lastSeenPrivacy,
        whoCanAddToGroups: groupInvitePrivacy,
        discoverable,
      }
      await updateDoc(doc(db, 'users', uid), {
        displayName: cleanDisplayName,
        bio: bio.trim(),
        privacy,
        updatedAt: serverTimestamp(),
      })
      if (realtimeDb) await setRealtimeValue(ref(realtimeDb, 'presenceVisibility/' + uid), lastSeenPrivacy)
      localStorage.setItem('notification-display-name', cleanDisplayName)
      localStorage.setItem('notification-username', normalized)
      localStorage.setItem('notification-username-locked', 'true')
      localStorage.setItem('notification-bio', bio.trim())
      setDisplayName(cleanDisplayName)
      setUsername(normalized)
      setUsernameLocked(true)
      window.dispatchEvent(new CustomEvent('notification-profile-updated', { detail: { displayName: cleanDisplayName, username: normalized } }))
      setNotice('Profile and privacy settings saved to your account.')
    } catch (error) {
      setNotice(error?.message || 'Could not save your profile. Please try again.')
    }
  }

  const savePrivacySettings = async () => {
    const uid = auth?.currentUser?.uid
    if (!uid || !db) {
      setNotice('Your account is not connected. Sign in again and retry.')
      return
    }
    try {
      await updateDoc(doc(db, 'users', uid), {
        privacy: {
          whoCanMessage: messagePrivacy,
          whoCanSeeLastSeen: lastSeenPrivacy,
          whoCanAddToGroups: groupInvitePrivacy,
          discoverable,
        },
        updatedAt: serverTimestamp(),
      })
      if (realtimeDb) await setRealtimeValue(ref(realtimeDb, 'presenceVisibility/' + uid), lastSeenPrivacy)
      setNotice('Privacy settings saved to your account.')
    } catch (error) {
      setNotice(error?.message || 'Could not save privacy settings. Please try again.')
    }
  }

  const addBlockedHandle = async () => {
    const handle = blockedInput.trim().toLowerCase().replace(/^@/, '')
    const uid = auth?.currentUser?.uid
    if (!handle || !/^[a-z0-9_]{3,20}$/.test(handle)) { setNotice('Enter a valid username to block.'); return }
    if (handle === username.toLowerCase()) { setNotice('You cannot block your own profile.'); return }
    if (!uid || !db) { setNotice('Sign in again before blocking an account.'); return }
    try {
      const usernameSnapshot = await getDoc(doc(db, 'usernames', handle))
      const targetUid = usernameSnapshot.exists() ? usernameSnapshot.data().uid : ''
      if (!targetUid || targetUid === uid) { setNotice('No account found for that username.'); return }
      await setDoc(doc(db, 'users', uid, 'blocks', targetUid), { uid: targetUid, username: handle, createdAt: serverTimestamp() })
      setBlockedHandles((items) => items.includes(handle) ? items : [...items, handle])
      setBlockedInput('')
      setNotice('@' + handle + ' is blocked. They can no longer message you.')
    } catch (error) { setNotice(error?.message || 'Could not block this account. Please try again.') }
  }

  const removeBlockedHandle = async (handle) => {
    const uid = auth?.currentUser?.uid
    if (!uid || !db) return
    try {
      const usernameSnapshot = await getDoc(doc(db, 'usernames', handle))
      const targetUid = usernameSnapshot.exists() ? usernameSnapshot.data().uid : ''
      if (targetUid) await deleteDoc(doc(db, 'users', uid, 'blocks', targetUid))
      setBlockedHandles((items) => items.filter((item) => item !== handle))
      setNotice('@' + handle + ' has been unblocked.')
    } catch (error) { setNotice(error?.message || 'Could not unblock this account.') }
  }

  const submitReport = () => {
    const target = reportUsername.trim().toLowerCase().replace(/^@/, '')
    if (!/^[a-z0-9_]{3,20}$/.test(target)) { setNotice('Enter a valid username to report.'); return }
    if (target === username.toLowerCase()) { setNotice('You cannot report your own account.'); return }
    setReports((items) => [{ id: 'report-' + Date.now(), target, reason: reportReason, details: reportDetails.trim().slice(0, 1000), createdAt: Date.now(), status: 'saved locally' }, ...items])
    setReportUsername(''); setReportDetails('')
    setNotice('Report saved on this device. It has not been sent to a moderation team.')
  }

  return (
    <section className="settings-section account-privacy-panel">
      <div className="settings-section-title"><strong>Profile & privacy</strong><span>Manage your public details, discoverability and contact preferences</span></div>
      <div className="account-fields-grid">
        <label className="account-field">Display name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={48} /></label>
        <label className="account-field">Username<input value={username} onChange={(event) => setUsername(event.target.value.replace(/^@/, ''))} maxLength={20} readOnly={usernameLocked} aria-readonly={usernameLocked} /><small>{usernameLocked ? 'Username is permanent and cannot be changed after saving.' : '@username · Choose carefully: it cannot be changed after you save your profile.'}</small></label>
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
      <div className="account-panel-actions"><button className="secondary-button" type="button" onClick={savePrivacySettings}>Save privacy settings</button></div>
      <div className="account-divider" />
      <div className="account-subheading"><strong>Blocked usernames</strong><span>Blocked accounts cannot send you messages. Blocking is synced to your account.</span></div>
      <div className="account-inline-input"><input value={blockedInput} onChange={(event) => setBlockedInput(event.target.value)} placeholder="Enter username to block" /><button className="secondary-button" onClick={addBlockedHandle}>Block</button></div>
      {blockedLoading ? <p className="account-muted">Loading blocked accounts…</p> : blockedHandles.length > 0 ? <div className="blocked-handle-list">{blockedHandles.map((handle) => <span key={handle}>@{handle}<button onClick={() => removeBlockedHandle(handle)} aria-label={'Unblock ' + handle}>×</button></span>)}</div> : <p className="account-muted">No blocked usernames saved.</p>}
      <div className="account-divider" />
      <div className="account-subheading"><strong>Report an account</strong><span>Report impersonation, spam, harassment or other abuse.</span></div>
      <div className="account-report-form">
        <label className="account-field">Username<input value={reportUsername} onChange={(event) => setReportUsername(event.target.value.replace(/^@/, ''))} maxLength={20} placeholder="username to report" /></label>
        <label className="account-field">Reason<select value={reportReason} onChange={(event) => setReportReason(event.target.value)}><option value="spam">Spam or scam</option><option value="harassment">Harassment or bullying</option><option value="impersonation">Impersonation</option><option value="inappropriate">Inappropriate content</option><option value="other">Other</option></select></label>
        <label className="account-field account-field-wide">Additional details<textarea value={reportDetails} onChange={(event) => setReportDetails(event.target.value)} rows={2} maxLength={1000} placeholder="Add context (optional)" /></label>
        <button className="secondary-button" type="button" onClick={submitReport}>Submit report</button>
      </div>
      {reports.length > 0 && <div className="local-story-list"><strong>Reports saved on this device</strong>{reports.slice(0, 5).map((report) => <div key={report.id}><span>@{report.target} · {report.reason}</span><small>{new Date(report.createdAt).toLocaleString()} · {report.status}</small></div>)}</div>}
      <div className="verified-note"><span className="verified-label">✓ Verified accounts</span> are assigned by administrators after review. Verification cannot be self-selected.</div>
      {notice && <p className="account-notice" role="status">{notice}</p>}
      <p className="account-security-note">Your display name, bio, privacy preferences and blocked accounts sync to your Firebase account. Report delivery/review and verified badges require administrator review.</p>
    </section>
  )
}
