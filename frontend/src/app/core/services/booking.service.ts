import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Booking } from '../models/booking.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private apiUrl = `${environment.apiUrl}/bookings`;

  constructor(private http: HttpClient) { }

  // When authenticated with Keycloak, backend derives the current user from JWT; only pass classInstanceId
  createBooking(classInstanceId: number): Observable<Booking> {
    return this.http.post<Booking>(this.apiUrl, null, {
      params: { classInstanceId: classInstanceId.toString() }
    });
  }

  // Admin/Instructor booking on behalf of a user
  createBookingForUser(classInstanceId: number, userId: number): Observable<Booking> {
    return this.http.post<Booking>(this.apiUrl, null, {
      params: { classInstanceId: classInstanceId.toString(), userId: userId.toString() }
    });
  }

  cancelBooking(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/cancel`, {});
  }

  completeBooking(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/complete`, {});
  }

  getUserBookings(userId: number): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.apiUrl}/user/${userId}`);
  }

  // Authenticated user's bookings (backend derives user from JWT)
  getMyBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.apiUrl}/me`);
  }

  getClassBookings(classInstanceId: number): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.apiUrl}/class/${classInstanceId}`);
  }

  getClassBookingsCount(classInstanceId: number): Observable<number> {
    return this.http.get<{count: number}>(`${this.apiUrl}/class/${classInstanceId}/count`).pipe(
      // map response to just the count number
      (source => new Observable<number>(subscriber => {
        const sub = source.subscribe({
          next: (res) => { subscriber.next(res.count ?? 0); subscriber.complete(); },
          error: (err) => subscriber.error(err)
        });
        return () => sub.unsubscribe();
      }))
    );
  }
}