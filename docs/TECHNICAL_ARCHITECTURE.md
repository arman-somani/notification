# Notification — Technical Architecture

## Client
- React + Vite single-page application.
- Feature modules: auth, profile, conversations, messages, groups, media, notifications, privacy, stories, reports, and admin.
- Firebase Web SDK isolated behind service modules; components should not issue arbitrary database writes.
- PWA service worker for browser push.
- Local drafts cached per signed-in account, with a shared-device privacy policy.

## Managed backend
- Firebase Authentication: identity, email verification, password reset, optional MFA.
- Cloud Firestore: profiles, username index, conversations, membership, messages, reactions, polls, reports, notifications, stories, and audit records.
- Firebase Realtime Database: presence connections and ephemeral typing state.
- Cloud Storage: normal images and voice-note audio; strict membership, size, and MIME checks.
- Cloud Functions: trusted role changes, scheduled sends, expiry cleanup, push fan-out, reports, admin operations, and view-once authorization/proxy.
- Firebase Cloud Messaging: browser push.
- Firebase App Check: app attestation and abuse reduction.
- Firebase Emulator Suite: local Auth, Firestore, Realtime Database, Storage, and Functions testing.

## Suggested Firestore collections
- users/{uid}
- usernames/{normalizedUsername}
- conversations/{conversationId}
- conversations/{conversationId}/members/{uid}
- conversations/{conversationId}/messages/{messageId}
- conversations/{conversationId}/polls/{pollId}
- conversations/{conversationId}/polls/{pollId}/votes/{uid}
- users/{uid}/inbox/{conversationId}
- users/{uid}/devices/{deviceId}
- users/{uid}/notifications/{notificationId}
- users/{uid}/blocks/{blockedUid}
- stories/{storyId}
- reports/{reportId}
- announcements/{announcementId}
- adminAuditLogs/{eventId}

## Suggested Realtime Database paths
- presence/{uid}/{connectionId}
- typing/{conversationId}/{uid}

Use connection-scoped presence and onDisconnect cleanup. Typing state is ephemeral and should have a short TTL.

## Storage paths
- conversations/{conversationId}/images/{messageId}/{fileName}
- conversations/{conversationId}/voice/{messageId}/{fileName}
- conversations/{conversationId}/view-once/{messageId}/{fileName}
- stories/{uid}/{storyId}/{fileName}

View-once paths must deny direct client reads. A trusted backend must enforce atomic one-open consumption and avoid reusable public URLs.

## Trusted backend requirements
- Use server timestamps for authoritative times.
- Scheduled sends must be executed by trusted scheduled functions, not browser timers.
- Message expiry must be enforced by backend cleanup and access checks, not only by hiding UI.
- Push fan-out must check membership, block lists, mute settings, and privacy preferences.
- Admin roles and verification flags must be controlled by trusted claims/backend operations.
- Admin actions must be audited.
- Cloud Functions using the Admin SDK must explicitly authorize every operation because Admin SDK access bypasses Firestore Security Rules.

## Operational requirements
- Separate development and production Firebase projects.
- Environment variables for web app configuration; never commit service-account keys.
- Firestore, Realtime Database, and Storage rules tests in CI.
- Lint and production build checks on every pull request.
- Error monitoring, budget alerts, backup/retention policy, and abuse/rate controls.
