# Security Specification for Ngopi di Puncak

## Data Invariants
1. **Bookings Responsibility**: A booking must always be tied to the `userId` of the person who created it.
2. **Quota Integrity**: Open trip quota updates must be atomic or secured.
3. **Configuration Locking**: Only authorized admins can change website configuration, destination list, leaders, and open trip schedules.
4. **ID Shielding**: All document IDs must be valid alphanumeric strings.

## The Dirty Dozen Payloads (Rejection Tests)
1. **Spoofed Owner**: Attempt to create a booking for `userABC` while authenticated as `userXYZ`.
2. **Admin Escalation**: Non-admin user tries to update `/openTrips/data`.
3. **Shadow Update**: Attempt to update a booking's `status` field without permission.
4. **Giant Payload**: Sending a 1MB string in the `nama` field.
5. **Orphaned Booking**: Creating a booking with a non-existent `destinasi`.
6. **Timeline Breach**: Creating a booking with `createdAt` in the future or past (not server timestamp).
7. **Identity Hijack**: Attempt to change the `userId` of an existing booking.
8. **Junk ID**: Attempt to write to a document with ID `../../secrets`.
9. **Private Path Leak**: Accessing another user's private data (if we had any).
10. **Unverified Email**: Attempt to write while email is unverified (if required).
11. **Negative Count**: Booking with -5 participants.
12. **Status Bypass**: Changing booking status from 'confirmed' back to 'pending' by the customer.

## Database Structure
- `/bookings/{bookingId}`: User trip requests.
- `/website/data`: Hero, facilities, video config.
- `/destinations/data`: Destination catalog.
- `/leaders/data`: Team members.
- `/gallery/data`: Gallery images.
- `/openTrips/data`: Open trip schedule.
- `/admins/{userId}`: Admin white-list.
