import { describe, expect, it } from 'vitest';
import {
  getFileExtension,
  isBinaryFile,
  isCodeFile,
  isImageFile,
  isMarkdownFile,
  isOpenCORFile,
  isPdfFile,
  isSvgFile,
} from '@/utils/file';

describe('getFileExtension', () => {
  it('returns the extension in lowercase', () => {
    expect(getFileExtension('model.CellML')).toBe('cellml');
  });

  it('returns empty string when there is no extension', () => {
    expect(getFileExtension('Makefile')).toBe('');
  });

  it('returns empty string when dot is at the end', () => {
    expect(getFileExtension('file.')).toBe('');
  });

  it('handles dotfiles correctly', () => {
    expect(getFileExtension('.gitignore')).toBe('gitignore');
  });
});

describe('isImageFile', () => {
  it('returns true for common image extensions', () => {
    for (const ext of ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp']) {
      expect(isImageFile(`file.${ext}`)).toBe(true);
    }
  });

  it('returns false for non-image files', () => {
    expect(isImageFile('file.txt')).toBe(false);
    expect(isImageFile('file.svg')).toBe(false);
  });
});

describe('isSvgFile', () => {
  it('returns true for svg extension', () => {
    expect(isSvgFile('icon.svg')).toBe(true);
  });

  it('returns false for non-svg files', () => {
    expect(isSvgFile('icon.png')).toBe(false);
  });
});

describe('isPdfFile', () => {
  it('returns true for pdf extension', () => {
    expect(isPdfFile('doc.pdf')).toBe(true);
  });

  it('returns false for non-pdf files', () => {
    expect(isPdfFile('doc.txt')).toBe(false);
  });
});

describe('isOpenCORFile', () => {
  it('returns true for OpenCOR-compatible extensions', () => {
    for (const ext of ['cellml', 'sedml', 'omex']) {
      expect(isOpenCORFile(`file.${ext}`)).toBe(true);
    }
  });

  it('returns true for OpenCOR-compatible extensions regardless of case', () => {
    expect(isOpenCORFile('model.CELLML')).toBe(true);
    expect(isOpenCORFile('simulation.SEDML')).toBe(true);
    expect(isOpenCORFile('archive.OMEX')).toBe(true);
  });

  it('returns false for non-OpenCOR files', () => {
    expect(isOpenCORFile('file.txt')).toBe(false);
    expect(isOpenCORFile('image.png')).toBe(false);
    expect(isOpenCORFile('README')).toBe(false);
  });
});

describe('isMarkdownFile', () => {
  it('returns true for md and markdown extensions', () => {
    expect(isMarkdownFile('README.md')).toBe(true);
    expect(isMarkdownFile('notes.markdown')).toBe(true);
  });

  it('returns false for non-markdown files', () => {
    expect(isMarkdownFile('README.txt')).toBe(false);
  });
});

describe('isCodeFile', () => {
  it('returns true for common code file extensions', () => {
    for (const ext of ['py', 'js', 'ts', 'xml', 'json', 'txt', 'cellml', 'sedml']) {
      expect(isCodeFile(`file.${ext}`)).toBe(true);
    }
  });

  it('returns true for .exf files', () => {
    expect(isCodeFile('model.exf')).toBe(true);
  });

  it('returns true for .proj files', () => {
    expect(isCodeFile('project.proj')).toBe(true);
  });

  it('returns true for .rdf files', () => {
    expect(isCodeFile('metadata.rdf')).toBe(true);
  });

  it('returns true for text-based files', () => {
    expect(isCodeFile('transformed.exelem')).toBe(true);
    expect(isCodeFile('transformed.exnode')).toBe(true);
  });

  it('returns true for .neon files', () => {
    expect(isCodeFile('generated.neon')).toBe(true);
  });

  it('returns true for .xul files', () => {
    expect(isCodeFile('model.xul')).toBe(true);
  });

  it('returns true for .hgsub dotfile', () => {
    expect(isCodeFile('.hgsub')).toBe(true);
  });

  it('returns true for extensionless known filenames', () => {
    expect(isCodeFile('Makefile')).toBe(true);
    expect(isCodeFile('Dockerfile')).toBe(true);
  });

  it('returns false for binary file extensions', () => {
    expect(isCodeFile('archive.zip')).toBe(false);
    expect(isCodeFile('video.mp4')).toBe(false);
  });
});

describe('isBinaryFile', () => {
  it('returns true for binary extensions', () => {
    for (const ext of ['pdf', 'png', 'jpg', 'zip', 'exe', 'mp4', 'omex']) {
      expect(isBinaryFile(`file.${ext}`)).toBe(true);
    }
  });

  it('returns false for text file extensions', () => {
    expect(isBinaryFile('file.txt')).toBe(false);
    expect(isBinaryFile('model.cellml')).toBe(false);
  });

  it('returns false for .exf files', () => {
    expect(isBinaryFile('model.exf')).toBe(false);
  });

  it('returns false for .proj files', () => {
    expect(isBinaryFile('project.proj')).toBe(false);
  });

  it('returns false for .rdf files', () => {
    expect(isBinaryFile('metadata.rdf')).toBe(false);
  });
});
