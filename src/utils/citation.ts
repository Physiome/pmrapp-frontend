import type { Author, Citation } from '@/types/citation';

/**
 * Parse a full author name into an Author object.
 *
 * If only one name is supplied it is treated as the family name.
 * If two names are supplied the first is the given name and the second is the family name.
 * If three or more names are supplied the first is the given name, the last is the family name
 * and the remainder is treated as other name.
 * @param fullName - The full name of the author as a single string.
 * @returns An Author object with family, given, and other name parts.
 * @example parseFullNameToAuthor("Jane Doe") // { given: "Jane", family: "Doe" }
 * @example parseFullNameToAuthor("John Michael Smith") // { given: "John", other: "Michael", family: "Smith" }
 * @example parseFullNameToAuthor("Madonna") // { family: "Madonna" }
 */
export function parseFullNameToAuthor(fullName: string): Author {
  const trimmedName = fullName.trim();

  if (!trimmedName) {
    return { family: '' };
  }

  const parts = trimmedName.split(/\s+/);

  if (parts.length === 1) {
    return { family: parts[0] };
  }

  if (parts.length === 2) {
    return { given: parts[0], family: parts[1] };
  }

  const given = parts[0];
  const family = parts[parts.length - 1];
  const other = parts.slice(1, -1).join(' ');

  return { family, given, other };
}

/**
 * Format an author name array to a readable string.
 * Author parts should be [lastName, firstName?, middleInitial?].
 * @param authorParts Array of name parts for one author.
 * @returns Formatted author name string.
 */
export const formatCitationAuthor = (authorParts: string[]): string => {
  if (authorParts.length >= 2) {
    const [lastName, firstName, middleInitial] = authorParts;
    return middleInitial
      ? `${firstName} ${middleInitial}. ${lastName}`
      : `${firstName} ${lastName}`;
  }
  return authorParts.join(' ');
};

export const formatIndividualAuthor = (author: Author): string => {
  const family = author.family || '';
  const given = author.given || '';
  const givenInitial = given ? `${given.charAt(0).toUpperCase()}.` : '';
  const otherInitials = author.other ? `${author.other.charAt(0).toUpperCase()}.` : '';
  const allInitials = [givenInitial, otherInitials].filter(Boolean).join(' ');
  return `${family}${allInitials ? `, ${allInitials}` : ''}`;
};

/**
 * Format a citation object to APA style citation string.
 * Format: Authors (Year). Title. Journal, Volume, Pages.
 * @param citation Citation object.
 * @returns APA formatted citation string.
 */
export const formatCitation = (citation: Citation): string => {
  const parts: string[] = [];

  const authorStrings =
    citation.authors && Array.isArray(citation.authors)
      ? citation.authors.map(formatIndividualAuthor).filter(Boolean)
      : [];

  const year = citation.issued?.trim().split('-')[0];
  const yearPart = year ? `(${year}).` : '';
  const title = citation.title?.trim();
  const titlePart = title ? ensureSentence(title) : '';

  if (authorStrings.length > 0) {
    const authorSection =
      authorStrings.length === 1
        ? authorStrings[0]
        : authorStrings.length === 2
          ? `${authorStrings[0]}, & ${authorStrings[1]}`
          : `${authorStrings.slice(0, -1).join(', ')}, & ${authorStrings[authorStrings.length - 1]}`;

    parts.push(/[.!?]$/.test(authorSection) ? authorSection : `${authorSection}.`);

    if (yearPart) {
      parts.push(yearPart);
    }

    if (titlePart) {
      parts.push(titlePart);
    }
  } else {
    if (titlePart) {
      parts.push(titlePart);
      if (yearPart) {
        parts.push(yearPart);
      }
    } else if (yearPart) {
      parts.push(yearPart);
    }
  }

  if (citation.journal) {
    if (citation.volume || citation.first_page || citation.last_page) {
      parts.push(`${citation.journal},`);
    } else {
      parts.push(ensureSentence(citation.journal));
    }
  }

  if (citation.volume) {
    let volumeSection = citation.volume;
    if (citation.first_page && citation.last_page) {
      volumeSection += `, ${citation.first_page}-${citation.last_page}`;
    } else if (citation.first_page) {
      volumeSection += `, ${citation.first_page}`;
    }
    parts.push(`${volumeSection}.`);
  } else if (citation.first_page && citation.last_page) {
    parts.push(`${citation.first_page}-${citation.last_page}.`);
  } else if (citation.first_page) {
    parts.push(`${citation.first_page}.`);
  }

  if (citation.publisher) {
    parts.push(ensureSentence(citation.publisher));
  }

  if (citation.url) {
    const normalisedUrl = normaliseUrl(citation.url);
    const anchorTag = `<a href="${normalisedUrl}" target="_blank" rel="noopener noreferrer">${normalisedUrl}</a>`;
    parts.push(anchorTag);
  }

  return parts.filter(Boolean).join(' ');
};

/**
 * Ensure a string ends with sentence punctuation.
 * @param value Input string.
 * @returns Trimmed sentence with trailing punctuation.
 */
export const ensureSentence = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
};

/**
 * Remove query and hash from a URL for cleaner citation output.
 * @param url URL string.
 * @returns normalised URL string.
 */
export const normaliseUrl = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed) return '';

  try {
    const parsed = new URL(trimmed);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }

    parsed.search = '';
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return '';
  }
};
