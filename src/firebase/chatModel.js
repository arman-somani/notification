const RETENTION_MS = 24 * 60 * 60 * 1000

export const timestampToMillis = (value) => {
  if (value && typeof value.toMillis === 'function') return value.toMillis()
  if (value && typeof value.toDate === 'function') return value.toDate().getTime()
  if (value instanceof Date) return value.getTime()
  return Number.isFinite(value) ? value : null
}

export const normalizeMessage = (id, data = {}, uid = '') => {
  const createdAt = timestampToMillis(data.createdAt) || Date.now()
  const readAt = timestampToMillis(data.readAt)
  const reactionMap = data.reactions && !Array.isArray(data.reactions) && typeof data.reactions === 'object'
    ? data.reactions
    : {}
  const legacyReactions = Array.isArray(data.reactions) ? data.reactions : []
  const readBy = Array.isArray(data.readBy) ? [...new Set(data.readBy.filter(Boolean))] : []

  return {
    id,
    from: data.senderId === uid ? 'me' : 'them',
    senderId: data.senderId || '',
    sender: data.senderName || '',
    type: data.type || 'text',
    text: data.deletedAt ? '' : (data.text || ''),
    deleted: Boolean(data.deletedAt),
    attachmentPath: data.attachmentPath || '',
    viewOnce: data.viewOnce === true,
    viewed: Boolean(data.viewedByUids?.includes(uid) || (data.senderId !== uid && data.viewedByUid)),
    replyToId: data.replyToId || '',
    replyToText: data.replyToText || '',
    editedAt: timestampToMillis(data.editedAt),
    createdAt,
    readAt,
    expiresAt: timestampToMillis(data.expiresAt) || (readAt ? readAt + RETENTION_MS : null),
    readBy,
    reactionByUid: reactionMap,
    reactions: [...legacyReactions, ...Object.values(reactionMap).filter(Boolean)],
    myReaction: reactionMap[uid] || '',
    forwardedFrom: data.forwardedFrom || '',
    time: new Date(createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    status: data.senderId === uid ? (readBy.some((reader) => reader !== uid) ? 'read' : 'sent') : 'received',
  }
}

export const countUnreadMessages = (documents = [], uid = '') => documents.reduce((count, document) => {
  const data = typeof document?.data === 'function' ? document.data() : document || {}
  if (!data.senderId || data.senderId === uid || data.deletedAt) return count
  const readBy = Array.isArray(data.readBy) ? data.readBy : []
  return readBy.includes(uid) ? count : count + 1
}, 0)

export const mapGroupConversation = (id, data = {}, uid = '') => {
  const memberIds = Array.isArray(data.memberIds) ? [...new Set(data.memberIds.filter(Boolean))] : []
  const adminIds = Array.isArray(data.adminIds) ? data.adminIds : (Array.isArray(data.admins) ? data.admins : [data.createdBy].filter(Boolean))
  const createdAt = timestampToMillis(data.createdAt) || 0
  const lastMessageAt = timestampToMillis(data.lastMessageAt) || timestampToMillis(data.updatedAt) || createdAt
  const title = String(data.title || data.name || 'Group conversation').trim() || 'Group conversation'

  return {
    id,
    firebaseConversationId: id,
    name: title,
    initials: title.split(/\\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
    status: 'group',
    members: memberIds.length + ' members',
    memberIds,
    admins: adminIds.map((adminId) => adminId === uid ? 'you' : adminId),
    adminIds,
    moderators: (Array.isArray(data.moderatorIds) ? data.moderatorIds : []).map((moderatorId) => moderatorId === uid ? 'you' : moderatorId),
    moderatorIds: Array.isArray(data.moderatorIds) ? data.moderatorIds : [],
    preview: data.lastMessagePreview || 'Group created',
    time: lastMessageAt ? new Date(lastMessageAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '',
    lastActivityAt: lastMessageAt,
    unread: 0,
    archived: false,
    muted: false,
    pinned: false,
    favorite: false,
    messages: [],
    createdBy: data.createdBy || '',
  }
}
