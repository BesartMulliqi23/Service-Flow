export function getWeekStart(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();

    const daysSinceMonday = day === 0 ? 6 : day - 1; // Sunday = 0 in JS

    result.setDate(result.getDate() - daysSinceMonday);
    result.setHours(0, 0, 0, 0);

    return result;
}

export function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);

    return result;
}

export function getWeekDays(weekStart: Date): Date[] {
    return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

export function formatWeekRange(weekStart: Date): string {
    const weekEnd = addDays(weekStart, 6);

    const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
    const sameYear = weekStart.getFullYear() === weekEnd.getFullYear();

    if (sameMonth && sameYear) {
        const monthFormatter = new Intl.DateTimeFormat(undefined, {
            month: 'short'
        });

        const dayFormatter = new Intl.DateTimeFormat(undefined, {
            day: 'numeric'
        });

        const yearFormatter = new Intl.DateTimeFormat(undefined, {
            year: 'numeric'
        });

        return `${monthFormatter.format(weekStart)} ${dayFormatter.format(weekStart)}`
            + ` - ${dayFormatter.format(weekEnd)}, ${yearFormatter.format(weekEnd)}`;
    }

    if (sameYear) {
        const startFormatter = new Intl.DateTimeFormat(undefined, {
            month: 'short',
            day: 'numeric'
        });

        const endFormatter = new Intl.DateTimeFormat(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        return `${startFormatter.format(weekStart)} - ${endFormatter.format(weekEnd)}`;
    }

    const formatter = new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    return `${formatter.format(weekStart)} - ${formatter.format(weekEnd)}`;
}

export function formatDayName(date: Date): string {
    return new Intl.DateTimeFormat(undefined, {
        weekday: 'short'
    }).format(date);
}

export function formatDayNumber(date: Date): string {
    return new Intl.DateTimeFormat(undefined, {
        day: 'numeric'
    }).format(date);
}

export function formatTime(value: string): string {
    return new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(value));
}

export function isSameLocalDay(first: Date, second: Date): boolean {
    return (
        first.getFullYear() === second.getFullYear() &&
        first.getMonth() === second.getMonth() &&
        first.getDate() === second.getDate()
    );
}

export function overlapsDay(startUtc: string, endUtc: string, dayStart: Date): boolean {
    const workOrderStart = new Date(startUtc);
    const workOrderEnd = new Date(endUtc);
    const dayEnd = addDays(dayStart, 1);

    return workOrderStart < dayEnd && workOrderEnd > dayStart;
}