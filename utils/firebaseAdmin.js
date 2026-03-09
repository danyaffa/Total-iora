// FILE: /utils/firebaseAdmin.js

import * as admin from "firebase-admin";
import { initializeApp as initClientApp, getApps as getClientApps, getApp as getClientApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, collection as fsCollection, query, where, getDocs } from "firebase/firestore";
import serviceAccount from "./serviceAccountKey.json";

function ensureInitialized() {
  if (admin.apps.length) return true;

  // Use bundled service account directly — env vars are unreliable on Vercel
  const projectId = serviceAccount.project_id;
  const clientEmail = serviceAccount.client_email;
  const privateKey = serviceAccount.private_key;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn("[firebaseAdmin] Service account key missing fields");
    return false;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
    console.log("[firebaseAdmin] Admin SDK initialized successfully with bundled service account");
    return true;
  } catch (err) {
    console.error("[firebaseAdmin] Admin SDK initialization FAILED:", err.message || err);
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
// REST API fallback — uses service account credentials to call Firestore
// REST API directly, bypassing both Admin SDK init and Firestore rules.
// ---------------------------------------------------------------------------
import { createSign } from "crypto";

let _restAccessToken = null;
let _restTokenExpiry = 0;

async function getRestAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (_restAccessToken && now < _restTokenExpiry - 60) return _restAccessToken;

  const clientEmail = serviceAccount.client_email;
  const privateKey = serviceAccount.private_key;

  if (!clientEmail || !privateKey || !privateKey.includes("-----BEGIN")) {
    return null;
  }

  // Create JWT manually using Node.js crypto
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const iat = now;
  const exp = now + 3600;
  const payload = Buffer.from(JSON.stringify({
    iss: clientEmail,
    sub: clientEmail,
    aud: "https://oauth2.googleapis.com/token",
    iat,
    exp,
    scope: "https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/cloud-platform",
  })).toString("base64url");

  const signInput = `${header}.${payload}`;

  let signature;
  try {
    const sign = createSign("RSA-SHA256");
    sign.update(signInput);
    signature = sign.sign(privateKey, "base64url");
  } catch (err) {
    console.error("[firebaseAdmin] REST fallback: JWT signing failed:", err.message);
    return null;
  }

  const jwt = `${signInput}.${signature}`;

  // Exchange JWT for access token
  try {
    const resp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    });
    const data = await resp.json();
    if (data.access_token) {
      _restAccessToken = data.access_token;
      _restTokenExpiry = now + (data.expires_in || 3600);
      console.log("[firebaseAdmin] REST fallback: got access token OK");
      return _restAccessToken;
    }
    console.error("[firebaseAdmin] REST fallback: token exchange failed:", data.error, data.error_description);
    return null;
  } catch (err) {
    console.error("[firebaseAdmin] REST fallback: token fetch error:", err.message);
    return null;
  }
}

function firestoreRestUrl(projectId, path) {
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}`;
}

/** Convert a JS value to Firestore REST API Value format */
function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === "boolean") return { booleanValue: val };
  if (typeof val === "number") return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  if (typeof val === "string") return { stringValue: val };
  if (val instanceof Date) return { timestampValue: val.toISOString() };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFirestoreValue) } };
  if (typeof val === "object") {
    const fields = {};
    for (const [k, v] of Object.entries(val)) fields[k] = toFirestoreValue(v);
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

/** Convert Firestore REST Value back to JS */
function fromFirestoreValue(val) {
  if ("nullValue" in val) return null;
  if ("booleanValue" in val) return val.booleanValue;
  if ("integerValue" in val) return parseInt(val.integerValue, 10);
  if ("doubleValue" in val) return val.doubleValue;
  if ("stringValue" in val) return val.stringValue;
  if ("timestampValue" in val) return new Date(val.timestampValue);
  if ("arrayValue" in val) return (val.arrayValue.values || []).map(fromFirestoreValue);
  if ("mapValue" in val) {
    const obj = {};
    for (const [k, v] of Object.entries(val.mapValue.fields || {})) obj[k] = fromFirestoreValue(v);
    return obj;
  }
  return null;
}

function fromFirestoreDoc(docData) {
  if (!docData || !docData.fields) return {};
  const obj = {};
  for (const [k, v] of Object.entries(docData.fields)) obj[k] = fromFirestoreValue(v);
  return obj;
}

/** Build Admin-SDK-compatible interface using Firestore REST API */
function buildRestDb(projectId, getToken) {
  function buildCollectionRef(collName) {
    const constraints = [];

    const chainable = {
      doc(docId) {
        const docPath = `${collName}/${docId}`;
        return {
          async get() {
            const token = await getToken();
            if (!token) throw new Error("REST fallback: could not get access token");
            const resp = await fetch(firestoreRestUrl(projectId, docPath), {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (resp.status === 404) return { exists: false, data() { return undefined; } };
            if (!resp.ok) {
              const err = await resp.text();
              throw new Error(`Firestore REST GET failed (${resp.status}): ${err}`);
            }
            const doc = await resp.json();
            return { exists: true, data() { return fromFirestoreDoc(doc); } };
          },
          async set(data, _options) {
            const token = await getToken();
            if (!token) throw new Error("REST fallback: could not get access token");
            const fields = {};
            for (const [k, v] of Object.entries(data)) fields[k] = toFirestoreValue(v);
            const resp = await fetch(firestoreRestUrl(projectId, docPath), {
              method: "PATCH",
              headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
              body: JSON.stringify({ fields }),
            });
            if (!resp.ok) {
              const err = await resp.text();
              throw new Error(`Firestore REST SET failed (${resp.status}): ${err}`);
            }
          },
          async update(data) {
            const token = await getToken();
            if (!token) throw new Error("REST fallback: could not get access token");
            const fields = {};
            const fieldPaths = [];
            for (const [k, v] of Object.entries(data)) {
              fields[k] = toFirestoreValue(v);
              fieldPaths.push(k);
            }
            const mask = fieldPaths.map((f) => `updateMask.fieldPaths=${encodeURIComponent(f)}`).join("&");
            const resp = await fetch(`${firestoreRestUrl(projectId, docPath)}?${mask}`, {
              method: "PATCH",
              headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
              body: JSON.stringify({ fields }),
            });
            if (!resp.ok) {
              const err = await resp.text();
              throw new Error(`Firestore REST UPDATE failed (${resp.status}): ${err}`);
            }
          },
          async delete() {
            const token = await getToken();
            if (!token) throw new Error("REST fallback: could not get access token");
            const resp = await fetch(firestoreRestUrl(projectId, docPath), {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!resp.ok) {
              const err = await resp.text();
              throw new Error(`Firestore REST DELETE failed (${resp.status}): ${err}`);
            }
          },
        };
      },
      where(_field, _op, _value) {
        constraints.push({ field: _field, op: _op, value: _value });
        return chainable;
      },
      async get() {
        const token = await getToken();
        if (!token) throw new Error("REST fallback: could not get access token");
        if (constraints.length > 0) {
          // Use runQuery for where() queries
          const structuredQuery = {
            from: [{ collectionId: collName }],
            where: {
              compositeFilter: {
                op: "AND",
                filters: constraints.map((c) => ({
                  fieldFilter: {
                    field: { fieldPath: c.field },
                    op: c.op === "==" ? "EQUAL" : c.op === "!=" ? "NOT_EQUAL" : c.op === "<" ? "LESS_THAN" : c.op === "<=" ? "LESS_THAN_OR_EQUAL" : c.op === ">" ? "GREATER_THAN" : c.op === ">=" ? "GREATER_THAN_OR_EQUAL" : "EQUAL",
                    value: toFirestoreValue(c.value),
                  },
                })),
              },
            },
          };
          const resp = await fetch(
            `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`,
            {
              method: "POST",
              headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
              body: JSON.stringify({ structuredQuery }),
            }
          );
          if (!resp.ok) {
            const err = await resp.text();
            throw new Error(`Firestore REST QUERY failed (${resp.status}): ${err}`);
          }
          const results = await resp.json();
          const docs = results
            .filter((r) => r.document)
            .map((r) => {
              const name = r.document.name;
              const id = name.split("/").pop();
              return { id, exists: true, data() { return fromFirestoreDoc(r.document); } };
            });
          return {
            size: docs.length,
            empty: docs.length === 0,
            docs,
            forEach(cb) { docs.forEach(cb); },
          };
        }
        // List all documents in collection
        const resp = await fetch(firestoreRestUrl(projectId, collName), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) {
          const err = await resp.text();
          throw new Error(`Firestore REST LIST failed (${resp.status}): ${err}`);
        }
        const data = await resp.json();
        const docs = (data.documents || []).map((d) => {
          const id = d.name.split("/").pop();
          return { id, exists: true, data() { return fromFirestoreDoc(d); } };
        });
        return {
          size: docs.length,
          empty: docs.length === 0,
          docs,
          forEach(cb) { docs.forEach(cb); },
        };
      },
    };

    return chainable;
  }

  return { collection: buildCollectionRef };
}

let _restDb = undefined;

function getRestFirestore() {
  if (_restDb !== undefined) return _restDb;

  const projectId = serviceAccount.project_id;
  const clientEmail = serviceAccount.client_email;
  const privateKey = serviceAccount.private_key;

  if (!projectId || !clientEmail || !privateKey || !privateKey.includes("-----BEGIN")) {
    console.warn("[firebaseAdmin] REST fallback: bundled service account missing fields");
    _restDb = null;
    return null;
  }

  console.log("[firebaseAdmin] REST fallback: using bundled service account");
  _restDb = buildRestDb(projectId, getRestAccessToken);
  return _restDb;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** @returns {admin.firestore.Firestore | object | null} */
export function getAdminDb() {
  // Prefer Admin SDK
  if (ensureInitialized()) return admin.firestore();

  // Fallback 1: REST API with service account (bypasses Firestore rules)
  const restDb = getRestFirestore();
  if (restDb) {
    console.log("[firebaseAdmin] Using REST API fallback (bypasses Firestore rules)");
    return restDb;
  }

  // Fallback 2: Client SDK wrapper (subject to Firestore rules)
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
