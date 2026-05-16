import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';

// Load service account from the desktop project
const serviceAccount = JSON.parse(readFileSync('./SRD-DESKTOP/src/main/resources/service-account.json', 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const auth = getAuth();

async function init() {
  console.log('🚀 Starting Database Initialization...');
  try {
    // 1. Create Users
    let adminUid = null;
    const usersToCreate = [
      { email: 'admin@aast.edu', password: 'aast1234', employeeId: 'admin', role: 'admin', displayName: 'المسؤول العام' },
      { email: '12345@aast.edu', password: '111111', employeeId: '12345', role: 'employee', displayName: 'موظف أكاديمي' },
      { email: 'secretary@aast.edu', password: 'aast1234', employeeId: 'secretary', role: 'secretary', displayName: 'سكرتير الكلية' },
      { email: 'manager@aast.edu', password: 'aast1234', employeeId: 'manager', role: 'branch_manager', displayName: 'مدير الفرع' }
    ];

    for (const u of usersToCreate) {
      let uid;
      try {
        const userRecord = await auth.getUserByEmail(u.email);
        uid = userRecord.uid;
        // Update password if it already exists
        await auth.updateUser(uid, { password: u.password });
        console.log(`✅ User ${u.employeeId} already exists in Auth. Password updated.`);
      } catch (e) {
        const userRecord = await auth.createUser({
          email: u.email,
          password: u.password,
          displayName: u.displayName,
        });
        uid = userRecord.uid;
        console.log(`✅ Created User ${u.employeeId} in Auth.`);
      }

      if (u.employeeId === 'admin') {
        adminUid = uid;
      }

      await db.collection('users').doc(uid).set({
        email: u.email,
        employeeId: u.employeeId,
        role: u.role,
        displayName: u.displayName,
        createdAt: FieldValue.serverTimestamp()
      });
      console.log(`✅ User ${u.employeeId} added to Firestore (users collection).`);
    }

    // 2. Add some dummy rooms with CORRECT schema
    await db.collection('rooms').doc('101').delete().catch(()=>console.log("No 101"));
    await db.collection('rooms').doc('102').delete().catch(()=>console.log("No 102"));
    await db.collection('rooms').doc('hallA').delete().catch(()=>console.log("No hallA"));
    
    const newRoomsRefs = [
      db.collection('rooms').doc(),
      db.collection('rooms').doc(),
      db.collection('rooms').doc()
    ];
    
    const rooms = [
        { id: newRoomsRefs[0].id, roomNumber: '101', type: 'fixed', building: 'مبنى A', floor: 1, capacity: 30, status: 'available' },
        { id: newRoomsRefs[1].id, roomNumber: '102', type: 'fixed', building: 'مبنى B', floor: 2, capacity: 50, status: 'available' },
        { id: newRoomsRefs[2].id, roomNumber: 'مدرج أ', type: 'multi', building: 'مبنى A', floor: 1, capacity: 150, status: 'available' }
    ];
    
    for (const r of rooms) {
      await db.collection('rooms').doc(r.id).set({
        id: r.id,
        roomNumber: r.roomNumber,
        type: r.type,
        building: r.building,
        floor: Number(r.floor),
        capacity: Number(r.capacity),
        status: r.status,
        createdAt: FieldValue.serverTimestamp()
      });
    }
    console.log('✅ Added initial rooms to Firestore with EXACT structure.');

    // 3. Create Settings document
    await db.collection('settings').doc('system').set({
      ramadanMode: false
    });
    await db.collection('settings').doc('global').set({
      ramadanMode: false
    });
    console.log('✅ Added global/system settings to Firestore.');

    // 4. Create dummy Booking
    const bookingRef = db.collection('bookings').doc();
    await bookingRef.set({
      id: bookingRef.id,
      roomId: rooms[0].id,
      roomNumber: rooms[0].roomNumber,
      date: '2026-05-16',
      startTime: '09:00',
      endTime: '11:00',
      userId: adminUid,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp()
    });
    console.log('✅ Added dummy booking to Firestore (bookings collection).');

    // 5. Create dummy Audit Log
    const auditRef = db.collection('audit_logs').doc();
    await auditRef.set({
      action: 'SYSTEM_INIT',
      details: 'تمت تهيئة قاعدة البيانات بنجاح',
      userId: adminUid,
      userName: 'المسؤول العام',
      timestamp: FieldValue.serverTimestamp()
    });
    console.log('✅ Added dummy audit log to Firestore (audit_logs collection).');

    // 6. Create dummy Notification
    const notifRef = db.collection('notifications').doc();
    await notifRef.set({
      userId: adminUid,
      title: 'مرحباً',
      message: 'تم إعداد النظام وإنشاء جميع الجداول بنجاح',
      read: false,
      createdAt: FieldValue.serverTimestamp()
    });
    console.log('✅ Added dummy notification to Firestore (notifications collection).');

    // 7. Create dummy Delegation
    const delRef = db.collection('delegations').doc();
    await delRef.set({
      adminId: adminUid,
      targetUserId: 'temp_user_id',
      permissions: ['rooms', 'requests'],
      status: 'expired',
      createdAt: FieldValue.serverTimestamp()
    });
    console.log('✅ Added dummy delegation to Firestore (delegations collection).');

    console.log('\n🎉 --- Database Initialization Complete! --- 🎉');
    console.log('All collections have been created and populated with dummy data.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  }
}

init();
