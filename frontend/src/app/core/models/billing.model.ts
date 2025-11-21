export interface BillingEvent {
  id: number;
  userId: number;
  bookingId: number;
  amount: number;
  reason: string;
  eventDate: string;
  settled: boolean;
}

export interface BillingEventSummary {
  id: number;
  bookingId?: number;
  className?: string;
  instructorName?: string;
  classKind?: string;
  amount: number;
  reason: string;
  eventDate: string;
  settled: boolean;
  settlementType?: 'NONE' | 'PAYMENT' | 'BONUS';
}

export interface BillingReport {
  userId: number;
  userName: string;
  bonusDays: number;
  events: BillingEventSummary[];
}
