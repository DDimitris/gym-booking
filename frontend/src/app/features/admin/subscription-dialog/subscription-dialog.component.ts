import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';

export interface SubscriptionDialogData {
  initialPayment: string;
  months: number;
}

@Component({
  selector: 'app-subscription-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, TranslateModule],
  templateUrl: './subscription-dialog.component.html',
  styleUrls: ['./subscription-dialog.component.scss']
})
export class SubscriptionDialogComponent {
  dataModel: SubscriptionDialogData;

  constructor(
    public dialogRef: MatDialogRef<SubscriptionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SubscriptionDialogData
  ) {
    this.dataModel = { ...data };
  }

  cancel(): void {
    this.dialogRef.close();
  }

  submit(): void {
    // Basic validation
    const months = Number(this.dataModel.months);
    const initial = parseFloat(this.dataModel.initialPayment || '0');
    if (isNaN(months) || months <= 0) return;
    if (isNaN(initial) || initial < 0) return;
    this.dialogRef.close(this.dataModel);
  }
}
