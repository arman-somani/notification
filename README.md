# Converly

A React + Vite messaging application. The existing monochrome chat interface is being connected to Firebase in staged, testable phases.

## Local development

    npm install
    npm run dev

## Firebase setup

Follow docs/FIREBASE_SETUP.md to create the Firebase project, enable Authentication, Firestore, Realtime Database and Storage, and add the Web App config to an ignored .env.local file.

Do not commit .env.local, service-account JSON files, or Admin SDK private keys.

## Current implementation status

- The current chat UI includes local prototype interactions and sample conversations.
- Local browser state is not a shared backend and does not synchronize between accounts or devices.
- Firebase rules in this repository are scaffolding; do not deploy them to production until they have been tightened and tested.
- Voice/video calling and AI features are out of scope.
- Shared images are always view-once by product design.
- Message retention is fixed at 24 hours after the recipient first sees a message.
- Message drafts and scheduled messages are excluded.

## Project documentation

- Firebase setup: docs/FIREBASE_SETUP.md
- Product scope: docs/PRODUCT_SCOPE.md
- Technical architecture: docs/TECHNICAL_ARCHITECTURE.md
- View-once image security: docs/ONE_TIME_VIEW_SECURITY.md
