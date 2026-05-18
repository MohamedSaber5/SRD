import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./SRD-DESKTOP/src/main/resources/service-account.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const ODD_SATURDAYS = [
  '2026-10-03',
  '2026-10-17',
  '2026-10-31',
  '2026-11-14',
  '2026-11-28',
  '2026-12-12',
  '2026-12-26',
  '2027-01-09'
];

const EVEN_SATURDAYS = [
  '2026-10-10',
  '2026-10-24',
  '2026-11-07',
  '2026-11-21',
  '2026-12-05',
  '2026-12-19',
  '2027-01-02',
  '2027-01-16'
];

async function run() {
  console.log('Querying CSE3201 Saturday lecture bookings...');
  const snap = await db.collection('bookings')
    .where('college', '==', 'حاسبات ومعلومات')
    .where('department', '==', 'هندسة البرمجيات')
    .where('group', '==', 'F')
    .where('courseCode', '==', 'CSE3201')
    .where('lectureType', '==', 'lecture')
    .get();

  console.log(`Found ${snap.size} documents.`);
  
  const batch = db.batch();
  let deletedCount = 0;
  let updatedCount = 0;
  let createdCount = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const dateStr = data.date;

    if (EVEN_SATURDAYS.includes(dateStr)) {
      // Delete even week Saturday lectures
      console.log(`[DELETE] Even week Saturday booking found: Doc ID ${doc.id} on date ${dateStr}. Deleting...`);
      batch.delete(doc.ref);
      deletedCount++;
    } else if (ODD_SATURDAYS.includes(dateStr)) {
      // Modify odd week Saturday lectures
      console.log(`[UPDATE] Odd week Saturday booking found: Doc ID ${doc.id} on date ${dateStr}.`);
      
      // Update existing to Slot 7 only
      batch.update(doc.ref, {
        startSlot: 7,
        endSlot: 7,
        timeFrom: '14:30',
        timeTo: '15:30',
        biWeekly: true,
        isBiWeekly: true
      });
      updatedCount++;

      // Create new booking for Slot 9
      const slot9Ref = db.collection('bookings').doc();
      const slot9Data = {
        ...data,
        startSlot: 9,
        endSlot: 9,
        timeFrom: '16:30',
        timeTo: '17:30',
        biWeekly: true,
        isBiWeekly: true
      };
      batch.set(slot9Ref, slot9Data);
      createdCount++;
      console.log(`[CREATE] Creating new Slot 9 booking for date ${dateStr} with Doc ID ${slot9Ref.id}.`);
    } else {
      console.log(`[SKIP] Booking on date ${dateStr} does not match any Saturday list.`);
    }
  }

  if (deletedCount > 0 || updatedCount > 0 || createdCount > 0) {
    console.log('Committing changes to Firestore...');
    await batch.commit();
    console.log('Migration completed successfully!');
    console.log(`Deleted: ${deletedCount} documents.`);
    console.log(`Updated (Slot 7): ${updatedCount} documents.`);
    console.log(`Created (Slot 9): ${createdCount} documents.`);
  } else {
    console.log('No modifications needed.');
  }
  
  process.exit(0);
}

run().catch(console.error);
