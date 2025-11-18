import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { GymClassDialogComponent } from './gym-class-dialog.component';
import { GymClass } from '../../core/models/gym-class.model';
import { GymClassService } from '../../core/services/gym-class.service';
import { BookingService } from '../../core/services/booking.service';
import { UserService } from '../../core/services/user.service';
import { KeycloakService } from '../../core/services/keycloak.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-gym-class-list',
  standalone: true,
  imports: [CommonModule, RouterModule, SharedModule, TranslateModule, MatTooltipModule],
  template: `
    <div class="container">
      <div class="header">
        <h1>{{ 'gymClasses.list.title' | translate }}</h1>
      </div>

      <mat-form-field>
        <mat-label>{{ 'gymClasses.list.searchLabel' | translate }}</mat-label>
        <input
          matInput
          (keyup)="applyFilter($event)"
          [placeholder]="'gymClasses.list.searchPlaceholder' | translate"
          #input
        />
      </mat-form-field>

      <div class="controls">
        <mat-slide-toggle [(ngModel)]="showPast" (change)="computeGroups()">
          {{ 'gymClasses.list.showPast' | translate }}
        </mat-slide-toggle>
      </div>

      <mat-accordion multi>
        <mat-expansion-panel *ngFor="let group of groupedByDay">
          <mat-expansion-panel-header>
            <mat-panel-title>
              {{ group.date | date:'EEE, dd MMM yyyy' }}
            </mat-panel-title>
            <mat-panel-description>
              {{ 'gymClasses.list.daySummary' | translate:{ count: group.items.length } }}
            </mat-panel-description>
          </mat-expansion-panel-header>

          <div class="day-list">
            <div class="class-item" *ngFor="let c of group.items; trackBy: trackById">
              <div class="left">
                <div class="title">{{ c.name }}</div>
                <div class="desc" *ngIf="c.description">{{ c.description }}</div>
              </div>
              <div class="middle">
                <span class="time">{{ c.startTime | date:'HH:mm' }} - {{ c.endTime | date:'HH:mm' }}</span>
              </div>
              <div class="right">
                <button mat-icon-button color="primary" (click)="openEditDialog(c)" *ngIf="canManage()">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="deleteClass(c.id)" *ngIf="canManage()">
                  <mat-icon>delete</mat-icon>
                </button>
                <button mat-icon-button (click)="openAttendees(c)" [matTooltip]="'gymClasses.list.tooltips.viewAttendees' | translate">
                  <mat-icon>group</mat-icon>
                </button>
                <button
                  mat-icon-button
                  (click)="openBookForDialog(c)"
                  *ngIf="canBookForOthers()"
                  [matTooltip]="'gymClasses.list.tooltips.bookForUser' | translate"
                >
                  <mat-icon>person_add</mat-icon>
                </button>
              </div>
            </div>
          </div>
        </mat-expansion-panel>
      </mat-accordion>
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

    .mat-form-field {
      width: 100%;
      margin-bottom: 20px;
    }
    .controls { margin-bottom: 8px; }
    .day-list { display: flex; flex-direction: column; gap: 8px; }
    .class-item { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; gap: 8px; }
    .class-item:last-child { border-bottom: none; }
    .left { flex: 1; min-width: 0; }
    .title { font-weight: 600; }
    .desc { color: #555; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .middle { width: 140px; text-align: center; font-variant-numeric: tabular-nums; }
    .right { width: auto; min-width: 140px; display: flex; justify-content: flex-end; gap: 8px; flex-wrap: wrap; }

    /* Responsive alignment: avoid overlap on small screens */
    @media (max-width: 720px) {
      .class-item {
        flex-wrap: wrap;
        align-items: flex-start;
      }
      .left { flex: 1 1 100%; }
      .middle { flex: 0 0 auto; width: auto; order: 2; }
      .right { flex: 1 1 100%; order: 3; justify-content: flex-start; }
    }
  `]
})
export class GymClassListComponent implements OnInit {
  classes: GymClass[] = [];
  filteredClasses: GymClass[] = [];
  showPast = false;
  groupedByDay: Array<{ date: Date, items: GymClass[] }> = [];

  constructor(
    private gymClassService: GymClassService,
    private bookingService: BookingService,
    private userService: UserService,
    private kc: KeycloakService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadClasses();
  }

  loadClasses(): void {
    this.gymClassService.getAllGymClasses().subscribe({
      next: (classes) => {
        this.classes = classes;
        this.filteredClasses = classes;
        this.computeGroups();
      },
      error: (error) => {
        this.snackBar.open(
          this.translate.instant('gymClasses.list.errors.loadClasses'),
          this.translate.instant('common.close'),
          {
          duration: 3000
          }
        );
      }
    });
  }

  canManage(): boolean {
    return this.kc.isReady() && this.kc.isAuthenticated() && (this.kc.getRoles().includes('ADMIN') || this.kc.getRoles().includes('TRAINER'));
  }

  canBookForOthers(): boolean {
    return this.canManage();
  }

  openAttendees(gymClass: GymClass): void {
    // Fetch bookings for class and show simple alert (later replace with dialog component)
    this.bookingService.getClassBookings(gymClass.id).subscribe({
      next: (bookings) => {
        const list = bookings.map(b => `${b.userName || ('User#'+b.userId)}`).join('\n');
        const title = this.translate.instant('gymClasses.list.prompts.attendeesTitle', { name: gymClass.name });
        const noAttendees = this.translate.instant('gymClasses.list.prompts.noAttendees', { name: gymClass.name });
        alert(list ? `${title}:\n\n${list}` : noAttendees);
      },
      error: () => {
        this.snackBar.open(
          this.translate.instant('gymClasses.list.errors.loadAttendees'),
          this.translate.instant('common.close'),
          { duration: 3000 }
        );
      }
    });
  }

  openBookForDialog(gymClass: GymClass): void {
    // Simple prompt-based selection for now; later replace with proper dialog
    this.userService.getAllMembers().subscribe({
      next: (members) => {
        if (!members.length) {
          alert(this.translate.instant('gymClasses.list.prompts.noMembers'));
          return;
        }
        const options = members.map(a => `${a.id}: ${a.name || a.email || ('User#'+a.id)}`).join('\n');
        const promptTitle = this.translate.instant('gymClasses.list.prompts.selectMemberTitle', { name: gymClass.name });
        const input = prompt(`${promptTitle}:\n\n${options}`);
        if (!input) return;
        const chosenId = parseInt(input, 10);
        if (!members.some(a => a.id === chosenId)) {
          alert(this.translate.instant('gymClasses.list.prompts.invalidMemberId'));
          return;
        }
        this.bookingService.createBookingForUser(gymClass.id, chosenId).subscribe({
          next: () => {
            this.snackBar.open(
              this.translate.instant('gymClasses.list.messages.bookingCreated'),
              this.translate.instant('common.close'),
              { duration: 3000 }
            );
          },
          error: (err) => {
            console.error(err);
            this.snackBar.open(
              this.translate.instant('gymClasses.list.errors.createBooking'),
              this.translate.instant('common.close'),
              { duration: 3000 }
            );
          }
        });
      },
      error: () => {
        this.snackBar.open(
          this.translate.instant('gymClasses.list.errors.loadMembers'),
          this.translate.instant('common.close'),
          { duration: 3000 }
        );
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredClasses = this.classes.filter(c =>
      (c.name && c.name.toLowerCase().includes(filterValue)) ||
      (c.description && c.description.toLowerCase().includes(filterValue))
    );
    this.computeGroups();
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(GymClassDialogComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.gymClassService.createGymClass(result).subscribe({
          next: () => {
            this.loadClasses();
            this.snackBar.open(
              this.translate.instant('gymClasses.list.messages.classCreated'),
              this.translate.instant('common.close'),
              { duration: 3000 }
            );
          },
          error: (error) => {
            this.snackBar.open(
              this.translate.instant('gymClasses.list.errors.createClass'),
              this.translate.instant('common.close'),
              { duration: 3000 }
            );
          }
        });
      }
    });
  }

  openEditDialog(gymClass: GymClass): void {
    const dialogRef = this.dialog.open(GymClassDialogComponent, {
      width: '500px',
      data: gymClass
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.gymClassService.updateGymClass(gymClass.id, result).subscribe({
          next: () => {
            this.loadClasses();
            this.snackBar.open(
              this.translate.instant('gymClasses.list.messages.classUpdated'),
              this.translate.instant('common.close'),
              { duration: 3000 }
            );
          },
          error: (error) => {
            this.snackBar.open(
              this.translate.instant('gymClasses.list.errors.updateClass'),
              this.translate.instant('common.close'),
              { duration: 3000 }
            );
          }
        });
      }
    });
  }

  deleteClass(id: number): void {
    if (confirm(this.translate.instant('gymClasses.list.confirm.cancelClass'))) {
      this.gymClassService.deleteGymClass(id).subscribe({
        next: () => {
          this.loadClasses();
          this.snackBar.open(
            this.translate.instant('gymClasses.list.messages.classCancelled'),
            this.translate.instant('common.close'),
            { duration: 3000 }
          );
        },
        error: (error) => {
          this.snackBar.open(
            this.translate.instant('gymClasses.list.errors.cancelClass'),
            this.translate.instant('common.close'),
            { duration: 3000 }
          );
        }
      });
    }
  }

  computeGroups(): void {
    const now = new Date();
    const src = this.showPast ? this.filteredClasses : this.filteredClasses.filter(c => new Date(c.endTime) >= now);
    const map = new Map<string, GymClass[]>();
    for (const c of src) {
      const d = new Date(c.startTime);
      const key = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    const entries = Array.from(map.entries())
      .map(([k, items]) => ({ date: new Date(k), items: items.sort((a,b) => +new Date(a.startTime) - +new Date(b.startTime)) }))
      .sort((a,b) => +a.date - +b.date);
    this.groupedByDay = entries;
  }

  trackById(_: number, item: GymClass) { return item.id; }
}