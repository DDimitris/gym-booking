# Gym Booking System - Complete Implementation Roadmap

## 🎯 Current Status: Foundation Phase Complete

### ✅ Completed So Far (This Session)

1. **Test Users & Mock Auth** - Working
   - 3 test users (admin, trainer/instructor, member/athlete)
   - Color-coded role badges
   - Quick login dropdown
   - LocalStorage persistence

2. **FullCalendar Integration** - Working
   - Month/Week/Day views
   - Click events for details
   - Color-coded by trainer
   - Responsive modals

3. **Role-Based UI** - Working  
   - Admin: Full CRUD access
   - Trainer: Create + edit own
   - Member: View + book only

4. **Database Schema Evolution** - Designed
   - V2 migration created with new tables
   - ClassType, BillingEvent, AuditLog tables
   - Updated User fields (baseCost, bonusDays, authProvider)
   - Capacity default to 5

5. **Backend Entities Updated** - In Progress
   - User: Added billing fields, INSTRUCTOR/ATHLETE roles
   - ClassType: New entity for class categories
   - BillingEvent: Charge tracking
   - AuditLog: Activity tracking
   - GymClass → ClassInstance: Refactored with startTime/endTime
   - Booking: Updated statuses (BOOKED, COMPLETED, CANCELLED_BY_USER, CANCELLED_BY_GYM)

---

## 🏗️ Complete Implementation Plan

### Phase 1: Backend Foundation (Est. 4-6 hours)
**Goal**: Complete backend entities, repositories, and core business logic

#### 1.1 Finish Entity Layer
- [ ] Create repositories for all entities
  - `ClassTypeRepository`
  - `BillingEventRepository`
  - `AuditLogRepository`
- [ ] Update existing repositories for new schema
- [ ] Add database indexes for performance

#### 1.2 Core Services
- [ ] **BookingService** - Main booking logic
  - Reserve class with capacity check (pessimistic locking)
  - Cancel booking with billing rule check
  - Get user booking history
  - Validate concurrent bookings

- [ ] **ClassTypeService** - Class category management
  - CRUD for class types
  - Filter classes by type
  - Assign instructor to type

- [ ] **BillingService** - Financial tracking
  - Create billing event for same-day cancellation
  - Calculate charges per athlete
  - Generate billing reports

- [ ] **UserService** - User management
  - Register new user (default: ATHLETE)
  - Promote user to INSTRUCTOR
  - Set base cost and bonus days
  - OAuth integration (Google/Facebook)

- [ ] **AuditService** - Activity logging
  - Log all important actions
  - Query audit trail

#### 1.3 Business Logic
- [ ] **Same-day cancellation rule**: Cancel <24h before class → charge
- [ ] **Capacity enforcement**: Max 5 per class, pessimistic lock
- [ ] **Concurrent booking prevention**: Use database constraints + locking
- [ ] **Billing calculation**: baseCost * classes - bonusDays

---

### Phase 2: REST API Layer (Est. 3-4 hours)
**Goal**: Expose all functionality via clean REST endpoints

#### 2.1 Authentication & Registration
```
POST /api/auth/register (email/password)
POST /api/auth/login
POST /api/auth/oauth/google
POST /api/auth/oauth/facebook
POST /api/auth/logout
GET  /api/auth/me
```

#### 2.2 Class Types
```
GET    /api/class-types (list all active types)
POST   /api/class-types (INSTRUCTOR, ADMIN only)
PUT    /api/class-types/{id}
DELETE /api/class-types/{id} (ADMIN only)
```

#### 2.3 Class Instances (Schedule)
```
GET    /api/classes?typeId={id}&from={date}&to={date}
POST   /api/classes (INSTRUCTOR, ADMIN)
PUT    /api/classes/{id} (INSTRUCTOR own, ADMIN all)
DELETE /api/classes/{id} (INSTRUCTOR own, ADMIN all)
GET    /api/classes/{id}/bookings (INSTRUCTOR, ADMIN)
```

#### 2.4 Bookings
```
POST   /api/bookings (user reserves class)
GET    /api/bookings/me (user's booking history)
DELETE /api/bookings/{id} (cancel booking)
PATCH  /api/bookings/{id}/complete (mark attended)
```

#### 2.5 Admin Endpoints
```
GET    /api/admin/athletes (list all athletes)
PATCH  /api/admin/users/{id}/promote (promote to INSTRUCTOR)
PATCH  /api/admin/users/{id}/base-cost
PATCH  /api/admin/users/{id}/bonus-days
GET    /api/admin/billing?from={date}&to={date}&userId={id}
GET    /api/admin/billing/export?from={date}&to={date} (Excel download)
```

#### 2.6 User Profile
```
GET    /api/users/me/profile
PUT    /api/users/me/profile
GET    /api/users/me/stats (completed/aborted counts, bonus days)
```

---

### Phase 3: Frontend Implementation (Est. 6-8 hours)
**Goal**: Build complete user-facing UI

#### 3.1 Update Auth System
- [ ] Replace mock auth with real API calls
- [ ] Add email/password registration form
- [ ] Integrate OAuth buttons (Google/Facebook)
- [ ] Update role names (TRAINER→INSTRUCTOR, MEMBER→ATHLETE)
- [ ] Persist JWT token in localStorage

#### 3.2 Calendar Enhancements
- [ ] Add **Class Type dropdown filter**
- [ ] Show capacity (e.g., "3/5 spots filled")
- [ ] Real-time capacity updates
- [ ] Color-code by class type or instructor
- [ ] Show "Full" badge when capacity reached

#### 3.3 Booking Flow
- [ ] Click class → Show details modal
- [ ] "Book" button → Reserve with API call
- [ ] Show confirmation toast
- [ ] Disable book button if full or already booked
- [ ] Allow cancellation with warning if <24h

#### 3.4 Activity History Page (`/history`)
- [ ] List all user bookings
- [ ] Filter by status (completed/cancelled/upcoming)
- [ ] Show status badges
- [ ] Show cancellation charges if applicable
- [ ] Export personal history (CSV)

#### 3.5 Instructor Dashboard (`/instructor`)
- [ ] View all bookings for instructor's classes
- [ ] Create new class types
- [ ] Schedule class instances
- [ ] Edit/delete own classes
- [ ] See attendee list per class

#### 3.6 Admin Dashboard (`/admin`)
- [ ] **Athlete List**:
  - Table with all athletes
  - Columns: Name, Email, Classes Completed, Classes Aborted, Total Charges, Bonus Days
  - Search and filter
  - Click row → Athlete detail page

- [ ] **Athlete Detail Page**:
  - Personal info
  - Set base cost (editable)
  - Set bonus days (editable)
  - Weekly/monthly activity view (chart or table)
  - Full booking history with charges

- [ ] **Promote User**:
  - Button to promote athlete to instructor

- [ ] **Billing Export**:
  - Date range picker
  - Filter by athlete (optional)
  - "Export Excel" button
  - Download XLSX with per-athlete billing

#### 3.7 User Profile Page (`/profile`)
- [ ] View profile info (name, email, role)
- [ ] Edit name
- [ ] Upload avatar (optional enhancement)
- [ ] View personal stats:
  - Total classes completed
  - Total classes cancelled
  - Bonus days remaining (if athlete)
  - Total charges (if athlete)
- [ ] Change password

---

### Phase 4: Advanced Features (Est. 4-6 hours)

#### 4.1 OAuth Integration
- [ ] Add Spring Security OAuth2 client dependencies
- [ ] Configure Google OAuth
- [ ] Configure Facebook OAuth
- [ ] Handle account linking (if email exists)
- [ ] Frontend: OAuth buttons with redirect flow

#### 4.2 Real-Time Updates (Optional)
- [ ] WebSocket for capacity changes
- [ ] Push notifications when class cancelled by gym
- [ ] Live calendar updates

#### 4.3 Excel Export (Backend)
- [ ] Add Apache POI dependency
- [ ] Create ExcelExportService
- [ ] Generate XLSX with:
  - Athlete name, email
  - Per-class breakdown (date, class type, status)
  - Charges applied
  - Totals per athlete
  - Summary sheet

#### 4.4 Enhanced UI/UX
- [ ] Loading states and spinners
- [ ] Error handling with user-friendly messages
- [ ] Toast notifications for actions
- [ ] Confirmation dialogs for destructive actions
- [ ] Responsive mobile design
- [ ] Dark mode toggle

#### 4.5 Email Notifications (Optional)
- [ ] Welcome email on registration
- [ ] Booking confirmation email
- [ ] Class cancelled by gym notification
- [ ] Same-day cancellation charge notice

---

### Phase 5: Testing & Optimization (Est. 3-4 hours)

#### 5.1 Backend Tests
- [ ] Unit tests for booking service (concurrency scenarios)
- [ ] Unit tests for billing rules
- [ ] Integration tests for API endpoints
- [ ] Test role-based permissions

#### 5.2 Frontend Tests
- [ ] Component tests for calendar
- [ ] E2E tests for booking flow
- [ ] Test role-based UI rendering

#### 5.3 Performance Optimization
- [ ] Add caching where appropriate
- [ ] Optimize database queries (N+1 prevention)
- [ ] Add pagination for large lists
- [ ] Lazy loading for admin athlete list

#### 5.4 Security
- [ ] Enable CSRF protection (if not using JWT-only)
- [ ] Rate limiting on auth endpoints
- [ ] Input validation and sanitization
- [ ] SQL injection prevention (use parameterized queries)

---

## 📦 Dependencies to Add

### Backend (`pom.xml`)
```xml
<!-- OAuth2 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-oauth2-client</artifactId>
</dependency>

<!-- Excel Export -->
<dependency>
    <groupId>org.apache.poi</groupId>
    <artifactId>poi-ooxml</artifactId>
    <version>5.2.3</version>
</dependency>

<!-- Email (optional) -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
</dependency>
```

### Frontend (`package.json`)
```json
{
  "dependencies": {
    "@angular/material": "^19.2.19",
    "chart.js": "^4.4.0",
    "ng2-charts": "^5.0.0",
    "file-saver": "^2.0.5",
    "xlsx": "^0.18.5"
  }
}
```

---

## 🚀 Recommended Implementation Order

### Week 1: Core Backend (High Priority)
1. Finish entity repositories
2. Implement BookingService with capacity control
3. Implement BillingService with same-day rule
4. Create REST endpoints for classes and bookings
5. Test concurrency scenarios

### Week 2: Admin & Instructor Features (High Priority)
1. UserService with promote/billing management
2. Admin endpoints (athlete list, billing export)
3. ClassTypeService and endpoints
4. Excel export functionality

### Week 3: Frontend Integration (High Priority)
1. Real auth integration (replace mock)
2. Class type dropdown filter on calendar
3. Booking flow with API calls
4. Activity history page
5. Instructor dashboard

### Week 4: Admin UI & Profile (Medium Priority)
1. Admin dashboard with athlete list
2. Athlete detail page (set cost, bonus days)
3. Billing export UI
4. User profile page
5. Promote user flow

### Week 5: OAuth & Polish (Medium Priority)
1. OAuth integration (Google, Facebook)
2. UI/UX enhancements
3. Error handling and loading states
4. Email notifications (optional)

### Week 6: Testing & Launch (High Priority)
1. Write comprehensive tests
2. Performance optimization
3. Security hardening
4. Documentation
5. Deployment

---

## 💡 Additional Enhancement Ideas (From a Gym Enthusiast Programmer)

### Short-term (1-2 weeks)
1. **Waitlist System**: Allow users to join waitlist when class is full, auto-book if slot opens
2. **Recurring Classes**: Instructor can create recurring weekly schedule (e.g., "Pilates every Monday 6pm")
3. **Push Notifications**: Browser push for class reminders (1 hour before)
4. **QR Code Check-in**: Generate QR code for each booking, instructor scans to mark attended
5. **Class Reviews**: Athletes can rate/review completed classes

### Medium-term (1-2 months)
6. **Membership Tiers**: Different pricing tiers (e.g., unlimited vs. 10 classes/month)
7. **Personal Training**: 1-on-1 sessions between athlete and instructor
8. **Progress Tracking**: Athletes track weight, measurements, personal records
9. **Workout Plans**: Instructors can assign workout plans to athletes
10. **Nutrition Tracking**: Log meals, macros (integration with MyFitnessPal?)

### Long-term (2-6 months)
11. **Mobile App**: React Native or Flutter app
12. **Wearable Integration**: Sync with Fitbit, Apple Watch, Garmin
13. **Social Features**: Follow friends, compare stats, challenges
14. **Video On-Demand**: Library of workout videos for home training
15. **AI Coach**: Personalized recommendations based on history
16. **Multi-Location**: Support gyms with multiple branches

---

## 🎨 UI/UX Best Practices (Applied)

1. **Color Coding**:
   - Admin = Red
   - Instructor = Blue
   - Athlete = Green
   - Class types = Different colors (already implemented)

2. **Status Badges**:
   - Booked = Blue
   - Completed = Green
   - Cancelled (user) = Orange
   - Cancelled (gym) = Red
   - No-show = Gray

3. **Icons & Emojis**:
   - 🏋️ Gym branding
   - ✅ Completed
   - ❌ Cancelled
   - ⏰ Upcoming
   - 💰 Charges

4. **Accessibility**:
   - ARIA labels
   - Keyboard navigation
   - High contrast mode
   - Screen reader support

---

## 📝 Implementation Notes

### Current Mock Data
- Frontend currently uses mock classes if backend returns empty
- This allows immediate testing while backend is being built
- Once backend endpoints are ready, remove mock fallback

### Database Migration Strategy
- V1: Initial schema (already applied)
- V2: Add billing, class types (created, not applied yet)
- Run migrations after reviewing schema changes
- Test on local DB before production

### Authentication Flow
1. Keep mock auth for now (allows development)
2. Build real auth in parallel
3. Feature-flag switch between mock and real
4. Remove mock once OAuth + email/password tested

### Deployment Checklist
- [ ] Environment variables for secrets (Google/FB OAuth keys)
- [ ] Database backups configured
- [ ] HTTPS enforced
- [ ] CORS configured properly
- [ ] Monitoring and logging
- [ ] Error tracking (Sentry?)

---

## 🎯 Success Metrics (Per Spec)

1. **Athletes can book in <2 minutes** ✅ (Already achievable with current UI)
2. **No overbooking** (Need to implement pessimistic locking)
3. **Excel export in <30 seconds** (Need Apache POI implementation)
4. **80% test coverage** (Need to write tests)
5. **New users default to ATHLETE** (Need to implement registration)

---

## 🤝 Next Steps (Your Decision)

### Option A: Continue Full Implementation (Recommended)
I can systematically implement all phases above, starting with backend services and working through frontend integration. This will take multiple sessions but deliver a complete, production-ready system.

### Option B: Prioritized MVP
Focus on the highest-value features first:
1. Real auth (email/password)
2. Class type filtering
3. Working booking system with capacity
4. Basic admin dashboard

### Option C: Current State + Documentation
Keep the current working prototype, and I'll provide detailed implementation guides for each remaining feature that your team can implement.

---

**Which option would you prefer? Or would you like me to continue implementing specific features from the roadmap right now?**
