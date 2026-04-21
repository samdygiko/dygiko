const admin = require('firebase-admin');
const csv = require('csv-parser');
const fs = require('fs');

const serviceAccount = require('/Users/samuelsako/Desktop/dygiko-main-firebase-adminsdk-fbsvc-b2477d23c9.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function importCSV(filePath, collectionName) {
  const results = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        console.log(`Importing ${results.length} records to ${collectionName}...`);
        for (const row of results) {
          await db.collection(collectionName).add(row);
        }
        console.log(`✅ Done importing ${collectionName}`);
        resolve();
      })
      .on('error', reject);
  });
}

async function main() {
  await importCSV('/Users/samuelsako/Desktop/dygiko-calllist-2026-04-16.csv', 'callList');
  await importCSV('/Users/samuelsako/Desktop/dygiko-leads-2026-04-16.csv', 'leads');
  console.log('🎉 All done!');
  process.exit(0);
}

main().catch(console.error);
