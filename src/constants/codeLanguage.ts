import type { CodeLanguageId } from '@/types/codeLanguage';

/**
 * Map of file extensions to code viewer languages.
 */
export const EXTENSION_LANGUAGE_MAP: Record<string, CodeLanguageId> = {
  c: 'cpp',
  cc: 'cpp',
  cellml: 'xml',
  cjs: 'javascript',
  conf: 'json',
  cpp: 'cpp',
  css: 'css',
  cts: 'javascript',
  cxx: 'cpp',
  f: 'fortran',
  f03: 'fortran',
  f08: 'fortran',
  f77: 'fortran',
  f90: 'fortran',
  f95: 'fortran',
  for: 'fortran',
  fortran: 'fortran',
  geojson: 'json',
  h: 'cpp',
  hh: 'cpp',
  hpp: 'cpp',
  htm: 'html',
  html: 'html',
  hxx: 'cpp',
  ipynb: 'json',
  js: 'javascript',
  json: 'json',
  jsonld: 'json',
  jsx: 'javascript',
  kml: 'xml',
  m: 'matlab',
  markdown: 'markdown',
  matlab: 'matlab',
  md: 'markdown',
  mjs: 'javascript',
  mml: 'xml',
  mts: 'javascript',
  neon: 'json',
  owl: 'xml',
  py: 'python',
  python: 'python',
  rdf: 'xml',
  sass: 'css',
  sbml: 'xml',
  scss: 'css',
  sedml: 'xml',
  svg: 'xml',
  ts: 'javascript',
  tsx: 'javascript',
  xhtml: 'html',
  xml: 'xml',
  xsd: 'xml',
  xsl: 'xml',
  xslt: 'xml',
  xul: 'xml',
};

/**
 * Map of code viewer languages to Monaco language IDs.
 * JSON, Fortran and MATLAB use small tokenizers defined in `utils/monarch`.
 */
export const MONACO_LANGUAGE_MAP: Record<CodeLanguageId, string> = {
  cpp: 'cpp',
  css: 'css',
  fortran: 'fortran',
  html: 'html',
  // The TypeScript tokenizer also covers JavaScript and JSX.
  javascript: 'typescript',
  json: 'json',
  markdown: 'markdown',
  matlab: 'matlab',
  python: 'python',
  xml: 'xml',
};

/**
 * Maximum height of the code viewer: the viewport below the sticky header, less the file panel's
 * toolbar and borders, so that a sticky file panel fits the screen exactly. Shorter files fit
 * their content; longer files scroll inside the editor. The header and toolbar heights are
 * measured by `Header` and `FilePanel`, and count as zero where they are not set.
 */
export const CODE_VIEW_MAX_HEIGHT =
  'calc(100dvh - var(--header-height, 0px) - var(--file-panel-toolbar-height, 0px) - 2px)';

/** Monaco theme names used by the code viewer, following the system colour scheme. */
export const CODE_VIEW_THEMES = {
  light: 'pmr-light',
  dark: 'pmr-dark',
} as const;
