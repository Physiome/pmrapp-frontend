import { CODE_VIEW_THEMES } from '@/constants/codeLanguage';
import { fortranConfiguration, fortranLanguage } from '@/utils/monarch/fortran';
import { gitignoreConfiguration, gitignoreLanguage } from '@/utils/monarch/gitignore';
import { jsonConfiguration, jsonLanguage } from '@/utils/monarch/json';
import { matlabConfiguration, matlabLanguage } from '@/utils/monarch/matlab';

/** The Monaco editor API. */
export type Monaco = typeof import('monaco-editor/editor/editor.api');

// Background colours match the page's code surfaces (Tailwind gray-50 and gray-900).
const LIGHT_BACKGROUND = '#f9fafb';
const DARK_BACKGROUND = '#101828';

let monacoPromise: Promise<Monaco> | null = null;

const setUpMonaco = async (): Promise<Monaco> => {
  // Only the core editor is loaded, not `editor.main`, which includes every language and the
  // TypeScript, CSS, HTML and JSON language services with their workers.
  const [monaco, { default: EditorWorker }] = await Promise.all([
    import('monaco-editor/editor/editor.api'),
    import('monaco-editor/editor/editor.worker?worker'),
    import('monaco-editor/features/codicon/register'),
    import('monaco-editor/features/find/register'),
    import('monaco-editor/features/folding/register'),
    // Each language registration loads its tokenizer only when a file of that language is shown.
    import('monaco-editor/languages/definitions/bat/register'),
    import('monaco-editor/languages/definitions/cpp/register'),
    import('monaco-editor/languages/definitions/css/register'),
    import('monaco-editor/languages/definitions/dockerfile/register'),
    import('monaco-editor/languages/definitions/html/register'),
    import('monaco-editor/languages/definitions/ini/register'),
    import('monaco-editor/languages/definitions/java/register'),
    import('monaco-editor/languages/definitions/julia/register'),
    import('monaco-editor/languages/definitions/less/register'),
    import('monaco-editor/languages/definitions/markdown/register'),
    import('monaco-editor/languages/definitions/python/register'),
    import('monaco-editor/languages/definitions/r/register'),
    import('monaco-editor/languages/definitions/restructuredtext/register'),
    import('monaco-editor/languages/definitions/scss/register'),
    import('monaco-editor/languages/definitions/shell/register'),
    import('monaco-editor/languages/definitions/sparql/register'),
    import('monaco-editor/languages/definitions/sql/register'),
    import('monaco-editor/languages/definitions/typescript/register'),
    import('monaco-editor/languages/definitions/xml/register'),
    import('monaco-editor/languages/definitions/yaml/register'),
  ]);

  // The viewer is read-only, so only the base editor worker is needed.
  globalThis.MonacoEnvironment = { getWorker: () => new EditorWorker() };

  // JSON (tokens only), Fortran, MATLAB and `.gitignore` use small tokenizers defined in `utils/monarch`.
  monaco.languages.register({ id: 'json', aliases: ['JSON'] });
  monaco.languages.setMonarchTokensProvider('json', jsonLanguage);
  monaco.languages.setLanguageConfiguration('json', jsonConfiguration);
  monaco.languages.register({ id: 'fortran', aliases: ['Fortran'] });
  monaco.languages.setMonarchTokensProvider('fortran', fortranLanguage);
  monaco.languages.setLanguageConfiguration('fortran', fortranConfiguration);
  monaco.languages.register({ id: 'gitignore', aliases: ['Git Ignore'] });
  monaco.languages.setMonarchTokensProvider('gitignore', gitignoreLanguage);
  monaco.languages.setLanguageConfiguration('gitignore', gitignoreConfiguration);
  monaco.languages.register({ id: 'matlab', aliases: ['MATLAB', 'Octave'] });
  monaco.languages.setMonarchTokensProvider('matlab', matlabLanguage);
  monaco.languages.setLanguageConfiguration('matlab', matlabConfiguration);

  monaco.editor.defineTheme(CODE_VIEW_THEMES.light, {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: { 'editor.background': LIGHT_BACKGROUND, 'editorGutter.background': LIGHT_BACKGROUND },
  });
  monaco.editor.defineTheme(CODE_VIEW_THEMES.dark, {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: { 'editor.background': DARK_BACKGROUND, 'editorGutter.background': DARK_BACKGROUND },
  });

  return monaco;
};

/**
 * Load and set up the Monaco editor once, with the languages and features the code viewer uses.
 * Monaco is imported dynamically so that it is only downloaded when a code view is shown.
 * @returns The Monaco editor API.
 */
export const loadMonaco = (): Promise<Monaco> => {
  monacoPromise ??= setUpMonaco().catch((err) => {
    // Allow a later attempt, for example after a network error.
    monacoPromise = null;
    throw err;
  });
  return monacoPromise;
};
