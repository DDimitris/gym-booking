import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ScrollPositionService {
  private positions = new Map<string, number>();

  set(key: string, position: number): void {
    this.positions.set(key, position);
  }

  get(key: string): number | null {
    return this.positions.has(key) ? this.positions.get(key)! : null;
  }

  clear(key: string): void {
    this.positions.delete(key);
  }
}
