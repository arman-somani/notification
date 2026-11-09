# Converly admin setup

The only designated Converly admin account is:

`armansomani786@gmail.com`

Admin access requires all of the following:
- The Firebase Authentication user exists for that exact email.
- The Gmail address is verified.
- Firebase Admin SDK has set the `admin: true` custom claim for that user.
- The signed-in client has refreshed its Firebase ID token.

The app checks the exact email and custom claim before showing the Admin navigation item. Firestore rules independently check the exact email, verified-email claim, and `admin: true` custom claim.

## Grant the admin claim

1. Register or sign in to Converly using `armansomani786@gmail.com`.
2. In Firebase Console, open project `notification-32ea1`, then go to **Project settings → Service accounts**.
3. Generate a new private key for the Firebase Admin SDK. Save the downloaded JSON file as:

   `D:\Projects\Notification\firebase-admin-key.json`

   Keep this file private. The repository ignores this filename; never upload it to GitHub or Vercel.
4. In PowerShell:

   ```powershell
   cd D:\Projects\Notification
   npm install --no-save --package-lock=false firebase-admin
   $env:GOOGLE_APPLICATION_CREDENTIALS = (Resolve-Path .\firebase-admin-key.json).Path
   node .\scripts\grant-admin.mjs
   ```

5. If the script prints an email verification link, open it in a browser signed in as the designated Gmail account. Then rerun the script. It will set the custom claim only after Firebase reports that email as verified.
6. Sign out of Converly and sign back in as `armansomani786@gmail.com`. The app refreshes the Firebase ID token at sign-in, then shows the **Admin** option.
7. Deploy the secured Firestore rules:

   ```powershell
   npx firebase-tools deploy --only firestore:rules --project notification-32ea1
   ```

## Notes

- Do not put the service-account JSON or private key into frontend environment variables, Vercel, or GitHub.
- Do not manually create a user document field such as `isAdmin: true`. Admin status comes from Firebase custom claims.
- The Admin dashboard currently shows account/report counts and allows the designated admin to publish platform announcements.
- The Firebase rules protect report reads, announcement writes, and admin audit-log reads independently of the UI.
