import { describe, expect, it } from 'vitest'
import {
  ensureSentence,
  formatCitation,
  formatCitationAuthor,
  formatIndividualAuthor,
  normaliseUrl,
  parseFullNameToAuthor,
} from './citation'

describe('parseFullNameToAuthor', () => {
  it('parses a single name as family name', () => {
    expect(parseFullNameToAuthor('Madonna')).toEqual({ family: 'Madonna' })
  })

  it('parses two names as given and family', () => {
    expect(parseFullNameToAuthor('Jane Doe')).toEqual({ given: 'Jane', family: 'Doe' })
  })

  it('parses three names as given, other, and family', () => {
    expect(parseFullNameToAuthor('John Michael Smith')).toEqual({
      given: 'John',
      other: 'Michael',
      family: 'Smith',
    })
  })

  it('parses four names as given, other (multiple), and family', () => {
    expect(parseFullNameToAuthor('John Michael David Smith')).toEqual({
      given: 'John',
      other: 'Michael David',
      family: 'Smith',
    })
  })

  it('handles leading and trailing whitespace', () => {
    expect(parseFullNameToAuthor('  Jane Doe  ')).toEqual({ given: 'Jane', family: 'Doe' })
  })

  it('handles multiple spaces between names', () => {
    expect(parseFullNameToAuthor('Jane    Marie    Doe')).toEqual({
      given: 'Jane',
      other: 'Marie',
      family: 'Doe',
    })
  })

  it('returns empty family name for empty string', () => {
    expect(parseFullNameToAuthor('')).toEqual({ family: '' })
  })

  it('returns empty family name for whitespace-only string', () => {
    expect(parseFullNameToAuthor('   ')).toEqual({ family: '' })
  })
})

describe('formatCitationAuthor', () => {
  it('formats author with lastname and firstname', () => {
    expect(formatCitationAuthor(['Doe', 'Jane'])).toBe('Jane Doe')
  })

  it('formats author with lastname, firstname, and middle initial', () => {
    expect(formatCitationAuthor(['Doe', 'Jane', 'M'])).toBe('Jane M. Doe')
  })

  it('returns single part as is', () => {
    expect(formatCitationAuthor(['Madonna'])).toBe('Madonna')
  })

  it('only uses first 3 elements when array has more than 3 elements', () => {
    expect(formatCitationAuthor(['Doe', 'Jane', 'M', 'Extra'])).toBe('Jane M. Doe')
  })

  it('handles empty array', () => {
    expect(formatCitationAuthor([])).toBe('')
  })
})

describe('formatIndividualAuthor', () => {
  it('formats author with family and given name', () => {
    expect(formatIndividualAuthor({ family: 'Doe', given: 'Jane' })).toBe('Doe, J.')
  })

  it('formats author with family, given, and other name', () => {
    expect(formatIndividualAuthor({ family: 'Smith', given: 'John', other: 'Michael' })).toBe(
      'Smith, J. M.',
    )
  })

  it('formats author with only family name', () => {
    expect(formatIndividualAuthor({ family: 'Madonna' })).toBe('Madonna')
  })

  it('formats author with empty given name', () => {
    expect(formatIndividualAuthor({ family: 'Doe', given: '' })).toBe('Doe')
  })

  it('formats author with empty other name', () => {
    expect(formatIndividualAuthor({ family: 'Doe', given: 'Jane', other: '' })).toBe('Doe, J.')
  })

  it('handles author with all empty properties', () => {
    expect(formatIndividualAuthor({ family: '', given: '', other: '' })).toBe('')
  })
})

describe('ensureSentence', () => {
  it('adds period to sentence without punctuation', () => {
    expect(ensureSentence('This is a sentence')).toBe('This is a sentence.')
  })

  it('does not add period if sentence ends with period', () => {
    expect(ensureSentence('This is a sentence.')).toBe('This is a sentence.')
  })

  it('does not add period if sentence ends with question mark', () => {
    expect(ensureSentence('Is this a sentence?')).toBe('Is this a sentence?')
  })

  it('does not add period if sentence ends with exclamation mark', () => {
    expect(ensureSentence('This is a sentence!')).toBe('This is a sentence!')
  })

  it('trims leading and trailing whitespace', () => {
    expect(ensureSentence('  This is a sentence  ')).toBe('This is a sentence.')
  })

  it('returns empty string for empty input', () => {
    expect(ensureSentence('')).toBe('')
  })

  it('returns empty string for whitespace-only input', () => {
    expect(ensureSentence('   ')).toBe('')
  })
})

describe('normaliseUrl', () => {
  it('removes query parameters from URL', () => {
    expect(normaliseUrl('https://example.com/article?query=1')).toBe('https://example.com/article')
  })

  it('removes hash from URL', () => {
    expect(normaliseUrl('https://example.com/article#section')).toBe('https://example.com/article')
  })

  it('removes both query and hash from URL', () => {
    expect(normaliseUrl('https://example.com/article?query=1#section')).toBe(
      'https://example.com/article',
    )
  })

  it('handles HTTP protocol', () => {
    expect(normaliseUrl('http://example.com/article?query=1#section')).toBe(
      'http://example.com/article',
    )
  })

  it('returns empty string for invalid protocol', () => {
    expect(normaliseUrl('ftp://example.com/article')).toBe('')
  })

  it('trims whitespace from URL', () => {
    expect(normaliseUrl('  https://example.com/article  ')).toBe('https://example.com/article')
  })

  it('returns empty string for empty input', () => {
    expect(normaliseUrl('')).toBe('')
  })

  it('returns empty string for whitespace-only input', () => {
    expect(normaliseUrl('   ')).toBe('')
  })

  it('returns empty string for malformed URL', () => {
    expect(normaliseUrl('not a url')).toBe('')
  })

  it('preserves path in URL', () => {
    expect(normaliseUrl('https://example.com/path/to/article?query=1#section')).toBe(
      'https://example.com/path/to/article',
    )
  })

  it('preserves URL with special characters %20 for spaces', () => {
    expect(
      normaliseUrl(
        'http://localhost:5173/pmrapp-frontend/exposure/d6a/mapclient%20workflow/Argon_Viewer-previous-docs/document_whole_body.json',
      ),
    ).toBe(
      'http://localhost:5173/pmrapp-frontend/exposure/d6a/mapclient%20workflow/Argon_Viewer-previous-docs/document_whole_body.json',
    )
  })
})

describe('formatCitation', () => {
  it('formats a complete citation with authors, year, title, journal, volume, pages, publisher, and URL', () => {
    const citation = {
      authors: [
        { family: 'Doe', given: 'Jane' },
        { family: 'Smith', given: 'John' },
      ],
      issued: '2024-05-20',
      title: 'Example research article',
      journal: 'Journal of Testing',
      volume: '12',
      first_page: '34',
      last_page: '56',
      publisher: 'Test Publisher',
      url: 'https://example.com/article?query=1#section',
    }

    expect(formatCitation(citation)).toBe(
      `Doe, J., & Smith, J. (2024). Example research article. Journal of Testing, 12, 34-56. Test Publisher. ` +
        `<a href="https://example.com/article" target="_blank" rel="noopener noreferrer">https://example.com/article</a>`,
    )
  })

  it('places title before year when no author is provided', () => {
    const citation = {
      issued: '2023-01-01',
      title: 'An anonymous study',
      journal: 'Journal of Anonymous Research',
    }

    expect(formatCitation(citation)).toBe(
      'An anonymous study. (2023). Journal of Anonymous Research.',
    )
  })

  it('places year after title when there is no author and only issued and title are present', () => {
    const citation = {
      issued: '2022-12-31',
      title: 'Title without author',
    }

    expect(formatCitation(citation)).toBe('Title without author. (2022).')
  })

  it('formats year and title correctly when author list is missing but title exists', () => {
    const citation = {
      issued: '2021',
      title: 'Missing author, present title',
    }

    expect(formatCitation(citation)).toBe('Missing author, present title. (2021).')
  })

  it('formats author with only family name and title', () => {
    const citation = {
      issued: '2020-07-15',
      title: 'Only family name author',
      authors: [{ family: 'Doe' }],
    }

    expect(formatCitation(citation)).toBe('Doe. (2020). Only family name author.')
  })

  it('formats year only when author and title are both missing', () => {
    const citation = {
      issued: '2020-07-15',
    }

    expect(formatCitation(citation)).toBe('(2020).')
  })
})
