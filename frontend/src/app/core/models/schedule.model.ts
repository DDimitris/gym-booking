export interface Schedule {
    id: number;
    gymClassId: number;
    startTime: string;
    endTime: string;
    isCancelled: boolean;
}