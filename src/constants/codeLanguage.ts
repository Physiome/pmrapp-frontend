import type { CodeLanguageId } from '@/types/codeLanguage';

/**
 * Map of file extensions to code viewer languages.
 */
export const EXTENSION_LANGUAGE_MAP: Record<string, CodeLanguageId> = {
  bash: 'shell',
  bat: 'bat',
  c: 'cpp',
  cc: 'cpp',
  cellml: 'xml',
  cff: 'yaml',
  cfg: 'ini',
  cjs: 'javascript',
  cmd: 'bat',
  conf: 'json',
  cpp: 'cpp',
  css: 'css',
  cts: 'javascript',
  cxx: 'cpp',
  dockerfile: 'dockerfile',
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
  ini: 'ini',
  ipynb: 'json',
  java: 'java',
  jl: 'julia',
  js: 'javascript',
  json: 'json',
  jsonld: 'json',
  jsx: 'javascript',
  kml: 'xml',
  less: 'less',
  m: 'matlab',
  markdown: 'markdown',
  matlab: 'matlab',
  md: 'markdown',
  mjs: 'javascript',
  mml: 'xml',
  mts: 'javascript',
  neon: 'json',
  owl: 'xml',
  proj: 'ini',
  properties: 'ini',
  py: 'python',
  python: 'python',
  r: 'r',
  rdf: 'xml',
  rq: 'sparql',
  rst: 'restructuredtext',
  sass: 'scss',
  sbml: 'xml',
  scss: 'scss',
  sedml: 'xml',
  sh: 'shell',
  sparql: 'sparql',
  sql: 'sql',
  svg: 'xml',
  toml: 'ini',
  ts: 'javascript',
  tsx: 'javascript',
  xhtml: 'html',
  xml: 'xml',
  xsd: 'xml',
  xsl: 'xml',
  xslt: 'xml',
  xul: 'xml',
  yaml: 'yaml',
  yml: 'yaml',
  zsh: 'shell',
};

/**
 * Map of whole filenames (lower case) to code viewer languages, for files without a usable
 * extension. These take precedence over `EXTENSION_LANGUAGE_MAP`.
 */
export const FILENAME_LANGUAGE_MAP: Record<string, CodeLanguageId> = {
  '.editorconfig': 'ini',
  '.gitconfig': 'ini',
  '.gitignore': 'gitignore',
  '.gitmodules': 'ini',
  dockerfile: 'dockerfile',
};

/**
 * Map of code viewer languages to Monaco language IDs.
 * JSON, Fortran, MATLAB, INI and `.gitignore` use small tokenizers defined in `utils/monarch`; the others are
 * Monaco built-ins, registered in `utils/monaco`.
 */
export const MONACO_LANGUAGE_MAP: Record<CodeLanguageId, string> = {
  bat: 'bat',
  cpp: 'cpp',
  css: 'css',
  dockerfile: 'dockerfile',
  fortran: 'fortran',
  gitignore: 'gitignore',
  html: 'html',
  ini: 'ini',
  java: 'java',
  // The TypeScript tokenizer also covers JavaScript and JSX.
  javascript: 'typescript',
  json: 'json',
  julia: 'julia',
  less: 'less',
  markdown: 'markdown',
  matlab: 'matlab',
  python: 'python',
  r: 'r',
  restructuredtext: 'restructuredtext',
  scss: 'scss',
  shell: 'shell',
  sparql: 'sparql',
  sql: 'sql',
  xml: 'xml',
  yaml: 'yaml',
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
