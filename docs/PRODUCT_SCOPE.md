# Notification — Product Feature Scope

## Product decisions
- Target: complete messaging platform.
- Voice/video calling: excluded.
- AI features: excluded.
- Images: normal image sharing plus a view-once mode.
- Voice messages remain in scope as browser-recorded audio.
- Preserve the existing monochrome Notification UI.

## Messaging
- [ ] One-to-one private conversations
- [ ] Group conversations
- [ ] Sent, delivered, and read receipts
- [ ] Live typing indicators
- [ ] Online presence and last seen
- [ ] Emoji reactions
- [ ] Reply to a message
- [ ] Edit sent messages
- [ ] Delete for me / delete for everyone
- [ ] Forward messages
- [ ] Pin and unpin messages
- [ ] Search message history
- [ ] Unread counters and mark-as-unread
- [ ] Browser voice-note recording and playback
- [ ] Persistent drafts per conversation
- [ ] Scheduled messages
- [ ] Server-enforced disappearing-message expiry

## Image sharing
- [ ] Normal image messages with previews
- [ ] View-once image messages
- [ ] Recipient explicitly opens a view-once image
- [ ] Server atomically consumes the first successful open
- [ ] Consumed/expired placeholder replaces the image
- [ ] No permanent public download URL for view-once images

Security note: a web app cannot prevent screenshots, screen recording, or photographing the screen. View-once means one successful in-app open, not a guarantee that the recipient cannot make a copy.

## People and profiles
- [ ] Search members
- [ ] Unique normalized usernames
- [ ] Public-facing display names
- [ ] Block and unblock users
- [ ] Abuse reports
- [ ] Privacy settings for discoverability, contact requests, presence, last seen, typing, and read receipts
- [ ] Verified-account indicator controlled only by trusted administrators
- [ ] Temporary stories/status updates with expiry
- [ ] QR profile sharing

## Notifications
- [ ] Browser push notifications
- [ ] Group mentions
- [ ] Direct mentions
- [ ] Reply notifications
- [ ] Message sound controls
- [ ] Mute conversations
- [ ] Mark all notifications as read
- [ ] Respect block, mute, and privacy settings before push delivery
- [ ] Hide message previews when requested

## Groups
- [ ] Create and rename groups
- [ ] Owners, admins, and moderators
- [ ] Invite links with expiry and revocation
- [ ] Poll creation and voting
- [ ] Add/remove members
- [ ] Promote/demote roles with permission checks
- [ ] Leave group and transfer ownership
- [ ] Group-level notification preferences

## Administration
- [ ] Admin-only registered-user directory
- [ ] Suspend, deactivate, and reactivate accounts
- [ ] Review abuse reports
- [ ] Moderate groups
- [ ] Investigate spam
- [ ] Review reported messages
- [ ] Usage dashboards
- [ ] Error monitoring
- [ ] Storage consumption monitoring
- [ ] Publish and manage announcements
- [ ] Audit log for sensitive admin actions

## Explicit exclusions
- Voice calls
- Video calls
- AI assistants, summaries, smart replies, and AI moderation

## Delivery order
1. Firebase project, environments, emulator, and secure rules.
2. Authentication, profiles, username uniqueness, and privacy model.
3. Direct messages and durable message operations.
4. Presence, typing, read state, search, drafts, and unread counts.
5. Groups, roles, invite links, polls, and voting.
6. Voice notes and normal image messages.
7. View-once image delivery and disappearing-message expiry.
8. Push notifications, mentions, mute, and notification center.
9. Stories, QR profiles, verification, blocking, and reporting.
10. Admin console, audit logs, usage/error/storage monitoring.
11. Security review, abuse testing, responsive QA, and launch.

## Release rule
A UI control alone does not make a feature production-ready. It must work across separate authenticated accounts/devices, enforce authorization in trusted backend rules/functions, handle failures and retries, and have tests. Local-only demos must be labelled as demos until backend-connected.
