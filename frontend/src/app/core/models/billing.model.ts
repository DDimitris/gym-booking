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
  amount: number;
  reason: string;
  eventDate: string;
  settled: boolean;
}

export interface BillingReport {
  userId: number;
  userName: string;
  baseCost: number;
  bonusDays: number;
  totalOwed: number;
  events: BillingEventSummary[];
}
