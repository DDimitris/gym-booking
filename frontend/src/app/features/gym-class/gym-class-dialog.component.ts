import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GymClass } from '../../core/models/gym-class.model';
import { UserService } from '../../core/services/user.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-gym-class-dialog',
  standalone: true,
  imports: [CommonModule, SharedModule],
  template: `
    <h2 mat-dialog-title>{{data ? 'Edit' : 'Create'}} Gym Class</h2>
    <form [formGroup]="classForm" (ngSubmit)="onSubmit()">
      <mat-dialog-content>
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" required>
          <mat-error *ngIf="classForm.get('name')?.hasError('required')">
            Name is required
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Capacity</mat-label>
          <input matInput type="number" formControlName="capacity" required>
          <mat-error *ngIf="classForm.get('capacity')?.hasError('required')">
            Capacity is required
          </mat-error>
          <mat-error *ngIf="classForm.get('capacity')?.hasError('min')">
            Capacity must be at least 1
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Duration (minutes)</mat-label>
          <input matInput type="number" formControlName="durationMinutes" required>
          <mat-error *ngIf="classForm.get('durationMinutes')?.hasError('required')">
            Duration is required
          </mat-error>
          <mat-error *ngIf="classForm.get('durationMinutes')?.hasError('min')">
            Duration must be at least 15 minutes
          </mat-error>
        </mat-form-field>

        <div class="datetime-row">
          <mat-form-field appearance="outline" class="date-field">
            <mat-label>Date</mat-label>
            <input matInput [matDatepicker]="datePicker" formControlName="date" required>
            <mat-datepicker-toggle matSuffix [for]="datePicker"></mat-datepicker-toggle>
            <mat-datepicker #datePicker></mat-datepicker>
            <mat-error *ngIf="classForm.get('date')?.hasError('required')">
              Date is required
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="time-field">
            <mat-label>Start Time</mat-label>
            <input matInput type="time" formControlName="startTime" required>
            <mat-error *ngIf="classForm.get('startTime')?.hasError('required')">
              Start time is required
            </mat-error>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Trainer</mat-label>
          <mat-select formControlName="trainerId" required>
            <mat-option *ngFor="let trainer of trainers" [value]="trainer.id">
              {{trainer.name}}
            </mat-option>
          </mat-select>
          <mat-error *ngIf="classForm.get('trainerId')?.hasError('required')">
            Trainer is required
          </mat-error>
        </mat-form-field>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Cancel</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="classForm.invalid">
          {{data ? 'Update' : 'Create'}}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    mat-form-field {
      width: 100%;
      margin-bottom: 16px;
    }

    textarea {
      resize: vertical;
    }

    .datetime-row {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .date-field,
    .time-field {
      flex: 1 1 150px;
    }
  `]
})
export class GymClassDialogComponent {
  classForm: FormGroup;
  trainers: User[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<GymClassDialogComponent>,
    private userService: UserService,
    @Inject(MAT_DIALOG_DATA) public data: GymClass | null
  ) {
    this.classForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      capacity: ['', [Validators.required, Validators.min(1)]],
      durationMinutes: ['', [Validators.required, Validators.min(15)]],
      trainerId: ['', Validators.required],
  date: ['', Validators.required], // stores a Date object from MatDatepicker
      startTime: ['', Validators.required]
    });

    if (data) {
      // Pre-populate date and start time from existing startTime/endTime
      const start = data.startTime ? new Date(data.startTime) : null;
      const isoDate = start
        ? `${start.getFullYear()}-${(start.getMonth() + 1).toString().padStart(2, '0')}-${start.getDate()
            .toString()
            .padStart(2, '0')}`
        : '';
      const isoTime = start
        ? `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`
        : '';

      this.classForm.patchValue({
        ...data,
        trainerId: (data as any).trainerId ?? (data as any).instructorId,
  date: start ?? isoDate,
        startTime: isoTime
      });
    }

    this.loadTrainers();
  }

  loadTrainers(): void {
    this.userService.getAllTrainers().subscribe({
      next: (trainers) => {
        this.trainers = trainers;
      }
    });
  }

  onSubmit(): void {
    if (this.classForm.valid) {
      // Map to backend DTO (trainerId expected; include legacy instructorId for safety during transition)
      const value = this.classForm.value;

      // Combine date and startTime into ISO startTime; derive endTime from durationMinutes
      // MatDatepicker gives a Date object; fall back to string if needed
      const dateControl: any = value.date;
      let date: string;
      if (dateControl instanceof Date) {
        const y = dateControl.getFullYear();
        const m = (dateControl.getMonth() + 1).toString().padStart(2, '0');
        const d = dateControl.getDate().toString().padStart(2, '0');
        date = `${y}-${m}-${d}`;
      } else {
        date = dateControl as string; // fallback: assume already in YYYY-MM-DD
      }
      const startTime: string = value.startTime; // HH:mm
      const durationMinutes: number = Number(value.durationMinutes) || 0;

      const startDateTime = new Date(`${date}T${startTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

      const toIso = (d: Date) => d.toISOString();

      this.dialogRef.close({
        name: value.name,
        description: value.description,
        capacity: value.capacity,
        durationMinutes: durationMinutes,
        trainerId: value.trainerId,
        instructorId: value.trainerId, // transitional field
        startTime: toIso(startDateTime),
        endTime: toIso(endDateTime)
      });
    }
  }
}