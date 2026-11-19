# Converly chat repair — deployment and verification

This branch contains the Firebase chat synchronization and privacy repair. It is deliberately separate from `main`. Merge the existing blank-screen/emoji repair PR first, then merge this repair PR into its base branch. Do not publish the rules or Worker before reviewing them against the Firebase project.

## What changed

- Direct and group text messages, replies, edits, deletion tombstones and reactions are stored in Firestore and synchronized through listeners.
- Group conversations and member roles are stored in Firestore. Only accepted friends can be invited; admins control member and moderator changes.
- Read receipts and unread counts use per-recipient `readBy` data. The first read sets the fixed 24-hour expiry field.
- Presence visibility is gated by the user's last-seen preference and reciprocal accepted-friend entries.
- Typing records are stored below each conversation in Firestore, so conversation membership rules protect them.
- The ImageKit/Cloudflare Worker checks conversation membership and direct-chat blocking. View-once opens are claimed per recipient and do not return a reusable ImageKit URL.
- The Worker CORS list includes the production site `https://converly.vercel.app`.

## 1. Check the frontend build

From the repository root in PowerShell:

```powershell
npm ci
npm test
npm run lint
npm run build
```

The CI workflow runs the same steps plus `npm audit --audit-level=high`.

## 2. Deploy Firebase rules

First sign in and confirm that the selected Firebase project is `notification-32ea1`:

```powershell
firebase login
firebase projects:list
firebase use notification-32ea1
firebase deploy --only firestore:rules,database --project notification-32ea1
```

Check both deployments in Firebase Console. The `firestore.rules` file is the Firestore rule set; `database.rules.json` is for Realtime Database. Do not use these rules with another Firebase project without reviewing its user and friendship data model.

### Enable message expiry cleanup

The app hides messages after their `expiresAt` timestamp and the media Worker refuses an expired image. For Firestore to delete expired message documents automatically, create a Firestore TTL policy:

- Collection group: `messages`
- Timestamp field: `expiresAt`

TTL cleanup is asynchronous; the client and Worker checks enforce expiry while the backend cleanup catches up. Do not configure TTL on `createdAt`.

## 3. Deploy the media Worker

The repository root `wrangler.toml` targets the existing Worker named `notification-api`. Confirm the Cloudflare account before deploying. Set the secrets without pasting their values into the repository:

```powershell
npx wrangler login
npx wrangler secret put FIREBASE_WEB_API_KEY
npx wrangler secret put IMAGEKIT_PUBLIC_KEY
npx wrangler secret put IMAGEKIT_PRIVATE_KEY
npx wrangler deploy
```

The Worker uses `FIREBASE_PROJECT_ID`, `IMAGEKIT_URL_ENDPOINT` and `ALLOWED_ORIGINS` from `wrangler.toml`. The private ImageKit key must remain a Cloudflare secret. Confirm the deployed Worker still serves:

```text
https://notification-api.mediatoolkit.workers.dev/health
```

It should return the worker health response. If you use another production domain, add its exact origin to `ALLOWED_ORIGINS` and redeploy the Worker.

## 4. Confirm Vercel environment settings

The Vercel production deployment must have the required `VITE_FIREBASE_*` values, including `VITE_FIREBASE_DATABASE_URL`, and `VITE_NOTIFICATION_API_URL=https://notification-api.mediatoolkit.workers.dev`. Redeploy the Vercel frontend after merging the branch and checking its environment settings.

## 5. Two-account acceptance test

Use two different Gmail accounts that have completed registration and accepted each other's friend request.

1. Send text in both directions; verify both browsers receive it without refresh.
2. Reply to a message, edit a sent message, delete a sent message, and react from both accounts. Verify state survives reload.
3. Create a group with at least three accepted friends. Verify each member sees the same group, send text in the group, promote/remove a moderator, add a member, and leave the group.
4. Open a received conversation to check read receipts and unread counts on the other account. Confirm a message expires 24 hours after first read.
5. Set last-seen visibility to `nobody`, `contacts` and `everyone`; verify access from a friend and a non-friend account.
6. Block a direct contact from one account. Confirm new direct text and media sends are rejected in both the UI and Firebase rules.
7. Send a view-once image to a one-to-one chat and to a group. Confirm each recipient can open once, a second open is denied, a different group recipient gets their own first open, and the sender can open their sent copy once from their own account.
8. Test the live Vercel site, not only localhost, including image upload/open from the production origin.

## Security notes and limits

- A view-once flow limits access through the application and avoids exposing a permanent media URL. It cannot stop a recipient from taking a screenshot, photographing the screen or using screen recording.
- The automated tests currently cover the message/group data-normalization helpers. They are not a substitute for Firebase Emulator Suite rules tests or the two-account acceptance test above.
- This branch has not deployed Firebase rules, Cloudflare Worker code or Vercel production assets. Deploy those only after reviewing and merging the PR.
