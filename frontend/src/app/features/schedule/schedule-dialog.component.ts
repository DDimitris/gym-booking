import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { GymClass } from '../../core/models/gym-class.model';
import { GymClassService } from '../../core/services/gym-class.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-schedule-dialog',
  standalone: true,
  imports: [CommonModule, SharedModule, TranslateModule],
  template: `
    <h2 mat-dialog-title>{{ 'schedule.dialog.title' | translate }}</h2>
    <form [formGroup]="scheduleForm" (ngSubmit)="onSubmit()">
      <mat-dialog-content>
        <mat-form-field appearance="outline">
          <mat-label>{{ 'schedule.dialog.fields.class' | translate }}</mat-label>
          <mat-select formControlName="gymClassId" required>
            <mat-option *ngFor="let class of gymClasses" [value]="class.id">
              {{class.name}}
            </mat-option>
          </mat-select>
          <mat-error *ngIf="scheduleForm.get('gymClassId')?.hasError('required')">
            {{ 'schedule.dialog.errors.classRequired' | translate }}
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'schedule.dialog.fields.startDate' | translate }}</mat-label>
          <input matInput [matDatepicker]="datePicker" formControlName="startDate" required>
          <mat-datepicker-toggle matSuffix [for]="datePicker"></mat-datepicker-toggle>
          <mat-datepicker #datePicker></mat-datepicker>
          <mat-error *ngIf="scheduleForm.get('startDate')?.hasError('required')">
            {{ 'schedule.dialog.errors.dateRequired' | translate }}
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'schedule.dialog.fields.startTime' | translate }}</mat-label>
          <input matInput type="time" formControlName="startTime" required>
          <mat-error *ngIf="scheduleForm.get('startTime')?.hasError('required')">
            {{ 'schedule.dialog.errors.timeRequired' | translate }}
          </mat-error>
        </mat-form-field>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>{{ 'schedule.dialog.actions.cancel' | translate }}</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="scheduleForm.invalid">
          {{ 'schedule.dialog.actions.submit' | translate }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    mat-form-field {
      width: 100%;
      margin-bottom: 16px;
    }
  `]
})
export class ScheduleDialogComponent implements OnInit {
  scheduleForm: FormGroup;
  gymClasses: GymClass[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ScheduleDialogComponent>,
    private gymClassService: GymClassService,
    private translate: TranslateService
  ) {
    this.scheduleForm = this.fb.group({
      gymClassId: ['', Validators.required],
      startDate: ['', Validators.required],
      startTime: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadGymClasses();
  }

  loadGymClasses(): void {
    this.gymClassService.getAllGymClasses().subscribe({
      next: (classes) => {
        this.gymClasses = classes;
      }
    });
  }

  onSubmit(): void {
    if (this.scheduleForm.valid) {
      const formValue = this.scheduleForm.value;
      const date = new Date(formValue.startDate);
      const [hours, minutes] = formValue.startTime.split(':');
      date.setHours(parseInt(hours), parseInt(minutes));

      const schedule = {
        gymClassId: formValue.gymClassId,
        startTime: date.toISOString()
      };

      this.dialogRef.close(schedule);
    }
  }
}