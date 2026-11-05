import { TITLE } from '@/constants/global';
import type { SearchQueryRequest, SearchResult } from '@/types/search';

/**
 * Utility function to extract the exposure ID from a resource path string.
 *
 * @param resourcePath The resource path string to extract the exposure ID from.
 * @returns The exposure ID as a number, or null if not found.
 */
export const getExposureIdFromResourcePath = (resourcePath: string): number | null => {
  const match = resourcePath.match(/\/exposure\/(\d+)\//);
  if (match?.[1]) {
    // match[1] contains the captured digits, which is the exposure ID.
    return Number(match[1]);
  }
  return null;
};

/**
 * Generate exposure page title from description or ID.
 *
 * @param description The description of the exposure, if available.
 * @param id The ID of the exposure, used as a fallback if description is not available.
 * @param withTitleSuffix When true, appends the site title suffix. Defaults to false.
 * @returns A string representing the title for the exposure page.
 */
export const generateExposureTitle = (
  description: string | null | undefined,
  id: number | null | undefined,
  withTitleSuffix = false,
): string => {
  let title: string;

  // Generic title if neither description nor ID is available.
  if (!description && !id) {
    title = 'Exposure Detail';
  } else if (description && description.trim() !== '') {
    // Title using description.
    title = description;
  } else {
    // Fallback title using ID.
    title = `Exposure ${id}`;
  }

  return withTitleSuffix ? `${title} – ${TITLE}` : title;
};

const findExposureFileTitle = (results: SearchResult[], file: string): string => {
  const match = results.find((result) => {
    const resourcePath = result.resource_path;
    const parts = resourcePath.split('/');
    const lastPart = parts[parts.length - 1];
    return lastPart === file;
  });
  return match?.data._title?.[0] || '';
};

/**
 * Resolve an exposure file title from search index results.
 *
 * @param alias Exposure alias used by the exposure_alias filter.
 * @param file Exposure file path from route or props.
 * @param searchQuery Function used to execute the search query.
 * @returns A resolved title string or empty string when unavailable.
 */
export const resolveExposureFileTitle = async (
  alias: string,
  file: string,
  searchQuery: (request: SearchQueryRequest) => Promise<SearchResult[]>,
): Promise<string> => {
  const results = await searchQuery({
    filters: [
      {
        kind: 'exposure_alias',
        term: alias,
      },
    ],
  });

  if (!Array.isArray(results)) {
    return '';
  }

  return findExposureFileTitle(results, file);
};
