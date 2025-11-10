import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';

export type Role = 'ADMIN' | 'TRAINER' | 'MEMBER';

export interface TestUser {
  id: number;
  username: string;
  password: string;
  displayName: string;
  email: string;
  role: Role;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private users: TestUser[] = [
    { id: 1, username: 'admin', password: 'admin', displayName: 'Admin User', email: 'admin@gym.com', role: 'ADMIN' },
  { id: 2, username: 'trainer', password: 'trainer', displayName: 'Trainer Smith', email: 'trainer@gym.com', role: 'TRAINER' },
  { id: 3, username: 'member', password: 'member', displayName: 'Member Jones', email: 'member@gym.com', role: 'MEMBER' }
  ];

  private currentUserSubject = new BehaviorSubject<TestUser | null>(this.loadFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  async init(): Promise<boolean> {
    return true;
  }

  login(username: string, password: string): boolean {
    const user = this.users.find(u => u.username === username && u.password === password);
    if (user) {
      this.setUser(user);
      return true;
    }
    return false;
  }

  loginAs(username: string): void {
    const user = this.users.find(u => u.username === username);
    if (user) {
      this.setUser(user);
    }
  }

  async logout(): Promise<void> {
    localStorage.removeItem('mock_user');
    this.currentUserSubject.next(null);
  }

  async isLoggedIn(): Promise<boolean> {
    return !!this.currentUserSubject.value;
  }

  getUser(): TestUser | null {
    return this.currentUserSubject.value;
  }

  getUsers(): TestUser[] {
    return [...this.users];
  }

  getUsername(): string {
    return this.currentUserSubject.value?.username || '';
  }

  getUserProfile(): Observable<any> {
    const user = this.currentUserSubject.value;
    if (user) {
      return of({
        username: user.username,
        email: user.email,
        firstName: user.displayName.split(' ')[0],
        lastName: user.displayName.split(' ')[1] || ''
      });
    }
    return of(null);
  }

  getRoles(): string[] {
    const user = this.currentUserSubject.value;
    return user ? [user.role] : [];
  }

  hasRole(role: string): boolean {
    return this.getRoles().includes(role);
  }

  getToken(): string {
    return '';
  }

  private setUser(user: TestUser): void {
    localStorage.setItem('mock_user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private loadFromStorage(): TestUser | null {
    try {
      const raw = localStorage.getItem('mock_user');
      return raw ? JSON.parse(raw) as TestUser : null;
    } catch {
      return null;
    }
  }
}