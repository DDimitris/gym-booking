import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Schedule } from '../models/schedule.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private apiUrl = `${environment.apiUrl}/schedules`;

  constructor(private http: HttpClient) { }

  createSchedule(schedule: Schedule): Observable<Schedule> {
    return this.http.post<Schedule>(this.apiUrl, schedule);
  }

  cancelSchedule(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/cancel`, {});
  }

  getSchedules(start: Date, end: Date): Observable<Schedule[]> {
    const params = new HttpParams()
      .set('start', start.toISOString())
      .set('end', end.toISOString());

    return this.http.get<Schedule[]>(this.apiUrl, { params });
  }

  getTrainerSchedules(trainerId: number, start: Date, end: Date): Observable<Schedule[]> {
    const params = new HttpParams()
      .set('start', start.toISOString())
      .set('end', end.toISOString());

    return this.http.get<Schedule[]>(`${this.apiUrl}/trainer/${trainerId}`, { params });
  }

  getClassSchedules(classId: number): Observable<Schedule[]> {
    return this.http.get<Schedule[]>(`${this.apiUrl}/class/${classId}`);
  }
}