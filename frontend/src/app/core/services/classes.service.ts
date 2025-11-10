import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface GymClass {
  id: string;
  name: string;
  description?: string;
  dateTime: string;
  durationMinutes: number;
  capacity?: number;
  trainerId?: string;
  trainer?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClassesService {
  constructor(private http: HttpClient) {}

  getClasses(): Observable<GymClass[]> {
    return this.http.get<GymClass[]>('/api/classes');
  }

  createClass(gymClass: GymClass): Observable<GymClass> {
    return this.http.post<GymClass>('/api/classes', gymClass);
  }

  updateClass(id: string, gymClass: GymClass): Observable<GymClass> {
    return this.http.put<GymClass>(`/api/classes/${id}`, gymClass);
  }

  deleteClass(id: string): Observable<void> {
    return this.http.delete<void>(`/api/classes/${id}`);
  }
}
