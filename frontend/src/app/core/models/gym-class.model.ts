export interface GymClass {
    id: number;
    name: string;
    description: string;
    capacity: number;
    durationMinutes: number;
    trainerId: number | null; // renamed from instructorId
    startTime: string;
    endTime: string;
    location: string;
    classTypeId: number;
    status: ClassStatus;
    kind: ClassKind;
}

export enum ClassStatus {
    SCHEDULED = 'SCHEDULED',
    CANCELLED = 'CANCELLED',
    COMPLETED = 'COMPLETED'
}

export enum ClassKind {
    GROUP = 'GROUP',
    SMALL_GROUP = 'SMALL_GROUP',
    PERSONAL = 'PERSONAL',
    OPEN_GYM = 'OPEN_GYM'
}