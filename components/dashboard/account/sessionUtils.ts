export function formatSessionDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    const timeStr = date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });

    if (isToday) {
      return `Dzisiaj, ${timeStr}`;
    }
    if (isYesterday) {
      return `Wczoraj, ${timeStr}`;
    }

    return `${date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' })}, ${timeStr}`;
  } catch {
    return dateString;
  }
}
