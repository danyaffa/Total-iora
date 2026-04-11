// FILE: /lib/agents/selfHeal.js
// Self-healing agent: runs a series of idempotent checks against the
// running app and tries to auto-correct the fixable issues. Any change
// the agent performs is written to the audit_logs collection.
//
// Checks performed:
//   1. Environment variables present / formats sane
//   2. Firestore is reachable via the Admin SDK or REST fallback
//   3. OpenAI key is present (connectivity is not probed to avoid cost)
//   4. Owner users in OWNER_EMAILS are marked isPaid=true / isOwner=true
//
// All steps swallow their own errors so the agent can report a summary
// even when one step fails.

import { envReport } from "../env";
import { getAdminDb } from "../../utils/firebaseAdmin";
import { writeAudit } from "../audit";
import { logger } from "../logger";

const log = logger.child({ agent: "selfHeal" });

const CRITICAL_ENV = [
  "OPENAI_API_KEY",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "NEXT_PUBLIC_FIREBASE_API_KEY",
];

async function checkEnv() {
  const report = envReport();
  const missing = CRITICAL_ENV.filter((k) => !report[k]?.present);
  return {
    name: "env",
    ok: missing.length === 0,
    detail: missing.length ? { missing } : { ok: true },
  };
}

async function checkFirestore() {
  const db = getAdminDb();
  if (!db) return { name: "firestore", ok: false, detail: { reason: "no_db" } };
  try {
    const ref = db.collection("_healthcheck").doc("ping");
    await ref.set({ ts: new Date() });
    const snap = await ref.get();
    const ok = snap.exists;
    try {
      await ref.delete();
    } catch {
      /* best effort */
    }
    return { name: "firestore", ok, detail: { ok } };
  } catch (err) {
    return {
      name: "firestore",
      ok: false,
      detail: { error: String(err?.message || err).slice(0, 256) },
    };
  }
}

async function healOwners() {
  const owners = (process.env.OWNER_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!owners.length) return { name: "owners", ok: true, detail: { skipped: true } };

  const db = getAdminDb();
  if (!db) return { name: "owners", ok: false, detail: { reason: "no_db" } };

  const patched = [];
  for (const email of owners) {
    try {
      const ref = db.collection("users").doc(email);
      const snap = await ref.get();
      if (!snap.exists) continue;
      const data = snap.data() || {};
      if (!data.isPaid || !data.isOwner) {
        await ref.update({ isPaid: true, isOwner: true });
        patched.push(email);
        writeAudit({
          action: "agent.selfHeal.owner_promoted",
          actor: "selfHeal",
          target: email,
          route: "agent.selfHeal",
        }).catch(() => {});
      }
    } catch (err) {
      log.error("owner_heal_failed", {
        email,
        error: String(err?.message || err),
      });
    }
  }

  return { name: "owners", ok: true, detail: { patched } };
}

export async function runSelfHeal() {
  const start = Date.now();
  const results = [];
  results.push(await checkEnv());
  results.push(await checkFirestore());
  results.push(await healOwners());

  const ok = results.every((r) => r.ok);
  const ms = Date.now() - start;

  writeAudit({
    action: "agent.selfHeal.run",
    actor: "selfHeal",
    route: "agent.selfHeal",
    result: ok ? "success" : "failure",
    meta: { ms, results: results.map((r) => ({ name: r.name, ok: r.ok })) },
  }).catch(() => {});

  log.info("selfHeal.done", { ms, ok });

  return { ok, ms, results };
}
