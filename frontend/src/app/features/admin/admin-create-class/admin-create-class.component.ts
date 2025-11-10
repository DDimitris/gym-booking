import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { GymClassService } from '../../../core/services/gym-class.service';
import { KeycloakService } from '../../../core/services/keycloak.service';
import { User } from '../../../core/models/user.model';
import { ClassTypeService } from '../../../core/services/class-type.service';
import { ClassType } from '../../../core/models/class-type.model';

@Component({
  selector: 'app-admin-create-class',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-create-class.component.html',
  styleUrls: ['./admin-create-class.component.css']
})
export class AdminCreateClassComponent implements OnInit {
  instructors: User[] = [];
  classTypes: ClassType[] = [];
  isLoading = true;
  message: string | null = null;
  messageType: 'success' | 'error' | 'info' = 'info';

  // Form fields
  name = '';
  description = '';
  capacity = 5;
  durationMinutes = 60;
  trainerId: number | null = null;
  classTypeId: number | null = null;
  startDate = ''; // YYYY-MM-DD
  startTime = '';// HH:mm
  location = '';

  constructor(
    private adminService: AdminService,
    private gymClassService: GymClassService,
    private classTypeService: ClassTypeService,
    private keycloak: KeycloakService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Route is already guarded; if reached without admin role, redirect silently
    if (!this.isAdmin()) {
      console.warn('Access denied: admin privileges required');
      this.router.navigate(['/']);
      return;
    }

  this.adminService.getInstructors().subscribe({
      next: (instructors) => {
        this.instructors = instructors;
        // Load class types too
        this.classTypeService.getActiveClassTypes().subscribe({
          next: (types) => {
            this.classTypes = types;
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Failed to load class types', err);
            this.isLoading = false;
          }
        });
      },
      error: (err) => {
        console.error('Failed to load instructors', err);
        this.isLoading = false;
      }
    });
  }

  submit(): void {
    if (!this.isAdmin()) {
      console.warn('Admin privileges required to create class');
      if (this.keycloak && !this.keycloak.isAuthenticated()) {
        this.keycloak.login();
      }
      return;
    }
  if (!this.trainerId) { this.messageType = 'error'; this.message = 'Please select a trainer.'; return; }
    if (!this.name.trim()) { this.messageType = 'error'; this.message = 'Please enter a class name.'; return; }
    if (!this.classTypeId) { this.messageType = 'error'; this.message = 'Please select a class type.'; return; }
    if (!this.startDate || !this.startTime) { this.messageType = 'error'; this.message = 'Please select start date and time.'; return; }

    const start = `${this.startDate}T${this.startTime}:00`;

    // Compute end time by adding duration minutes using Date
    const startDateObj = new Date(`${this.startDate}T${this.startTime}:00`);
    const endDateObj = new Date(startDateObj.getTime() + this.durationMinutes * 60000);
    const end = this.formatLocalDateTime(endDateObj);

  const payload: any = {
      name: this.name,
      description: this.description,
      capacity: this.capacity,
      durationMinutes: this.durationMinutes,
  trainerId: this.trainerId,
  instructorId: this.trainerId, // transitional
      classTypeId: this.classTypeId,
      startTime: start,
      endTime: end,
      location: this.location
    };

    this.gymClassService.createGymClass(payload).subscribe({
      next: () => {
        console.log('Class created successfully');
        this.messageType = 'success';
        this.message = 'Class created successfully';
        setTimeout(() => this.router.navigate(['/classes']), 600);
      },
      error: (err) => {
        console.error('Failed to create class', err);
        this.messageType = 'error';
        this.message = err?.error?.message || 'Failed to create class. Please check inputs and try again.';
      }
    });
  }

  private isAdmin(): boolean {
    if (this.keycloak?.isReady() && this.keycloak.isAuthenticated()) {
      return this.keycloak.getRoles().includes('ADMIN');
    }
    return false;
  }

  private formatLocalDateTime(d: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
  }
}
