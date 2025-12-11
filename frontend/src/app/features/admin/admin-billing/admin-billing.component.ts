import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { WalletService, WalletTransaction } from '../../../core/services/wallet.service';
import { KeycloakService } from '../../../core/services/keycloak.service';
import { BillingReport } from '../../../core/models/billing.model';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { SubscriptionDialogComponent } from '../subscription-dialog/subscription-dialog.component';

@Component({
  selector: 'app-admin-billing',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, SubscriptionDialogComponent],
  templateUrl: './admin-billing.component.html',
  styleUrls: ['./admin-billing.component.css']
})
export class AdminBillingComponent implements OnInit {
  reports: BillingReport[] = [];
  // keep raw reports to support client-side filtering
  reportsRaw: BillingReport[] = [];
  memberId: number | null = null;
  isLoading = true;
  selectedEventIds: Set<number> = new Set<number>();
  // Wallet/admin controls
  walletBalance: number | null = null;
  walletTransactions: WalletTransaction[] = [];
  subscription: any = null;
  subscriptionHistory: any[] = [];
  adminAmount: number | null = null;
  adminReference = '';
  
  // Date range
  startDate = '';
  endDate = '';
  // Filters
  settlementFilter: 'ALL' | 'SUBSCRIPTION' | 'PAYMENT' | 'BONUS' | 'NONE' = 'ALL';
  reasonFilter = '';

  constructor(
    private adminService: AdminService,
    private kc: KeycloakService,
    private router: Router,
    private route: ActivatedRoute,
    private translate: TranslateService,
    private dialog: MatDialog,
    private walletService: WalletService
  ) {}

  ngOnInit(): void {
    // Check if user is admin (Keycloak-only)
    if (!(this.kc.isReady() && this.kc.isAuthenticated() && this.kc.getRoles().includes('ADMIN'))) {
      console.warn('Access denied. Admin privileges required.');
      this.router.navigate(['/']);
      return;
    }

    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    this.endDate = this.formatDate(today);
    this.startDate = this.formatDate(thirtyDaysAgo);

    // Check if viewing specific member
    this.route.paramMap.subscribe(params => {
      const id = params.get('memberId');
      if (id) {
        this.memberId = parseInt(id);
      }
      this.loadReports();
    });
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  loadReports(): void {
    this.isLoading = true;
    this.selectedEventIds.clear();

    if (this.memberId) {
      // Load single member report
      this.adminService.getMemberReport(this.memberId, this.startDate, this.endDate).subscribe({
        next: (report) => {
          this.reports = [report];
            this.reportsRaw = [report];
            this.applyFilters();
          this.isLoading = false;
          // Load wallet info for this member
          this.loadWalletForMember(this.memberId!);
          // load subscription info
          this.loadSubscriptionInfo(this.memberId!);
        },
        error: (err) => {
          console.error('Error loading member report:', err);
          alert('Failed to load billing report. Please try again.');
          this.isLoading = false;
        }
      });
    } else {
      // Load all billing events
      this.adminService.getAllBillingEvents(this.startDate, this.endDate).subscribe({
        next: (reports) => {
          this.reportsRaw = reports;
          this.applyFilters();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading billing reports:', err);
          alert('Failed to load billing reports. Please try again.');
          this.isLoading = false;
        }
      });
    }
  }

  loadSubscriptionInfo(memberId: number): void {
    this.subscription = null;
    this.subscriptionHistory = [];
    this.adminService.getActiveSubscription(memberId).subscribe({
      next: (sub) => { this.subscription = sub; },
      error: (err) => { /* ignore 204/no-content */ }
    });
    this.adminService.getSubscriptionHistory(memberId).subscribe({
      next: (hist) => { this.subscriptionHistory = hist || []; },
      error: (err) => { this.subscriptionHistory = []; }
    });
  }

  applyFilters(): void {
    const sf = this.settlementFilter || 'ALL';
    const term = (this.reasonFilter || '').trim().toLowerCase();
    // Map reports -> filter events per report
    this.reports = this.reportsRaw.map(r => {
      const events = (r.events || []).filter(e => {
        // settlement filter
        if (sf !== 'ALL') {
          const st = (e as any).settlementType || 'NONE';
          if (sf === 'SUBSCRIPTION') {
            if (st !== 'SUBSCRIPTION') return false;
          } else if (st !== sf) {
            return false;
          }
        }
        // reason/text filter
        if (term) {
          const hay = (`${(e as any).reason || ''} ${(e as any).className || ''} ${(e as any).instructorName || ''}`).toLowerCase();
          if (!hay.includes(term)) return false;
        }
        return true;
      });
      return { ...r, events } as BillingReport;
    });
  }

  daysRemainingFor(sub: any): number | null {
    if (!sub || !sub.endDate) return null;
    const end = new Date(sub.endDate);
    const diff = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }

  parseHistoryEventData(eventData: string | null): { key: string; value: string }[] {
    if (!eventData) return [];
    // Try key=value pairs separated by commas, fallback to raw string
    const parts = eventData.split(',').map(p => p.trim()).filter(p => p.length > 0);
    const parsed: { key: string; value: string }[] = [];
    let anyKv = false;
    for (const p of parts) {
      const idx = p.indexOf('=');
      if (idx > 0) {
        anyKv = true;
        const k = p.substring(0, idx).trim();
        const v = p.substring(idx + 1).trim();
        parsed.push({ key: k, value: v });
      }
    }
    if (!anyKv) {
      // treat entire string as single entry
      return [{ key: 'data', value: eventData }];
    }
    return parsed;
  }

  openSubscriptionDialog(): void {
    if (!this.memberId) return;
    const dialogRef = this.dialog.open(SubscriptionDialogComponent, {
      width: '420px',
      data: { initialPayment: '0.00', months: 1 }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      const initialPayment = parseFloat(result.initialPayment as any);
      const months = Number(result.months);
      if (isNaN(initialPayment) || isNaN(months) || months <= 0) { alert('Invalid input'); return; }
      this.adminService.createSubscription(this.memberId!, initialPayment, months).subscribe({
        next: () => { this.loadSubscriptionInfo(this.memberId!); this.loadReports(); },
        error: (err) => { console.error('Failed to create subscription', err); alert('Failed to create subscription: ' + (err?.error || err?.message || err)); }
      });
    });
  }

  cancelSubscription(): void {
    if (!this.memberId || !this.subscription) return;
    const confirmed = window.confirm('Cancel subscription? This will remove remaining days.');
    if (!confirmed) return;
    this.adminService.cancelSubscription(this.memberId, this.subscription.id).subscribe({
      next: () => { this.loadSubscriptionInfo(this.memberId!); this.loadReports(); },
      error: (err) => { console.error('Failed to cancel subscription', err); alert('Failed to cancel subscription.'); }
    });
  }

  loadWalletForMember(memberId: number): void {
    this.walletService.adminGetTransactions(memberId).subscribe({
      next: (txs) => {
        this.walletTransactions = txs;
        // derive balance from transactions ledger (assumes ledger contains all ops)
        this.walletBalance = txs.reduce((s, t) => s + (t.amount || 0), 0);
      },
      error: (err) => {
        console.error('Failed to load wallet transactions', err);
        this.walletTransactions = [];
        this.walletBalance = null;
      }
    });
  }

  adminTopUpMember(): void {
    if (!this.memberId || this.adminAmount == null) return;
    this.walletService.adminTopUp(this.memberId, this.adminAmount, this.adminReference).subscribe({
      next: () => { this.loadWalletForMember(this.memberId!); this.loadReports(); },
      error: (err) => { console.error('Top-up failed', err); alert('Top-up failed'); }
    });
  }


  adminSetMemberBalance(): void {
    if (!this.memberId || this.adminAmount == null) return;
    this.walletService.adminSetBalance(this.memberId, this.adminAmount, this.adminReference).subscribe({
      next: () => { this.loadWalletForMember(this.memberId!); this.loadReports(); },
      error: (err) => { console.error('Set balance failed', err); alert('Set balance failed'); }
    });
  }

  applyDateFilter(): void {
    this.loadReports();
  }

  exportToCSV(): void {
    if (this.reports.length === 0) {
      alert('No data to export.');
      return;
    }

    // Build CSV content
    let csv = 'Member Name,Email,Bonus Days,Event Date,Amount,Reason,Settled\n';
    
    this.reports.forEach(report => {
      if (report.events.length === 0) {
        // Include member even if no events
        csv += `"${report.userName}","","${report.bonusDays}","","","",""\n`;
      } else {
        report.events.forEach(event => {
          csv += `"${report.userName}","","${report.bonusDays}","${event.eventDate}","€${event.amount}","${event.reason}","${event.settled ? 'Yes' : 'No'}"\n`;
        });
      }
    });

    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `billing-report-${this.startDate}-to-${this.endDate}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  backToMembers(): void {
    this.router.navigate(['/admin/members']);
  }

  get totalOwedAcrossAll(): number {
    return 0; // removed totalOwed aggregation; keep getter for template compatibility
  }

  get totalEventsCount(): number {
    return this.reports.reduce((sum, report) => sum + report.events.length, 0);
  }

  // Map backend classKind enum values to i18n keys
  classKindKey(kind: string | null | undefined): string | null {
    if (!kind) return null;
    switch (kind) {
      case 'GROUP':
        return 'gymClasses.kinds.group';
      case 'SMALL_GROUP':
        return 'gymClasses.kinds.smallGroup';
      case 'PERSONAL':
        return 'gymClasses.kinds.personal';
      case 'OPEN_GYM':
        return 'gymClasses.kinds.openGym';
      default:
        return null;
    }
  }

  // Selection helpers
  isSelected(eventId: number): boolean { return this.selectedEventIds.has(eventId); }
  toggleEventSelection(eventId: number, checked: boolean): void {
    if (checked) this.selectedEventIds.add(eventId); else this.selectedEventIds.delete(eventId);
  }
  selectAllPendingInReport(report: BillingReport, checked: boolean): void {
    const ids = report.events.filter(e => !e.settled).map(e => (e as any).id || (e as any).eventId || e.bookingId);
    // Prefer id if present on event summaries; backend DTO includes id
    report.events.forEach(e => {
      const id = (e as any).id ?? (e as any).eventId ?? e.bookingId;
      if (!e.settled && typeof id === 'number') {
        if (checked) this.selectedEventIds.add(id); else this.selectedEventIds.delete(id);
      }
    });
  }

  markSelectedAsPaid(): void {
    if (this.selectedEventIds.size === 0) return;
    const ids = Array.from(this.selectedEventIds.values());
    this.adminService.settleBillingEvents(ids).subscribe({
      next: () => { this.loadReports(); },
      error: (err) => { console.error('Failed to settle events', err); alert('Failed to mark as paid.'); }
    });
  }

  settleSingleAsPayment(eventId: number): void {
    this.adminService.settleBillingEventAsPayment(eventId).subscribe({
      next: () => this.loadReports(),
      error: (err) => {
        console.error('Failed to mark event as paid', err);
        alert('Failed to mark event as paid.');
      }
    });
  }

  settleSingleAsBonus(eventId: number): void {
    this.adminService.settleBillingEventAsBonus(eventId).subscribe({
      next: () => this.loadReports(),
      error: (err) => {
        console.error('Failed to settle event via bonus', err);
        const message = err?.error || 'Failed to settle event via bonus.';
        alert(message);
      }
    });
  }
}
