import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';
import { BillingReport } from '../models/billing.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) { }

  // Athlete Management
  getAllMembers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/members`);
  }

  assignBonusDays(userId: number, bonusDays: number): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/members/${userId}/bonus-days`, null, {
      params: { bonusDays: bonusDays.toString() }
    });
  }

  promoteToTrainer(userId: number): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/members/${userId}/promote-to-trainer`, {});
  }

  setMemberBaseCosts(userId: number, costs: {
    groupBaseCost?: number;
    smallGroupBaseCost?: number;
    personalBaseCost?: number;
    openGymBaseCost?: number;
  }): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/members/${userId}/base-costs`, costs);
  }

  // Billing Reports
  getMemberReport(userId: number, startDate?: string, endDate?: string): Observable<BillingReport> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', this.toStartOfDayDateTime(startDate));
    if (endDate) params = params.set('endDate', this.toEndOfDayDateTime(endDate));
    return this.http.get<BillingReport>(`${this.apiUrl}/billing/member/${userId}`, { params });
  }

  // Backwards compatibility while we finish renaming across the app
  getAthleteReport(userId: number, startDate?: string, endDate?: string): Observable<BillingReport> {
    return this.getMemberReport(userId, startDate, endDate);
  }

  getAllBillingEvents(startDate?: string, endDate?: string): Observable<BillingReport[]> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', this.toStartOfDayDateTime(startDate));
    if (endDate) params = params.set('endDate', this.toEndOfDayDateTime(endDate));
    return this.http.get<BillingReport[]>(`${this.apiUrl}/billing/all`, { params });
  }

  // Billing: mark events settled
  settleBillingEvents(eventIds: number[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/billing/settle`, eventIds);
  }

  settleBillingEventAsPayment(eventId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/billing/events/${eventId}/settle/payment`, {});
  }

  settleBillingEventAsBonus(eventId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/billing/events/${eventId}/settle/bonus`, {});
  }

  // Instructors
  getTrainers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/trainers`);
  }

  // Server-side search for users (by name or email)
  searchUsers(query: string): Observable<User[]> {
    const params = new HttpParams().set('query', query);
    return this.http.get<User[]>(`${this.apiUrl}/users/search`, { params });
  }

  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${userId}`);
  }

  // Subscriptions
  createSubscription(userId: number, initialPayment: number, months: number) {
    return this.http.post<any>(`${this.apiUrl}/members/${userId}/subscription`, { initialPayment, months });
  }

  getActiveSubscription(userId: number) {
    return this.http.get<any>(`${this.apiUrl}/members/${userId}/subscription`);
  }

  getSubscriptionHistory(userId: number) {
    return this.http.get<any[]>(`${this.apiUrl}/members/${userId}/subscription/history`);
  }

  cancelSubscription(userId: number, subscriptionId: number, reason?: string) {
    const params = reason ? { params: { reason } } : {} as any;
    return this.http.post<void>(`${this.apiUrl}/members/${userId}/subscription/${subscriptionId}/cancel`, null, params);
  }

  // Ensure backend receives ISO DATE_TIME (LocalDateTime) strings
  private toStartOfDayDateTime(date?: string): string {
    if (!date) return '';
    // If already contains time component, return as-is
    if (date.includes('T')) return date;
    return `${date}T00:00:00`;
  }

  private toEndOfDayDateTime(date?: string): string {
    if (!date) return '';
    if (date.includes('T')) return date;
    return `${date}T23:59:59`;
  }
}
