import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { SharedModule } from '../../../shared/shared.module';
import { AdminService } from '../../../core/services/admin.service';
import { GymClassService } from '../../../core/services/gym-class.service';
import { ClassTypeService } from '../../../core/services/class-type.service';
import { KeycloakService } from '../../../core/services/keycloak.service';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';
import { ClassType } from '../../../core/models/class-type.model';

@Component({
  selector: 'app-admin-create-class-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule],
  template: `
    <h2 mat-dialog-title>Create Class</h2>
    <div mat-dialog-content>
      <form (ngSubmit)="submit()" #form="ngForm">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Instructor</mat-label>
                <mat-select [(ngModel)]="instructorId" name="instructorId" required>
                  <mat-option *ngFor="let i of instructors" [value]="i.id">{{ i.name }}</mat-option>
                </mat-select>
              </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Class Type</mat-label>
          <mat-select [(ngModel)]="classTypeId" name="classTypeId" required (selectionChange)="onClassTypeChange()">
            <mat-option *ngFor="let t of classTypes" [value]="t.id">{{ t.name }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput [(ngModel)]="name" name="name" required (blur)="autoNameFromType()" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput [(ngModel)]="description" name="description"></textarea>
        </mat-form-field>

        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Capacity</mat-label>
            <input matInput type="number" [(ngModel)]="capacity" name="capacity" required min="1" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Duration (minutes)</mat-label>
            <input matInput type="number" [(ngModel)]="durationMinutes" name="durationMinutes" required min="15" />
          </mat-form-field>
        </div>

        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Date</mat-label>
            <input matInput [matDatepicker]="picker" [(ngModel)]="startDateObj" name="startDateObj" required>
            <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>
          <div class="time-selectors">
            <mat-form-field appearance="outline">
              <mat-label>Hour (24h)</mat-label>
              <mat-select [(ngModel)]="startHour" name="startHour" required>
                <mat-option *ngFor="let h of hours" [value]="h">{{ h }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Minute</mat-label>
              <mat-select [(ngModel)]="startMinute" name="startMinute" required>
                <mat-option *ngFor="let m of minutes" [value]="m">{{ m }}</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </div>

        <mat-slide-toggle [(ngModel)]="recurring" name="recurring">Recurring</mat-slide-toggle>
        <div *ngIf="recurring" class="recurrence-box">
          <div class="days">
            <span class="label">Days of week:</span>
            <mat-button-toggle-group multiple [(ngModel)]="selectedDays" name="selectedDays">
              <mat-button-toggle *ngFor="let d of weekdays" [value]="d.value">{{ d.label }}</mat-button-toggle>
            </mat-button-toggle-group>
          </div>
          <mat-form-field appearance="outline" class="weeks-field">
            <mat-label>Weeks to repeat</mat-label>
            <input matInput type="number" [(ngModel)]="repeatWeeks" name="repeatWeeks" min="1" max="52" required />
          </mat-form-field>
          <div class="hint" *ngIf="selectedDays.length">Will create {{ occurrencesPreview }} total instance(s).</div>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Location</mat-label>
          <input matInput [(ngModel)]="location" name="location" />
        </mat-form-field>

        <div *ngIf="message" class="message" [ngClass]="messageType">{{ message }}</div>
      </form>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="close()">Cancel</button>
      <button mat-raised-button color="primary" (click)="submit()" [disabled]="!canSubmit">Create</button>
    </div>
  `,
  styles: [`
    .full-width { width: 100%; }
    .row { display: flex; gap: 12px; }
    .row > * { flex: 1; }
    .message.info { color: #1976d2; }
    .message.success { color: #2e7d32; }
    .message.error { color: #d32f2f; }
    .time-selectors { display: flex; gap: 12px; }
    .recurrence-box { margin-top: 16px; padding: 12px; border: 1px solid #ddd; border-radius: 4px; }
    .days { margin-bottom: 12px; display: flex; flex-direction: column; gap: 6px; }
    .label { font-size: 12px; color: #555; }
    .weeks-field { width: 160px; }
    .hint { font-size: 12px; color: #555; }
  `]
})
export class AdminCreateClassDialogComponent {
  instructors: User[] = [];
  classTypes: ClassType[] = [];
  message: string | null = null;
  messageType: 'success' | 'error' | 'info' = 'info';

  name = '';
  description = '';
  capacity = 5;
  durationMinutes = 60;
  instructorId: number | null = null;
  classTypeId: number | null = null;
  startDateObj: Date | null = null;
  startHour: number | null = null;
  startMinute: number | null = 0;
  location = '';

  // Recurrence
  recurring = false;
  repeatWeeks = 4;
  selectedDays: number[] = []; // 0=Sun..6=Sat
  weekdays = [
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
    { value: 0, label: 'Sun' }
  ];
  hours = Array.from({ length: 24 }, (_, i) => i);
  minutes = [0, 15, 30, 45];

  instructorLocked = false;

  constructor(
    private dialogRef: MatDialogRef<AdminCreateClassDialogComponent>,
    private adminService: AdminService,
    private gymClassService: GymClassService,
    private classTypeService: ClassTypeService,
    private kc: KeycloakService,
    private users: UserService
  ) {
    this.load();
  }

  get canSubmit(): boolean {
    const baseOk = !!(this.instructorId && this.classTypeId && this.name && this.startDateObj && this.startHour !== null && this.startMinute !== null && this.capacity > 0 && this.durationMinutes >= 15);
    if (!this.recurring) return baseOk;
    return baseOk && this.selectedDays.length > 0 && this.repeatWeeks >= 1;
  }

  get occurrencesPreview(): number {
    if (!this.recurring) return 1;
    return this.selectedDays.length * this.repeatWeeks;
  }

  load(): void {
    // Load all trainers for both admins and instructors from /api/users/instructors
    this.users.getAllTrainers().subscribe({
      next: (list) => { this.instructors = list; },
      error: () => { this.instructors = []; }
    });

    // Load class types independently
    this.classTypeService.getActiveClassTypes().subscribe({
      next: (types) => (this.classTypes = types),
      error: () => (this.classTypes = [])
    });
  }

  onClassTypeChange(): void {
    this.autoNameFromType();
  }

  autoNameFromType(): void {
    if (!this.name && this.classTypeId) {
      const ct = this.classTypes.find(c => c.id === this.classTypeId);
      if (ct) this.name = ct.name;
    }
  }

  submit(): void {
    if (!this.canSubmit) { return; }
    // Base date/time
    const firstStart = this.composeDateTime(this.startDateObj!, this.startHour!, this.startMinute!);
    const firstEnd = this.formatLocalDateTime(new Date(firstStart.getTime() + this.durationMinutes * 60000));

    if (!this.recurring) {
      const singlePayload = this.buildPayload(firstStart, firstEnd);
      this.createOne(singlePayload);
      return;
    }

    // Recurring: generate occurrences
    const occurrences = this.generateRecurringDates(this.startDateObj!, this.selectedDays, this.repeatWeeks, this.startHour!, this.startMinute!);
    let created = 0;
    let failed = 0;
    const total = occurrences.length;

    const processNext = () => {
      const next = occurrences.shift();
      if (!next) {
        this.messageType = failed === 0 ? 'success' : 'error';
        this.message = failed === 0 ? `Created ${created} class(es)` : `Created ${created}/${total}, ${failed} failed`;
        this.dialogRef.close('created');
        return;
      }
      const endIso = this.formatLocalDateTime(new Date(next.getTime() + this.durationMinutes * 60000));
      const payload = this.buildPayload(next, endIso);
      this.gymClassService.createGymClass(payload).subscribe({
        next: () => { created++; processNext(); },
        error: () => { failed++; processNext(); }
      });
    };
    processNext();
  }

  close(): void {
    this.dialogRef.close();
  }

  private formatLocalDateTime(d: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
  }

  private composeDateTime(date: Date, hour: number, minute: number): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute, 0, 0);
  }

  private buildPayload(start: Date, endIso: string): any {
    return {
      name: this.name,
      description: this.description,
      capacity: this.capacity,
      durationMinutes: this.durationMinutes,
      instructorId: this.instructorId,
      classTypeId: this.classTypeId,
      startTime: this.formatLocalDateTime(start),
      endTime: endIso,
      location: this.location
    };
  }

  private createOne(payload: any): void {
    this.gymClassService.createGymClass(payload).subscribe({
      next: () => {
        this.messageType = 'success';
        this.message = 'Class created successfully';
        this.dialogRef.close('created');
      },
      error: (err) => {
        this.messageType = 'error';
        this.message = err?.error?.message || 'Failed to create class.';
      }
    });
  }

  private generateRecurringDates(baseDate: Date, days: number[], weeks: number, hour: number, minute: number): Date[] {
    const results: Date[] = [];
    const sortedDays = [...days].sort((a,b)=>a-b);
    // Start from week 0 to weeks-1
    for (let w = 0; w < weeks; w++) {
      for (const d of sortedDays) {
        // Find date of day d in week offset
        const ref = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
        // Move to Monday of week? We'll treat baseDate's week anchor as its own day.
        // Compute difference from baseDate's weekday to target d then add 7*w days.
        const baseWeekday = ref.getDay(); // 0..6
        const diff = d - baseWeekday + (w * 7);
        const occurrence = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + diff, hour, minute, 0, 0);
        if (occurrence < this.composeDateTime(baseDate, hour, minute) && w === 0) continue; // skip past days in first week
        results.push(occurrence);
      }
    }
    return results;
  }
}
