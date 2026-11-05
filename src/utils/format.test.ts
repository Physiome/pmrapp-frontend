import { describe, expect, it } from 'vitest';
import {
  formatDate,
  formatFileCount,
  formatKindLabel,
  formatNumber,
  formatSearchKey,
  formatYear,
} from './format';

describe('formatNumber', () => {
  it('returns formatted number', () => {
    const results = formatNumber(1234567);

    expect(results).toBe('1,234,567');
  });
});

describe('formatDate', () => {
  it('returns formatted date', () => {
    const results = formatDate(1704499200);

    expect(results).toBe('6 January 2024');
  });
});

describe('formatYear', () => {
  it('returns formatted year only', () => {
    const results = formatYear(1704499200);

    expect(results).toBe('2024');
  });
});

describe('formatFileCount', () => {
  it('returns formatted file count for 1 item', () => {
    const results = formatFileCount(1);

    expect(results).toBe('1 item');
  });

  it('returns formatted file count for more than 1', () => {
    const results = formatFileCount(1234);

    expect(results).toBe('1,234 items');
  });

  it('returns formatted file count for zero', () => {
    const results = formatFileCount(0);

    expect(results).toBe('');
  });

  it('returns formatted file count for undefined', () => {
    const results = formatFileCount(undefined);

    expect(results).toBe('');
  });

  it('returns formatted file count for null', () => {
    const results = formatFileCount(null);

    expect(results).toBe('');
  });
});

describe('formatSearchKey', () => {
  it('returns formatted search key for normal string', () => {
    const results = formatSearchKey('Cells');

    expect(results).toBe(
      '<span class="text-gray-700 dark:text-gray-200 font-semibold">Cells</span>',
    );
  });

  it('returns formatted and escaped HTML for HTML tag string', () => {
    const results = formatSearchKey('<h1>Cells</h1>');

    expect(results).toBe(
      '<span class="text-gray-700 dark:text-gray-200 font-semibold">&lt;h1&gt;Cells&lt;/h1&gt;</span>',
    );
  });

  it('returns formatted and escaped HTML for script tag with quotes', () => {
    const results = formatSearchKey('<script>alert("hello")</script>');

    expect(results).toBe(
      '<span class="text-gray-700 dark:text-gray-200 font-semibold">&lt;script&gt;alert(&quot;hello&quot;)&lt;/script&gt;</span>',
    );
  });
});

describe('formatKindLabel', () => {
  it('returns formatted kind label for normal string', () => {
    const results = formatKindLabel('Cells');

    expect(results).toBe('<span class="text-gray-600 dark:text-gray-300">Cells</span>');
  });
});
