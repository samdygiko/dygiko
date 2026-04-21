/**
 * Export sako-digital Firestore collections → CSV files
 * Usage: node export-firestore.mjs
 */
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { createWriteStream } from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const key = require("./sako-digital-key.json");

const app = initializeApp({ credential: cert(key) }, "src");
const db = getFirestore(app);

const COLLECTIONS = ["callList", "leads"];

function toCell(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return String(value);
  if (typeof value === "number") return String(value);
  // Firestore Timestamp
  if (typeof value === "object" && typeof value.toDate === "function")
    return value.toDate().toISOString();
  // Plain Date
  if (value instanceof Date) return value.toISOString();
  // Array or nested object — serialize as JSON
  if (typeof value === "object") return JSON.stringify(value);
  // String — CSV-escape
  return String(value);
}

function csvRow(cells) {
  return (
    cells
      .map((c) => {
        const s = toCell(c);
        // Wrap in quotes if the value contains comma, quote, or newline
        if (s.includes('"') || s.includes(",") || s.includes("\n")) {
          return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
      })
      .join(",") + "\n"
  );
}

async function exportCollection(name) {
  const outPath = `/Users/samuelsako/Desktop/sako-digital/${name}.csv`;
  console.log(`Fetching '${name}'...`);

  const snap = await db.collection(name).get();

  if (snap.empty) {
    console.log(`  '${name}' is empty — skipping`);
    return;
  }

  // Collect all unique field names across all documents
  const fieldSet = new Set();
  for (const doc of snap.docs) {
    for (const key of Object.keys(doc.data())) fieldSet.add(key);
  }
  const fields = Array.from(fieldSet).sort();
  const headers = ["__id__", ...fields];

  const stream = createWriteStream(outPath, { encoding: "utf8" });
  stream.write(csvRow(headers));

  for (const doc of snap.docs) {
    const data = doc.data();
    const row = [doc.id, ...fields.map((f) => data[f] ?? "")];
    stream.write(csvRow(row));
  }

  await new Promise((resolve, reject) => {
    stream.end(resolve);
    stream.on("error", reject);
  });

  console.log(`  ${snap.size} docs → ${outPath} ✓`);
}

for (const col of COLLECTIONS) {
  await exportCollection(col);
}

console.log("\nExport complete.");
