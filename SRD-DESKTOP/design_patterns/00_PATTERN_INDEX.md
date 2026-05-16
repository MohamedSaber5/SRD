# Design Patterns Documentation - Index

## Complete Index of SRD DESKTOP Design Patterns

This directory contains comprehensive documentation of all 13 design patterns identified in the SRD Desktop Java application. Each pattern file includes detailed explanations, code examples, Mermaid diagrams, and validation checklists.

---

## Pattern Overview Table

| # | Pattern | Category | Location | Key Classes | Purpose |
|---|---------|----------|----------|-------------|---------|
| 1 | [Singleton](pattern_01_Singleton.md) | Creational | `core/` | SessionManager, FirebaseService, BookingNotifierSubject | Single global instance for shared resources |
| 2 | [Factory](pattern_02_Factory.md) | Creational | `core/` | DashboardFactory | Create role-specific dashboard instances |
| 3 | [Observer](pattern_03_Observer.md) | Behavioral | `core/observer/` | BookingNotifierSubject, NotificationObserver | Publish booking events to multiple subscribers |
| 4 | [Facade](pattern_04_Facade.md) | Structural | `auth/`, `admin/facade/` | AuthService, AdminBookingFacade | Simplify complex Firebase interactions |
| 5 | [Composite](pattern_05_Composite.md) | Structural | `patterns/permissions/` | PermissionComponent, PermissionGroup, LeafPermission | Hierarchical permission structures |
| 6 | [Decorator](pattern_06_Decorator.md) | Structural | `secretary/form/` | BookingDecorator, WithCateringDecorator, WithProjectorDecorator | Add features to bookings dynamically |
| 7 | [Memento](pattern_07_Memento.md) | Behavioral | `secretary/form/`, `admin/` | BookingMemento, BookingCaretaker, AdminBookingMemento | Undo/redo form state and audit trail |
| 8 | [Builder](pattern_08_Builder.md) | Creational | `patterns/builder/` | BookingBuilder, StandardBookingBuilder | Construct complex booking objects step-by-step |
| 9 | [Command](pattern_09_Command.md) | Behavioral | `patterns/command/` | Command, ApproveBookingCommand, RejectBookingCommand | Encapsulate booking actions as objects |
| 10 | [Strategy](pattern_10_Strategy.md) | Behavioral | `admin/search/`, `admin/strategies/` | RoomSearchStrategy, IApprovalStrategy, SearchStrategyFactory | Different algorithms for room search and approval |
| 11 | [Prototype](pattern_11_Prototype.md) | Creational | `models/` | Booking.clone() | Clone bookings for resubmission |
| 12 | [Template Method](pattern_12_Template_Method.md) | Behavioral | `core/` | BaseDashboardController | Define dashboard initialization skeleton |
| 13 | [Mediator](pattern_13_Mediator.md) | Behavioral | `secretary/ui/` | DashboardNavigationMediator | Coordinate view transitions |

---

## Patterns by Category

### Creational Patterns (4)
Patterns dealing with object creation mechanisms:

1. **Singleton** - Ensure single instance of critical resources
   - SessionManager, FirebaseService, BookingNotifierSubject
   - See: [pattern_01_Singleton.md](pattern_01_Singleton.md)

2. **Factory** - Create objects of different types based on input
   - DashboardFactory creates role-specific dashboards
   - See: [pattern_02_Factory.md](pattern_02_Factory.md)

3. **Builder** - Construct complex objects step-by-step
   - BookingBuilder for multi-step booking form
   - See: [pattern_08_Builder.md](pattern_08_Builder.md)

4. **Prototype** - Clone objects for reuse
   - Booking.clone() for booking resubmission
   - See: [pattern_11_Prototype.md](pattern_11_Prototype.md)

### Structural Patterns (3)
Patterns dealing with object composition and relationships:

1. **Facade** - Simplified interface to complex subsystems
   - AuthService, AdminBookingFacade hide Firebase complexity
   - See: [pattern_04_Facade.md](pattern_04_Facade.md)

2. **Composite** - Tree structures for hierarchical data
   - PermissionComponent, PermissionGroup for permission trees
   - See: [pattern_05_Composite.md](pattern_05_Composite.md)

3. **Decorator** - Attach additional features dynamically
   - Booking decorators (Catering, Projector, Holiday, etc.)
   - See: [pattern_06_Decorator.md](pattern_06_Decorator.md)

### Behavioral Patterns (6)
Patterns dealing with object collaboration and responsibility:

1. **Observer** - Notify multiple objects of state changes
   - BookingNotifierSubject publishes events to observers
   - See: [pattern_03_Observer.md](pattern_03_Observer.md)

2. **Memento** - Capture and restore object state
   - BookingMemento for form undo/redo
   - See: [pattern_07_Memento.md](pattern_07_Memento.md)

3. **Command** - Encapsulate requests as objects
   - ApproveBookingCommand, RejectBookingCommand
   - See: [pattern_09_Command.md](pattern_09_Command.md)

4. **Strategy** - Define interchangeable algorithms
   - Room search strategies (Fixed, Multi)
   - Approval strategies (Lecture, MultiPurpose)
   - See: [pattern_10_Strategy.md](pattern_10_Strategy.md)

5. **Template Method** - Define algorithm skeleton in base class
   - BaseDashboardController initialization sequence
   - See: [pattern_12_Template_Method.md](pattern_12_Template_Method.md)

6. **Mediator** - Coordinate interactions between objects
   - DashboardNavigationMediator manages view transitions
   - See: [pattern_13_Mediator.md](pattern_13_Mediator.md)

---

## Patterns by Use Case

### User Authentication & Session Management
- **Singleton**: SessionManager, FirebaseService
- **Facade**: AuthService
- See: [pattern_01_Singleton.md](pattern_01_Singleton.md), [pattern_04_Facade.md](pattern_04_Facade.md)

### Dashboard & Navigation
- **Factory**: Role-based dashboard creation
- **Template Method**: Dashboard initialization
- **Mediator**: View navigation coordination
- See: [pattern_02_Factory.md](pattern_02_Factory.md), [pattern_12_Template_Method.md](pattern_12_Template_Method.md), [pattern_13_Mediator.md](pattern_13_Mediator.md)

### Booking Management
- **Builder**: Multi-step form completion
- **Prototype**: Booking resubmission
- **Command**: Approval/rejection actions
- **Decorator**: Optional booking features
- **Memento**: Form undo/redo
- See: [pattern_08_Builder.md](pattern_08_Builder.md), [pattern_11_Prototype.md](pattern_11_Prototype.md), [pattern_09_Command.md](pattern_09_Command.md), [pattern_06_Decorator.md](pattern_06_Decorator.md), [pattern_07_Memento.md](pattern_07_Memento.md)

### Admin Approval & Search
- **Strategy**: Different approval/search algorithms
- **Facade**: Simplified admin operations
- See: [pattern_10_Strategy.md](pattern_10_Strategy.md), [pattern_04_Facade.md](pattern_04_Facade.md)

### Permissions & Access Control
- **Composite**: Hierarchical permission structures
- See: [pattern_05_Composite.md](pattern_05_Composite.md)

### Event Notifications
- **Observer**: Publish booking events
- **Singleton**: Central event hub
- See: [pattern_03_Observer.md](pattern_03_Observer.md), [pattern_01_Singleton.md](pattern_01_Singleton.md)

---

## Key Architectural Insights

### Layered Architecture
```
┌─────────────────────────────────┐
│  Controllers (UI Layer)          │
│  - Use templates, factories       │
│  - Delegate to mediators         │
├─────────────────────────────────┤
│  Facades & Services (Logic)      │
│  - AuthService, AdminBookingFacade│
│  - Implement strategies          │
├─────────────────────────────────┤
│  Models & Data (Domain)          │
│  - Booking, User, Room           │
│  - Include clone, decorators     │
├─────────────────────────────────┤
│  Firebase (Data)                 │
│  - Firestore, REST API           │
└─────────────────────────────────┘
```

### Pattern Interaction Flow

1. **Initialization**
   - `DashboardFactory` creates dashboard based on role
   - `BaseDashboardController` template executes init sequence
   - Observers registered in `setupObservers()`
   - UI initialized in `initUI()`
   - Data loaded in `loadData()`

2. **User Interaction**
   - `DashboardNavigationMediator` routes view changes
   - UI components call facade methods (simplified API)
   - `BookingBuilder` constructs complex objects
   - `Command` objects encapsulate actions

3. **Data Management**
   - `Singleton` services manage resources
   - `Observer` pattern propagates changes
   - `Memento` enables undo/redo
   - `Strategy` adapts to different contexts

4. **Feature Enhancement**
   - `Decorator` adds optional features to bookings
   - `Composite` builds permission hierarchies
   - `Prototype` clones objects for variation

---

## Pattern Frequency & Importance

### High Impact Patterns (Used Extensively)
1. **Singleton** - Core infrastructure
2. **Factory** - Every login creates new dashboard
3. **Builder** - Every booking form submission
4. **Facade** - All service interactions
5. **Strategy** - Room search and approval workflow

### Medium Impact Patterns (Important)
1. **Observer** - Booking notifications
2. **Template Method** - All dashboard controllers
3. **Mediator** - Dashboard navigation

### Specialized Patterns (Focused Use)
1. **Composite** - Permission management
2. **Decorator** - Booking customization
3. **Memento** - Form undo/redo
4. **Command** - Approval actions
5. **Prototype** - Booking resubmission

---

## Cross-Pattern Dependencies

```
Singleton ────┬──> Factory
              ├──> Facade
              └──> Observer

Factory ──────────> Template Method

Facade ───────┬──> Singleton
              ├──> Strategy
              └──> Command

Builder ──────┬──> Prototype
              └──> Decorator

Strategy ─────────> Factory

Mediator ─────────> Facade
```

---

## Testing Patterns

Each pattern documentation includes:
- **Validation Checklist**: Verify pattern implementation correctness
- **Code Examples**: Real usage from codebase
- **Potential Issues**: Common pitfalls and mitigations
- **Best Practices**: Recommendations for usage

For testing patterns, refer to each pattern's "Validation Checklist" section.

---

## Alignment with Web Application

The Java Desktop application mirrors the React web application's architecture:

| Java (Desktop) | React (Web) | Pattern |
|---|---|---|
| SessionManager | Redux Store | Singleton |
| DashboardFactory | React Router | Factory |
| AuthService | Auth Context | Facade |
| BookingNotifierSubject | Event Emitter | Observer |
| BaseDashboardController | Custom Hook | Template Method |
| DashboardNavigationMediator | Navigation | Mediator |
| BookingBuilder | Form State | Builder |

---

## Future Pattern Opportunities

Patterns that could be added in the future:

1. **Adapter** - Adapt old booking format to new
2. **Bridge** - Separate booking abstraction from persistence
3. **Chain of Responsibility** - Escalating approval workflow
4. **Proxy** - Lazy loading of dashboard components
5. **Visitor** - Traverse permission/booking trees
6. **State** - Booking workflow state management
7. **Interpreter** - Parse complex queries
8. **Flyweight** - Share immutable room data
9. **Abstract Factory** - Create families of related objects
10. **Iterator** - Traverse booking collections

---

## Document Maintenance

- **Last Updated**: 2024
- **Patterns Documented**: 13/13
- **Coverage**: 100%
- **Code Examples**: All from actual codebase
- **Mermaid Diagrams**: All patterns include architecture and sequence diagrams

---

## How to Use This Documentation

1. **Learn Patterns**: Read pattern files for detailed explanations
2. **Understand Context**: See where patterns are used in codebase
3. **Implement New**: Use examples as templates for new code
4. **Debug Issues**: Check potential issues and mitigations
5. **Best Practices**: Follow recommendations for pattern usage
6. **Validate Implementation**: Use checklists to verify correctness

---

## Quick Reference

### Finding Patterns by Purpose

- **Need to ensure single instance?** → Singleton
- **Need to create objects based on input?** → Factory
- **Need to notify multiple listeners?** → Observer
- **Need to simplify complex subsystem?** → Facade
- **Need to build complex object?** → Builder
- **Need to clone existing object?** → Prototype
- **Need to add optional features?** → Decorator
- **Need to capture state for undo?** → Memento
- **Need to encapsulate action?** → Command
- **Need different algorithms?** → Strategy
- **Need hierarchical structure?** → Composite
- **Need to define algorithm skeleton?** → Template Method
- **Need to coordinate components?** → Mediator

---

**Navigation**: [Go to ANALYSIS_SUMMARY.md](ANALYSIS_SUMMARY.md) for architectural overview
