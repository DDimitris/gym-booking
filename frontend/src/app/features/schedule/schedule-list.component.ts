import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { Schedule } from '../../core/models/schedule.model';
import { GymClass } from '../../core/models/gym-class.model';
import { ScheduleService } from '../../core/services/schedule.service';
import { GymClassService } from '../../core/services/gym-class.service';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { addMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ScheduleDialogComponent } from './schedule-dialog.component';

@Component({
  selector: 'app-schedule-list',
  standalone: true,
  imports: [CommonModule, SharedModule],
  template: `
    <div class="container">
      <div class="header">
        <h1>Class Schedule</h1>
        <button mat-raised-button color="primary" (click)="openCreateDialog()">
          Schedule Class
        </button>
      </div>

      <form [formGroup]="filterForm" class="filters">
        <mat-form-field>
          <mat-label>Month</mat-label>
          <input matInput [matDatepicker]="monthPicker" formControlName="month">
          <mat-datepicker-toggle matSuffix [for]="monthPicker"></mat-datepicker-toggle>
          <mat-datepicker #monthPicker startView="month"></mat-datepicker>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Class</mat-label>
          <mat-select formControlName="classId">
            <mat-option [value]="null">All Classes</mat-option>
            <mat-option *ngFor="let class of gymClasses" [value]="class.id">
              {{class.name}}
            </mat-option>
          </mat-select>
        </mat-form-field>
      </form>

      <table mat-table [dataSource]="dataSource" matSort class="mat-elevation-z8">
        <ng-container matColumnDef="class">
          <th mat-header-cell *matHeaderCellDef> Class </th>
          <td mat-cell *matCellDef="let schedule">
            {{getClassName(schedule.gymClassId)}}
          </td>
        </ng-container>

        <ng-container matColumnDef="startTime">
          <th mat-header-cell *matHeaderCellDef> Start Time </th>
          <td mat-cell *matCellDef="let schedule">
            {{schedule.startTime | date:'medium'}}
          </td>
        </ng-container>

        <ng-container matColumnDef="endTime">
          <th mat-header-cell *matHeaderCellDef> End Time </th>
          <td mat-cell *matCellDef="let schedule">
            {{schedule.endTime | date:'shortTime'}}
          </td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef> Status </th>
          <td mat-cell *matCellDef="let schedule">
            <span [class.cancelled]="schedule.isCancelled">
              {{schedule.isCancelled ? 'Cancelled' : 'Active'}}
            </span>
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef> Actions </th>
          <td mat-cell *matCellDef="let schedule">
            <button mat-icon-button color="warn" 
                    (click)="cancelSchedule(schedule.id)"
                    [disabled]="schedule.isCancelled">
              <mat-icon>cancel</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
      <mat-paginator [pageSize]="10" [pageSizeOptions]="[5, 10, 25, 100]"></mat-paginator>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .filters {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
    }

    table {
      width: 100%;
    }

    .cancelled {
      color: red;
      text-decoration: line-through;
    }
  `]
})
export class ScheduleListComponent implements OnInit {
  dataSource = new MatTableDataSource<Schedule>([]);
  gymClasses: GymClass[] = [];
  displayedColumns: string[] = ['class', 'startTime', 'endTime', 'status', 'actions'];
  filterForm: FormGroup;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private scheduleService: ScheduleService,
    private gymClassService: GymClassService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.filterForm = this.fb.group({
      month: [new Date()],
      classId: [null]
    });
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(ScheduleDialogComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.scheduleService.createSchedule(result).subscribe({
          next: () => {
            this.loadSchedules();
            this.snackBar.open('Schedule created successfully', 'Close', {
              duration: 3000
            });
          },
          error: (error) => {
            this.snackBar.open('Error creating schedule', 'Close', {
              duration: 3000
            });
          }
        });
      }
    });
  }

  ngOnInit(): void {
    this.loadGymClasses();
    this.loadSchedules();

    this.filterForm.valueChanges.subscribe(() => {
      this.loadSchedules();
    });

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadGymClasses(): void {
    this.gymClassService.getAllGymClasses().subscribe({
      next: (classes) => {
        this.gymClasses = classes;
      },
      error: (error) => {
        this.snackBar.open('Error loading classes', 'Close', {
          duration: 3000
        });
      }
    });
  }

  loadSchedules(): void {
    const month = this.filterForm.get('month')?.value || new Date();
    const classId = this.filterForm.get('classId')?.value;

    if (classId) {
      this.scheduleService.getClassSchedules(classId).subscribe({
        next: (schedules) => {
          this.dataSource.data = schedules;
        },
        error: (error) => {
          this.snackBar.open('Error loading schedules', 'Close', {
            duration: 3000
          });
        }
      });
    } else {
      this.scheduleService.getSchedules(startOfMonth(month), endOfMonth(month)).subscribe({
        next: (schedules) => {
          this.dataSource.data = schedules;
        },
        error: (error) => {
          this.snackBar.open('Error loading schedules', 'Close', {
            duration: 3000
          });
        }
      });
    }
  }

  cancelSchedule(id: number): void {
    if (confirm('Are you sure you want to cancel this class?')) {
      this.scheduleService.cancelSchedule(id).subscribe({
        next: () => {
          this.loadSchedules();
          this.snackBar.open('Class cancelled successfully', 'Close', {
            duration: 3000
          });
        },
        error: (error) => {
          this.snackBar.open('Error cancelling class', 'Close', {
            duration: 3000
          });
        }
      });
    }
  }

  getClassName(classId: number): string {
    return this.gymClasses.find(c => c.id === classId)?.name || '';
  }
}