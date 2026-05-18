import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./SRD-DESKTOP/src/main/resources/service-account.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function run() {
  console.log('Querying Saturday bookings for Group F, Software Eng...');
  const snap = await db.collection('bookings')
    .where('college', '==', 'حاسبات ومعلومات')
    .where('department', '==', 'هندسة البرمجيات')
    .where('group', '==', 'F')
    .get();
  
  snap.forEach(doc => {
    const data = doc.data();
    console.log(`Doc: ${doc.id} | Date: ${data.date} | Course: ${data.courseCode} | Type: ${data.lectureType} | Time: ${data.timeFrom}-${data.timeTo} | Slots: ${data.startSlot}-${data.endSlot} | biWeekly: ${data.biWeekly}`);
  });
  process.exit(0);
}

run().catch(console.error);
