// FILE: /utils/firebaseAdmin.js

import * as admin from "firebase-admin";
import { initializeApp as initClientApp, getApps as getClientApps, getApp as getClientApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

function getPrivateKey() {
  let pk = process.env.FIREBASE_PRIVATE_KEY || "";
  pk = pk.trim();
  if (pk.startsWith('"') && pk.endsWith('"')) pk = pk.slice(1, -1);
  if (pk.startsWith("'") && pk.endsWith("'")) pk = pk.slice(1, -1);
  pk = pk.replace(/\\n/g, "\n");
  return pk;
}

function ensureInitialized() {
  if (admin.apps.length) return true;

  const projectId = (
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    ""
  ).trim();
  const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || "").trim();
  const privateKey = getPrivateKey();

  if (!projectId || !clientEmail || !privateKey) {
    console.warn(
      "Firebase Admin missing credentials:",
      "projectId:", projectId ? "SET" : "MISSING",
      "clientEmail:", clientEmail ? "SET" : "MISSING",
      "privateKey:", privateKey ? `SET (${privateKey.length} chars)` : "MISSING"
    );
    return false;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
    return true;
  } catch (err) {
    console.error("Firebase Admin initialization error:", err.message || err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Client SDK fallback — uses NEXT_PUBLIC_* env vars (always available)
// Returns an object with the same .collection().doc() interface as Admin SDK
// ---------------------------------------------------------------------------
let _clientDb = undefined; // undefined = not attempted, null = failed

function getClientFirestore() {
  if (_clientDb !== undefined) return _clientDb;

  const projectId = (
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    ""
  ).trim();
  const apiKey = (process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "").trim();

  if (!projectId || !apiKey) {
    console.warn("Firebase Client SDK fallback: missing projectId or apiKey");
    _clientDb = null;
    return null;
  }

  try {
    const cfg = {
      apiKey,
      authDomain: (process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "").trim() || undefined,
      projectId,
      storageBucket: (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "").trim() || undefined,
      messagingSenderId: (process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "").trim() || undefined,
      appId: (process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "").trim() || undefined,
    };

    const app = getClientApps().length ? getClientApp() : initClientApp(cfg);
    _clientDb = getFirestore(app);
    console.log("Firebase Client SDK fallback: Firestore initialised OK");
    return _clientDb;
  } catch (err) {
    console.error("Firebase Client SDK fallback init error:", err.message || err);
    _clientDb = null;
    return null;
  }
}

/**
 * Wraps the client SDK Firestore instance to match the Admin SDK interface:
 *   db.collection("x").doc("y").get()  → { exists, data() }
 *   db.collection("x").doc("y").set(data, opts)
 *   db.collection("x").doc("y").update(data)
 *   db.collection("x").doc("y").delete()
 */
function wrapClientDb(firestore) {
  return {
    collection(collName) {
      return {
        doc(docId) {
          const docRef = doc(firestore, collName, docId);
          return {
            async get() {
              const snap = await getDoc(docRef);
              return {
                exists: snap.exists(),
                data() { return snap.data(); },
              };
            },
            async set(data, _options) {
              // Admin SDK set() with merge:false is the default for client setDoc
              await setDoc(docRef, data);
            },
            async update(data) {
              await updateDoc(docRef, data);
            },
            async delete() {
              await deleteDoc(docRef);
            },
          };
        },
      };
    },
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** @returns {admin.firestore.Firestore | object | null} */
export function getAdminDb() {
  // Prefer Admin SDK
  if (ensureInitialized()) return admin.firestore();

  // Fallback to client SDK wrapper
  const clientFs = getClientFirestore();
  if (clientFs) return wrapClientDb(clientFs);

  return null;
}

/** @returns {admin.auth.Auth | null} */
export function getAdminAuth() {
  return ensureInitialized() ? admin.auth() : null;
}

// Legacy named exports — try init now, but callers should prefer getAdminDb()
ensureInitialized();
export const adminApp = admin.apps.length ? admin.app() : null;
export const adminDb = adminApp ? admin.firestore() : null;
export const adminAuth = adminApp ? admin.auth() : null;
