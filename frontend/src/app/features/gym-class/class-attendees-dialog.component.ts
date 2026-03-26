import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Booking } from '../../core/models/booking.model';
import { BookingService } from '../../core/services/booking.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface ClassAttendeesDialogData {
  className: string;
  startTime?: string | Date | null;
  attendees: Booking[];
}

@Component({
  selector: 'app-class-attendees-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, TranslateModule],
  template: `
    <div class="attendees-dialog">
      <div class="dialog-header">
        <div>
          <h2 class="title">Attendees</h2>
          <p class="subtitle" *ngIf="data.className">
            {{ data.className }}
            <span *ngIf="data.startTime" class="time-pill">
              {{ data.startTime | date: 'EEE dd MMM, HH:mm' }}
            </span>
          </p>
        </div>
        <button mat-icon-button (click)="dialogRef.close()" aria-label="Close">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div *ngIf="!data.attendees?.length" class="empty">
        {{ 'gymClasses.list.prompts.noAttendees' | translate:{ name: data.className } }}
      </div>

      <div *ngIf="data.attendees?.length" class="summary-row">
        <span class="count">{{ data.attendees.length }} attendees</span>
      </div>

      <div *ngIf="data.attendees?.length" class="attendees-list">
        <div class="attendee-row" *ngFor="let a of data.attendees; index as i">
          <div class="avatar">{{ avatarInitial(a) }}</div>
          <div class="info">
            <div class="name">{{ a.userName || ('User#' + a.userId) }}</div>
            <div class="meta">
              <span class="id">#{{ a.userId }}</span>
              <span class="status-chip" [ngClass]="statusClass(a.status)">
                {{ statusLabel(a.status) }}
              </span>
            </div>
          </div>
          <div class="timestamps" *ngIf="a.bookedAt || a.completedAt || a.cancelledAt">
            <div *ngIf="a.bookedAt" class="ts">Booked: {{ a.bookedAt | date:'short' }}</div>
            <div *ngIf="a.completedAt" class="ts">Completed: {{ a.completedAt | date:'short' }}</div>
            <div *ngIf="a.cancelledAt" class="ts">Cancelled: {{ a.cancelledAt | date:'short' }}</div>
          </div>
          <button
            mat-icon-button
            color="warn"
            class="remove-btn"
            *ngIf="a.status === 'BOOKED'"
            (click)="removeAttendee(a)"
            [disabled]="removingIds.has(a.id)"
            [attr.aria-label]="'gymClasses.list.attendees.removeAria' | translate"
          >
            <mat-icon *ngIf="!removingIds.has(a.id)">person_remove</mat-icon>
            <mat-progress-spinner
              *ngIf="removingIds.has(a.id)"
              diameter="20"
              mode="indeterminate"
            ></mat-progress-spinner>
          </button>
        </div>
      </div>

      <div class="actions-footer">
        <button mat-button (click)="dialogRef.close()">{{ 'common.close' | translate }}</button>
      </div>
    </div>
  `,
  styles: [`
    .attendees-dialog {
      padding: 16px 16px 8px;
      max-width: 600px;
    }
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: 8px;
    }
    .title {
      margin: 0;
      font-size: 1.4rem;
    }
    .subtitle {
      margin: 4px 0 0;
      color: #4b5563;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .time-pill {
      padding: 2px 8px;
      border-radius: 999px;
      background: #eff6ff;
      color: #1d4ed8;
      font-size: 0.75rem;
    }
    .summary-row {
      font-size: 0.8rem;
      color: #6b7280;
      margin-bottom: 4px;
      text-align: right;
    }
    .attendees-list {
      max-height: 320px;
      overflow-y: auto;
      padding-right: 4px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .attendee-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 8px;
      border-radius: 8px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      box-shadow: 0 1px 2px rgba(15,23,42,0.04);
    }
    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 999px;
      background: #dbeafe;
      color: #1d4ed8;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      flex-shrink: 0;
    }
    .info {
      flex: 1 1 auto;
      min-width: 0;
    }
    .name {
      font-weight: 600;
      color: #111827;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
      font-size: 0.8rem;
      color: #6b7280;
    }
    .id {
      font-variant-numeric: tabular-nums;
    }
    .status-chip {
      padding: 2px 6px;
      border-radius: 999px;
      border: 1px solid transparent;
      font-size: 0.7rem;
      text-transform: lowercase;
    }
    .status-chip.status-booked {
      background: #ecfdf3;
      color: #166534;
      border-color: #bbf7d0;
    }
    .status-chip.status-completed {
      background: #eff6ff;
      color: #1d4ed8;
      border-color: #bfdbfe;
    }
    .status-chip.status-cancelled-by-user,
    .status-chip.status-cancelled-by-gym {
      background: #fef2f2;
      color: #b91c1c;
      border-color: #fecaca;
    }
    .status-chip.status-no-show {
      background: #fef9c3;
      color: #854d0e;
      border-color: #fef3c7;
    }
    .timestamps {
      font-size: 0.75rem;
      color: #6b7280;
      text-align: right;
      white-space: nowrap;
    }
    .ts + .ts {
      margin-top: 2px;
    }
    .remove-btn {
      margin-left: 8px;
      align-self: center;
    }
    .actions-footer {
      margin-top: 12px;
      text-align: right;
    }
    .empty {
      padding: 12px 4px;
      font-size: 0.9rem;
      color: #6b7280;
    }
    @media (max-width: 600px) {
      .attendees-dialog {
        padding: 12px 12px 8px;
        max-width: 100vw;
      }
      .attendee-row {
        flex-wrap: wrap;
      }
      .timestamps {
        width: 100%;
        text-align: left;
      }
    }
  `]
})
export class ClassAttendeesDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ClassAttendeesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ClassAttendeesDialogData,
    private translate: TranslateService,
    private bookingService: BookingService,
    private snackBar: MatSnackBar
  ) {}

  removingIds = new Set<number>();

  avatarInitial(a: Booking): string {
    const name = a.userName || '';
    if (name.trim()) return name.trim().charAt(0).toUpperCase();
    return (a.userId || '?').toString().charAt(0).toUpperCase();
  }

  statusClass(status: string | undefined | null): string {
    if (!status) return '';
    return 'status-' + status.toString().toLowerCase();
  }

  statusLabel(status: string | undefined | null): string {
    if (!status) return '';
    const s = status.toString().toUpperCase();
    switch (s) {
      case 'BOOKED':
        return 'Booked';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED_BY_USER':
        return 'Cancelled by user';
      case 'CANCELLED_BY_GYM':
        return 'Cancelled by gym';
      case 'NO_SHOW':
        return 'No show';
      default:
        return status;
    }
  }

  removeAttendee(booking: Booking): void {
    if (!booking || !booking.id) {
      return;
    }
    const confirmed = confirm(this.translate.instant('gymClasses.list.attendees.removeConfirm'));
    if (!confirmed) {
      return;
    }
    this.removingIds.add(booking.id);
    this.bookingService.cancelBookingByGym(booking.id).subscribe({
      next: () => {
        this.data.attendees = this.data.attendees.filter(b => b.id !== booking.id);
        this.removingIds.delete(booking.id);
        this.snackBar.open(
          this.translate.instant('gymClasses.list.attendees.removeSuccess'),
          this.translate.instant('common.close'),
          { duration: 3000 }
        );
      },
      error: () => {
        this.removingIds.delete(booking.id);
        this.snackBar.open(
          this.translate.instant('gymClasses.list.attendees.removeError'),
          this.translate.instant('common.close'),
          { duration: 4000 }
        );
      }
    });
  }
}
