# Firebase setup for Notification

This guide prepares the existing React/Vite app for its first real backend connection. Keep the current UI and sample data until authentication and the first Firestore flow have been tested.

## 1. Create the Firebase project

1. Open the Firebase Console: https://console.firebase.google.com/
2. Create a project named **Notification** (or select the project you already created).
3. Add a Web App named **Notification Web**.
4. Copy the Firebase web app configuration. These are public client configuration values; do not copy a service-account JSON key.

## 2. Enable the required Firebase products

- **Authentication:** Get started → Sign-in method → enable Email/Password.
- **Cloud Firestore:** Create database and choose a region deliberately.
- **Realtime Database:** Create database in locked mode.
- **Storage:** Not enabled for chat images. Keep chat images on ImageKit through the Cloudflare Worker; Firebase Storage is not used by this feature. Voice-note uploads need their own configured media path.

Use a nearby supported region for the services where practical. Do not deploy the repository's current rules yet; they are scaffolding and need tightening and emulator tests first.

## 3. Add the Web App config locally

In your local project folder D:\Projects\Notification, create .env.local by copying .env.example, then fill in the values from the Web App config:

    VITE_FIREBASE_API_KEY=...
    VITE_FIREBASE_AUTH_DOMAIN=...
    VITE_FIREBASE_PROJECT_ID=...
    VITE_FIREBASE_STORAGE_BUCKET=...
    VITE_FIREBASE_MESSAGING_SENDER_ID=...
    VITE_FIREBASE_APP_ID=...
    VITE_FIREBASE_DATABASE_URL=...
    VITE_NOTIFICATION_API_URL=https://notification-api.mediatoolkit.workers.dev

The Realtime Database URL is shown in the Firebase Console under Realtime Database. .env.local is ignored by Git. Never put service-account credentials, Admin SDK private keys, or the ImageKit private key in a VITE_* variable. The Notification API URL is public; Worker secrets stay in Cloudflare.

After creating or changing .env.local, restart Vite:

    npm run dev

## 4. Configure the Cloudflare Worker URL

The deployed Worker base URL is `https://notification-api.mediatoolkit.workers.dev`. Its `/health` endpoint has returned the expected health response. Add the base URL to `.env.local` as `VITE_NOTIFICATION_API_URL` (without `/health`). The Worker now exposes authenticated ImageKit upload and one-time-open routes. Set its Firebase Web API key and ImageKit public/private keys as Cloudflare secrets, then deploy the Worker from the repository's wrangler.toml. Test with two separate signed-in accounts.

## 5. Keep credentials private

Do not paste passwords, service-account keys, private keys, or user data into the repository. The ImageKit private key belongs only in Cloudflare Worker Secrets. Firebase Web App configuration and the Worker URL are client configuration, not server secrets.

## 6. Implementation sequence

1. Install the Firebase Web SDK and initialize Auth, Firestore and Realtime Database. Use the Cloudflare Worker and private ImageKit assets for chat images; do not initialize Firebase Storage for chat images in this Spark-plan setup.
2. Add registration, login, logout, auth persistence and a protected app session.
3. Reserve normalized usernames transactionally so two accounts cannot claim the same handle.
4. Move profiles and conversation data into Firestore.
5. Replace demo-only chat data with authenticated real-time listeners.
6. Tighten Firestore/Realtime Database/Storage rules and test them with the Firebase Emulator Suite before deployment.

Until those steps are complete, sample contacts and local browser state remain demo data, not real multi-user messaging.
