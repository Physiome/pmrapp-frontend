import type { languages } from 'monaco-editor/editor/editor.api';
import { beforeAll, describe, expect, it } from 'vitest';
import { fortranLanguage } from './fortran';
import { gitignoreLanguage } from './gitignore';
import { jsonLanguage } from './json';
import { matlabLanguage } from './matlab';

type MonacoApi = typeof import('monaco-editor/editor/editor.api');

let monaco: MonacoApi;

beforeAll(async () => {
  // Monaco's theme service reads the colour scheme, which jsdom does not implement.
  window.matchMedia = (media: string) =>
    ({
      matches: false,
      media,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;

  monaco = await import('monaco-editor/editor/editor.api');
  const definitions: [string, languages.IMonarchLanguage][] = [
    ['fortran', fortranLanguage],
    ['gitignore', gitignoreLanguage],
    ['json', jsonLanguage],
    ['matlab', matlabLanguage],
  ];
  for (const [id, definition] of definitions) {
    monaco.languages.register({ id });
    monaco.languages.setMonarchTokensProvider(id, definition);
  }
});

/**
 * Tokenize code and list each non-whitespace token as `text: type`, without the language suffix.
 */
const tokens = (code: string, languageId: string): string[] => {
  const lines = code.split('\n');
  return monaco.editor.tokenize(code, languageId).flatMap((lineTokens, lineIndex) =>
    lineTokens
      .map((token, index) => {
        const end = lineTokens[index + 1]?.offset ?? lines[lineIndex].length;
        const text = lines[lineIndex].slice(token.offset, end);
        return `${text}: ${token.type.replace(`.${languageId}`, '')}`;
      })
      .filter((token) => !token.endsWith(': white')),
  );
};

describe('Fortran tokenizer', () => {
  it('highlights keywords, types, comments, strings and numbers', () => {
    expect(tokens("      REAL X ! note\n      x = 'a' .and. 1.5e3", 'fortran')).toEqual([
      'REAL: type',
      'X: identifier',
      '! note: comment',
      'x: identifier',
      '=: operator',
      "'a': string",
      '.and.: operator',
      '1.5e3: number',
    ]);
  });

  it('is case-insensitive for keywords and built-ins', () => {
    expect(tokens('Subroutine f\nY = SQRT(x)', 'fortran')).toContain('Subroutine: keyword');
    expect(tokens('Y = SQRT(x)', 'fortran')).toContain('SQRT: predefined');
  });

  it('ends an unterminated string at the end of the line', () => {
    expect(tokens("print *, 'open\nx = 1", 'fortran')).toContain('x: identifier');
  });
});

describe('MATLAB tokenizer', () => {
  it('highlights keywords, built-ins, comments, strings and numbers', () => {
    expect(tokens("function y = f(x) % comment\ny = sqrt(x) + 'str';", 'matlab')).toEqual([
      'function: keyword',
      'y: identifier',
      '=: operator',
      'f: identifier',
      '(: delimiter',
      'x: identifier',
      '): delimiter',
      '% comment: comment',
      'y: identifier',
      '=: operator',
      'sqrt: predefined',
      '(: delimiter',
      'x: identifier',
      '): delimiter',
      '+: operator',
      "'str': string",
      ';: delimiter',
    ]);
  });

  it('treats a quote after a name or bracket as the transpose operator', () => {
    expect(tokens("b = a' * (c)'", 'matlab')).toEqual([
      'b: identifier',
      '=: operator',
      'a: identifier',
      "': operator",
      '*: operator',
      '(: delimiter',
      'c: identifier',
      '): delimiter',
      "': operator",
    ]);
  });

  it('highlights block comments', () => {
    expect(tokens('%{\nnot code\n%}\nx = 1', 'matlab')).toEqual([
      '%{: comment',
      'not code: comment',
      '%}: comment',
      'x: identifier',
      '=: operator',
      '1: number',
    ]);
  });
});

describe('JSON tokenizer', () => {
  it('distinguishes property names from string values', () => {
    expect(tokens('{"name": "model", "size": 1.5e2, "ok": true}', 'json')).toEqual([
      '{: delimiter.curly',
      '"name": type',
      ':: delimiter',
      '"model": string',
      ',: delimiter',
      '"size": type',
      ':: delimiter',
      '1.5e2: number',
      ',: delimiter',
      '"ok": type',
      ':: delimiter',
      'true: keyword',
      '}: delimiter.curly',
    ]);
  });
});

describe('.gitignore tokenizer', () => {
  it('highlights only comments', () => {
    expect(tokens('# Build output\n*.py[cod]\n!keep.so', 'gitignore')).toEqual([
      '# Build output: comment',
      '*.py[cod]: ',
      '!keep.so: ',
    ]);
  });

  it('treats # as part of the pattern when not at the start of a line', () => {
    expect(tokens('a#b\n \\#c', 'gitignore')).toEqual(['a#b: ', ' \\#c: ']);
  });
});
