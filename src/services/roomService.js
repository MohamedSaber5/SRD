import { db } from '../firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  where, 
  writeBatch,
  serverTimestamp,
  addDoc
} from 'firebase/firestore';

// ==========================================
// REPOSITORY PATTERN: Room Service
// Abstracts all Firestore logic for rooms
// ==========================================

class RoomService {
  /**
   * Subscribe to real-time room updates (Observer Pattern)
   */
  subscribeToRooms(callback) {
    const qRooms = query(collection(db, 'rooms'));
    return onSnapshot(qRooms, (snapshot) => {
      const rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(rooms);
    });
  }

  /**
   * Add a new room
   */
  async addRoom(roomData, currentUser) {
    // Use roomNumber as the document ID instead of auto-generating one
    const newRoomRef = doc(db, 'rooms', roomData.roomNumber);
    
    // Check if room already exists
    const roomSnap = await getDoc(newRoomRef);
    if (roomSnap.exists()) {
        throw new Error('قاعة بنفس الرقم موجودة بالفعل.');
    }

    const newRoom = {
      id: roomData.roomNumber, // the ID is now the room number
      roomNumber: roomData.roomNumber,
      type: roomData.type, // 'fixed' or 'multi'
      building: roomData.building,
      floor: Number(roomData.floor),
      capacity: Number(roomData.capacity),
      status: roomData.status || 'available',
      createdAt: serverTimestamp()
    };

    await setDoc(newRoomRef, newRoom);

    // Audit log
    await this.logAuditAction('ADD_ROOM', `تم إضافة قاعة جديدة برقم/اسم: ${newRoom.roomNumber} بسعة ${newRoom.capacity}`, currentUser);
    
    return newRoom;
  }

  /**
   * Update an existing room
   */
  async updateRoom(roomId, roomData, currentUser) {
    const roomRef = doc(db, 'rooms', roomId);
    const updatePayload = {
      roomNumber: roomData.roomNumber,
      type: roomData.type,
      building: roomData.building,
      floor: Number(roomData.floor),
      capacity: Number(roomData.capacity),
      status: roomData.status,
      updatedAt: serverTimestamp()
    };

    await setDoc(roomRef, updatePayload, { merge: true });

    // Audit log
    await this.logAuditAction('EDIT_ROOM', `تم تعديل بيانات القاعة: ${roomData.roomNumber}`, currentUser);
  }

  /**
   * Delete a room, with optional migration of active bookings
   */
  async deleteRoom(roomId, replacementRoomId, activeBookings, currentUser) {
    // If there are active bookings, migrate them
    if (activeBookings && activeBookings.length > 0) {
      if (!replacementRoomId) {
        throw new Error('يجب تحديد قاعة بديلة لترحيل الحجوزات النشطة.');
      }
      
      const batch = writeBatch(db);
      activeBookings.forEach(d => {
          batch.update(doc(db, 'bookings', d.id), { roomId: replacementRoomId });
      });
      await batch.commit();
    }

    // Delete the room document
    await deleteDoc(doc(db, 'rooms', roomId));

    const details = (activeBookings && activeBookings.length > 0 && replacementRoomId)
        ? `تم إزالة القاعة ${roomId} وترحيل ${activeBookings.length} حجوزات نشطة إلى القاعة ${replacementRoomId}`
        : `تم إزالة القاعة ${roomId} (بدون حجوزات نشطة)`;

    // Audit log
    await this.logAuditAction('DELETE_ROOM', details, currentUser);
  }

  /**
   * Get active bookings for a specific room (Useful before deletion or for reporting)
   */
  async getActiveBookingsForRoom(roomId) {
    const qBookings = query(collection(db, 'bookings'), where('roomId', '==', roomId));
    const snapshot = await getDocs(qBookings);
    
    // Filter active statuses
    return snapshot.docs
      .filter(d => ['pending', 'awaiting_manager_final', 'approved', 'approved_by_branch'].includes(d.data().status))
      .map(d => ({ id: d.id, ...d.data() }));
  }

  /**
   * Get ALL bookings for a room (Useful for PDF reporting)
   */
  async getAllBookingsForRoom(roomId) {
    const qBookings = query(collection(db, 'bookings'), where('roomId', '==', roomId));
    const snapshot = await getDocs(qBookings);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  /**
   * Get active bookings for a specific date (Useful for Availability Search)
   */
  async getBookingsByDate(date) {
    const qBookings = query(collection(db, 'bookings'), where('date', '==', date));
    const snapshot = await getDocs(qBookings);
    return snapshot.docs
      .filter(d => ['pending', 'awaiting_manager_final', 'approved', 'approved_by_branch'].includes(d.data().status))
      .map(d => ({ id: d.id, ...d.data() }));
  }

  /**
   * Helper for creating audit logs
   */
  async logAuditAction(actionType, details, currentUser) {
    if (!currentUser) return;
    await addDoc(collection(db, 'audit_logs'), {
        actionBy: currentUser.email,
        actionByName: currentUser.displayName || 'Admin',
        actionType,
        details,
        timestamp: serverTimestamp()
    });
  }
}

export const roomService = new RoomService();
