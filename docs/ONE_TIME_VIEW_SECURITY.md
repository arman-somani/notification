# View-once image security design

## Required behavior
A sender can choose View once when attaching an image. The recipient sees a locked preview and must choose Open once. After a successful open, the image becomes consumed and cannot be opened again from Notification.

## Do not use a permanent Storage URL
Hiding an image after rendering it, deleting a React component, or changing localStorage is not security. A client can replay requests and a permanent download URL can be reused.

## Recommended flow
1. Upload the image to a private object path associated with its conversation and message.
2. Store metadata only: conversation ID, sender ID, eligible recipient/member scope, object path, viewOnce=true, consumedAt=null, and expiry.
3. Deny direct Storage reads for the view-once object path.
4. Recipient calls an authenticated HTTPS/callable Cloud Function named openViewOnceImage.
5. The function verifies identity, membership, recipient eligibility, block state, expiry, and that consumedAt is still null.
6. The function atomically claims the message in a Firestore transaction. Only one concurrent request can win.
7. Stream the object through an authenticated one-time response/proxy. Do not return a reusable permanent public URL.
8. Further requests fail as consumed/expired. Delete the object asynchronously after its retention window.
9. UI replaces the image with an Opened or Expired placeholder.

## Important limitations
- A browser cannot reliably prevent screenshots, screen recording, developer-tools capture, or photographing the display.
- Once image bytes reach a recipient's device, no web app can guarantee the recipient did not copy them.
- The accurate promise is one successful in-app open, not impossible to save.
- Rate-limit and audit the endpoint. Do not log image bytes or private message contents.
- If end-to-end encryption is adopted later, redesign the flow so the service cannot decrypt the image.

## Acceptance tests
- Authorized recipient can open once.
- Two simultaneous open requests result in exactly one success.
- Sender cannot consume the recipient's view.
- Non-members and blocked users cannot open.
- Expired images cannot open.
- Replayed requests cannot open again.
- No permanent public download URL is exposed.
- Consumed state persists after reload and on another device.
