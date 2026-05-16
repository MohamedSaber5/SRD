# Proxy Design Pattern

## Definition
The **Proxy** design pattern provides a placeholder (proxy object) that controls access to another object (the real subject).

## Why Use It
- Control access (authorization/permission checks).
- Delay expensive object creation (lazy loading).
- Add logging, caching, or monitoring without changing the real object.
- Hide remote/network complexity behind a local interface.

## Structure
- **Subject**: common interface for both proxy and real object.
- **RealSubject**: the actual object that does the main work.
- **Proxy**: implements the same interface and forwards requests to `RealSubject` while adding extra behavior.

## Real-World Example
A university room-booking system may use a proxy service that:
- verifies user role and permissions first,
- checks rate limits or booking rules,
- then forwards valid requests to the real booking service.

## Pros
- Improves security and control.
- Supports separation of concerns.
- Enables performance optimizations (e.g., caching/lazy init).

## Cons
- Adds extra layer/complexity.
- Can increase response time if overused.

## Common Types of Proxy
- **Virtual Proxy**: lazy initialization.
- **Protection Proxy**: access control.
- **Remote Proxy**: access remote object.
- **Caching Proxy**: stores/reuses previous results.
