import { describe, expect, it } from 'vitest';
import { detectCodeLanguage, toMonacoLanguage } from './codeLanguage';

describe('detectCodeLanguage', () => {
  it.each([
    ['model.cellml', 'xml'],
    ['simulation.sedml', 'xml'],
    ['metadata.rdf', 'xml'],
    ['diagram.svg', 'xml'],
    ['model.xul', 'xml'],
    ['index.html', 'html'],
    ['styles.scss', 'scss'],
    ['styles.sass', 'scss'],
    ['styles.less', 'less'],
    ['model.c', 'cpp'],
    ['model.h', 'cpp'],
    ['script.tsx', 'javascript'],
    ['generated.neon', 'json'],
    ['settings.conf', 'json'],
    ['model.py', 'python'],
    ['README.md', 'markdown'],
    ['model.f77', 'fortran'],
    ['model.f', 'fortran'],
    ['model.f90', 'fortran'],
    ['model.cc', 'cpp'],
    ['model.hpp', 'cpp'],
    ['script.mjs', 'javascript'],
    ['model.sbml', 'xml'],
    ['transform.xslt', 'xml'],
    ['ontology.owl', 'xml'],
    ['equation.mml', 'xml'],
    ['page.xhtml', 'html'],
    ['notebook.ipynb', 'json'],
    ['model.m', 'matlab'],
    ['run.sh', 'shell'],
    ['run.bat', 'bat'],
    ['config.yml', 'yaml'],
    ['CITATION.cff', 'yaml'],
    ['setup.cfg', 'ini'],
    ['pyproject.toml', 'ini'],
    ['workflow.proj', 'ini'],
    ['analysis.R', 'r'],
    ['model.jl', 'julia'],
    ['Model.java', 'java'],
    ['query.rq', 'sparql'],
    ['schema.sql', 'sql'],
    ['index.rst', 'restructuredtext'],
    ['Dockerfile', 'dockerfile'],
    ['.editorconfig', 'ini'],
    ['.gitmodules', 'ini'],
    ['.gitignore', 'gitignore'],
    ['models/.gitignore', 'gitignore'],
  ])('detects %s as %s', (filename, expected) => {
    expect(detectCodeLanguage(filename)).toBe(expected);
  });

  it('is case-insensitive for extensions', () => {
    expect(detectCodeLanguage('MODEL.CellML')).toBe('xml');
  });

  it('uses the basename when a path is given', () => {
    expect(detectCodeLanguage('models/v1.2/model.py')).toBe('python');
    expect(detectCodeLanguage('folder.d/Makefile')).toBeNull();
    expect(detectCodeLanguage('docker/Dockerfile')).toBe('dockerfile');
  });

  it('is case-insensitive for whole filenames', () => {
    expect(detectCodeLanguage('dockerfile')).toBe('dockerfile');
  });

  it('returns null for unknown extensions', () => {
    expect(detectCodeLanguage('data.xyz')).toBeNull();
  });

  it('returns null for files without an extension', () => {
    expect(detectCodeLanguage('LICENSE')).toBeNull();
    expect(detectCodeLanguage('')).toBeNull();
  });
});

describe('toMonacoLanguage', () => {
  it.each([
    ['xml', 'xml'],
    ['javascript', 'typescript'],
    ['json', 'json'],
    ['fortran', 'fortran'],
    ['matlab', 'matlab'],
    ['shell', 'shell'],
    ['yaml', 'yaml'],
  ] as const)('maps %s to the Monaco language %s', (id, expected) => {
    expect(toMonacoLanguage(id)).toBe(expected);
  });

  it('uses plain text when no language is detected', () => {
    expect(toMonacoLanguage(null)).toBe('plaintext');
  });
});
