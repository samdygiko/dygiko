/**
 * Import CSV files → dygiko-hosting-a733a Firestore
 * Usage: node import-firestore.mjs
 * Run AFTER export-firestore.mjs has produced callList.csv and leads.csv
 */
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const key = require("./dygiko-key.json");

const app = initializeApp({ credential: cert(key) }, "dst");
const db = getFirestore(app);

const COLLECTIONS = ["callList", "leads"];
const CSV_DIR = "/Users/samuelsako/Desktop/sako-digital";

// ── CSV parser ────────────────────────────────────────────────────────────────
function parseCsv(content) {
  const lines = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const rows = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    const cells = [];
    let i = 0;
    while (i < line.length) {
      if (line[i] === '"') {
        // Quoted field
        let cell = "";
        i++; // skip opening quote
        while (i < line.length) {
          if (line[i] === '"' && line[i + 1] === '"') {
            cell += '"';
            i += 2;
          } else if (line[i] === '"') {
            i++; // skip closing quote
            break;
          } else {
            cell += line[i++];
          }
        }
        cells.push(cell);
        if (line[i] === ",") i++; // skip comma
      } else {
        const end = line.indexOf(",", i);
        if (end === -1) {
          cells.push(line.slice(i));
          break;
        } else {
          cells.push(line.slice(i, end));
          i = end + 1;
        }
      }
    }
    rows.push(cells);
  }
  return rows;
}

// ── Type inference ────────────────────────────────────────────────────────────
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

function parseValue(raw) {
  if (raw === "") return null;
  if (raw === "true") return true;
  if (raw === "false") return false;
  // ISO timestamp → Firestore Timestamp
  if (ISO_RE.test(raw)) {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return Timestamp.fromDate(d);
  }
  // Number
  if (raw !== "" && !isNaN(Number(raw))) return Number(raw);
  // JSON array or object
  if ((raw.startsWith("[") || raw.startsWith("{")) ) {
    try { return JSON.parse(raw); } catch {}
  }
  // Plain string
  return raw;
}

// ── Import one collection ─────────────────────────────────────────────────────
async function importCollection(name) {
  const path = `${CSV_DIR}/${name}.csv`;
  console.log(`Reading ${path}...`);

  let content;
  try {
    content = readFileSync(path, "utf8");
  } catch {
    console.error(`  File not found: ${path} — skipping`);
    return;
  }

  const rows = parseCsv(content);
  if (rows.length < 2) {
    console.log(`  No data rows — skipping`);
    return;
  }

  const [headers, ...dataRows] = rows;
  const idIdx = headers.indexOf("__id__");

  const docs = dataRows.map((row) => {
    const id = idIdx >= 0 ? row[idIdx] : null;
    const fields = {};
    for (let i = 0; i < headers.length; i++) {
      if (i === idIdx) continue;
      const val = parseValue(row[i] ?? "");
      if (val !== null) fields[headers[i]] = val;
    }
    return { id, fields };
  });

  console.log(`  ${docs.length} docs to write...`);

  // Commit in batches of 500
  for (let i = 0; i < docs.length; i += 500) {
    const batch = db.batch();
    const chunk = docs.slice(i, i + 500);
    for (const { id, fields } of chunk) {
      const ref = id
        ? db.collection(name).doc(id)
        : db.collection(name).doc();
      batch.set(ref, fields);
    }
    await batch.commit();
    console.log(`  wrote ${Math.min(i + 500, docs.length)}/${docs.length}`);
  }

  console.log(`  '${name}' done ✓`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log("Importing CSVs → dygiko-hosting-a733a\n");

for (const col of COLLECTIONS) {
  await importCollection(col);
}

console.log("\nImport complete.");
