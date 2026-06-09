/**
 * Helper function to determine the correct Polish plural form.
 * @param {number} value - The time count
 * @param {string} form1 - Singular (e.g., 1 godzina)
 * @param {string} form2 - Plural nominative (e.g., 2, 3, 4, 22 godziny)
 * @param {string} form3 - Plural genitive (e.g., 5, 6, 11, 12 godzin)
 * @returns {string} The correctly inflected word
 */
export function getPolishPlural(value, form1, form2, form3) {
    if (value === 1) return form1;

    const mod10 = value % 10;
    const mod100 = value % 100;

    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
        return form2;
    }

    return form3;
}

/**
 * Formats a TIMESTAMPTZ into a relative time string in Polish.
 * @param {string|Date} timestamp - The ISO 8601 string or Date object
 * @param {boolean} [includePrefixSuffix=true] - Whether to include "za" or "temu"
 * @returns {string} Relative time in Polish
 */
export function formatRelativeTimePL(timestamp, includePrefixSuffix = true) {
    const date = new Date(timestamp);
    const now = new Date();

    const diffMs = date.getTime() - now.getTime();
    const isFuture = diffMs > 0;

    const diffSec = Math.floor(Math.abs(diffMs) / 1000);

    if (diffSec < 1) {
        return 'przed chwilą';
    }

    const intervals = [
        { seconds: 31536000, labels: ['rok', 'lata', 'lat'] },
        { seconds: 2592000, labels: ['miesiąc', 'miesiące', 'miesięcy'] },
        { seconds: 86400, labels: ['dzień', 'dni', 'dni'] },
        { seconds: 3600, labels: ['godzina', 'godziny', 'godzin'] },
        { seconds: 60, labels: ['minuta', 'minuty', 'minut'] },
        { seconds: 1, labels: ['sekunda', 'sekundy', 'sekund'] }
    ];

    for (const interval of intervals) {
        const count = Math.floor(diffSec / interval.seconds);

        if (count >= 1) {
            const word = getPolishPlural(count, interval.labels[0], interval.labels[1], interval.labels[2]);
            const basePhrase = `${count} ${word}`;

            if (!includePrefixSuffix) {
                return basePhrase;
            }

            return isFuture ? `za ${basePhrase}` : `${basePhrase} temu`;
        }
    }
}

// format dates for HTML inputs (YYYY-MM-DDTHH:MM)
export function formatForDateTimeInput(input) {
    if (!input) return '';

    const dateObj = typeof input === 'string' ? new Date(input) : input;

    if (!(dateObj instanceof Date) || isNaN(dateObj)) return '';

    // Adjusts for local timezone offset before slicing
    const tzOffset = dateObj.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(dateObj - tzOffset)).toISOString().slice(0, 16);
    
    return localISOTime;
}