import admin from 'firebase-admin';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require('/Users/samuelsako/Desktop/dygiko-main-firebase-adminsdk-fbsvc-b2477d23c9.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// Parse "DD/MM/YYYY" → Firestore Timestamp (falls back to null if blank/invalid)
function parseDate(str) {
  if (!str || str.trim() === '' || str.trim() === '—') return null;
  // Try DD/MM/YYYY
  const m = str.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const d = new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]));
    if (!isNaN(d.getTime())) return admin.firestore.Timestamp.fromDate(d);
  }
  // Try ISO
  const d = new Date(str.trim());
  if (!isNaN(d.getTime())) return admin.firestore.Timestamp.fromDate(d);
  return null;
}

function parseBool(str) {
  if (typeof str === 'boolean') return str;
  return String(str).trim().toLowerCase() === 'yes' || String(str).trim() === '1';
}

function parseNum(str) {
  const n = parseInt(str);
  return isNaN(n) ? 0 : n;
}

async function migrateCallList() {
  const snap = await db.collection('callList').get();
  console.log(`callList: ${snap.size} documents`);

  let migrated = 0, skipped = 0;
  const batch_size = 400;
  let batch = db.batch();
  let ops = 0;

  for (const docSnap of snap.docs) {
    const d = docSnap.data();

    // Skip already-migrated docs (have camelCase businessName)
    if (d.businessName !== undefined) { skipped++; continue; }

    // Map CSV headers → camelCase fields
    const newData = {
      businessName:  (d['Business']        ?? '').trim(),
      address:       (d['Address']         ?? '').trim(),
      phone:         (d['Phone']           ?? '').trim(),
      googleMapsUrl: (d['Google Maps URL'] ?? '').trim(),
      placeId:       (d['Place ID']        ?? '').trim(),
      category:      (d['Category']        ?? '').trim(),
      status:        (d['Status']          ?? 'New').trim(),
      notes:         (d['Notes']           ?? '').trim(),
      callCount:     parseNum(d['Call Count'] ?? d['callCount'] ?? 0),
      movedToLeads:  parseBool(d['Moved to Leads'] ?? false),
      pscName:       (d['PSC Name']        ?? '').trim(),
      dateAdded:     parseDate(d['Date Added'] ?? d['dateAdded'] ?? ''),
    };

    // Remove all old fields and set new ones
    const ref = db.collection('callList').doc(docSnap.id);
    batch.set(ref, newData);
    ops++;
    migrated++;

    if (ops >= batch_size) {
      await batch.commit();
      console.log(`  Committed ${ops} callList docs...`);
      batch = db.batch();
      ops = 0;
    }
  }

  if (ops > 0) await batch.commit();
  console.log(`callList done: ${migrated} migrated, ${skipped} already correct`);
}

async function migrateLeads() {
  const snap = await db.collection('leads').get();
  console.log(`leads: ${snap.size} documents`);

  let migrated = 0, skipped = 0;
  let batch = db.batch();
  let ops = 0;

  for (const docSnap of snap.docs) {
    const d = docSnap.data();

    if (d.businessName !== undefined) { skipped++; continue; }

    const newData = {
      businessName:      (d['Business']  ?? '').trim(),
      contactName:       (d['Contact']   ?? '').trim(),
      email:             (d['Email']     ?? '').trim(),
      phone:             (d['Phone']     ?? '').trim(),
      address:           (d['Address']   ?? '').trim(),
      category:          (d['Category']  ?? '').trim(),
      googleMapsUrl:     (d['Google Maps URL'] ?? '').trim(),
      placeId:           (d['Place ID']  ?? '').trim(),
      stage:             (d['Stage']     ?? 'Pending/Callback').trim(),
      package:           (d['Package']   ?? '').trim(),
      notes:             (d['Notes']     ?? '').trim(),
      emailSentInterest: parseBool(d['Email Sent Interest'] ?? false),
      emailSentClosed:   parseBool(d['Email Sent Closed']   ?? false),
      dateAdded:         parseDate(d['Date'] ?? d['dateAdded'] ?? ''),
    };

    batch.set(db.collection('leads').doc(docSnap.id), newData);
    ops++;
    migrated++;

    if (ops >= 400) {
      await batch.commit();
      console.log(`  Committed ${ops} leads docs...`);
      batch = db.batch();
      ops = 0;
    }
  }

  if (ops > 0) await batch.commit();
  console.log(`leads done: ${migrated} migrated, ${skipped} already correct`);
}

async function migrateSearchHistory() {
  // The searchHistory was stored as a collection from the CSV - check what's there
  const colSnap = await db.collection('searchHistory').get();
  if (!colSnap.empty) {
    console.log(`searchHistory collection: ${colSnap.size} docs — consolidating into config/searchHistory...`);
    const entries = [];
    for (const d of colSnap.docs) {
      const row = d.data();
      // CSV row might be { keyword: '...', postcode: '...' } or { '0': '...::...' }
      const combo = row.entry ?? row['0'] ?? (row.keyword && row.postcode ? `${row.keyword}::${row.postcode}` : null);
      if (combo) entries.push(combo.trim());
    }
    await db.collection('config').doc('searchHistory').set({ entries }, { merge: true });
    console.log(`searchHistory: wrote ${entries.length} entries to config/searchHistory`);
  } else {
    console.log('searchHistory collection: empty or not found (may already be in config/searchHistory)');
    const configDoc = await db.collection('config').doc('searchHistory').get();
    if (configDoc.exists) {
      console.log(`config/searchHistory exists with ${configDoc.data()?.entries?.length ?? 0} entries`);
    } else {
      console.log('config/searchHistory also missing — no search history to migrate');
    }
  }
}

async function main() {
  console.log('=== Starting field migration ===');
  await migrateCallList();
  await migrateLeads();
  await migrateSearchHistory();
  console.log('=== Migration complete ===');
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
