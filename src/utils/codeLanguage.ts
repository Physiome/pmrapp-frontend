import {
  EXTENSION_LANGUAGE_MAP,
  FILENAME_LANGUAGE_MAP,
  MONACO_LANGUAGE_MAP,
} from '@/constants/codeLanguage';
import type { CodeLanguageId } from '@/types/codeLanguage';

/**
 * Detect the code viewer language from a filename.
 * @param filename - The filename, optionally including a path.
 * @returns The detected language, or null when the file should be shown as plain text.
 */
export const detectCodeLanguage = (filename: string): CodeLanguageId | null => {
  const basename = filename.split('/').pop() ?? '';
  const byFilename = FILENAME_LANGUAGE_MAP[basename.toLowerCase()];

  if (byFilename) return byFilename;

  const dotIndex = basename.lastIndexOf('.');

  if (dotIndex < 0) return null;

  const extension = basename.slice(dotIndex + 1).toLowerCase();
  return EXTENSION_LANGUAGE_MAP[extension] ?? null;
};

/**
 * Get the Monaco language ID for a code viewer language.
 * @param id - The code viewer language, or null for plain text.
 * @returns The Monaco language ID.
 */
export const toMonacoLanguage = (id: CodeLanguageId | null): string =>
  id ? MONACO_LANGUAGE_MAP[id] : 'plaintext';
