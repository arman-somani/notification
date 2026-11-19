import test from 'node:test'
import assert from 'node:assert/strict'
import { countUnreadMessages, mapGroupConversation, normalizeMessage } from './chatModel.js'

const timestamp = (value) => ({ toMillis: () => value })

test('normalizes a synced message including reactions, replies and read receipts', () => {
  const message = normalizeMessage('msg-1', {
    senderId: 'alice',
    text: 'Hello',
    type: 'text',
    createdAt: timestamp(1000),
    editedAt: timestamp(2000),
    replyToId: 'msg-0',
    replyToText: 'Earlier',
    readBy: ['alice', 'bob'],
    reactions: { bob: '❤️', carol: '😂' },
  }, 'alice')

  assert.equal(message.from, 'me')
  assert.equal(message.editedAt, 2000)
  assert.equal(message.replyToId, 'msg-0')
  assert.deepEqual(message.reactions, ['❤️', '😂'])
  assert.equal(message.myReaction, '')
  assert.equal(message.status, 'read')
})

test('normalizes deleted messages without exposing their old text', () => {
  const message = normalizeMessage('msg-2', {
    senderId: 'alice',
    text: 'private text',
    deletedAt: timestamp(3000),
  }, 'bob')

  assert.equal(message.deleted, true)
  assert.equal(message.text, '')
})

test('counts unread incoming messages and ignores sent, read and deleted messages', () => {
  const documents = [
    { senderId: 'alice', readBy: [] },
    { senderId: 'alice', readBy: ['bob'] },
    { senderId: 'bob', readBy: [] },
    { senderId: 'alice', deletedAt: timestamp(1000), readBy: [] },
  ]

  assert.equal(countUnreadMessages(documents, 'bob'), 1)
})

test('maps a persisted group conversation with the current user role', () => {
  const group = mapGroupConversation('group-1', {
    title: 'Weekend plans',
    memberIds: ['alice', 'bob', 'carol'],
    adminIds: ['alice'],
    moderatorIds: ['bob'],
    createdBy: 'alice',
    createdAt: timestamp(100),
  }, 'alice')

  assert.equal(group.status, 'group')
  assert.equal(group.members, '3 members')
  assert.deepEqual(group.admins, ['you'])
  assert.deepEqual(group.moderators, ['bob'])
})
