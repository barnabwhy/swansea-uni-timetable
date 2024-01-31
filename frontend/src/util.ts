export function getStartOfWeek(offset: number = 0) {
    let d = new Date(Date.now() + 24 * 3600 * 1000 * 7 * offset);
    const day = d.getDay();

    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setHours(0, 0, 0, 0);
    d.setDate(diff)

    return d;
}

export async function waitFor<T>(ms: number, res: T): Promise<T> {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(res);
        }, ms);
    })
}

export function formatTime(dateStr: string) {
    let d = new Date(dateStr);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}