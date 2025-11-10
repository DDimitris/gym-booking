export interface Booking {
    id: number;
    userId: number;
    userName?: string;
    classInstanceId: number;
    status: BookingStatus;
    bookedAt?: string;
    cancelledAt?: string;
    completedAt?: string;
}

export enum BookingStatus {
    BOOKED = 'BOOKED',
    COMPLETED = 'COMPLETED',
    CANCELLED_BY_USER = 'CANCELLED_BY_USER',
    CANCELLED_BY_GYM = 'CANCELLED_BY_GYM',
    NO_SHOW = 'NO_SHOW'
}