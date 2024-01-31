/**
 * Get the start of the week.
 * @param offset How many weeks ahead or behind to calculate
 * @returns A date with the start of the week
 */
export function getStartOfWeek(offset: number = 0) {
    let d = new Date(Date.now() + 24 * 3600 * 1000 * 7 * offset);
    const day = d.getDay();

    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setHours(0, 0, 0, 0);
    d.setDate(diff)

    return d;
}

export function chunk(arr: any[], chunkSize: number) {
    var R = [];
    for (var i = 0; i < arr.length; i += chunkSize)
        R.push(arr.slice(i, i + chunkSize));
    return R;
};

/**
 * Formats an API route with specified parameters.
 * @param path The path to format
 * @param params The params to format using
 * @returns The formatted path
 */
export function formatApiRoute(path: string, params: { [key: string]: any }): string {
    let result = path;
    for (const key in params) {
        result = result.replaceAll(`{${key}}`, params[key]);
    }

    return result;
}