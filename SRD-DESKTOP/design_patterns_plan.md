# SRD Desktop — Project Audit & Design Patterns Implementation Plan

---

## 🔴 Part 1: Current Problems Analysis

### Problem 1 — Firebase Quota (Reads Overuse)
**Root Cause:** Multiple controllers make **independent Firestore reads** for the same data on every screen navigation.

| Location | Problem |
|---|---|
| `AdminDashboardController.fetchAllData()` | Fetches 300 bookings + rooms every time the screen loads |
| `AdminDashboardController.fetchPendingRequestsOnly()` | Called on `initialize()` AND on every tab switch to "Pending" |
| `RoomManagementController` | Fetches all rooms independently (ignores `GlobalDataService` cache) |
| `AdminStatisticsController.refreshData()` | Re-fetches everything on every visit |
| `BranchManagerDashboardController` | Has its own fetch logic, doesn't share any cache |
| `SecretaryDashboardController` | Fetches rooms independently, not using global cache |
| `addSnapshotListener` in `AdminBookingFacade` | Real-time listener left open, firing on every document change |

**Fix Strategy:** Enforce `GlobalDataService` as the **single read gate** for rooms + users. All controllers must go through it. Only invalidate cache on write operations.

---

### Problem 2 — Naming & Folder Structure
**Current Issues:**
- `secretary/form/BookingBuilder.java` — duplicates `patterns/builder/BookingBuilder.java` (two builders, different logic)
- `secretary/form/BookingService.java` — shadows `services/BookingService.java` (same name, different package)
- `admin/AdminDecorators.java` — two classes in one file, package-private, not discoverable
- `patterns/permissions/` — mixes Proxy, Chain of Responsibility, Strategy, Command all in ONE folder
- `core/observer/` — Observer is in `core`, but Proxy/Chain are in `patterns/permissions/` — inconsistent location
- `admin/strategies/` — Strategy is in `admin/`, not in `patterns/` with the others
- `admin/facade/` — Facade is in `admin/`, not in `patterns/`

**Clean Target Structure:**
```
patterns/
  builder/          ← MultiPurposeBookingBuilder (secretary + employee)
  command/          ← ICommand, UpdateRoomCommand, ApproveBookingCommand, RejectBookingCommand
  singleton/        ← (reference only — FirebaseService, SessionManager, GlobalDataService)
  prototype/        ← IBookingPrototype, Booking implements clone()
  decorator/        ← IBookingDecorator, UrgentRequestDecorator
  chain/            ← IBookingHandler, AdminHandler, BranchManagerHandler
  facade/           ← SystemFacade (unified entry point)
  proxy/            ← IActionService, SecurityProxy, RoleGuard
  observer/         ← IBookingObserver, BookingSubject, UINotificationObserver, FirestoreObserver
  strategy/         ← IAvailabilityStrategy, RamadanAvailabilityStrategy, NormalAvailabilityStrategy
```

---

### Problem 3 — Wrong/Random Design Pattern Usage
| Pattern | Current State | Problem |
|---|---|---|
| **Builder** | `patterns/builder/BookingBuilder.java` exists but is **not used** by secretary form | Secretary uses raw field assignments in controller |
| **Command** | Only `ApproveBookingCommand` + `RejectBookingCommand` exist | `UpdateRoomCommand` missing — room update logic duplicated in 2+ places |
| **Singleton** | `FirebaseService`, `SessionManager`, `GlobalDataService` — OK | `BookingNotifierSubject` is Singleton but **not thread-safe** |
| **Prototype** | `cloneWithSuggestions()` in `BookingService` — correct logic | `Booking` does not implement `Cloneable` properly with a dedicated interface |
| **Decorator** | `AdminBookingDecorator` exists but is **never called** anywhere | Urgent flag set directly via `chkUrgent.isSelected()` — decorator ignored |
| **Chain of Responsibility** | `RoleHandler` → `DelegationHandler` chain exists | Only used inside `SecurityProxy` for permission check — NOT used for booking approval flow (Admin → BranchManager) |
| **Facade** | `AdminBookingFacade` — good start | Does too much (approval logic + room availability + notifications). Not reused by secretary/employee |
| **Proxy** | `SecurityProxy` exists | Called manually in some places but skipped in others — not enforced consistently |
| **Observer** | `BookingNotifierSubject` + `NotificationObserver` exist | Never actually connected to `NotificationService` or any UI controller |
| **Strategy** | `IApprovalStrategy` in `admin/strategies/` | Only used in approval — should also drive **availability checking** (Ramadan vs Normal) |

---

## 🟡 Part 2: Implementation Plan (Prompt by Prompt)

---

### ✅ Prompt 1 — Singleton Audit & Cache Fix (Firebase Quota Fix)

**Goal:** Fix the Firebase overread problem.

**Files to touch:**
- `services/GlobalDataService.java` — add `bookings` cache + invalidation methods
- `services/BookingService.java` — all fetches go through cache
- `services/RoomService.java` — already partially cached, fix edge cases
- `admin/AdminDashboardController.java` — remove duplicate `fetchAllData` + `fetchPendingRequestsOnly` on init
- `admin/facade/AdminBookingFacade.java` — after any write (approve/reject), call `GlobalDataService.invalidateBookings()`

**Concept (from template):**
```java
// GlobalDataService — thread-safe double-checked Singleton
public class GlobalDataService {
    private static volatile GlobalDataService instance; // volatile = thread-safe
    private List<Booking> cachedBookings = null;
    private long lastBookingFetch = 0;
    private static final long CACHE_MS = 3 * 60 * 1000; // 3 minutes

    public static GlobalDataService getInstance() {
        if (instance == null) {
            synchronized (GlobalDataService.class) {
                if (instance == null) instance = new GlobalDataService();
            }
        }
        return instance;
    }

    public boolean isBookingCacheStale() {
        return cachedBookings == null || (System.currentTimeMillis() - lastBookingFetch > CACHE_MS);
    }

    public void invalidateBookings() { cachedBookings = null; } // call after every write
}
```

**Rules:**
- `fetchAllData()` in `AdminDashboardController` must check cache first
- `fetchPendingRequestsOnly()` must NOT be called on `initialize()` — call only on tab switch
- After every approve/reject/update → call `GlobalDataService.getInstance().invalidateBookings()`

---

### ✅ Prompt 2 — Builder Pattern (Multi-Purpose Hall Booking Form)

**Goal:** Use Builder properly for the secretary AND employee multi-purpose hall booking form.

**Location:** `patterns/builder/`  
**Rename:** Keep `BookingBuilder.java` (already good)  
**Delete:** `secretary/form/BookingBuilder.java` and `secretary/form/StandardBookingBuilder.java` — merge into the one in `patterns/builder/`

**Add Director class:**
```java
// patterns/builder/BookingDirector.java
public class BookingDirector {

    // Used by Secretary — all fields available
    public Booking buildSecretaryMultiPurposeBooking(BookingBuilder b,
            String date, String timeFrom, String timeTo, String purpose,
            int capacity, String responsibleName, String responsibleJob,
            String responsibleMobile, boolean reqMic, int micQty,
            boolean reqLaptop, boolean reqVideoConf, String userId, String userName) {
        return b.roomType("multi")
                .hallCategory("multi")
                .date(date).timeFrom(timeFrom).timeTo(timeTo)
                .purpose(purpose).requiredCapacity(capacity)
                .responsibleName(responsibleName)
                .responsibleJob(responsibleJob)
                .responsibleMobile(responsibleMobile)
                .reqMic(reqMic, micQty).reqLaptop(reqLaptop).reqVideoConf(reqVideoConf)
                .userId(userId).userName(userName).userRole("secretary")
                .build();
    }

    // Used by Employee — simpler, no room assigned
    public Booking buildEmployeeMultiPurposeRequest(BookingBuilder b,
            String date, String timeFrom, String timeTo, String purpose,
            int capacity, String userId, String userName) {
        return b.roomType("multi")
                .hallCategory("multi")
                .date(date).timeFrom(timeFrom).timeTo(timeTo)
                .purpose(purpose).requiredCapacity(capacity)
                .userId(userId).userName(userName).userRole("employee")
                .build();
    }
}
```

**Wire into:**
- `SecretaryDashboardController` — replace raw `Booking` construction with `BookingDirector`
- `employee/BookingFormController.java` — replace raw construction with `BookingDirector`

---

### ✅ Prompt 3 — Command Pattern (Room Update + Booking Actions)

**Goal:** Extract `updateRoom` logic (used in RoomManagement AND booking approval) into a Command.

**New files in `patterns/command/`:**

```java
// ICommand.java (rename existing Command.java → ICommand.java for clarity)
public interface ICommand {
    void execute();
    void undo(); // optional but correct per template
}

// UpdateRoomCommand.java
public class UpdateRoomCommand implements ICommand {
    private final Room room;
    private final RoomService roomService;
    private final Runnable onSuccess;
    private final Consumer<Exception> onError;

    public UpdateRoomCommand(Room room, Runnable onSuccess, Consumer<Exception> onError) {
        this.room = room;
        this.onSuccess = onSuccess;
        this.onError = onError;
    }

    @Override
    public void execute() {
        RoomService.updateRoom(room, v -> {
            GlobalDataService.getInstance().invalidateRooms(); // cache bust
            onSuccess.run();
        }, onError);
    }

    @Override public void undo() { /* future: store previous Room state */ }
}

// ApproveBookingCommand.java — fix to also invalidate cache
// RejectBookingCommand.java  — fix to also invalidate cache
```

**Wire into:**
- `admin/RoomManagementController` → use `new UpdateRoomCommand(...).execute()` instead of direct `RoomService.updateRoom()`
- `admin/facade/AdminBookingFacade.approveRequest()` → use `ApproveBookingCommand`
- `branchmanager/BranchManagerDashboardController` → use same commands

---

### ✅ Prompt 4 — Prototype Pattern (Re-submit Rejected Booking)

**Goal:** Make `Booking` a proper Prototype with a clean interface.

**New file: `patterns/prototype/IBookingPrototype.java`**
```java
public interface IBookingPrototype {
    Booking cloneForResubmit(); // deep copy with clean status
}
```

**Update `models/Booking.java`:**
```java
public class Booking implements IBookingPrototype {
    @Override
    public Booking cloneForResubmit() {
        Booking copy = new Booking();
        copy.setRoomId(this.roomId);
        copy.setRoomType(this.roomType);
        copy.setHallCategory(this.hallCategory);
        copy.setDate(this.date);
        copy.setTimeFrom(this.timeFrom);
        copy.setTimeTo(this.timeTo);
        copy.setPurpose(this.purpose);
        copy.setRequiredCapacity(this.requiredCapacity);
        copy.setResponsibleName(this.responsibleName);
        copy.setResponsibleJob(this.responsibleJob);
        copy.setResponsibleMobile(this.responsibleMobile);
        copy.setReqMic(this.reqMic); copy.setReqMicQty(this.reqMicQty);
        copy.setReqLaptop(this.reqLaptop); copy.setReqVideoConf(this.reqVideoConf);
        copy.setReqOther(this.reqOther); copy.setReqOtherDetails(this.reqOtherDetails);
        // Apply suggested alternatives from rejection
        if (this.suggestedRoomId != null) copy.setRoomId(this.suggestedRoomId);
        if (this.suggestedDate != null) copy.setDate(this.suggestedDate);
        if (this.suggestedTimeFrom != null) copy.setTimeFrom(this.suggestedTimeFrom);
        if (this.suggestedTimeTo != null) copy.setTimeTo(this.suggestedTimeTo);
        copy.setStatus("pending"); // reset status
        copy.setId(null);         // new document
        return copy;
    }
}
```

**Wire into:**
- `employee/BookingListController` — "إعادة إرسال" button calls `booking.cloneForResubmit()`
- Remove `BookingService.cloneWithSuggestions()` — replaced by prototype method

---

### ✅ Prompt 5 — Decorator Pattern (Urgent Request to Branch Manager)

**Goal:** When admin marks a request as urgent (`chkUrgent` checkbox), wrap the booking with `UrgentRequestDecorator` BEFORE saving.

**New files in `patterns/decorator/`:**

```java
// IBookingComponent.java
public interface IBookingComponent {
    Booking getBooking();
    String getDisplayPriority(); // "normal" | "urgent"
}

// BaseBookingComponent.java
public class BaseBookingComponent implements IBookingComponent {
    private final Booking booking;
    public BaseBookingComponent(Booking booking) { this.booking = booking; }
    @Override public Booking getBooking() { return booking; }
    @Override public String getDisplayPriority() { return "normal"; }
}

// UrgentRequestDecorator.java
public class UrgentRequestDecorator implements IBookingComponent {
    private final IBookingComponent wrapped;

    public UrgentRequestDecorator(IBookingComponent component) {
        this.wrapped = component;
        // Mark the booking itself
        wrapped.getBooking().setUrgent(true);
        wrapped.getBooking().setStatus("awaiting_manager_final"); // jump the queue
    }

    @Override public Booking getBooking() { return wrapped.getBooking(); }
    @Override public String getDisplayPriority() { return "urgent"; }
}
```

**Wire into:**
- `admin/facade/AdminBookingFacade.approveRequest()`:
```java
IBookingComponent component = new BaseBookingComponent(booking);
if (isUrgent) {
    component = new UrgentRequestDecorator(component); // wraps + sets flags
}
Booking decorated = component.getBooking();
// save decorated to Firestore
```

- `branchmanager/BranchManagerDashboardController` — when loading requests, sort urgent ones first:
```java
bookings.sort((a, b) -> Boolean.compare(b.isUrgent(), a.isUrgent()));
```

---

### ✅ Prompt 6 — Chain of Responsibility (Booking Approval Flow)

**Goal:** Multi-purpose hall booking must pass through Admin FIRST, then go to Branch Manager. Model this as a chain.

**New files in `patterns/chain/`:**

```java
// IBookingApprovalHandler.java
public abstract class BookingApprovalHandler {
    protected BookingApprovalHandler next;

    public BookingApprovalHandler setNext(BookingApprovalHandler next) {
        this.next = next;
        return next;
    }

    public abstract void handle(Booking booking, Firestore db) throws Exception;
}

// AdminApprovalHandler.java
public class AdminApprovalHandler extends BookingApprovalHandler {
    @Override
    public void handle(Booking booking, Firestore db) throws Exception {
        if ("pending".equals(booking.getStatus())) {
            // Admin reviews: set status to awaiting_manager_final
            db.collection("bookings").document(booking.getId())
              .update("status", "awaiting_manager_final").get();
            System.out.println("[Chain] Admin reviewed → passed to Branch Manager");
            if (next != null) next.handle(booking, db);
        } else if (next != null) {
            next.handle(booking, db);
        }
    }
}

// BranchManagerApprovalHandler.java
public class BranchManagerApprovalHandler extends BookingApprovalHandler {
    @Override
    public void handle(Booking booking, Firestore db) throws Exception {
        if ("awaiting_manager_final".equals(booking.getStatus())) {
            db.collection("bookings").document(booking.getId())
              .update("status", "approved_by_branch").get();
            System.out.println("[Chain] Branch Manager approved booking");
        }
    }
}
```

**Wire into:**
- `admin/facade/AdminBookingFacade.approveRequest()` for multi-purpose bookings:
```java
BookingApprovalHandler adminHandler = new AdminApprovalHandler();
adminHandler.setNext(new BranchManagerApprovalHandler()); // only for multi
adminHandler.handle(booking, db);
```

---

### ✅ Prompt 7 — Facade Pattern (SystemFacade — unified entry point)

**Goal:** Create one `SystemFacade` that all dashboard controllers use instead of calling multiple services directly.

**New file: `patterns/facade/SystemFacade.java`**

```java
public class SystemFacade {
    private static SystemFacade instance;
    private final GlobalDataService cache = GlobalDataService.getInstance();
    private final FirebaseService firebase = FirebaseService.getInstance();

    public static SystemFacade getInstance() { ... } // Singleton

    // ── Rooms ──
    public void getRooms(Consumer<List<Room>> onSuccess, Consumer<Exception> onError) {
        if (!cache.isRoomCacheStale()) { onSuccess.accept(cache.getCachedRooms()); return; }
        RoomService.fetchRooms(rooms -> { cache.setCachedRooms(rooms); onSuccess.accept(rooms); }, onError);
    }

    // ── Bookings ──
    public void getPendingBookings(Consumer<List<Booking>> onSuccess, Consumer<Exception> onError) {
        // delegates to AdminBookingFacade internally
    }

    // ── Notifications ──
    public void sendNotification(String userId, String title, String message) {
        NotificationService.send(userId, title, message); // wraps Firestore write
    }

    // ── Room Update (via Command) ──
    public void updateRoom(Room room, Runnable onSuccess, Consumer<Exception> onError) {
        new UpdateRoomCommand(room, onSuccess, onError).execute();
    }
}
```

**Wire into:**
- `AdminDashboardController`, `SecretaryDashboardController`, `BranchManagerDashboardController` all call `SystemFacade.getInstance()` instead of individual services.

---

### ✅ Prompt 8 — Proxy Pattern (Role-Based Access Guard)

**Goal:** Enforce that EVERY sensitive action goes through `SecurityProxy` — not just some.

**Fix `SecurityProxy.java`:**
```java
public class SecurityProxy {
    private static final Map<String, List<String>> ROLE_PERMISSIONS = Map.of(
        "admin",    List.of("approve_booking","reject_booking","manage_rooms","delegate","view_stats","ramadan_mode"),
        "temp_admin", List.of("approve_booking","reject_booking"),
        "branch_manager", List.of("final_approve","view_all_bookings","instant_booking","ramadan_mode"),
        "secretary", List.of("create_booking","view_bookings"),
        "employee",  List.of("create_booking","view_my_bookings","resubmit_booking")
    );

    public boolean canAccess(String permissionKey) {
        User user = SessionManager.getInstance().getCurrentUser();
        if (user == null) return false;
        List<String> allowed = ROLE_PERMISSIONS.getOrDefault(user.getRole(), List.of());
        boolean hasAccess = allowed.contains(permissionKey);
        if (!hasAccess) showAccessDeniedAlert(permissionKey);
        return hasAccess;
    }
}
```

**Wire into (add guard before action):**
- `AdminDashboardController.confirmApprove()` → `proxy.canAccess("approve_booking")`
- `AdminDashboardController.toggleRamadanMode()` → `proxy.canAccess("ramadan_mode")`
- `BranchManagerDashboardController` final approve → `proxy.canAccess("final_approve")`
- `RoomManagementController.deleteRoom()` → `proxy.canAccess("manage_rooms")`

---

### ✅ Prompt 9 — Observer Pattern (Notification System)

**Goal:** Connect the existing Observer skeleton to actual Firestore notifications + UI badge updates.

**Fix `BookingNotifierSubject.java`:**
```java
// BookingEvent.java
public class BookingEvent {
    public enum Type { APPROVED, REJECTED, PENDING, URGENT }
    private final Booking booking;
    private final Type type;
    // constructor + getters
}

// IBookingObserver.java
public interface IBookingObserver {
    void onBookingEvent(BookingEvent event);
}

// BookingNotifierSubject.java (fixed, thread-safe)
public class BookingNotifierSubject {
    private static volatile BookingNotifierSubject instance;
    private final List<IBookingObserver> observers = new CopyOnWriteArrayList<>(); // thread-safe

    public static BookingNotifierSubject getInstance() { ... }
    public void subscribe(IBookingObserver o) { observers.add(o); }
    public void unsubscribe(IBookingObserver o) { observers.remove(o); }
    public void notify(BookingEvent event) {
        observers.forEach(o -> o.onBookingEvent(event));
    }
}
```

**Concrete Observers:**
```java
// UIBadgeObserver.java — updates notification badge in sidebar
public class UIBadgeObserver implements IBookingObserver {
    private final Label badgeLabel;
    public UIBadgeObserver(Label badge) { this.badgeLabel = badge; }

    @Override
    public void onBookingEvent(BookingEvent event) {
        Platform.runLater(() -> {
            int current = Integer.parseInt(badgeLabel.getText());
            badgeLabel.setText(String.valueOf(current + 1));
        });
    }
}

// FirestoreNotificationObserver.java — writes to Firestore notifications collection
public class FirestoreNotificationObserver implements IBookingObserver {
    @Override
    public void onBookingEvent(BookingEvent event) {
        NotificationService.send(event.getBooking().getUserId(), ...);
    }
}
```

**Wire into:**
- On app start in each dashboard `initialize()`:
```java
BookingNotifierSubject subject = BookingNotifierSubject.getInstance();
subject.subscribe(new UIBadgeObserver(notificationBadge));
subject.subscribe(new FirestoreNotificationObserver());
```
- After approve/reject in `AdminBookingFacade`:
```java
BookingNotifierSubject.getInstance().notify(new BookingEvent(booking, BookingEvent.Type.APPROVED));
```

---

### ✅ Prompt 10 — Strategy Pattern (Room Availability — Ramadan vs Normal)

**Goal:** Room availability time-slot checking differs between Normal mode and Ramadan mode. Use Strategy.

**New files in `patterns/strategy/`:**

```java
// IAvailabilityStrategy.java
public interface IAvailabilityStrategy {
    List<String> getAvailableTimeSlots();
    boolean isValidTimeRange(String timeFrom, String timeTo);
    String getMultiPurposeFixedTime(); // Ramadan: "17:25", Normal: null (any time)
}

// NormalAvailabilityStrategy.java
public class NormalAvailabilityStrategy implements IAvailabilityStrategy {
    private static final List<String> SLOTS = List.of(
        "08:00","09:30","11:00","12:30","14:00","15:30","17:00"
    );
    @Override public List<String> getAvailableTimeSlots() { return SLOTS; }
    @Override public boolean isValidTimeRange(String from, String to) { return true; }
    @Override public String getMultiPurposeFixedTime() { return null; }
}

// RamadanAvailabilityStrategy.java
public class RamadanAvailabilityStrategy implements IAvailabilityStrategy {
    private static final List<String> SLOTS = List.of("08:00","09:30","11:00","12:30");
    @Override public List<String> getAvailableTimeSlots() { return SLOTS; }
    @Override public boolean isValidTimeRange(String from, String to) {
        return timeToMinutes(from) < timeToMinutes("14:00"); // no late bookings
    }
    @Override public String getMultiPurposeFixedTime() { return "17:25"; }
}

// AvailabilityContext.java
public class AvailabilityContext {
    private IAvailabilityStrategy strategy;
    public void setStrategy(boolean isRamadan) {
        this.strategy = isRamadan ? new RamadanAvailabilityStrategy() : new NormalAvailabilityStrategy();
    }
    public List<String> getSlots() { return strategy.getAvailableTimeSlots(); }
    public boolean validate(String from, String to) { return strategy.isValidTimeRange(from, to); }
}
```

**Wire into:**
- `employee/BookingFormController` — replace hardcoded slot list with `AvailabilityContext`
- `SecretaryDashboardController` — same
- `admin/AdminBookingFormController` — same
- After `fetchRamadanMode()` resolves, call `availabilityContext.setStrategy(isRamadan)`

---

## 🟢 Part 3: Folder Cleanup Summary

| Action | From | To |
|---|---|---|
| DELETE | `secretary/form/BookingBuilder.java` | Merged into `patterns/builder/` |
| DELETE | `secretary/form/BookingService.java` | Use `services/BookingService.java` |
| MOVE | `admin/AdminBookingDecorator.java` | `patterns/decorator/` |
| MOVE | `admin/AdminDecorators.java` | `patterns/decorator/` |
| MOVE | `admin/strategies/` | `patterns/strategy/` |
| MOVE | `admin/facade/` | `patterns/facade/` |
| MOVE | `patterns/permissions/SecurityProxy.java` | `patterns/proxy/` |
| MOVE | `patterns/permissions/RoleHandler.java` | `patterns/chain/` |
| MOVE | `patterns/permissions/DelegationHandler.java` | `patterns/chain/` |
| MOVE | `patterns/permissions/DelegationStrategy.java` | `patterns/strategy/` |
| RENAME | `patterns/command/Command.java` | `ICommand.java` |
| CREATE | `patterns/prototype/IBookingPrototype.java` | New |
| CREATE | `patterns/chain/BookingApprovalHandler.java` | New |
| CREATE | `patterns/observer/IBookingObserver.java` | New |
| CREATE | `patterns/observer/BookingEvent.java` | New |
| CREATE | `patterns/strategy/IAvailabilityStrategy.java` | New |
| CREATE | `patterns/facade/SystemFacade.java` | New |

---

## 🔵 Prompt Execution Order

```
Prompt 1 → Singleton + Cache Fix (fixes Firebase quota immediately)
Prompt 2 → Builder (secretary + employee multi-purpose form)
Prompt 3 → Command (UpdateRoomCommand + fix existing commands)
Prompt 4 → Prototype (Booking.cloneForResubmit())
Prompt 5 → Decorator (UrgentRequestDecorator)
Prompt 6 → Chain of Responsibility (Admin → BranchManager flow)
Prompt 7 → Facade (SystemFacade unification)
Prompt 8 → Proxy (SecurityProxy enforcement)
Prompt 9 → Observer (notification system wired up)
Prompt 10 → Strategy (Ramadan vs Normal availability)
Folder Cleanup → rename/move files after all patterns are wired
```
