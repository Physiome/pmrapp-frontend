import type { languages } from 'monaco-editor/editor/editor.api';

/**
 * Editor behaviour for INI files: line comments and brackets.
 */
export const iniConfiguration: languages.LanguageConfiguration = {
  comments: { lineComment: ';' },
  brackets: [['[', ']']],
};

/**
 * Monarch tokenizer for INI files (and similar formats such as Qt settings and TOML),
 * used instead of Monaco's own, which colours every digit in a value.
 * Like VS Code, only comments, section headers, keys and quoted strings are highlighted;
 * other values are plain text. A key is everything before the first `=` on a line,
 * so Qt keys such as `nodelist\1\name` are matched whole.
 */
export const iniLanguage: languages.IMonarchLanguage = {
  defaultToken: '',
  tokenPostfix: '.ini',

  tokenizer: {
    root: [
      [/^\s*[#;].*$/, 'comment'],
      [/^\s*\[[^\]]*\]/, 'metatag'],
      [/^(\s*)([^=\s][^=]*?)(\s*)(=)/, ['white', 'key', 'white', 'delimiter']],
      [/"(?:[^"\\]|\\.)*"/, 'string'],
      [/'(?:[^'\\]|\\.)*'/, 'string'],
      [/\s+/, 'white'],
      [/[^"'\s]+/, ''],
      [/["']/, ''],
    ],
  },
};
