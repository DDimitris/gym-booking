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

        <mat-form-field appearance="outline">
          <mat-label>Instructor</mat-label>
          <mat-select formControlName="instructorId" required>
            <mat-option *ngFor="let trainer of trainers" [value]="trainer.id">
              {{trainer.name}}
            </mat-option>
          </mat-select>
          <mat-error *ngIf="classForm.get('instructorId')?.hasError('required')">
            Instructor is required
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
      instructorId: ['', Validators.required]
    });

    if (data) {
      this.classForm.patchValue(data);
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
      // Align payload with backend DTO expectations (instructorId instead of trainerId)
      this.dialogRef.close(this.classForm.value);
    }
  }
}