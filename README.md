# الدليل المفصل لأنماط التصميم والميزات البرمجية (Design Patterns & Features)

هذا الملف يحتوي على تفصيل للميزات التي ذكرتها، مع توضيح مكونات الـ Design Pattern المستخدم فيها، ومكان وجوده بالضبط داخل الكود (مسار الملف ورقم السطر التقريبي).

---

### 1. Prototype: إعادة طلب القاعة المرفوض
يستخدم هذا النمط لأخذ "نسخة" من حجز قديم للتمكن من التعديل عليه وإرساله مجدداً بدلاً من بناءه من الصفر.
*   **المكونات (Components):**
    *   **Prototype Interface**: واجهة `Cloneable` الخاصة بجافا.
    *   **Concrete Prototype**: كلاس `Booking.java`.
    *   **Subclass Prototype**: كلاس `BookingRequest.java`.
    *   **Client**: كلاس `BookingListController.java` (المكان الذي يطلب النسخة).
*   **مكان التنفيذ في الكود:**
    *   `src/main/java/com/aast/booking/models/Booking.java` (سطر 80 - دالة `clone()`).
    *   `src/main/java/com/aast/booking/employee/BookingListController.java` (سطر 209 - استدعاء عملية النسخ).
    *   `src/main/java/com/aast/booking/patterns/builder/BookingBuilder.java` (سطر 190 - دالة `fromPrototype`).

---

### 2. Builder: بناء نموذج حجز قاعة متعددة الأغراض
يستخدم لتسهيل بناء كائن الحجز المعقد المليء بالخيارات خطوة بخطوة.
*   **المكونات (Components):**
    *   **Builder Interface**: واجهة `BookingBuilder.java`.
    *   **Concrete Builder**: كلاس `StandardBookingBuilder.java`.
    *   **Product**: كلاس `BookingRequest.java`.
    *   **Director & Client**: شاشة `SecretaryDashboardController.java` (أو `BookingFormController`).
*   **مكان التنفيذ في الكود:**
    *   `src/main/java/com/aast/booking/secretary/form/BookingBuilder.java` (سطر 8 - الواجهة).
    *   `src/main/java/com/aast/booking/secretary/form/StandardBookingBuilder.java` (سطر 5 - التنفيذ).
    *   `src/main/java/com/aast/booking/secretary/SecretaryDashboardController.java` (سطر 451 - إنشاء الكائن واستدعاء دوال البناء).

---

### 3. Singleton: ربط قاعدة البيانات (Database Connection)
يضمن فتح اتصال واحد فقط بقاعدة بيانات Firestore طوال فترة عمل التطبيق لتقليل استهلاك الموارد.
*   **المكونات (Components):**
    *   **Singleton Class**: كلاس `FirebaseService.java`.
*   **مكان التنفيذ في الكود:**
    *   `src/main/java/com/aast/booking/core/FirebaseService.java` (سطر 14 - تعريف النمط، ويتم الحصول على النسخة الوحيدة عبر `FirebaseService.getInstance()`).
    *   `src/main/java/com/aast/booking/MainApp.java` (سطر 21 - يتم تهيئة النسخة لأول مرة عند تشغيل التطبيق).

---

### 4. Chain of Responsibility: تسلسل الموافقات (Admin -> Branch Manager)
*ملاحظة: هذا مفهوم مطبق كسير عمل (Workflow Concept) في دورة حياة الحجز، ويوجد أيضاً كتنفيذ صريح ككلاسات في جزء الصلاحيات.*
يستخدم لجعل الطلب يمر في "سلسلة"؛ الأدمن يوافق أولاً، لكي يمر الطلب لاحقاً ويظهر لمدير الفرع ليوافق عليه.
*   **المكونات (Components):**
    *   **Handler 1**: كلاس `AdminBookingFacade.java` (الذي يقوم برفع حالة الطلب للمرحلة التالية).
    *   **Handler 2**: كلاس `BranchManagerService.java` (الذي يستقبل الطلبات المعلقة بعد موافقة الأدمن).
*   **التنفيذ الصريح ككلاسات (لإدارة الصلاحيات Permissions):**
    *   `src/main/java/com/aast/booking/patterns/permissions/PermissionHandler.java` (سطر 6 - Base Handler).
    *   `src/main/java/com/aast/booking/patterns/permissions/RoleHandler.java` (سطر 6 - Concrete Handler).
    *   `src/main/java/com/aast/booking/patterns/permissions/SecurityProxy.java` (سطر 15 - تعريف السلسلة).

---

### 5. Proxy: حماية الأدوار والوصول (Role Access Control)
يعمل كوسيط (بوابة) تمنع الدخول للشاشات أو تنفيذ الأوامر إلا إذا كان المستخدم يملك الصلاحية (Role) الصحيحة.
*   **المكونات (Components):**
    *   **Proxy**: كلاس `SecurityProxy.java`.
    *   **Real Subject**: المتحكمات التي تحاول تنفيذ الإجراء (مثل `AdminDashboardController`).
*   **مكان التنفيذ في الكود:**
    *   `src/main/java/com/aast/booking/patterns/permissions/SecurityProxy.java` (سطر 12 - يحتوي على المنطق الذي يمنع أو يسمح بالعبور).

---

### 6. Singleton: تسجيل الرول والجلسة (Session Manager)
يضمن تخزين بيانات المستخدم الذي سجل دخوله (اسمه، الرول بتاعه) في مكان مركزي واحد في الذاكرة لتصل إليه جميع شاشات التطبيق.
*   **المكونات (Components):**
    *   **Singleton Class**: كلاس `SessionManager.java`.
*   **مكان التنفيذ في الكود:**
    *   `src/main/java/com/aast/booking/core/SessionManager.java` (سطر 7 - حيث يتم تخزين المتغيرات ويتم استدعاؤها عبر `SessionManager.getInstance()`).

---

### 7. Facade: رفع جدول المحاضرات (Lecture Scheduling)
واجهة مبسطة تخفي وراءها تعقيد قراءة وتحليل ملفات الجداول، تحويلها لبيانات، وتوزيعها على القاعات وتخزينها في قاعدة البيانات.
*   **المكونات (Components):**
    *   **Facade**: كلاس `LectureSchedulingEngine.java` (أو `AdminBookingFacade`).
    *   **Subsystems**: كلاسات قواعد البيانات ومعالجة الأوقات وتفادي التعارض.
*   **مكان التنفيذ في الكود:**
    *   `src/main/java/com/aast/booking/admin/schedule/LectureSchedulingEngine.java` (سطر 20 - حيث يقوم هذا الكلاس بالتعامل مع كل التعقيدات بضغطة زر واحدة من الشاشة).

---

### 8. Command: أوامر التحكم بالوصول (Access Control Commands)
تحويل عمليات الموافقة، الرفض، والتحكم بالصلاحيات إلى "كائنات أوامر" مستقلة لتسهيل تنفيذها وتنظيمها أو التراجع عنها.
*   **المكونات (Components):**
    *   **Command Interface**: واجهة `Command.java`.
    *   **Concrete Commands**: الأوامر التي تنفذ الواجهة مثل (أوامر الموافقة، التراجع).
*   **مكان التنفيذ في الكود:**
    *   `src/main/java/com/aast/booking/patterns/command/Command.java`.

---

### 9. Command: أوامر إضافة وتعديل الغرف (Room Management)
تغليف عمليات إضافة وتعديل وحذف القاعات من النظام في كائنات أوامر لتأمين سير العمل.
*   **المكونات (Components):**
    *   **Command Interface**: واجهة `Command.java`.
    *   **Concrete Commands**: الأوامر المخصصة لإدارة القاعات (مثلاً `AddRoomCommand`).
    *   **Invoker**: أزرار واجهة تحكم الإدارة (AdminDashboard).
*   **مكان التنفيذ في الكود:**
    *   نفس مسار حزمة الأوامر `src/main/java/com/aast/booking/patterns/command/`.

---

### 10. Decorator: عند قبول الطلب من الإدارة (Admin Booking Decorator)
يستخدم لإضافة "خصائص إضافية" أو "تعديلات" على الحجز من قبل الأدمن (مثل إضافة موافقة استثنائية، أو متطلبات خاصة) بشكل ديناميكي فوق الكائن الأساسي دون العبث بالكود الأساسي للخدمة.
*   **المكونات (Components):**
    *   **Component**: واجهة `BookingService.java`.
    *   **Decorator**: كلاس `AdminBookingDecorator.java` (يضيف الصلاحيات الإدارية فوق الحجز العادي).
*   **مكان التنفيذ في الكود:**
    *   `src/main/java/com/aast/booking/admin/AdminBookingDecorator.java`.
    *   (و يتم تطبيقه أيضاً في طلب التجهيزات كـ `HolidayDecorator` و `OfficialEventDecorator`).

---

### 11. Observer: نظام الإشعارات والتحديث الفوري (Real-time Updates & Notifications)
يُستخدم هذا النمط لإرسال إشعارات وتحديث واجهات المستخدم والبيانات بشكل فوري عند حدوث أي تغيير (مثل إنشاء حجز جديد أو تحديث حالة طلب) دون الحاجة لتدخل يدوي من المستخدم، ويُطبق في النظام داخلياً وعبر قاعدة البيانات.
*   **المكونات (Components):**
    *   **Observer Interface**: واجهة `NotificationObserver.java`.
    *   **Subject (Publisher)**: كلاس `BookingNotifierSubject.java` الذي يدير قائمة المشتركين ويرسل لهم التنبيهات.
    *   **Concrete Observer (Subscriber)**: الشاشات التي تستقبل التحديثات مثل `SecretaryDashboardController.java`.
    *   **External Observer (Firestore)**: مستمع التغييرات اللحظية `addSnapshotListener`.
*   **مكان التنفيذ في الكود:**
    *   `src/main/java/com/aast/booking/core/observer/BookingNotifierSubject.java` (سطر 19 - إضافة المشتركين، وسطر 27 - إشعار المشتركين `notifyObservers`).
    *   `src/main/java/com/aast/booking/secretary/SecretaryDashboardController.java` (سطر 102 - تسجيل الاشتراك في الإشعارات عبر `addObserver`).
    *   `src/main/java/com/aast/booking/admin/facade/AdminBookingFacade.java` (سطر 29 - استخدام النمط بشكل عملي للاتصال بقاعدة البيانات والاستماع اللحظي للتغييرات باستخدام `addSnapshotListener`).