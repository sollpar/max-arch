# Axiom Archive

A minimal achievement tracking system.

## Setup

1. Copy `.env.example` to `.env`.
2. Fill in your Firebase configuration variables:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_FIRESTORE_DATABASE_ID` (Optional, defaults to `(default)`)

## Development

```bash
npm install
npm run dev
```

## Deployment (Netlify)

This project is configured for Netlify. Ensure you add the environment variables listed above in the Netlify dashboard under **Site settings > Environment variables**.

The `netlify.toml` file handles the build command and SPA routing.
