import plist from "simple-plist";

interface INSKeyedArchive {
    "$version": number;
    "$archiver": "NSKeyedArchiver";
    "$top": unknown;

    // Meat
    "$objects": Array<"$null" | { [key: string]: number | boolean | unknown }>;
}

interface INaiveRecurrence {
    // firstDayOfTheWeek: number;
    // nthWeekDaysOfTheMonth: unknown;
    // monthsOfTheYear: unknown;
    // recurrenceType: number;
    // daysOfTheWeek: unknown;
    // recurrenceInterval: number;
    // recurrenceEnd: unknown;
    // repeatAfterCompletion: boolean;
    // daysOfTheMonth: unknown;
    // nextStartDate: unknown;
    // timeIntervalBetweenStartAndDueDates: number;
    // hasDueDate: boolean;
}

export function parseRecurrenceBuffer(bplist: Buffer): INaiveRecurrence {
    const data = plist.parse(bplist) as INSKeyedArchive;
    console.log(JSON.stringify(data));
    data.$objects.forEach((obj) => {
        console.log(obj);
    })

    return {
    };
}