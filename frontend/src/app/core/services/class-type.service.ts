import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ClassType } from '../models/class-type.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClassTypeService {
  private apiUrl = `${environment.apiUrl}/class-types`;

  constructor(private http: HttpClient) { }

  getActiveClassTypes(): Observable<ClassType[]> {
    return this.http.get<ClassType[]>(`${this.apiUrl}/active`);
  }

  getAllClassTypes(): Observable<ClassType[]> {
    return this.http.get<ClassType[]>(this.apiUrl);
  }

  getClassTypeById(id: number): Observable<ClassType> {
    return this.http.get<ClassType>(`${this.apiUrl}/${id}`);
  }

  createClassType(classType: ClassType): Observable<ClassType> {
    return this.http.post<ClassType>(this.apiUrl, classType);
  }

  updateClassType(id: number, classType: ClassType): Observable<ClassType> {
    return this.http.put<ClassType>(`${this.apiUrl}/${id}`, classType);
  }

  deleteClassType(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
