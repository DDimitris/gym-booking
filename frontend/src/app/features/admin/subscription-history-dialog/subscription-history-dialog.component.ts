import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';

export interface SubscriptionHistoryDialogData {
  subscriptionId: number;
  startDate: string | null;
  endDate: string | null;
  initialPayment: number | string | null;
  classesCompleted: number;
  endReason: string | null;
}

@Component({
  selector: 'app-subscription-history-dialog',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatButtonModule],
  template: `
    <div class="history-dialog">
      <h2>Subscription details</h2>
      <div class="row"><strong>Start date:</strong> <span>{{ data.startDate || '-' }}</span></div>
      <div class="row"><strong>End date:</strong> <span>{{ data.endDate || '-' }}</span></div>
      <div class="row"><strong>Initial payment:</strong> <span>€{{ (data.initialPayment != null) ? (data.initialPayment | number:'1.2-2') : '0.00' }}</span></div>
      <div class="row"><strong>Classes completed:</strong> <span>{{ data.classesCompleted }}</span></div>
      <div class="row"><strong>End reason:</strong> <span>{{ data.endReason ? (data.endReason | slice:0:200) : '-' }}</span></div>
      <div class="actions">
        <button mat-button (click)="dialogRef.close()">Close</button>
      </div>
    </div>
  `,
  styles: [
    `
    .history-dialog { padding: 16px; max-width: 480px; }
    .row { margin: 8px 0; display:flex; gap:10px; align-items:center }
    .row strong { width: 180px; }
    .actions { margin-top: 16px; text-align: right }
    @media (max-width: 480px) { .row strong { width: 120px; } }
  `
  ]
})
export class SubscriptionHistoryDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<SubscriptionHistoryDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SubscriptionHistoryDialogData
  ) {}
}
