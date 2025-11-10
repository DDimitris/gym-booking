import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { GymClassService } from '../../core/services/gym-class.service';
import { ClassTypeService } from '../../core/services/class-type.service';
import { BookingService } from '../../core/services/booking.service';
import { KeycloakService } from '../../core/services/keycloak.service';
import { GymClass } from '../../core/models/gym-class.model';
import { ClassType } from '../../core/models/class-type.model';
import { forkJoin } from 'rxjs';
import { UserService } from '../../core/services/user.service';
import type { User } from '../../core/models/user.model';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, FullCalendarModule],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit {
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    editable: false,
    selectable: false,
    dayMaxEvents: true,
    weekends: true,
    events: [],
    eventClick: this.handleEventClick.bind(this)
  };

  showModal = false;
  modalMode: 'view' | 'book' = 'view';
  selectedClass: GymClass | null = null;
  bookingCount = 0;
  // simple in-component toast message
  toastMessage: string | null = null;
  toastType: 'success' | 'error' | 'info' = 'info';
  
  // Class types for filtering
  classTypes: ClassType[] = [];
  selectedClassTypeId: number | null = null;
  
  // All classes from backend
  allClasses: GymClass[] = [];
  
  isAdmin = false;
  isInstructor = false;
  private trainersMap: Map<number, string> = new Map();

  constructor(
    private gymClassService: GymClassService,
    private classTypeService: ClassTypeService,
    private bookingService: BookingService,
    private kc: KeycloakService,
    private users: UserService
  ) {}

  ngOnInit(): void {
  this.isAdmin = this.kc.isReady() && this.kc.isAuthenticated() && this.kc.getRoles().includes('ADMIN');
  // Accept both role labels for instructor role compatibility
  this.isInstructor = this.kc.isReady() && this.kc.isAuthenticated() && (this.kc.getRoles().includes('INSTRUCTOR') || this.kc.getRoles().includes('TRAINER'));
    
    this.loadData();
  }

  loadData(): void {
    forkJoin({
      classes: this.gymClassService.getAllGymClasses(),
      classTypes: this.classTypeService.getActiveClassTypes(),
      trainers: this.users.getAllTrainers()
    }).subscribe({
      next: ({ classes, classTypes, trainers }) => {
        this.allClasses = classes;
        this.classTypes = classTypes;
        // Build trainers map (id -> display name)
        this.trainersMap = new Map(
          trainers.map((u: User) => [u.id, (u.name || u.email || `User#${u.id}`)])
        );
        this.filterAndUpdateCalendar();
      },
      error: (err) => {
        console.error('Error loading data:', err);
        alert('Failed to load calendar data. Please refresh the page.');
      }
    });
  }

  onClassTypeFilterChange(): void {
    this.filterAndUpdateCalendar();
  }

  filterAndUpdateCalendar(): void {
    let filteredClasses = this.allClasses;
    
    if (this.selectedClassTypeId !== null && this.selectedClassTypeId !== 0) {
      filteredClasses = this.allClasses.filter(c => c.classTypeId === this.selectedClassTypeId);
    }
    
    this.updateCalendarEvents(filteredClasses);
  }

  updateCalendarEvents(classes: GymClass[]): void {
    const events: EventInput[] = classes.map(c => ({
      id: c.id.toString(),
      title: c.name,
      start: c.startTime,
      end: c.endTime,
      extendedProps: {
        description: c.description,
        trainerId: (c as any).trainerId ?? (c as any).instructorId,
        capacity: c.capacity,
        location: c.location,
        classTypeId: c.classTypeId,
        status: c.status
      },
      backgroundColor: this.getEventColor(c),
      borderColor: this.getEventColor(c)
    }));
    
    this.calendarOptions = {
      ...this.calendarOptions,
      events
    };
  }

  getEventColor(gymClass: GymClass): string {
    // Color code by class type
    const classType = this.classTypes.find(ct => ct.id === gymClass.classTypeId);
    if (!classType) return '#3788d8';
    
    const colors: Record<string, string> = {
      'Pilates': '#9c27b0',
      'CrossFit': '#f44336',
      'Yoga': '#4caf50',
      'Spin': '#ff9800',
      'Boxing': '#795548',
      'HIIT': '#e91e63'
    };
    
    return colors[classType.name] || '#3788d8';
  }

  handleEventClick(clickInfo: EventClickArg): void {
    const event = clickInfo.event;
    const classId = parseInt(event.id);
    const selectedClass = this.allClasses.find(c => c.id === classId);
    
    if (!selectedClass) return;
    
    this.selectedClass = selectedClass;
    
    // Load booking count for this class (public endpoint)
    this.bookingService.getClassBookingsCount(classId).subscribe({
      next: (count) => {
        this.bookingCount = count;
        this.modalMode = 'view';
        this.showModal = true;
      },
      error: (err) => {
        console.error('Error loading bookings:', err);
        this.bookingCount = 0;
        this.modalMode = 'view';
        this.showModal = true;
      }
    });
  }

  bookClass(): void {
    if (!this.selectedClass) return;
    if (!(this.kc.isReady() && this.kc.isAuthenticated())) {
      console.warn('Booking attempted while unauthenticated');
      this.showToast('Please log in to book a class.', 'info');
      return;
    }
    // Prevent self booking for admin/instructor roles
    if (this.isAdmin || this.isInstructor) {
      // Redundant guard (button hidden) but keep server-side safety feedback
      this.showToast('Staff cannot self-book. Use Management to book for an athlete.', 'error');
      return;
    }

    this.bookingService.createBooking(this.selectedClass.id).subscribe({
      next: () => {
        console.log('Booking successful');
        this.showToast('Successfully booked! Remember: cancellations within 24 hours may be charged.', 'success');
        this.closeModal();
        this.loadData(); // Refresh data
      },
      error: (err) => {
        console.error('Error booking class:', err);
        const message = err.error?.message || 'Failed to book class. The class may be full or you may already be registered.';
        this.showToast(message, 'error');
      }
    });
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedClass = null;
    this.bookingCount = 0;
  }

  get availableSpots(): number {
    if (!this.selectedClass) return 0;
    return this.selectedClass.capacity - this.bookingCount;
  }

  get isFull(): boolean {
    return this.availableSpots <= 0;
  }

  get classTypeName(): string {
    if (!this.selectedClass) return '';
    const classType = this.classTypes.find(ct => ct.id === this.selectedClass?.classTypeId);
    return classType?.name || '';
  }

  private showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.toastMessage = message;
    this.toastType = type;
    setTimeout(() => { this.toastMessage = null; }, 4000);
  }

  get trainerName(): string {
    if (!this.selectedClass) return '';
    const id = (this.selectedClass as any).trainerId ?? (this.selectedClass as any).instructorId;
    if (!id) return '';
    return this.trainersMap.get(id) || '';
  }
}
