import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { User } from '../../core/models/user.model';
import { UserService } from '../../core/services/user.service';

export interface BookForUserDialogData {
  gymClassName: string;
}

@Component({
  selector: 'app-book-for-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslateModule
  ],
  template: `
    <div class="book-dialog">
      <h2 class="title">
        Book class for member
      </h2>
      <p class="subtitle" *ngIf="data?.gymClassName">
        {{ data.gymClassName }}
      </p>

      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Search by name or email</mat-label>
        <input
          matInput
          [(ngModel)]="search"
          (ngModelChange)="applyFilter()"
          placeholder="Type to search members..."
        />
        <button mat-icon-button matSuffix *ngIf="search" (click)="clearSearch()" aria-label="Clear search">
          <mat-icon>close</mat-icon>
        </button>
      </mat-form-field>

      <ng-container *ngIf="!loading; else loadingTpl">
        <div class="results-header" *ngIf="members.length">
          <span class="count">{{ filtered.length }} of {{ members.length }} members</span>
        </div>

        <div class="empty" *ngIf="!members.length && !loading">
          No members available.
        </div>

        <div class="empty" *ngIf="members.length && !filtered.length && search">
          No matches for "{{ search }}".
        </div>

        <div class="results" *ngIf="filtered.length">
          <div
            class="member-row"
            *ngFor="let m of filtered"
          >
            <div class="avatar">{{ (m.name || m.email || '?') | slice:0:1 | uppercase }}</div>
            <div class="info">
              <div class="name">{{ m.name || '—' }}</div>
              <div class="meta">
                <span class="email">{{ m.email }}</span>
                <span class="id">#{{ m.id }}</span>
              </div>
            </div>
            <div class="status" *ngIf="m.status">
              <span class="chip" [ngClass]="statusClass(m.status)">{{ m.status }}</span>
            </div>
            <div class="actions">
              <button mat-stroked-button color="primary" (click)="select(m)">
                Add
              </button>
            </div>
          </div>
        </div>
      </ng-container>

      <ng-template #loadingTpl>
        <div class="loading">
          <mat-progress-spinner diameter="32" mode="indeterminate"></mat-progress-spinner>
        </div>
      </ng-template>

      <div class="actions-footer">
        <button mat-button (click)="dialogRef.close()">Close</button>
      </div>
    </div>
  `,
  styles: [`
    .book-dialog {
      padding: 16px 16px 8px;
      max-width: 520px;
    }
    .title {
      margin: 0;
      font-size: 1.4rem;
    }
    .subtitle {
      margin: 4px 0 12px;
      color: #4b5563;
      font-size: 0.9rem;
    }
    .search-field {
      width: 100%;
      margin-bottom: 8px;
    }
    .results-header {
      display: flex;
      justify-content: flex-end;
      font-size: 0.8rem;
      color: #6b7280;
      margin-bottom: 4px;
    }
    .results {
      max-height: 320px;
      overflow-y: auto;
      padding-right: 4px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .member-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      border-radius: 8px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      box-shadow: 0 1px 2px rgba(15,23,42,0.04);
    }
    .member-row:hover {
      border-color: #bfdbfe;
      box-shadow: 0 2px 4px rgba(37,99,235,0.12);
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
      font-size: 0.8rem;
      color: #6b7280;
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .email {
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .id {
      font-variant-numeric: tabular-nums;
    }
    .status {
      margin-left: 4px;
    }
    .chip {
      padding: 2px 6px;
      border-radius: 999px;
      font-size: 0.7rem;
      border: 1px solid transparent;
      text-transform: lowercase;
    }
    .chip.status-active {
      background: #ecfdf3;
      color: #166534;
      border-color: #bbf7d0;
    }
    .chip.status-suspended {
      background: #fef3c7;
      color: #92400e;
      border-color: #fde68a;
    }
    .chip.status-deleted {
      background: #fee2e2;
      color: #b91c1c;
      border-color: #fecaca;
    }
    .actions {
      margin-left: 8px;
      flex-shrink: 0;
    }
    .actions-footer {
      margin-top: 12px;
      text-align: right;
    }
    .empty {
      font-size: 0.9rem;
      color: #6b7280;
      padding: 12px 4px;
    }
    .loading {
      display: flex;
      justify-content: center;
      padding: 16px 0;
    }
    @media (max-width: 600px) {
      .book-dialog {
        padding: 12px 12px 8px;
        max-width: 100vw;
      }
      .member-row {
        flex-wrap: wrap;
        align-items: flex-start;
      }
      .email {
        max-width: 140px;
      }
      .actions {
        width: 100%;
        margin-left: 0;
        margin-top: 4px;
        text-align: right;
      }
    }
  `]
})
export class BookForUserDialogComponent {
  members: User[] = [];
  filtered: User[] = [];
  loading = true;
  search = '';

  constructor(
    private userService: UserService,
    public dialogRef: MatDialogRef<BookForUserDialogComponent, number | null>,
    @Inject(MAT_DIALOG_DATA) public data: BookForUserDialogData
  ) {
    this.loadMembers();
  }

  loadMembers(): void {
    this.loading = true;
    this.userService.getAllMembers().subscribe({
      next: (members) => {
        this.members = members || [];
        this.filtered = [...this.members];
        this.loading = false;
      },
      error: () => {
        this.members = [];
        this.filtered = [];
        this.loading = false;
      }
    });
  }

  applyFilter(): void {
    const term = this.search.trim().toLowerCase();
    if (!term) {
      this.filtered = [...this.members];
      return;
    }
    this.filtered = this.members.filter(m =>
      (m.name && m.name.toLowerCase().includes(term)) ||
      (m.email && m.email.toLowerCase().includes(term)) ||
      (m.id && m.id.toString().includes(term))
    );
  }

  clearSearch(): void {
    this.search = '';
    this.applyFilter();
  }

  statusClass(status: string | undefined | null): string {
    if (!status) return '';
    const normalized = status.toString().toLowerCase();
    return `status-${normalized}`;
  }

  select(user: User): void {
    this.dialogRef.close(user.id);
  }
}
