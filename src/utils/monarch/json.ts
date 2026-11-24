import type { languages } from 'monaco-editor/editor/editor.api';

/**
 * Editor behaviour for JSON: brackets.
 */
export const jsonConfiguration: languages.LanguageConfiguration = {
  brackets: [
    ['{', '}'],
    ['[', ']'],
  ],
};

/**
 * Monarch tokenizer for JSON. Monaco's own JSON support is a full language service with a worker,
 * which is much larger than a read-only viewer needs.
 */
export const jsonLanguage: languages.IMonarchLanguage = {
  defaultToken: '',
  tokenPostfix: '.json',

  tokenizer: {
    root: [
      // A string followed by a colon is a property name.
      [/"(?:[^"\\]|\\.)*"(?=\s*:)/, 'type'],
      [/"(?:[^"\\]|\\.)*"/, 'string'],
      [/-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/, 'number'],
      [/\b(?:true|false|null)\b/, 'keyword'],
      [/\/\/.*$/, 'comment'],
      [/[{}[\]]/, '@brackets'],
      [/[,:]/, 'delimiter'],
      [/\s+/, 'white'],
    ],
  },
};
