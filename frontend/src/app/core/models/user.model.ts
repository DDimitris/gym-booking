export interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    baseCost?: number;
    bonusDays?: number;
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