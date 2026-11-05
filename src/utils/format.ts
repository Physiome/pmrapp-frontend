/**
 * Format a number with comma separators for thousands.
 * @param num - The number to format.
 * @returns Formatted string with comma separators.
 * @example formatNumber(1234567) // "1,234,567".
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-NZ');
}

/**
 * Format a Unix timestamp to a readable date string.
 * @param timestamp - Unix timestamp in seconds.
 * @returns Formatted date string (e.g., "5 January 2026").
 * @example formatDate(1704499200) // "6 January 2024".
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-NZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a Unix timestamp to a year string.
 * @param timestamp - Unix timestamp in seconds.
 * @returns Four-digit year string (e.g., "2026").
 * @example formatYear(1704499200) // "2024".
 */
export function formatYear(timestamp: number): string {
  return new Date(timestamp * 1000).getFullYear().toString();
}

/**
 * Format a file count with formatting.
 * Returns empty string if count is zero, negative, or falsy.
 * @param count - The number of files/items.
 * @returns Formatted string like "1,234 items" or empty string if count is invalid.
 * @example formatFileCount(1) // "1 item".
 * @example formatFileCount(1234) // "1,234 items".
 * @example formatFileCount(0) // "".
 */
export function formatFileCount(count: number | undefined | null): string {
  if (!count || count <= 0) return '';
  const formatted = formatNumber(count);
  return `${formatted} ${count === 1 ? 'item' : 'items'}`;
}

const escapeHtml = (value: string): string => {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
};

export function formatSearchKey(key: string): string {
  const safeKey = escapeHtml(key);
  return `<span class="text-gray-700 dark:text-gray-200 font-semibold">${safeKey}</span>`;
}

export function formatKindLabel(label: string): string {
  const safeLabel = escapeHtml(label);
  return `<span class="text-gray-600 dark:text-gray-300">${safeLabel}</span>`;
}
