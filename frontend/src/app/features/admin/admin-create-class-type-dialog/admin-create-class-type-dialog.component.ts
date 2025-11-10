import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { SharedModule } from '../../../shared/shared.module';
import { ClassTypeService } from '../../../core/services/class-type.service';
import { AdminService } from '../../../core/services/admin.service';
import { KeycloakService } from '../../../core/services/keycloak.service';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-admin-create-class-type-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule],
  template: `
    <h2 mat-dialog-title>Create Class Type</h2>
    <div mat-dialog-content>
      <form (ngSubmit)="create()" #form="ngForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Trainer</mat-label>
          <mat-select [(ngModel)]="trainerId" name="trainerId">
            <mat-option *ngFor="let i of instructors" [value]="i.id">{{ i.name }}</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Name</mat-label>
          <input matInput [(ngModel)]="name" name="name" required />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <input matInput [(ngModel)]="description" name="description" />
        </mat-form-field>
      </form>
      <div *ngIf="message" class="message" [ngClass]="messageType">{{ message }}</div>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="close()">Cancel</button>
      <button mat-raised-button color="primary" (click)="create()" [disabled]="!name">Create</button>
    </div>
  `,
  styles: [`
    .full-width { width: 100%; }
    .message.info { color: #1976d2; }
    .message.success { color: #2e7d32; }
    .message.error { color: #d32f2f; }
  `]
})
export class AdminCreateClassTypeDialogComponent {
  name = '';
  description = '';
  trainerId: number | null = null;
  message: string | null = null;
  messageType: 'success' | 'error' | 'info' = 'info';
  instructors: User[] = [];
  instructorLocked = false;

  constructor(
    private ref: MatDialogRef<AdminCreateClassTypeDialogComponent>,
    private classTypeService: ClassTypeService,
    private adminService: AdminService,
    private kc: KeycloakService,
    private users: UserService
  ) {
    this.loadInstructors();
  }

  loadInstructors(): void {
    // Load all trainers for both admins and instructors from /api/users/instructors
    this.users.getAllTrainers().subscribe({
      next: (list) => (this.instructors = list),
      error: () => (this.instructors = [])
    });
  }

  create(): void {
  if (!this.name) return;
    this.classTypeService.createClassType({
      id: 0,
      name: this.name,
      description: this.description,
      trainerId: this.trainerId,
      isActive: true
    }).subscribe({
      next: () => {
        this.messageType = 'success';
        this.message = 'Class type created';
        this.ref.close('created');
      },
      error: (err) => {
        this.messageType = 'error';
        this.message = err?.error?.message || 'Failed to create class type';
      }
    });
  }

  close(): void { this.ref.close(); }
}
