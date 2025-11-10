export interface GymClass {
    id: number;
    name: string;
    description: string;
    capacity: number;
    durationMinutes: number;
    instructorId: number | null;
    startTime: string;
    endTime: string;
    location: string;
    classTypeId: number;
    status: ClassStatus;
}

export enum ClassStatus {
    SCHEDULED = 'SCHEDULED',
    CANCELLED = 'CANCELLED',
    COMPLETED = 'COMPLETED'
}