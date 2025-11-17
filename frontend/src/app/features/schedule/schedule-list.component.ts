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
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-schedule-list',
  standalone: true,
  imports: [CommonModule, SharedModule, TranslateModule],
  template: `
    <div class="container">
      <div class="header">
        <h1>{{ 'schedule.list.title' | translate }}</h1>
        <button mat-raised-button color="primary" (click)="openCreateDialog()">
          {{ 'schedule.list.actions.openDialog' | translate }}
        </button>
      </div>

      <form [formGroup]="filterForm" class="filters">
        <mat-form-field>
          <mat-label>{{ 'schedule.list.filters.month' | translate }}</mat-label>
          <input matInput [matDatepicker]="monthPicker" formControlName="month">
          <mat-datepicker-toggle matSuffix [for]="monthPicker"></mat-datepicker-toggle>
          <mat-datepicker #monthPicker startView="month"></mat-datepicker>
        </mat-form-field>

        <mat-form-field>
          <mat-label>{{ 'schedule.list.filters.class' | translate }}</mat-label>
          <mat-select formControlName="classId">
            <mat-option [value]="null">{{ 'schedule.list.filters.allClasses' | translate }}</mat-option>
            <mat-option *ngFor="let class of gymClasses" [value]="class.id">
              {{class.name}}
            </mat-option>
          </mat-select>
        </mat-form-field>
      </form>

      <table mat-table [dataSource]="dataSource" matSort class="mat-elevation-z8">
        <ng-container matColumnDef="class">
          <th mat-header-cell *matHeaderCellDef> {{ 'schedule.list.table.class' | translate }} </th>
          <td mat-cell *matCellDef="let schedule">
            {{getClassName(schedule.gymClassId)}}
          </td>
        </ng-container>

        <ng-container matColumnDef="startTime">
          <th mat-header-cell *matHeaderCellDef> {{ 'schedule.list.table.startTime' | translate }} </th>
          <td mat-cell *matCellDef="let schedule">
            {{schedule.startTime | date:'medium'}}
          </td>
        </ng-container>

        <ng-container matColumnDef="endTime">
          <th mat-header-cell *matHeaderCellDef> {{ 'schedule.list.table.endTime' | translate }} </th>
          <td mat-cell *matCellDef="let schedule">
            {{schedule.endTime | date:'shortTime'}}
          </td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef> {{ 'schedule.list.table.status' | translate }} </th>
          <td mat-cell *matCellDef="let schedule">
            <span [class.cancelled]="schedule.isCancelled">
              {{ schedule.isCancelled ? ('schedule.list.table.statusCancelled' | translate) : ('schedule.list.table.statusActive' | translate) }}
            </span>
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef> {{ 'schedule.list.table.actions' | translate }} </th>
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
    private dialog: MatDialog,
    private translate: TranslateService
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
            this.snackBar.open(
              this.translate.instant('schedule.list.messages.created'),
              this.translate.instant('common.close'),
              {
              duration: 3000
            });
          },
          error: (error) => {
            this.snackBar.open(
              this.translate.instant('schedule.list.errors.create'),
              this.translate.instant('common.close'),
              {
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
        this.snackBar.open(
          this.translate.instant('schedule.list.errors.loadClasses'),
          this.translate.instant('common.close'),
          {
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
          this.snackBar.open(
            this.translate.instant('schedule.list.errors.loadSchedules'),
            this.translate.instant('common.close'),
            {
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
          this.snackBar.open(
            this.translate.instant('schedule.list.errors.loadSchedules'),
            this.translate.instant('common.close'),
            {
            duration: 3000
          });
        }
      });
    }
  }

  cancelSchedule(id: number): void {
    if (confirm(this.translate.instant('schedule.list.confirm.cancel'))) {
      this.scheduleService.cancelSchedule(id).subscribe({
        next: () => {
          this.loadSchedules();
          this.snackBar.open(
            this.translate.instant('schedule.list.messages.cancelled'),
            this.translate.instant('common.close'),
            {
            duration: 3000
          });
        },
        error: (error) => {
          this.snackBar.open(
            this.translate.instant('schedule.list.errors.cancel'),
            this.translate.instant('common.close'),
            {
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