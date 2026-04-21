/**
 * Firestore migration: sako-digital → dygiko-hosting-a733a
 *
 * Reads from sako-digital via the Firestore REST API (HTTPS, not gRPC) to
 * avoid the gRPC quota / billing issues. Writes to dygiko via Admin SDK.
 */

import { GoogleAuth } from "google-auth-library";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const srcKey = require("./sako-digital-key.json");
const dstKey = require("./dygiko-key.json");

const SRC_PROJECT = "sako-digital";
const COLLECTIONS = ["callList", "leads"];
const PAGE_SIZE = 100;

// ── Auth for REST calls to sako-digital ──────────────────────────────────────
const srcAuth = new GoogleAuth({
  credentials: srcKey,
  scopes: ["https://www.googleapis.com/auth/datastore"],
});

async function getSrcToken() {
  const client = await srcAuth.getClient();
  const { token } = await client.getAccessToken();
  return token;
}

async function restGet(url, token) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`REST ${res.status}: ${body}`);
  }
  return res.json();
}

// Convert a Firestore REST API value to a plain JS value
function fromRestValue(v) {
  if (v.nullValue !== undefined) return null;
  if (v.booleanValue !== undefined) return v.booleanValue;
  if (v.integerValue !== undefined) return Number(v.integerValue);
  if (v.doubleValue !== undefined) return v.doubleValue;
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.timestampValue !== undefined) return new Date(v.timestampValue);
  if (v.arrayValue !== undefined)
    return (v.arrayValue.values || []).map(fromRestValue);
  if (v.mapValue !== undefined)
    return fromRestFields(v.mapValue.fields || {});
  // bytes, geoPoint, reference — return raw for now
  return v;
}

function fromRestFields(fields) {
  const obj = {};
  for (const [k, v] of Object.entries(fields)) {
    obj[k] = fromRestValue(v);
  }
  return obj;
}

// Fetch all documents in a collection via REST (paginated)
async function fetchAllDocs(collection) {
  const base = `https://firestore.googleapis.com/v1/projects/${SRC_PROJECT}/databases/(default)/documents/${collection}`;
  const docs = [];
  let pageToken = null;

  do {
    const token = await getSrcToken();
    const url = pageToken
      ? `${base}?pageSize=${PAGE_SIZE}&pageToken=${encodeURIComponent(pageToken)}`
      : `${base}?pageSize=${PAGE_SIZE}`;

    const data = await restGet(url, token);

    if (data.documents) {
      for (const doc of data.documents) {
        // doc.name = "projects/.../databases/(default)/documents/collection/docId"
        const id = doc.name.split("/").pop();
        const fields = fromRestFields(doc.fields || {});
        docs.push({ id, fields });
      }
      console.log(`  fetched ${docs.length} docs so far...`);
    }

    pageToken = data.nextPageToken || null;
  } while (pageToken);

  return docs;
}

// ── Destination: Admin SDK for dygiko-hosting-a733a ──────────────────────────
const dstApp = initializeApp({ credential: cert(dstKey) }, "dst");
const dstDb = getFirestore(dstApp);

async function writeDocs(collection, docs) {
  let written = 0;
  // Commit in batches of 500 (Firestore limit)
  for (let i = 0; i < docs.length; i += 500) {
    const batch = dstDb.batch();
    const chunk = docs.slice(i, i + 500);
    for (const { id, fields } of chunk) {
      const ref = dstDb.collection(collection).doc(id);
      batch.set(ref, fields);
    }
    await batch.commit();
    written += chunk.length;
    console.log(`  wrote ${written}/${docs.length} docs`);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
console.log(`Starting migration: ${SRC_PROJECT} → dygiko-hosting-a733a\n`);

for (const col of COLLECTIONS) {
  console.log(`\nMigrating '${col}'...`);
  try {
    const docs = await fetchAllDocs(col);
    if (docs.length === 0) {
      console.log(`  (empty — skipping)`);
      continue;
    }
    console.log(`  ${docs.length} docs fetched. Writing to destination...`);
    await writeDocs(col, docs);
    console.log(`  '${col}' done ✓`);
  } catch (err) {
    console.error(`  ERROR on '${col}':`, err.message);
    process.exit(1);
  }
}

console.log("\nMigration complete.");
