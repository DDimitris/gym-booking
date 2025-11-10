# data-model.md

## Entities

### User
- id: UUID
- name: string
- email: string (unique)
- role: enum {ATHLETE, INSTRUCTOR, ADMIN}
- auth_providers: list (e.g., ["email","google","facebook"])  
- base_cost: decimal (optional, set by admin)
- bonus_days: integer (optional)
- created_at, updated_at

### ClassType
- id: UUID
- name: string
- description: string
- owner_instructor_id: UUID (nullable)
- created_at, updated_at

### ClassInstance
- id: UUID
- class_type_id: UUID
- instructor_id: UUID
- start_datetime: timestamp with timezone
- end_datetime: timestamp with timezone
- capacity: integer (default 5, max 5)
- location: string (optional)
- status: enum {SCHEDULED, CANCELED}
- created_at, updated_at

### Reservation
- id: UUID
- class_instance_id: UUID
- user_id: UUID
- status: enum {BOOKED, COMPLETED, CANCELLED_BY_USER, CANCELLED_BY_GYM}
- created_at, updated_at

### BillingEvent
- id: UUID
- user_id: UUID
- reservation_id: UUID (nullable)
- amount: decimal
- reason: string
- created_at, settled_flag (boolean)

### AuditLog
- id: UUID
- actor_id: UUID
- action: string
- target_type: string
- target_id: UUID
- metadata: jsonb
- timestamp

## Relationships
- User (1) <- (N) Reservation
- ClassType (1) <- (N) ClassInstance
- ClassInstance (1) <- (N) Reservation
- User (Instructor) (1) <- (N) ClassInstance

## Validation Rules / Constraints
- ClassInstance.capacity <= 5
- Reservation creation: only if COUNT(booked reservations) < ClassInstance.capacity
- Reservation cancellation: if cancelled < 24h before start => no billing event; if cancelled < 24h => create BillingEvent

## Notes on migrations
- Place Flyway SQL scripts under each service that owns its tables, or use a centralized `migrations/` for shared schema.
