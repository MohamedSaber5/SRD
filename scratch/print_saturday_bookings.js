import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./SRD-DESKTOP/src/main/resources/service-account.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function run() {
  console.log('Querying Saturday CSE3201 bookings...');
  const snap = await db.collection('bookings')
    .where('courseCode', '==', 'CSE3201')
    .get();
  
  snap.forEach(doc => {
    const data = doc.data();
    // Parse date to check if it's a Saturday
    // 2026-10-10 is Saturday. 
    const date = new Date(data.date);
    const day = date.getDay(); // 6 is Saturday if week starts on Sunday, or let's just print all of them
    console.log(`Doc: ${doc.id} | Date: ${data.date} | Day: ${data.dayOfWeek} | Time: ${data.timeFrom}-${data.timeTo} | Slots: ${data.startSlot}-${data.endSlot} | biWeekly: ${data.biWeekly} | lecturer: ${data.lecturerName}`);
  });
  process.exit(0);
}

run().catch(console.error);
