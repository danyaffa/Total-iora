// FILE: /utils/firebaseAdmin.js

import * as admin from "firebase-admin";
import { initializeApp as initClientApp, getApps as getClientApps, getApp as getClientApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, collection as fsCollection, query, where, getDocs } from "firebase/firestore";

function getPrivateKey() {
  let pk = process.env.FIREBASE_PRIVATE_KEY || "";

  // Log raw key diagnostics (no secrets — just structure info)
  const rawLen = pk.length;
  const rawStart = pk.substring(0, 40);
  const rawEnd = pk.substring(pk.length - 40);

  pk = pk.trim();

  // Strip surrounding quotes (Vercel sometimes wraps values)
  if (pk.startsWith('"') && pk.endsWith('"')) pk = pk.slice(1, -1);
  if (pk.startsWith("'") && pk.endsWith("'")) pk = pk.slice(1, -1);

  // Handle double-escaped newlines (\\\\n → \\n → \n)
  pk = pk.replace(/\\\\n/g, "\\n");
  pk = pk.replace(/\\n/g, "\n");

  // Handle URL-safe base64 private keys (some providers encode this way)
  if (!pk.includes("-----BEGIN") && pk.length > 100) {
    try {
      const decoded = Buffer.from(pk, "base64").toString("utf8");
      if (decoded.includes("-----BEGIN")) {
        pk = decoded;
      }
    } catch (_) {}
  }

  const valid = pk.includes("-----BEGIN") && pk.includes("-----END");

  console.log("[firebaseAdmin] Private key diagnostics:", {
    rawLength: rawLen,
    rawStartsWith: rawStart,
    rawEndsWith: rawEnd,
    processedLength: pk.length,
    containsBeginMarker: pk.includes("-----BEGIN"),
    containsEndMarker: pk.includes("-----END"),
    containsRealNewlines: pk.includes("\n"),
    containsEscapedNewlines: pk.includes("\\n"),
    lineCount: pk.split("\n").length,
    looksValid: valid,
  });

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
    console.log("[firebaseAdmin] Admin SDK initialized successfully, apps:", admin.apps.length);
    return true;
  } catch (err) {
    console.error("[firebaseAdmin] Admin SDK initialization FAILED:", err.message || err);
    console.error("[firebaseAdmin] Error code:", err.code);
    console.error("[firebaseAdmin] Credential details — projectId:", projectId, "clientEmail:", clientEmail);
    console.error("[firebaseAdmin] Private key length:", privateKey.length, "starts with BEGIN:", privateKey.startsWith("-----BEGIN"));
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
 *   db.collection("x").where(...).where(...).get() → { size, forEach() }
 */
function wrapClientDb(firestore) {
  function buildCollectionRef(collName) {
    const collRef = fsCollection(firestore, collName);
    const constraints = [];

    const chainable = {
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
      where(field, op, value) {
        constraints.push(where(field, op, value));
        return chainable;
      },
      async get() {
        const q = constraints.length > 0
          ? query(collRef, ...constraints)
          : collRef;
        const snap = await getDocs(q);
        return {
          size: snap.size,
          empty: snap.empty,
          docs: snap.docs.map((d) => ({
            id: d.id,
            exists: d.exists(),
            data() { return d.data(); },
          })),
          forEach(cb) {
            snap.docs.forEach((d) => {
              cb({
                id: d.id,
                exists: d.exists(),
                data() { return d.data(); },
              });
            });
          },
        };
      },
    };

    return chainable;
  }

  return {
    collection: buildCollectionRef,
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
