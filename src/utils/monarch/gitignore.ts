import type { languages } from 'monaco-editor/editor/editor.api';

/**
 * Editor behaviour for `.gitignore` files: line comments.
 */
export const gitignoreConfiguration: languages.LanguageConfiguration = {
  comments: { lineComment: '#' },
};

/**
 * Monarch tokenizer for `.gitignore` files, which Monaco does not include.
 * Like VS Code, only comments are highlighted. A `#` starts a comment only at the start of a line;
 * elsewhere it is part of the pattern.
 */
export const gitignoreLanguage: languages.IMonarchLanguage = {
  defaultToken: '',
  tokenPostfix: '.gitignore',

  tokenizer: {
    root: [[/^#.*$/, 'comment']],
  },
};
