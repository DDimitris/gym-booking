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
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-management',
  standalone: true,
  imports: [CommonModule, SharedModule, AdminAthletesComponent, GymClassListComponent, TranslateModule],
  template: `
    <div class="management-container">
      <div class="header">
        <h1>{{ 'adminManagement.title' | translate }}</h1>
        <div class="actions">
          <button mat-raised-button color="primary" (click)="openCreateClassDialog()">
            {{ 'adminManagement.actions.createClass' | translate }}
          </button>
          <button mat-stroked-button color="accent" (click)="openCreateClassTypeDialog()">
            {{ 'adminManagement.actions.createClassType' | translate }}
          </button>
        </div>
      </div>

      <mat-tab-group>
        <mat-tab [label]="'adminManagement.tabs.athletes' | translate" *ngIf="isAdmin">
          <app-admin-athletes></app-admin-athletes>
        </mat-tab>
        <mat-tab [label]="'adminManagement.tabs.classes' | translate">
          <app-gym-class-list></app-gym-class-list>
        </mat-tab>
        <mat-tab [label]="'adminManagement.tabs.classTypes' | translate">
          <div class="type-list">
            <div class="filters">
              <mat-slide-toggle [(ngModel)]="showInactive" (change)="applyTypeFilter()">
                {{ 'adminManagement.classTypes.filters.showInactive' | translate }}
              </mat-slide-toggle>
            </div>
            <table mat-table [dataSource]="displayedTypes" class="mat-elevation-z8">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>
                  {{ 'adminManagement.classTypes.table.name' | translate }}
                </th>
                <td mat-cell *matCellDef="let t">
                  <ng-container *ngIf="editingId === t.id; else viewName">
                    <mat-form-field appearance="outline">
                      <input matInput [(ngModel)]="edited.name" name="name_{{t.id}}" />
                    </mat-form-field>
                  </ng-container>
                  <ng-template #viewName>
                    <span [class.inactive]="!t.isActive">{{ t.name }}</span>
                    <mat-chip color="warn" selected *ngIf="!t.isActive" class="chip">
                      {{ 'adminManagement.classTypes.badges.inactive' | translate }}
                    </mat-chip>
                  </ng-template>
                </td>
              </ng-container>
              <ng-container matColumnDef="description">
                <th mat-header-cell *matHeaderCellDef>
                  {{ 'adminManagement.classTypes.table.description' | translate }}
                </th>
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
                <th mat-header-cell *matHeaderCellDef>
                  {{ 'adminManagement.classTypes.table.active' | translate }}
                </th>
                <td mat-cell *matCellDef="let t">
                  <mat-slide-toggle [checked]="t.isActive" (change)="confirmToggle(t, $event.checked)"></mat-slide-toggle>
                </td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>
                  {{ 'adminManagement.classTypes.table.actions' | translate }}
                </th>
                <td mat-cell *matCellDef="let t">
                  <ng-container *ngIf="editingId === t.id; else editButtons">
                    <button mat-button color="primary" (click)="saveEdit(t)">
                      {{ 'common.save' | translate }}
                    </button>
                    <button mat-button (click)="cancelEdit()">
                      {{ 'common.cancel' | translate }}
                    </button>
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

  constructor(private router: Router, private classTypeService: ClassTypeService, private dialog: MatDialog, private snackBar: MatSnackBar, private kc: KeycloakService, private translate: TranslateService) {
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
      error: () => {
        this.classTypes = [];
        this.applyTypeFilter();
        this.snackBar.open(this.translate.instant('adminManagement.classTypes.errors.load'), this.translate.instant('common.close'), { duration: 2500 });
      }
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
        data: {
          title: this.translate.instant('adminManagement.classTypes.confirm.deactivateTitle'),
          message: this.translate.instant('adminManagement.classTypes.confirm.deactivateMessage')
        }
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
        const fallback = this.translate.instant('adminManagement.classTypes.errors.update');
        const msg = err?.error?.message || fallback;
        this.snackBar.open(msg, this.translate.instant('common.close'), { duration: 2500 });
      }
    });
  }

  confirmDelete(t: ClassType): void {
    const ref = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
      width: '360px',
      data: {
        title: this.translate.instant('adminManagement.classTypes.confirm.deleteTitle'),
        message: this.translate.instant('adminManagement.classTypes.confirm.deleteMessage', { name: t.name })
      }
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
            const fallback = this.translate.instant('adminManagement.classTypes.errors.delete');
            const msg = err?.error?.message || fallback;
            this.snackBar.open(msg, this.translate.instant('common.close'), { duration: 3000 });
          }
        });
      }
    });
  }
}
