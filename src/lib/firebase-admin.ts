import { cert, getApp, getApps, initializeApp, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

// Server-only Firebase Admin SDK — used by the PayPal order routes to write
// paid orders to Firestore without going through client-side auth rules, so
// they show up in the CRM. Requires FIREBASE_SERVICE_ACCOUNT_JSON env var.

let _app: App | null = null;

function getAdminApp(): App {
  if (_app) return _app;
  if (getApps().length) {
    _app = getApp();
    return _app;
  }
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON env var is required");
  }
  const serviceAccount = JSON.parse(raw);
  _app = initializeApp({ credential: cert(serviceAccount) });
  return _app;
}

export function adminDb(): Firestore {
  return getFirestore(getAdminApp());
}
