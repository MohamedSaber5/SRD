import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./SRD-DESKTOP/src/main/resources/service-account.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function run() {
  console.log('Searching for Walid bookings...');
  const snap = await db.collection('bookings').get();
  let count = 0;
  snap.forEach(doc => {
    const data = doc.data();
    const isWalid = (data.lecturerName && data.lecturerName.includes('Walid')) || 
                    (data.courseCode && data.courseCode.includes('CSE3201')) ||
                    (data.responsibleName && data.responsibleName.includes('Walid'));
    if (isWalid) {
      count++;
      console.log(`\nDoc ID: ${doc.id}`);
      console.log(`Course: ${data.courseName} (${data.courseCode})`);
      console.log(`Lecturer: ${data.lecturerName}`);
      console.log(`Day/Date: ${data.dayOfWeek} / ${data.date}`);
      console.log(`Time: ${data.timeFrom} - ${data.timeTo}`);
      console.log(`Slots: start=${data.startSlot}, end=${data.endSlot}`);
      console.log(`biWeekly (or isBiWeekly): biWeekly=${data.biWeekly}, isBiWeekly=${data.isBiWeekly}`);
      console.log(`source: ${data.source}, status: ${data.status}`);
      console.log(`Full doc:`, JSON.stringify(data, null, 2));
    }
  });
  console.log(`\nFound ${count} matching bookings.`);
  process.exit(0);
}

run().catch(console.error);
