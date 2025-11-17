# Gym Booking App - Testing Guide

## ✅ Successfully Implemented Features

### 1. **Test Users with Visual Role Badges**
Three pre-configured test users with distinct roles and color-coded badges:

| Username | Password | Role | Badge Color | Permissions |
|----------|----------|------|-------------|-------------|
| `admin` | `admin` | ADMIN | 🔴 Red | Full access - Create, Edit, Delete all classes, manage billing |
| `trainer` | `trainer` | TRAINER | 🔵 Blue | Create classes, Edit own classes |
| `member` | `member` | MEMBER | 🟢 Green | View classes, Book classes |

### 2. **Modern Header with Quick Login**
- Color-coded role badges (Admin=Red, Trainer=Blue, Member=Green)
- Quick login dropdown (no password needed for testing)
- Persistent login (saved in localStorage)
- Clean, professional UI with gradient background

### 3. **Full Calendar Integration (FullCalendar)**
- **Views**: Month, Week, Day
- **Interactive**: Click events to see details
- **Color-coded**: Classes color-coded by trainer
- **Responsive**: Works on all screen sizes

### 4. **Role-Based Class Management & Billing**

#### **For ADMIN (admin/admin)**
- ✅ Create new classes
- ✅ Edit ANY class
- ✅ Delete ANY class
- ✅ View all classes
- ✅ Book classes
- ✅ View per-athlete billing reports
- ✅ Mark billing events as paid (single and bulk)
- ✅ Settle individual billing events using bonus days (when available)

#### **For TRAINER (trainer/trainer)**
- ✅ Create new classes
- ✅ Edit THEIR OWN classes only
- ❌ Cannot delete classes
- ✅ View all classes
- ✅ Book classes

#### **For MEMBER (member/member)**
- ❌ Cannot create classes
- ❌ Cannot edit classes
- ❌ Cannot delete classes
- ✅ View all classes
- ✅ Book classes (button visible)

### 5. **Mock Data & Real Billing**
The app includes 6 sample classes spread across the week:
- Morning Yoga (Today 9:00 AM)
- Evening Spin (Today 6:00 PM)
- Pilates (Tomorrow 10:00 AM)
- CrossFit (Tomorrow 5:00 PM)
- Zumba (Day +2, 7:00 PM)
- Boxing (Day +3, 6:30 PM)

## 🧪 How to Test

### Step 1: Open the App
```
https://localhost
```

### Step 2: Login as Test User
1. Click the dropdown in the header "Quick login:"
2. Select a user (e.g., "Admin User — ADMIN")
3. You'll see the role badge appear with your name

### Step 3: View the Calendar
- The calendar loads automatically at `/classes`
- Try different views: Month / Week / Day (top right buttons)
- Click on any class to see details

### Step 4: Test Admin Features (login as `admin`)
1. Click "➕ Add New Class" button
2. Fill in the form:
   - Class Name: e.g., "HIIT Training"
   - Description: e.g., "High intensity interval training"
   - Date: Use the **date picker** to choose the class date
   - Start Time: e.g., `18:00`
   - Duration: e.g., 45 minutes (end time is computed automatically)
   - Trainer: Your name or any trainer
   - Capacity: e.g., 15
3. Click "Save"
4. The class appears on the calendar
5. Click the new class → Click "Edit" → Modify date/time via the date picker and time field → Save
6. Verify that the updated date/time is reflected correctly on the calendar
7. Click the class → Click "Delete" → Confirm

### Step 4b: Test Admin Billing & Settlement (login as `admin`)
1. Navigate to the **Admin / Billing** page.
2. For each athlete, review:
   - Their outstanding billing events.
   - The class name and instructor shown for each event.
   - The settlement badge (Unassigned, Payment, Bonus day).
3. Select multiple pending events and use the **"Mark selected as paid"** action to settle them as payments.
4. For a single event, use:
   - **"Mark Paid"** to settle as a standard payment, or
   - **"Use Bonus Day"** to settle via bonus days (if the athlete has bonus days available).
5. Confirm that:
   - The settlement badge updates to **Payment** or **Bonus day**.
   - Bonus days decrease when settling via bonus.
   - Totals in the per-athlete summary update accordingly.

### Step 5: Test Trainer Features (login as `trainer`)
1. Create a new class (trainer can create)
2. Try to edit a class created by "Admin User" → Edit button won't appear
3. Edit your own class → Edit button appears

### Step 6: Test Member Features (login as `member`)
1. "➕ Add New Class" button is hidden
2. Click any class → Only "Book Class" button is visible
3. No Edit or Delete buttons

### Step 7: Logout and Switch Users
1. Click "Logout" button
2. Select a different user from the dropdown
3. Notice the badge color changes
4. Test permissions again

## 🎨 UI Features

### Header
- Gradient blue background
- Gym emoji 🏋️ for branding
- Role badge with color coding
- Clean navigation

### Calendar
- Professional FullCalendar integration
- Event colors vary by trainer
- Hover effects on events
- Responsive modal dialogs

### Modals
- View mode: Clean details layout
- Create/Edit mode: Form with validation
- Role-based button visibility
- Smooth transitions

## 🔧 Technical Details

### Frontend Stack
- Angular 19
- FullCalendar 6.1
- Standalone components
- RxJS for state management
- TypeScript

### Authentication
- Mock auth service (no backend required)
- LocalStorage persistence
- Role-based access control
- BehaviorSubject for reactive state

### API Integration
- Calls `/api/classes` endpoint
- Falls back to mock data if backend returns empty
- Full CRUD operations wired up
- HTTP interceptor (pass-through for now)

## 🚀 Next Steps

If you want to enhance further:

1. **Add real backend data**
   - Populate backend database with test classes
   - Wire up bookings endpoint
   - Add user profiles

2. **Booking system**
   - Track who booked which class
   - Show remaining capacity
   - Prevent double-booking

3. **Calendar enhancements**
   - Drag-and-drop to reschedule (admin/trainer)
   - Recurring classes
   - Waitlist for full classes

4. **User profile**
   - Avatar upload
   - Personal schedule view
   - Booking history

## 📝 Notes

- All user sessions persist in localStorage (refresh browser to keep logged in)
- Backend is configured to permit all requests (no JWT validation)
- Frontend makes API calls but falls back to mock data if empty
- Tests and specs still need updating (not critical for manual testing)

---

**Enjoy testing! Switch between users to see how the UI adapts to each role.** 🎉
