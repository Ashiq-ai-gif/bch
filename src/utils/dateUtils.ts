import { format, differenceInDays, startOfDay } from "date-fns";

export const getTodayDate = (): string => {
    return format(new Date(), "yyyy-MM-dd");
};

export const formatDayDisplay = (date: Date): string => {
    return format(date, "EEEE, MMMM do, yyyy");
};

export const calculateDayCount = (startDate: string): number => {
    const start = startOfDay(new Date(startDate));
    const current = startOfDay(new Date());
    // Add 1 to include the first day
    return Math.max(1, differenceInDays(current, start) + 1);
};
