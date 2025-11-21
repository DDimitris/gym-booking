import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { GymClassService } from '../../core/services/gym-class.service';
import { ClassTypeService } from '../../core/services/class-type.service';
import { BookingService } from '../../core/services/booking.service';
import { KeycloakService } from '../../core/services/keycloak.service';
import { GymClass, ClassKind } from '../../core/models/gym-class.model';
import { ClassType } from '../../core/models/class-type.model';
import { forkJoin } from 'rxjs';
import { UserService } from '../../core/services/user.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import type { User } from '../../core/models/user.model';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, FullCalendarModule, TranslateModule],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit {
  calendarOptions: CalendarOptions = this.createCalendarOptions();

  showModal = false;
  modalMode: 'view' | 'book' = 'view';
  selectedClass: GymClass | null = null;
  bookingCount = 0;
  currentUser: User | null = null;
  chargeAmount: number | null = null;
  canBookByFunds: boolean | null = null;
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
  isMember = false;
  private trainersMap: Map<number, string> = new Map();

  constructor(
    private gymClassService: GymClassService,
    private classTypeService: ClassTypeService,
    private bookingService: BookingService,
    private kc: KeycloakService,
    private users: UserService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    const ready = this.kc.isReady() && this.kc.isAuthenticated();
    const roles = ready ? this.kc.getRoles() : [];
  this.isAdmin = ready && roles.includes('ADMIN');
  this.isInstructor = ready && (roles.includes('INSTRUCTOR') || roles.includes('TRAINER'));
  this.isMember = ready && (roles.includes('MEMBER') || roles.includes('ATHLETE'));

    this.loadData();
  }

  private isMobile(): boolean {
    return window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
  }

  private createCalendarOptions(): CalendarOptions {
    const mobile = this.isMobile();
    // Universal mobile toolbar: hide month view entirely on small screens
    const rightDesktop = 'dayGridMonth,timeGridWeek,timeGridDay';
    const rightMobile = 'listWeek,timeGridWeek,timeGridDay';
    const headerToolbar = mobile
      ? { left: 'prev,next', center: 'title', right: rightMobile }
      : { left: 'prev,next today', center: 'title', right: rightDesktop };
    return {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
      initialView: mobile ? 'listWeek' : 'timeGridWeek',
      headerToolbar,
      editable: false,
      selectable: false,
      dayMaxEvents: true,
      weekends: true,
      expandRows: true,
      contentHeight: 'auto',
      events: [],
      eventClick: this.handleEventClick.bind(this),
      slotMinTime: '06:00:00',
      slotMaxTime: '22:00:00',
      nowIndicator: true,
    };
  }

  // Adjust calendar layout on viewport resize
  onResize = () => {
    const options = this.createCalendarOptions();
    this.calendarOptions = { ...options, events: (this.calendarOptions.events as any) || [] };
  };

  // Set up resize listener
  ngAfterViewInit(): void {
    window.addEventListener('resize', this.onResize);
  }
  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onResize);
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
        alert(this.translate.instant('calendar.errors.loadData'));
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
        // If user is authenticated, fetch profile to compute wallet/bonus eligibility
        if (this.kc.isReady() && this.kc.isAuthenticated()) {
          this.users.getMe().subscribe({
            next: (me) => {
              this.currentUser = me as User;
              // Compute charge amount based on user's per-kind costs
              const kind = selectedClass.kind as string;
              const amount = this.resolveChargeAmountFromUser(this.currentUser, kind);
              this.chargeAmount = amount !== null ? Number(amount) : 0;
              const wallet = Number(this.currentUser.walletBalance ?? 0);
              const bonus = Number(this.currentUser.bonusDays ?? 0);
              this.canBookByFunds = (this.chargeAmount <= wallet) || (bonus > 0) || this.chargeAmount === 0;
            },
            error: () => {
              this.currentUser = null;
              this.chargeAmount = null;
              this.canBookByFunds = null;
            }
          });
        } else {
          this.currentUser = null;
          this.chargeAmount = null;
          this.canBookByFunds = null;
        }
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
      this.showToast(
        this.translate.instant('calendar.messages.loginRequired'),
        'info'
      );
      return;
    }
    // Prevent self booking for admin/instructor roles
    if (this.isAdmin || this.isInstructor) {
      // Redundant guard (button hidden) but keep server-side safety feedback
      this.showToast(
        this.translate.instant('calendar.messages.staffCannotBook'),
        'error'
      );
      return;
    }

    this.bookingService.createBooking(this.selectedClass.id).subscribe({
      next: () => {
        console.log('Booking successful');
        this.showToast(
          this.translate.instant('calendar.messages.bookingSuccess'),
          'success'
        );
        this.closeModal();
        this.loadData(); // Refresh data
      },
      error: (err) => {
        console.error('Error booking class:', err);
        const raw = err.error?.message || err.error;
        if (raw && typeof raw === 'string') {
          // Show server-provided message when available (e.g. insufficient funds)
          this.showToast(raw, 'error');
        } else {
          const key = 'calendar.errors.bookingFailed';
          this.showToast(this.translate.instant(key), 'error');
        }
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

  kindLabel(kind: ClassKind | string | undefined | null): string {
    switch (kind) {
      case ClassKind.GROUP:
      case 'GROUP':
        return 'gymClasses.kinds.group';
      case ClassKind.SMALL_GROUP:
      case 'SMALL_GROUP':
        return 'gymClasses.kinds.smallGroup';
      case ClassKind.PERSONAL:
      case 'PERSONAL':
        return 'gymClasses.kinds.personal';
      case ClassKind.OPEN_GYM:
      case 'OPEN_GYM':
        return 'gymClasses.kinds.openGym';
      default:
        return '';
    }
  }

  // Compute the charge amount for a class based on the user's per-kind base costs
  private resolveChargeAmountFromUser(user: User | null, kind: string | undefined | null): number | null {
    if (!user || !kind) return null;
    switch (kind) {
      case 'GROUP':
      case 'group':
        return user.groupBaseCost ?? user.groupBaseCost ?? 0;
      case 'SMALL_GROUP':
      case 'small_group':
      case 'smallGroup':
        return user.smallGroupBaseCost ?? 0;
      case 'PERSONAL':
      case 'personal':
        return user.personalBaseCost ?? 0;
      case 'OPEN_GYM':
      case 'open_gym':
      case 'openGym':
        return user.openGymBaseCost ?? 0;
      default:
        return 0;
    }
  }
}
