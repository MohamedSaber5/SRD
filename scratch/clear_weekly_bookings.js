import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./SRD-DESKTOP/src/main/resources/service-account.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function run() {
  console.log('--- Clearing ALL Firestore Weekly Bookings ---');
  const snap = await db.collection('bookings')
    .where('source', '==', 'weekly_lecture')
    .get();

  console.log(`Found ${snap.size} weekly lecture bookings.`);

  const batch = db.batch();
  snap.forEach(doc => {
    batch.delete(doc.ref);
  });

  if (snap.size > 0) {
    await batch.commit();
    console.log('Successfully deleted all weekly lecture bookings!');
  } else {
    console.log('No weekly bookings found to delete.');
  }
  process.exit(0);
}

run().catch(console.error);
