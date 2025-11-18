import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { KeycloakService } from '../../../core/services/keycloak.service';
import { User, UserRole } from '../../../core/models/user.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-admin-athletes',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
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
  modalMode: 'baseCost' | 'kindCosts' | 'bonusDays' | 'promote' | null = null;
  selectedMember: User | null = null;
  inputValue = 0;
  kindCosts = {
    groupBaseCost: 0,
    smallGroupBaseCost: 0,
    personalBaseCost: 0,
    openGymBaseCost: 0
  };

  constructor(
    private adminService: AdminService,
    private kc: KeycloakService,
    private router: Router,
    private translate: TranslateService
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
      alert(this.translate.instant('adminAthletes.errors.loadUsers'));
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

  openKindCostsModal(member: User): void {
    this.selectedMember = member;
    this.kindCosts = {
      groupBaseCost: (member as any).groupBaseCost || 0,
      smallGroupBaseCost: (member as any).smallGroupBaseCost || 0,
      personalBaseCost: (member as any).personalBaseCost || 0,
      openGymBaseCost: (member as any).openGymBaseCost || 0
    };
    this.modalMode = 'kindCosts';
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
    this.kindCosts = {
      groupBaseCost: 0,
      smallGroupBaseCost: 0,
      personalBaseCost: 0,
      openGymBaseCost: 0
    };
  }

  saveChanges(): void {
    if (!this.selectedMember) return;

  if (this.modalMode === 'baseCost') {
      this.adminService.setBaseCost(this.selectedMember.id, this.inputValue).subscribe({
        next: () => {
          alert(
            this.translate.instant('adminAthletes.messages.baseCostSet', {
              value: this.inputValue,
              name: this.selectedMember!.name
            })
          );
          this.loadAllUsers();
          this.closeModal();
        },
        error: (err) => {
          console.error('Error setting base cost:', err);
          alert(
            this.translate.instant('adminAthletes.errors.setBaseCost')
          );
        }
      });
    } else if (this.modalMode === 'kindCosts') {
      this.adminService.setMemberBaseCosts(this.selectedMember.id, this.kindCosts).subscribe({
        next: () => {
          alert(
            this.translate.instant('adminAthletes.messages.kindCostsSet', {
              name: this.selectedMember!.name
            })
          );
          this.loadAllUsers();
          this.closeModal();
        },
        error: (err) => {
          console.error('Error setting kind base costs:', err);
          alert(
            this.translate.instant('adminAthletes.errors.setKindCosts')
          );
        }
      });
    } else if (this.modalMode === 'bonusDays') {
      this.adminService.assignBonusDays(this.selectedMember.id, this.inputValue).subscribe({
        next: () => {
          alert(
            this.translate.instant('adminAthletes.messages.bonusAssigned', {
              value: this.inputValue,
              name: this.selectedMember!.name
            })
          );
          this.loadAllUsers();
          this.closeModal();
        },
        error: (err) => {
          console.error('Error assigning bonus days:', err);
          alert(
            this.translate.instant('adminAthletes.errors.assignBonus')
          );
        }
      });
    } else if (this.modalMode === 'promote') {
      this.adminService.promoteToTrainer(this.selectedMember.id).subscribe({
        next: () => {
          alert(
            this.translate.instant('adminAthletes.messages.promoted', {
              name: this.selectedMember!.name
            })
          );
          this.loadAllUsers();
          this.closeModal();
        },
        error: (err) => {
          console.error('Error promoting member:', err);
          alert(
            this.translate.instant('adminAthletes.errors.promote')
          );
        }
      });
    }
  }

  viewBilling(member: User): void {
    this.router.navigate(['/admin/billing', member.id]);
  }

  deleteUser(user: User): void {
    if (
      !confirm(
        this.translate.instant('adminAthletes.confirm.delete', {
          name: user.name,
          email: user.email
        })
      )
    )
      return;
    this.adminService.deleteUser(user.id).subscribe({
      next: () => {
        alert(this.translate.instant('adminAthletes.messages.deleted'));
        this.loadAllUsers();
      },
      error: (err) => {
        console.error('Error deleting user:', err);
        const fallback = this.translate.instant(
          'adminAthletes.errors.delete'
        );
        const msg = err?.error || err?.error?.message || fallback;
        alert(typeof msg === 'string' ? msg : fallback);
      }
    });
  }

  get modalTitle(): string {
    if (this.modalMode === 'baseCost') {
      return this.translate.instant('adminAthletes.modal.titles.baseCost');
    }
    if (this.modalMode === 'kindCosts') {
      return this.translate.instant('adminAthletes.modal.titles.kindCosts');
    }
    if (this.modalMode === 'bonusDays') {
      return this.translate.instant('adminAthletes.modal.titles.bonusDays');
    }
    if (this.modalMode === 'promote') {
      return this.translate.instant('adminAthletes.modal.titles.promote');
    }
    return '';
  }
}
