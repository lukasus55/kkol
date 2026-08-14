/**
 * Convert any url (youtube.com) from potentialy relative url (kkol.pl/youtube.com) to absolute url (https://youtube.com)
 * @param {string} url Any url (url that is already absolute will return itself)
 * @returns Absolute url (https://youtube.com)
 */
export function ensureAbsoluteUrl(url: string): string {
    if (!url) return '';

    if (/^https?:\/\//i.test(url)) {
        return url;
    }
    
    return `https://${url}`;
}
