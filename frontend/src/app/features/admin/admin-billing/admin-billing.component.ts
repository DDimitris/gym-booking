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
import { SubscriptionHistoryDialogComponent } from '../subscription-history-dialog/subscription-history-dialog.component';

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

  // Human-friendly label for subscription event types (fallback to raw type)
  subscriptionEventLabel(eventType: string | null | undefined): string {
    if (!eventType) return 'Subscription';
    switch (eventType.toUpperCase()) {
      case 'CREATED':
        return this.translate.instant('adminBilling.subscription.event.created');
      case 'RENEWED':
        return this.translate.instant('adminBilling.subscription.event.renewed');
      case 'CANCELLED':
      case 'CANCELED':
        return this.translate.instant('adminBilling.subscription.event.cancelled');
      case 'PAYMENT':
        return this.translate.instant('adminBilling.subscription.event.payment');
      default:
        return eventType;
    }
  }

  // Build a short summary line for a subscription history event
  subscriptionEventSummary(eventData: string | null): string {
    if (!eventData) return '';
    const kv = this.parseHistoryEventData(eventData);
    // Look for common keys
    const find = (k: string) => kv.find(x => x.key.toLowerCase() === k.toLowerCase())?.value;
    const parts: string[] = [];
    const initialPayment = find('initialPayment') || find('initial_payment') || find('amount');
      const duration = find('days') || find('months') || find('duration');
    const reason = find('reason') || find('by');
    if (initialPayment) parts.push(this.translate.instant('adminBilling.subscription.summary.initialPayment', { amount: initialPayment }));
      if (duration) parts.push(this.translate.instant('adminBilling.subscription.summary.days', { days: duration }));
    if (reason) parts.push(this.translate.instant('adminBilling.subscription.summary.reason', { reason }));
    if (parts.length > 0) return parts.join(' — ');
    // fallback: show raw eventData (shortened)
    return eventData.length > 120 ? eventData.substring(0, 117) + '...' : eventData;
  }

  // Format an end reason for display in the tile: prefer parsing key=value pairs
  formatEndReason(reason: string | null | undefined): string {
    if (!reason) return 'Unknown reason';
    // If it's key=value pairs joined by commas, build a short summary
    if (reason.includes('=')) {
      const parts = reason.split(',').map(p => p.trim()).filter(p => p.length > 0);
      const kv: { k: string; v: string }[] = [];
      for (const p of parts) {
        const idx = p.indexOf('=');
        if (idx > 0) {
          kv.push({ k: p.substring(0, idx).trim(), v: p.substring(idx + 1).trim() });
        }
      }
      if (kv.length > 0) {
        const find = (k: string) => kv.find(x => x.k.toLowerCase() === k)?.v;
        const amount = find('initialPayment') || find('initial_payment') || find('amount');
        const days = find('days') || find('duration');
        const r = find('reason') || find('by');
        const partsOut: string[] = [];
        if (amount) partsOut.push(`Initial payment €${Number(amount).toFixed(2)}`);
        if (days) partsOut.push(`${days} day${Number(days) === 1 ? '' : 's'}`);
        if (r) partsOut.push(r);
        if (partsOut.length > 0) return partsOut.join(' — ');
        // fallback: join a couple of kvs
        return kv.slice(0, 2).map(x => `${x.k}: ${x.v}`).join(' — ');
      }
    }
    return reason;
  }

  // Human-friendly label for subscription status values
  subscriptionStatusLabel(status: string | null | undefined): string {
    if (!status) return this.translate.instant('adminBilling.subscription.status') || 'Status';
    switch ((status || '').toString().toUpperCase()) {
      case 'ACTIVE':
        return this.translate.instant('adminBilling.subscription.active') || 'Active';
      case 'CANCELLED':
      case 'CANCELED':
        return this.translate.instant('adminBilling.subscription.cancel') || 'Cancelled';
      case 'COMPLETED':
        return this.translate.instant('adminBilling.subscription.completed') || 'Completed';
      default:
        // fallback: capitalize
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    }
  }

  // CSS class for subscription status pill
  subscriptionStatusClass(status: string | null | undefined): string {
    if (!status) return 'status-unknown';
    const normalized = status.toString().toLowerCase();
    switch (normalized) {
      case 'active':
        return 'status-active';
      case 'cancelled':
      case 'canceled':
        return 'status-cancelled';
      case 'completed':
        return 'status-completed';
      default:
        return 'status-' + normalized.replace(/[^a-z0-9]+/g, '-');
    }
  }

  openSubscriptionDialog(): void {
    if (!this.memberId) return;
    const dialogRef = this.dialog.open(SubscriptionDialogComponent, {
      width: '420px',
      data: { initialPayment: '0.00', days: 30 }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      const initialPayment = parseFloat(result.initialPayment as any);
      const days = Number(result.days);
      if (isNaN(initialPayment) || isNaN(days) || days <= 0) { alert('Invalid input'); return; }
      this.adminService.createSubscription(this.memberId!, initialPayment, days).subscribe({
        next: () => { this.loadSubscriptionInfo(this.memberId!); this.loadReports(); },
        error: (err) => { console.error('Failed to create subscription', err); alert('Failed to create subscription: ' + (err?.error || err?.message || err)); }
      });
    });
  }

  openHistoryDialog(item: any): void {
    const dialogRef = this.dialog.open(SubscriptionHistoryDialogComponent, {
      width: '520px',
      data: {
        subscriptionId: item.subscriptionId || item.id,
        startDate: item.startDate,
        endDate: item.endDate,
        initialPayment: item.initialPayment,
        classesCompleted: item.classesCompleted || 0,
        endReason: item.endReason || item.reason || null
      }
    });
    dialogRef.afterClosed().subscribe(() => {});
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
