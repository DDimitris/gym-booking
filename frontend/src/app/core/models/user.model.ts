export interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    bonusDays?: number;
    groupBaseCost?: number;
    smallGroupBaseCost?: number;
    personalBaseCost?: number;
    openGymBaseCost?: number;
    status?: UserStatus;
}

export enum UserRole {
    ADMIN = 'ADMIN',
    TRAINER = 'TRAINER',
    MEMBER = 'MEMBER'
}

export enum UserStatus {
    ACTIVE = 'ACTIVE',
    SUSPENDED = 'SUSPENDED',
    DELETED = 'DELETED'
}