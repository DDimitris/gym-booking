import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GymClass } from '../models/gym-class.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GymClassService {
  private apiUrl = `${environment.apiUrl}/classes`;

  constructor(private http: HttpClient) { }

  createGymClass(gymClass: Partial<GymClass>): Observable<GymClass> {
    return this.http.post<GymClass>(this.apiUrl, gymClass);
  }

  updateGymClass(id: number, gymClass: Partial<GymClass>): Observable<GymClass> {
    return this.http.put<GymClass>(`${this.apiUrl}/${id}`, gymClass);
  }

  deleteGymClass(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getAllGymClasses(): Observable<GymClass[]> {
    return this.http.get<GymClass[]>(this.apiUrl);
  }

  getGymClassesByTrainer(trainerId: number): Observable<GymClass[]> {
    return this.http.get<GymClass[]>(`${this.apiUrl}/trainer/${trainerId}`);
  }

  // Backward-compatible helper while UI migrates
  getGymClassesByInstructor(instructorId: number): Observable<GymClass[]> {
    return this.getGymClassesByTrainer(instructorId);
  }

  // NOTE: Backend search endpoint removed; client-side filtering is used instead.
}