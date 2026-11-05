import { describe, expect, it } from 'vitest';
import { TITLE } from '@/constants/global';
import { mockExposureInfo } from '@/mocks/exposureInfo';
import { generateExposureTitle, getExposureIdFromResourcePath } from './exposure';

describe('getExposureIdFromResourcePath', () => {
  it('extracts exposure ID from a valid resource path', () => {
    const id = mockExposureInfo.exposure.id;
    expect(getExposureIdFromResourcePath(`/exposure/${id}/some-resource`)).toBe(id);
  });

  it('returns null when no exposure ID is present', () => {
    expect(getExposureIdFromResourcePath('/workspace/682/file')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(getExposureIdFromResourcePath('')).toBeNull();
  });

  it('returns null for a path with non-numeric ID', () => {
    expect(getExposureIdFromResourcePath('/exposure/abc/')).toBeNull();
  });
});

describe('generateExposureTitle', () => {
  const { description, id } = mockExposureInfo.exposure;

  it('returns generic title when both description and id are null', () => {
    expect(generateExposureTitle(null, null)).toBe('Exposure Detail');
  });

  it('uses description from mock data', () => {
    expect(generateExposureTitle(description, id)).toBe(description);
  });

  it('accepts description with surrounding whitespace', () => {
    expect(generateExposureTitle('  My Exposure  ', id)).toBe('  My Exposure  ');
  });

  it('falls back to ID when description is null', () => {
    expect(generateExposureTitle(null, id)).toBe(`Exposure ${id}`);
  });

  it('falls back to ID when description is empty', () => {
    expect(generateExposureTitle('', id)).toBe(`Exposure ${id}`);
  });

  describe('with title suffix', () => {
    it('appends site title suffix when withTitleSuffix is true', () => {
      expect(generateExposureTitle(description, id, true)).toBe(`${description} – ${TITLE}`);
    });

    it('appends suffix with generic title', () => {
      expect(generateExposureTitle(null, null, true)).toBe(`Exposure Detail – ${TITLE}`);
    });

    it('appends suffix with ID fallback', () => {
      expect(generateExposureTitle(null, id, true)).toBe(`Exposure ${id} – ${TITLE}`);
    });
  });
});
