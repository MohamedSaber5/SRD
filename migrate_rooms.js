import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// Load service account from the desktop project
const serviceAccount = JSON.parse(readFileSync('./SRD-DESKTOP/src/main/resources/service-account.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function migrateRooms() {
  console.log('🚀 Starting Rooms Document ID Migration...');
  try {
    const roomsSnap = await db.collection('rooms').get();
    console.log(`🔍 Found ${roomsSnap.size} room documents.`);

    for (const doc of roomsSnap.docs) {
      const data = doc.data();
      const oldDocId = doc.id;
      const roomNumber = data.roomNumber || data.id || oldDocId;

      if (oldDocId === roomNumber) {
        console.log(`ℹ️ Room [${oldDocId}] already has a correct Document ID match.`);
        // Ensure its internal 'id' field is updated to roomNumber
        if (data.id !== roomNumber) {
          await doc.ref.update({ id: roomNumber });
          console.log(`✅ Updated internal 'id' field to match roomNumber for room: ${roomNumber}`);
        }
        continue;
      }

      console.log(`⚙️ Migrating Room: [${oldDocId}] -> Document ID: [${roomNumber}]`);

      // 1. Create a new document with Document ID = roomNumber
      const newRoomRef = db.collection('rooms').doc(roomNumber);
      await newRoomRef.set({
        ...data,
        id: roomNumber,
        roomNumber: roomNumber
      });
      console.log(`   + Created new document [rooms/${roomNumber}]`);

      // 2. Query all bookings that reference this room by oldDocId
      const bookingsSnap = await db.collection('bookings')
        .where('roomId', '==', oldDocId)
        .get();
      
      if (!bookingsSnap.empty) {
        console.log(`   🔄 Updating ${bookingsSnap.size} bookings from roomId [${oldDocId}] to [${roomNumber}]...`);
        const batch = db.batch();
        for (const bookingDoc of bookingsSnap.docs) {
          batch.update(bookingDoc.ref, { roomId: roomNumber });
        }
        await batch.commit();
        console.log(`   ✅ Bookings successfully updated.`);
      }

      // 3. Delete the old document with the random ID
      await doc.ref.delete();
      console.log(`   - Deleted old document [rooms/${oldDocId}]`);
    }

    console.log('\n🎉 --- Rooms Migration Complete Success! --- 🎉');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during rooms migration:', error);
    process.exit(1);
  }
}

migrateRooms();
