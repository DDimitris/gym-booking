export interface ClassType {
  id: number;
  name: string;
  description: string;
  trainerId: number | null; // renamed from instructorId
  isActive: boolean;
}
