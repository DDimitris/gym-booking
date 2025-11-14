import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { KeycloakService } from '../../../core/services/keycloak.service';
import { User, UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-admin-athletes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-athletes.component.html',
  styleUrls: ['./admin-athletes.component.css']
})
export class AdminAthletesComponent implements OnInit {
  members: User[] = [];
  trainers: User[] = [];
  filteredMembers: User[] = [];
  filteredTrainers: User[] = [];
  searchTerm = '';
  isLoading = true;
  
  // Modal state
  showModal = false;
  modalMode: 'baseCost' | 'bonusDays' | 'promote' | null = null;
  selectedMember: User | null = null;
  inputValue = 0;

  constructor(
    private adminService: AdminService,
    private kc: KeycloakService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check if user is admin (Keycloak-only)
    if (!(this.kc.isReady() && this.kc.isAuthenticated() && this.kc.getRoles().includes('ADMIN'))) {
      console.warn('Access denied. Admin privileges required.');
      this.router.navigate(['/']);
      return;
    }
    
    this.loadAllUsers();
  }
  loadAllUsers(): void {
    this.isLoading = true;
    // Parallel calls; merge results
    Promise.all([
      this.adminService.getAllMembers().toPromise(),
      this.adminService.getTrainers().toPromise()
    ]).then(([members, trainers]) => {
      this.members = members || [];
      this.trainers = trainers || [];
      this.filteredMembers = [...this.members].sort((a,b) => a.name.localeCompare(b.name));
      this.filteredTrainers = [...this.trainers].sort((a,b) => a.name.localeCompare(b.name));
      this.isLoading = false;
    }).catch(err => {
      console.error('Error loading users:', err);
      alert('Failed to load users. Please try again.');
      this.isLoading = false;
    });
  }

  onSearchChange(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.filteredMembers = [...this.members];
      this.filteredTrainers = [...this.trainers];
      return;
    }
    this.filteredMembers = this.members.filter(u =>
      u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)
    );
    this.filteredTrainers = this.trainers.filter(u =>
      u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)
    );
  }

  // Removed separate trainers load; consolidated in loadAllUsers

  openBaseCostModal(member: User): void {
    this.selectedMember = member;
    this.inputValue = member.baseCost || 0;
    this.modalMode = 'baseCost';
    this.showModal = true;
  }

  openBonusDaysModal(member: User): void {
    this.selectedMember = member;
    this.inputValue = member.bonusDays || 0;
    this.modalMode = 'bonusDays';
    this.showModal = true;
  }

  openPromoteModal(member: User): void {
    this.selectedMember = member;
    this.modalMode = 'promote';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.modalMode = null;
    this.selectedMember = null;
    this.inputValue = 0;
  }

  saveChanges(): void {
    if (!this.selectedMember) return;

    if (this.modalMode === 'baseCost') {
      this.adminService.setBaseCost(this.selectedMember.id, this.inputValue).subscribe({
        next: () => {
          alert(`Base cost set to €${this.inputValue} for ${this.selectedMember!.name}`);
          this.loadAllUsers();
          this.closeModal();
        },
        error: (err) => {
          console.error('Error setting base cost:', err);
          alert('Failed to set base cost. Please try again.');
        }
      });
    } else if (this.modalMode === 'bonusDays') {
      this.adminService.assignBonusDays(this.selectedMember.id, this.inputValue).subscribe({
        next: () => {
          alert(`Assigned ${this.inputValue} bonus days to ${this.selectedMember!.name}`);
          this.loadAllUsers();
          this.closeModal();
        },
        error: (err) => {
          console.error('Error assigning bonus days:', err);
          alert('Failed to assign bonus days. Please try again.');
        }
      });
    } else if (this.modalMode === 'promote') {
      this.adminService.promoteToTrainer(this.selectedMember.id).subscribe({
        next: () => {
          alert(`${this.selectedMember!.name} has been promoted to Trainer! They will see the Management page (Classes & Class Types) on their next login.`);
          this.loadAllUsers();
          this.closeModal();
        },
        error: (err) => {
          console.error('Error promoting member:', err);
          alert('Failed to promote member. Please try again.');
        }
      });
    }
  }

  viewBilling(member: User): void {
    this.router.navigate(['/admin/billing', member.id]);
  }

  deleteUser(user: User): void {
    if (!confirm(`Are you sure you want to delete ${user.name} (${user.email})?`)) return;
    this.adminService.deleteUser(user.id).subscribe({
      next: () => {
        alert('User deleted');
        this.loadAllUsers();
      },
      error: (err) => {
        console.error('Error deleting user:', err);
        const msg = err?.error || err?.error?.message || 'Failed to delete user.';
        alert(typeof msg === 'string' ? msg : 'Failed to delete user.');
      }
    });
  }

  get modalTitle(): string {
    if (this.modalMode === 'baseCost') return 'Set Base Cost';
    if (this.modalMode === 'bonusDays') return 'Assign Bonus Days';
    if (this.modalMode === 'promote') return 'Promote to Trainer';
    return '';
  }
}
