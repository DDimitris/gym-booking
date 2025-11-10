```markdown
# Feature Specification: Gym Class Booking

**Feature Branch**: `001-gym-class-booking`  
**Created**: 2025-11-04  
**Status**: Draft  
**Input**: User description: "im building a modern web site for booking gym classes. There should be 3 type of users (instructor, admin, athlete). every one of them should be able to loggin, logout or register either with email or google, facebook acount. after a successfull registration the user should be able to loggin. after successfull login the user should be able to see a calendar with all the available classes for a particular type of class (such as pilates or crosfit) and the available hours by selecting the type of class from a drop down. every class should have a maximum capacity of 5 people. the user should be able to pick the desired time and date and confirm reservation.  also the user should be able to whatch a history of his activity such as completed lessons aborted by the user or canceled by the gym. the instructors should be able to see all the reservations of every user as well as to add classes and hours or to delete classes and hours. also they should be able to add, remove or edit (such as name) type of classes. the admin should be able to do all of the above plus he should be able to see a complete list of every athlete and the classes that every athlete has completed or aborted. he should be able to watch weekly or monthly what has been done for every athlete and to add a base cost (that could be different) for every athlete. in case an athlete aborts a class on the same day that the class is going to take place, the athlete should be charged for that class otherwise charges are not applied for that class. also the admin sgould be able to give per athlete possible bonus days that also must be depicted. finaly the admin should be able to export an excel file with all of the stats for payment. the admin is the first one that should login the application. afterwords for every new registration everyone should be an athlete and the admin is responsible to declare if the new registration is an instructor."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Athlete books a class (Priority: P1)

An athlete registers or signs in, browses available class types, views a calendar for the chosen type, selects a date/time, reserves a spot (capacity max 5), and sees the reservation in their history.

**Why this priority**: Core user value — enables booking and consumes the primary product offering.

**Independent Test**: Create an athlete account, sign in, choose class type "Pilates", pick an available slot on the calendar and confirm reservation. Verify reservation appears in the user's history and capacity decreased by one.

**Acceptance Scenarios**:
1. **Given** an authenticated athlete with no conflicting reservation, **When** they select a class type and an available slot with remaining capacity, **Then** a reservation is created and the athlete sees a confirmation and updated history.
2. **Given** a class instance with 5 reservations, **When** another athlete attempts to reserve, **Then** the system returns an out-of-capacity error and prevents the booking.
3. **Given** a reservation exists, **When** the athlete cancels more than the same-day threshold, **Then** the reservation is removed and no charge applies.
4. **Given** a reservation exists, **When** the athlete cancels within the same-day charge window, **Then** the reservation is removed and the athlete is charged according to admin billing rules. Project default: "same-day" is defined as any cancellation less than 24 hours before the class start time (gym local timezone). This threshold is configurable by admins.

---

### User Story 2 - Instructor manages classes (Priority: P2)

An instructor signs in, views all reservations for their classes, adds or deletes class types and class instances (date/time), and edits class type metadata (name, description).

**Why this priority**: Instructors need to manage availability and supervise bookings — required for delivering classes.

**Independent Test**: Instructor adds a new class type and schedules an instance, then verifies it appears on athlete-facing calendars. Instructor views reservations for a class instance.

**Acceptance Scenarios**:
1. **Given** an authenticated instructor, **When** they create a class instance with date/time and capacity, **Then** the class appears for athletes to book.
2. **Given** a class instance, **When** the instructor deletes it, **Then** affected reservations are marked canceled and athletes see the cancellation in history.

---

### User Story 3 - Admin manages users, billing and exports (Priority: P1)

Admin signs in (first account in the system), can view every athlete and their class history, configure per-athlete base cost and bonus days, and export payment/stats to Excel for payroll/payment processing. Admin can promote a user to Instructor.

**Why this priority**: Admin governs system data, billing and reconciliation; required for operational and financial workflows.

**Independent Test**: Admin views athlete list, sets a per-athlete base cost, assigns bonus days to an athlete, and exports a CSV/XLSX containing per-athlete billing data for a selected month.

**Acceptance Scenarios**:
1. **Given** an authenticated admin, **When** they view an athlete's record for a week, **Then** the system shows completed, canceled, and aborted classes, and billable events according to rules.
2. **Given** an athlete aborts a class within the same-day charge window, **When** admin reviews monthly billing, **Then** the charge appears for that athlete.
3. **Given** admin requests an export for a date range, **When** generation completes, **Then** a downloadable Excel file is provided containing per-athlete stats and charges.
4. **Given** a new user registers, **When** they complete registration, **Then** they are created as an Athlete by default and appear in admin's list until promoted to Instructor by admin. Project default: the initial Admin account is pre-seeded during system provisioning (for example via an environment variable or an initial setup script). This provisioning step must be documented in deployment notes and can be replaced by an admin-invite or secret-code flow if required.

---

### User Story 4 - Authentication flows (Priority: P1)

Users (athlete, instructor, admin) can register with email/password or use Google/Facebook OAuth; after successful registration they can login and start using the app. Users can logout.

**Why this priority**: Authentication is fundamental for access control and personalized flows.

**Independent Test**: Register with an email, verify email if required, log in, and confirm profile is accessible; attempt login via Google/Facebook and confirm account linkage or creation.

**Acceptance Scenarios**:
1. **Given** a new user, **When** they register with email and password, **Then** they can log in and see athlete dashboard.
2. **Given** a user uses Google/Facebook to register, **When** the OAuth flow completes, **Then** a user account exists and they can log in.

---

### Edge Cases

- Simultaneous reservation attempts exceeding capacity — must ensure strong concurrency checks and last-write rejection with clear error to the user.
- Time zone issues: classes scheduled in local gym timezone; display must be explicit about timezone; bookings must lock to the class instance time independent of user locale.
- Deleted class instances with active reservations — system must notify athletes and mark reservations as canceled by gym.
- Partial data (e.g., social login returns no email) — flow must handle missing profile fields.
- Payment processing failures — charges must be retried or marked for manual reconciliation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow users to register using email/password and OAuth via Google and Facebook.
- **FR-002**: The system MUST allow users to login and logout; sessions must be revocable by admin.
- **FR-003**: The system MUST support three roles: Athlete, Instructor, Admin. New registrations default to Athlete.
- **FR-004**: The system MUST provide a calendar view filtered by class type and display available time slots for that class type.
- **FR-005**: The system MUST allow an authenticated Athlete to create a reservation for a class instance provided remaining capacity > 0. Max capacity per class instance: 5.
- **FR-006**: The system MUST prevent overbooking and must handle concurrent reservation attempts safely.
- **FR-007**: The system MUST persist reservations and provide a personal activity history for each user showing completed, aborted (user-cancelled), and canceled-by-gym items.
- **FR-008**: The system MUST allow Instructors to create, edit (name, description), and delete class types and class instances (date/time, capacity) for their scope.
- **FR-009**: The system MUST allow Instructors to view reservations for any of their class instances.
- **FR-010**: The system MUST allow Admins to view all athletes, promote athletes to Instructors, set per-athlete base cost, assign bonus days, and export per-athlete stats for billing.
- **FR-011**: The system MUST apply a charge when an Athlete aborts a class within the same-day charge window; no charge applies otherwise. Default behavior: the system records a BillingEvent and marks it for offline/invoiced settlement (manual reconciliation). The system shall provide exportable billing data (CSV/XLSX) for accounting. Integration with a payment gateway (Stripe, PayPal, etc.) is supported as a future configurable option but is out of scope for initial delivery.
- **FR-012**: The system MUST allow Admin to export billing/stats as an Excel file for any selected date range.
- **FR-013**: The system MUST ensure the Admin account exists as the first administrative login mechanism. Default: the initial Admin account is pre-seeded during provisioning (e.g., via an environment variable or an initial setup script); document this in deployment notes and support alternative provisioning flows if required.
- **FR-014**: The system MUST provide unit tests that cover core business logic for booking, cancellation rules, and role-based permissions. (Integration tests are optional.)

### Key Entities *(include if feature involves data)*

- **User**: id, role {Athlete, Instructor, Admin}, name, email, auth_providers, status, base_cost (if set by admin), bonus_days
- **ClassType**: id, name, description, instructor_id (owner)
- **ClassInstance**: id, class_type_id, instructor_id, start_datetime, end_datetime, capacity (max 5), location, status {scheduled, canceled}
- **Reservation**: id, class_instance_id, user_id, status {booked, completed, cancelled_by_user, cancelled_by_gym}, created_at
- **BillingEvent**: id, user_id, reservation_id, amount, reason, created_at, settled_flag
- **AuditLog**: id, actor_id, action, target, timestamp, metadata

## Success Criteria *(mandatory)*

### Measurable Outcomes
- **SC-001**: Athletes can complete a reservation transaction (select class type → pick slot → confirm) in under 2 minutes, 95% of attempts.
- **SC-002**: System prevents overbooking: when class capacity is 5, only 5 reservations can be in state `booked` for that instance; race condition tests demonstrate correctness under concurrent booking attempts.
- **SC-003**: Admin can generate an export (Excel) for a selected monthly range and receive a downloadable file within 30 seconds for typical dataset sizes (up to 10k rows).
- **SC-004**: Unit test coverage for core booking and billing rules is >= 80% for backend service logic.
- **SC-005**: Newly registered users default to Athlete role and are visible in admin's user list within 1 minute of registration.

## Assumptions

- Time zone for class scheduling is the gym's local timezone unless otherwise specified.
- Same-day cancellation window default: cancellations made less than 24 hours before class start (gym local time) are billable; this value is configurable by admin settings.
- Payment processing default: offline invoicing / manual reconciliation. The system records BillingEvents and produces exportable reports for accounting; payment gateway integrations are optional for later.
- Admin provisioning default: initial Admin account is pre-seeded during provisioning (via env var or setup script); document in deployment notes. Alternative provisioning (invite/code) can be implemented later.

## Resolved Decisions

1. Same-day cancellation window: default = <24 hours before class start (gym local timezone).
2. Payment processing approach: default = offline invoicing/manual reconciliation; BillingEvents recorded and exports produced. Gateway integration optional later.
3. Admin provisioning: default = initial Admin account pre-seeded at provisioning; document and support alternate flows if needed.

## Minimal Acceptance Test Plan (high level)

- Create athlete account (email), login, reserve a class — expect success and history update.
- Attempt to overbook a class with concurrent requests — expect exactly 5 booked, rest rejected.
- Instructor creates class type and instance, athlete sees it in calendar and can book.
- Admin sets per-athlete base cost and bonus days; export billing and verify exported rows reflect charges and bonuses.
- Cancel class instance as Instructor; verify athlete histories show canceled-by-gym.

---

**Spec ready for planning**: YES (defaults applied; please confirm with product owner)

```