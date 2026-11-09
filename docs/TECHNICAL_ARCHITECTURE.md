# Converly — Technical Architecture

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
- ImageKit via Cloudflare Worker: private shared images, with Firebase ID-token verification, Firestore membership checks, and authenticated one-time image streaming.
- Firebase Storage: not used for chat images in the current Spark-plan setup. Voice-note storage remains a separate implementation task.
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
- Chat images are stored as private ImageKit assets under /notification/{conversationId}/ and are never delivered through permanent public URLs.
- The Cloudflare Worker exposes authenticated /media/upload and /media/open routes. It verifies Firebase ID tokens and conversation membership using Firestore Security Rules.
- Firebase Storage voice and story paths remain separate and must not be assumed to be active until configured and tested.

Every shared image is view-once by default. View-once paths must deny direct client reads. A trusted backend must enforce atomic one-open consumption, ensure the sender cannot consume the recipient's open, and avoid reusable public URLs.

## Trusted backend requirements
- Use server timestamps for authoritative times.
- Scheduled sends must be executed by trusted scheduled functions, not browser timers.
- Every message has a fixed retention policy: expire 24 hours after the first recipient seen/read event; users cannot change or disable this duration.
- The trusted backend records the first recipient seenAt using a server timestamp and sets expiresAt = seenAt + 24 hours. Sending time must not start the countdown.
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
