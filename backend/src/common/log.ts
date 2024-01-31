export function log(tag: string, ...msg: string[]) {
    console.log(`[${tag}] ${msg.join(' ')}`);
}