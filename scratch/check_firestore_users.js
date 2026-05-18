import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./SRD-DESKTOP/src/main/resources/service-account.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function run() {
  console.log('--- ALL Firestore Users ---');
  const snap = await db.collection('users').get();
  snap.forEach(doc => {
    console.log(`Firestore User Doc [${doc.id}]:`, doc.data());
  });
  process.exit(0);
}

run().catch(console.error);
