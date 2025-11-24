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
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-admin-create-class-type-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule, TranslateModule],
  template: `
    <h2 mat-dialog-title>{{ 'adminManagement.classTypeDialog.title' | translate }}</h2>
    <div mat-dialog-content>
      <form (ngSubmit)="create()" #form="ngForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'adminManagement.classTypeDialog.fields.name' | translate }}</mat-label>
          <input matInput [(ngModel)]="name" name="name" required />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'adminManagement.classTypeDialog.fields.description' | translate }}</mat-label>
          <input matInput [(ngModel)]="description" name="description" />
        </mat-form-field>
      </form>
      <div *ngIf="messageKey" class="message" [ngClass]="messageType">
        {{ messageKey | translate }}
      </div>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="close()">
        {{ 'adminManagement.classTypeDialog.actions.cancel' | translate }}
      </button>
      <button mat-raised-button color="primary" (click)="create()" [disabled]="!name">
        {{ 'adminManagement.classTypeDialog.actions.create' | translate }}
      </button>
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
  messageKey: string | null = null;
  messageType: 'success' | 'error' | 'info' = 'info';
  // Trainer selection has been removed; class types are no longer bound to a single trainer

  constructor(
    private ref: MatDialogRef<AdminCreateClassTypeDialogComponent>,
    private classTypeService: ClassTypeService,
    private adminService: AdminService,
    private kc: KeycloakService,
    private translate: TranslateService
  ) {}

  create(): void {
    if (!this.name) {
      this.messageType = 'error';
      this.messageKey = 'adminManagement.classTypeDialog.errors.nameRequired';
      return;
    }
    this.classTypeService.createClassType({
      id: 0,
      name: this.name,
      description: this.description,
      isActive: true
    }).subscribe({
      next: () => {
        this.messageType = 'success';
        this.messageKey = 'adminManagement.classTypeDialog.messages.created';
        this.ref.close('created');
      },
      error: (err) => {
        this.messageType = 'error';
        this.messageKey = 'adminManagement.classTypeDialog.errors.createFailed';
      }
    });
  }

  close(): void { this.ref.close(); }
}
