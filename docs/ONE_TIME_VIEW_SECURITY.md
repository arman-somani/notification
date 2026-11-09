# View-once image security design

## Required behavior
Every image sent in Notification is automatically view-once; there is no toggle or normal-image mode. The sender sees their sent image in their own chat, but that does not consume the recipient's open. The recipient sees a locked preview and must explicitly open it. On the first successful open, it is consumed and cannot be opened again from Notification.

## Do not use a permanent Storage URL
Hiding an image after rendering it, deleting a React component, or changing localStorage is not security. A client can replay requests and a permanent download URL can be reused.

## Recommended flow
1. Upload the image through the authenticated Cloudflare Worker to a private ImageKit asset associated with its conversation and message.
2. Store metadata only: conversation ID, sender ID, eligible recipient/member scope, object path, viewOnce=true, consumedAt=null, and expiry.
3. Keep the ImageKit file private. Do not store or return its permanent public delivery URL to the browser.
4. Recipient calls the authenticated Cloudflare Worker route POST /media/open with their Firebase ID token, conversation ID, and message ID.
5. The function verifies identity, membership, recipient eligibility, block state, expiry, and that consumedAt is still null.
6. The function atomically claims the message in a Firestore transaction. Only one concurrent request can win.
7. Stream the private ImageKit bytes through the authenticated Worker response. Do not return a reusable permanent public URL.
8. Further recipient requests fail as consumed/expired. Delete the ImageKit object asynchronously after its retention window.
9. UI replaces the image with an Opened or Expired placeholder.

## Important limitations
- A browser cannot reliably prevent screenshots, screen recording, developer-tools capture, or photographing the display.
- Once image bytes reach a recipient's device, no web app can guarantee the recipient did not copy them.
- The accurate promise is one successful in-app open, not impossible to save.
- Rate-limit and audit the endpoint. Do not log image bytes or private message contents.
- If end-to-end encryption is adopted later, redesign the flow so the service cannot decrypt the image.

## Acceptance tests
- Every new image message is created as viewOnce=true by default.
- There is no user-selectable off switch or normal-image path.
- Authorized recipient can explicitly open once.
- Two simultaneous open requests result in exactly one success.
- Sender can still see their own sent image but cannot consume the recipient's view.
- Non-members and blocked users cannot open.
- Expired images cannot open.
- Replayed requests cannot open again.
- No permanent public download URL is exposed.
- Consumed state persists after reload and on another device.
