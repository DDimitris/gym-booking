import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { AdminAthletesComponent } from '../admin-athletes/admin-athletes.component';
import { GymClassListComponent } from '../../gym-class/gym-class-list.component';
import { ClassType } from '../../../core/models/class-type.model';
import { ClassTypeService } from '../../../core/services/class-type.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminCreateClassDialogComponent } from '../admin-create-class-dialog/admin-create-class-dialog.component';
import { AdminCreateClassTypeDialogComponent } from '../admin-create-class-type-dialog/admin-create-class-type-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { KeycloakService } from '../../../core/services/keycloak.service';

@Component({
  selector: 'app-management',
  standalone: true,
  imports: [CommonModule, SharedModule, AdminAthletesComponent, GymClassListComponent],
  template: `
    <div class="management-container">
      <div class="header">
        <h1>Management</h1>
        <div class="actions">
          <button mat-raised-button color="primary" (click)="openCreateClassDialog()">Create Class</button>
          <button mat-stroked-button color="accent" (click)="openCreateClassTypeDialog()">Create Class Type</button>
        </div>
      </div>

      <mat-tab-group>
        <mat-tab label="Athletes" *ngIf="isAdmin">
          <app-admin-athletes></app-admin-athletes>
        </mat-tab>
        <mat-tab label="Classes">
          <app-gym-class-list></app-gym-class-list>
        </mat-tab>
        <mat-tab label="Class Types">
          <div class="type-list">
            <div class="filters">
              <mat-slide-toggle [(ngModel)]="showInactive" (change)="applyTypeFilter()">Show inactive</mat-slide-toggle>
            </div>
            <table mat-table [dataSource]="displayedTypes" class="mat-elevation-z8">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef> Name </th>
                <td mat-cell *matCellDef="let t">
                  <ng-container *ngIf="editingId === t.id; else viewName">
                    <mat-form-field appearance="outline">
                      <input matInput [(ngModel)]="edited.name" name="name_{{t.id}}" />
                    </mat-form-field>
                  </ng-container>
                  <ng-template #viewName>
                    <span [class.inactive]="!t.isActive">{{ t.name }}</span>
                    <mat-chip color="warn" selected *ngIf="!t.isActive" class="chip">Inactive</mat-chip>
                  </ng-template>
                </td>
              </ng-container>
              <ng-container matColumnDef="description">
                <th mat-header-cell *matHeaderCellDef> Description </th>
                <td mat-cell *matCellDef="let t">
                  <ng-container *ngIf="editingId === t.id; else viewDesc">
                    <mat-form-field appearance="outline">
                      <input matInput [(ngModel)]="edited.description" name="desc_{{t.id}}" />
                    </mat-form-field>
                  </ng-container>
                  <ng-template #viewDesc>{{ t.description }}</ng-template>
                </td>
              </ng-container>
              <ng-container matColumnDef="active">
                <th mat-header-cell *matHeaderCellDef> Active </th>
                <td mat-cell *matCellDef="let t">
                  <mat-slide-toggle [checked]="t.isActive" (change)="confirmToggle(t, $event.checked)"></mat-slide-toggle>
                </td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef> Actions </th>
                <td mat-cell *matCellDef="let t">
                  <ng-container *ngIf="editingId === t.id; else editButtons">
                    <button mat-button color="primary" (click)="saveEdit(t)">Save</button>
                    <button mat-button (click)="cancelEdit()">Cancel</button>
                  </ng-container>
                  <ng-template #editButtons>
                    <button mat-icon-button color="primary" (click)="startEdit(t)">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button color="warn" (click)="confirmDelete(t)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </ng-template>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="['name','description','active','actions']"></tr>
              <tr mat-row *matRowDef="let row; columns: ['name','description','active','actions'];"></tr>
            </table>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .management-container { padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .actions button { margin-left: 8px; }
    .type-list { margin-top: 12px; }
    .filters { margin-bottom: 8px; }
    .inactive { opacity: 0.65; }
    .chip { margin-left: 6px; height: 22px; line-height: 22px; }
  `]
})
export class ManagementComponent {
  classTypes: ClassType[] = [];
  displayedTypes: ClassType[] = [];
  editingId: number | null = null;
  edited: Partial<ClassType> = {};
  showInactive = false;
  @ViewChild(GymClassListComponent) classesList?: GymClassListComponent;

  constructor(private router: Router, private classTypeService: ClassTypeService, private dialog: MatDialog, private snackBar: MatSnackBar, private kc: KeycloakService) {
    this.loadTypes();
  }

  get isAdmin(): boolean { return this.kc.isReady() && this.kc.isAuthenticated() && this.kc.getRoles().includes('ADMIN'); }

  openCreateClassDialog(): void {
    const ref = this.dialog.open(AdminCreateClassDialogComponent, { width: '640px' });
    ref.afterClosed().subscribe(result => {
      if (result === 'created') {
        this.classesList?.loadClasses();
      }
    });
  }

  openCreateClassTypeDialog(): void {
    const ref = this.dialog.open(AdminCreateClassTypeDialogComponent, { width: '520px' });
    ref.afterClosed().subscribe(result => {
      if (result === 'created') {
        this.loadTypes();
      }
    });
  }

  loadTypes(): void {
    this.classTypeService.getAllClassTypes().subscribe({
      next: (types) => { this.classTypes = types; this.applyTypeFilter(); },
      error: () => { this.classTypes = []; this.applyTypeFilter(); this.snackBar.open('Failed to load class types', 'Close', { duration: 2500 }); }
    });
  }

  applyTypeFilter(): void {
    this.displayedTypes = this.showInactive ? this.classTypes : this.classTypes.filter(t => t.isActive);
  }

  startEdit(t: ClassType): void {
    this.editingId = t.id;
    this.edited = { name: t.name, description: t.description };
  }
  cancelEdit(): void {
    this.editingId = null;
    this.edited = {};
  }
  saveEdit(t: ClassType): void {
    const payload: ClassType = {
      id: t.id,
      name: this.edited.name || t.name,
      description: this.edited.description || t.description,
      trainerId: (t as any).trainerId ?? (t as any).instructorId,
      isActive: t.isActive
    };
    this.classTypeService.updateClassType(t.id, payload).subscribe({
      next: () => {
        this.cancelEdit();
        this.loadTypes();
      }
    });
  }
  confirmToggle(t: ClassType, checked: boolean): void {
    // Optional confirm only when deactivating
    if (t.isActive && !checked) {
      const ref = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        width: '380px',
        data: { title: 'Deactivate class type', message: 'Existing and future classes will still reference this type. Continue?' }
      });
      ref.afterClosed().subscribe(result => {
        if (result) this.toggleActive(t, checked); else this.loadTypes();
      });
    } else {
      this.toggleActive(t, checked);
    }
  }

  private toggleActive(t: ClassType, checked: boolean): void {
    const previous = t.isActive;
    t.isActive = checked; // optimistic
    this.applyTypeFilter();
    const payload: ClassType = { ...t, isActive: checked };
    this.classTypeService.updateClassType(t.id, payload).subscribe({
      next: () => this.loadTypes(),
      error: (err) => {
        t.isActive = previous; // revert
        this.applyTypeFilter();
        const msg = err?.error?.message || 'Failed to update class type';
        this.snackBar.open(msg, 'Close', { duration: 2500 });
      }
    });
  }

  confirmDelete(t: ClassType): void {
    const ref = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
      width: '360px',
      data: { title: 'Delete class type', message: `Delete "${t.name}"? This cannot be undone.` }
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        const id = t.id;
        // optimistic remove
        const prev = [...this.classTypes];
        this.classTypes = this.classTypes.filter(ct => ct.id !== id);
        this.applyTypeFilter();
        this.classTypeService.deleteClassType(id).subscribe({
          next: () => this.loadTypes(),
          error: (err) => {
            this.classTypes = prev; this.applyTypeFilter();
            const msg = err?.error?.message || 'Failed to delete class type';
            this.snackBar.open(msg, 'Close', { duration: 3000 });
          }
        });
      }
    });
  }
}
