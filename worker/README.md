# Converly media API (Cloudflare Worker)

This Worker uses ImageKit for chat images, not Firebase Storage. It verifies Firebase ID tokens, checks Firestore conversation membership, uploads private ImageKit files, and streams image bytes through an authenticated one-time-open endpoint.

## Required Worker variables/secrets

The checked-in `wrangler.toml` sets the project ID, ImageKit URL endpoint and initial CORS origins.

Set these secrets in Cloudflare:

```powershell
npx wrangler secret put FIREBASE_WEB_API_KEY
npx wrangler secret put IMAGEKIT_PUBLIC_KEY
npx wrangler secret put IMAGEKIT_PRIVATE_KEY
```

- `FIREBASE_WEB_API_KEY`: copy the Web API key from your Firebase Web App config (the value of `VITE_FIREBASE_API_KEY` in your local `.env.local`).
- `IMAGEKIT_PUBLIC_KEY`: copy the public key from ImageKit → Developer options → API keys.
- `IMAGEKIT_PRIVATE_KEY`: copy the private key from ImageKit → Developer options → API keys. Never put it in Vite env, GitHub, or browser code.

Do not paste secret values into chat.

## Deploy

From the repository root:

```powershell
npx wrangler login
npx wrangler deploy
```

Use the same Cloudflare account and Worker name that owns `notification-api.mediatoolkit.workers.dev`. If Wrangler asks to create a new Worker instead of updating the existing one, stop and check the Cloudflare account/name before proceeding.

## API routes

- `GET /health`: health check.
- `POST /media/upload`: Firebase bearer token + multipart `conversationId`, `messageId`, and `file`. Checks Firestore membership and uploads a private ImageKit asset.
- `POST /media/open`: Firebase bearer token + JSON `conversationId` and `messageId`. The sender can preview their image without consuming the recipient's open. Each recipient has an independent Firestore view marker, created atomically with a per-message viewer list; the Worker streams private image bytes without returning a reusable ImageKit URL. The sender can preview their own copy without consuming a recipient view.

The Worker uses the Firestore REST API with the user's Firebase ID token, so Firestore Security Rules continue to apply.

## Production CORS

The production origin `https://converly.vercel.app` is included in `ALLOWED_ORIGINS`. Add any other custom production or preview origin explicitly before deploying. The default list includes localhost and the Firebase Hosting origins for this project.
