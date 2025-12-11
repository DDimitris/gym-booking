import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) { }

  createUser(user: User): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }

  updateUser(id: number, user: User): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getAllTrainers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/trainers`);
  }

  getAllMembers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/members`);
  }

  // Profile (me)
  getMe(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`);
  }

  // Member subscription endpoints (for current authenticated user)
  getMySubscription() {
    // Member-facing subscription endpoints live under /api/members
    return this.http.get<any>(`${environment.apiUrl}/members/me/subscription`);
  }

  getMySubscriptionHistory() {
    return this.http.get<any[]>(`${environment.apiUrl}/members/me/subscription/history`);
  }

  updateMe(payload: { name: string; avatarUrl?: string | null }): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/me`, payload);
  }
}