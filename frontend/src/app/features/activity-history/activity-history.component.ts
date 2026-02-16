import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookingService } from '../../core/services/booking.service';
import { GymClassService } from '../../core/services/gym-class.service';
import { ClassTypeService } from '../../core/services/class-type.service';
import { KeycloakService } from '../../core/services/keycloak.service';
import { Booking, BookingStatus } from '../../core/models/booking.model';
import { GymClass, ClassKind } from '../../core/models/gym-class.model';
import { ClassType } from '../../core/models/class-type.model';
import { UserService } from '../../core/services/user.service';
import { forkJoin } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface BookingWithDetails extends Booking {
  gymClass?: GymClass;
  classTypeName?: string;
}

@Component({
  selector: 'app-activity-history',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './activity-history.component.html',
  styleUrls: ['./activity-history.component.css']
})
export class ActivityHistoryComponent implements OnInit {
  bookings: BookingWithDetails[] = [];
  classes: GymClass[] = [];
  classTypes: ClassType[] = [];
  message: string | null = null;
  messageType: 'success' | 'error' | 'info' = 'info';
  isLoading = true;
  isInstructor = false;
  backendRole: string | null = null;
  // UI state for member combined view
  // Removed combined chronological view feature

  constructor(
    private bookingService: BookingService,
    private gymClassService: GymClassService,
    private classTypeService: ClassTypeService,
    private kc: KeycloakService,
    private userService: UserService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    // Route is guarded; assume authenticated
    this.isInstructor = this.kc.isReady() && this.kc.isAuthenticated() && (this.kc.getRoles().includes('TRAINER') || this.kc.getRoles().includes('INSTRUCTOR'));
    // Also check backend role to immediately reflect promotions/demotions
    if (this.kc.isReady() && this.kc.isAuthenticated()) {
      this.userService.getMe().subscribe({
        next: (me) => {
          const br = (me as any)?.role || null;
          this.backendRole = br;
          if (br === 'INSTRUCTOR' || br === 'TRAINER') {
            this.isInstructor = true;
          }
        },
        error: () => {
          this.backendRole = null;
        }
      });
    }
    this.loadActivityHistory();
  }

  loadActivityHistory(): void {
    this.isLoading = true;
    
    // For instructors we show classes they instruct (future: filter by instructorId) and bookings are not relevant.
    if (this.isInstructor) {
      this.userService.getMe().subscribe({
        next: (me) => {
          const myId = me?.id;
          forkJoin({
            classes: this.gymClassService.getAllGymClasses(),
            classTypes: this.classTypeService.getActiveClassTypes()
          }).subscribe({
            next: ({ classes, classTypes }) => {
              this.classTypes = classTypes;
              this.classes = classes.filter(c => (c as any).trainerId === myId || (c as any).instructorId === myId);
              this.isLoading = false;
            },
            error: (err) => {
              console.error('Error loading instructor classes:', err);
              this.messageType = 'error';
              this.message = 'Failed to load classes.';
              this.isLoading = false;
            }
          });
        },
        error: (err) => {
          console.error('Error resolving current user', err);
          this.isLoading = false;
        }
      });
    } else {
      forkJoin({
        bookings: this.bookingService.getMyBookings(),
        classes: this.gymClassService.getAllGymClasses(),
        classTypes: this.classTypeService.getActiveClassTypes()
      }).subscribe({
        next: ({ bookings, classes, classTypes }) => {
          this.classes = classes;
          this.classTypes = classTypes;
          this.bookings = bookings.map(booking => {
            const gymClass = classes.find(c => c.id === booking.classInstanceId);
            const classType = classTypes.find(ct => ct.id === gymClass?.classTypeId);
            return {
              ...booking,
              gymClass,
              classTypeName: classType?.name
            };
          });
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading activity history:', err);
          this.messageType = 'error';
          this.message = 'Failed to load activity history. Please try again.';
          this.isLoading = false;
        }
      });
    }
  }

  cancelBooking(booking: BookingWithDetails): void {
    if (!booking.gymClass) return;
    
    const now = new Date();
    const classStart = new Date(booking.gymClass.startTime);
    const hoursUntilClass = (classStart.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    let confirmMessage = `Are you sure you want to cancel "${booking.gymClass.name}"?`;
    
    // Mirror backend SAME_DAY_THRESHOLD_HOURS = 12
    if (hoursUntilClass < 12) {
      confirmMessage += `\n\n⚠️ Warning: This is a same-day cancellation (less than 12 hours before class). You will be charged the base cost.`;
    }
    
    if (!confirm(confirmMessage)) return;
    
    this.bookingService.cancelBooking(booking.id).subscribe({
      next: () => {
        // Keep client messaging aligned with 12-hour backend rule
        if (hoursUntilClass < 12) {
          console.log('Booking cancelled: same-day cancellation charge applied.');
          this.messageType = 'info';
          this.message = 'Booking cancelled (same-day charge applies: cancelled within 12 hours of class).';
        } else {
          console.log('Booking cancelled without charge.');
          this.messageType = 'success';
          this.message = 'Booking cancelled successfully.';
        }
        this.loadActivityHistory();
      },
      error: (err) => {
        console.error('Error cancelling booking:', err);
        this.messageType = 'error';
        this.message = 'Failed to cancel booking. Please try again.';
      }
    });
  }

  getStatusBadgeClass(status: BookingStatus): string {
    const classes: Record<BookingStatus, string> = {
      [BookingStatus.BOOKED]: 'badge-primary',
      [BookingStatus.COMPLETED]: 'badge-success',
      [BookingStatus.CANCELLED_BY_USER]: 'badge-warning',
      [BookingStatus.CANCELLED_BY_GYM]: 'badge-danger',
      [BookingStatus.NO_SHOW]: 'badge-danger'
    };
    return classes[status] || 'badge-secondary';
  }

  getStatusLabel(status: BookingStatus): string {
    const labels: Record<BookingStatus, string> = {
      [BookingStatus.BOOKED]: 'Booked',
      [BookingStatus.COMPLETED]: 'Completed',
      [BookingStatus.CANCELLED_BY_USER]: 'Cancelled by You',
      [BookingStatus.CANCELLED_BY_GYM]: 'Cancelled by Gym',
      [BookingStatus.NO_SHOW]: 'No Show'
    };
    return labels[status] || status;
  }

  canCancel(booking: BookingWithDetails): boolean {
    if (booking.status !== BookingStatus.BOOKED) return false;
    if (!booking.gymClass) return false;
    
    const now = new Date();
    const classStart = new Date(booking.gymClass.startTime);
    return classStart > now;
  }

  isPastClass(booking: BookingWithDetails): boolean {
    if (!booking.gymClass) return false;
    const now = new Date();
    const classStart = new Date(booking.gymClass.startTime);
    return classStart < now;
  }

  get upcomingBookings(): BookingWithDetails[] {
    // Show all future bookings regardless of status (e.g., future cancellation still visible)
    return this.bookings.filter(b => !this.isPastClass(b));
  }

  get pastBookings(): BookingWithDetails[] {
    return this.bookings.filter(b => this.isPastClass(b));
  }

  // Unified list (optional future use)
  get allBookingsChrono(): BookingWithDetails[] {
    return [...this.bookings].sort((a,b) => {
      const as = new Date(a.gymClass?.startTime || 0).getTime();
      const bs = new Date(b.gymClass?.startTime || 0).getTime();
      return as - bs;
    });
  }

  // toggleCombined removed along with combined view

  // For instructor view convenience
  get upcomingClasses(): GymClass[] {
    const now = new Date();
    return this.classes.filter(c => new Date(c.startTime) > now);
  }
  get pastClasses(): GymClass[] {
    const now = new Date();
    return this.classes.filter(c => new Date(c.startTime) <= now);
  }

  getClassTypeName(classTypeId: number | null | undefined): string {
    if (!classTypeId) return 'N/A';
    const ct = this.classTypes.find(x => x.id === classTypeId);
    return ct?.name || 'N/A';
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
}
