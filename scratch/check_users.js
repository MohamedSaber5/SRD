import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./SRD-DESKTOP/src/main/resources/service-account.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const auth = getAuth();

async function run() {
  console.log('--- Firebase Users in Auth ---');
  const listUsersResult = await auth.listUsers(100);
  for (const userRecord of listUsersResult.users) {
    if (userRecord.email.includes('student')) {
      console.log(`Auth User: ${userRecord.email} (uid: ${userRecord.uid})`);
    }
  }

  console.log('\n--- Firestore Users ---');
  const snap = await db.collection('users').get();
  snap.forEach(doc => {
    const data = doc.data();
    if (data.email && data.email.includes('student')) {
      console.log(`Firestore User Doc [${doc.id}]:`, data);
    }
  });

  process.exit(0);
}

run().catch(console.error);
