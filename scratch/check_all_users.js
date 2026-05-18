import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./SRD-DESKTOP/src/main/resources/service-account.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const auth = getAuth();

async function run() {
  console.log('--- ALL Firebase Users in Auth ---');
  const listUsersResult = await auth.listUsers(100);
  for (const userRecord of listUsersResult.users) {
    console.log(`Auth User: ${userRecord.email} (uid: ${userRecord.uid})`);
  }
  process.exit(0);
}

run().catch(console.error);
