# Exceptional Bookings and Alternative Rejection Cycle

The implementation of the **Exceptional Bookings and Alternative Rejection Cycle** has been finalized. This feature allows for a smooth feedback loop between administrators and users when an initial booking request cannot be fulfilled as requested.

## Features Completed
1. **Unrestricted Selection for Secretaries**: Removed the constraint in `BookingForm.jsx` that automatically pre-filled and locked secretaries into booking "Multi-purpose Rooms". Secretaries can now select any available room types via the interactive selection menu.
2. **Admin Rejection with Alternatives**: In `AdminRequests.jsx`, when an administrator encounters a booking constraint (e.g. Schedule clash), they can reject the booking while providing:
   - A contextual rejection reason.
   - A Suggested Alternative Time, Alternative Date, or Alternative Room.
3. **User Actionable Dashboard**: `UserDashboard.jsx` highlights rejected bookings and presents the administrator's suggestions clearly via a blue information panel.
4. **Resubmission Flow**: A new "تقديم الطلب بالبديل" (Submit with Alternative) button has been added for rejected bookings with suggestions. It navigates the user back to the Booking Form, dynamically pre-filling it with the new suggested Room, Date, and Time slots.
5. **Form Prefill Logic**: Re-worked `BookingForm.jsx` state management so it correctly handles the injected parameters. This includes auto-evaluating the `roomType` based on a suggested `roomId` and accurately setting the `<select>` value for Time Slots.

## Testing & Verification
- Validated that the `BookingForm.jsx` dynamically loads the rooms before setting the correct `roomType` and `hallCategory` when instantiated dynamically via React Router state mappings.
- Validated the pre-fill indexing of the `timeSlot` dropdown.
- This creates a **new** booking log (preventing database inconsistencies with old timestamps and maintaining a clean paper-trail of rejected history versus newly submitted suggestions).
