/**
 * Get file extension from filename.
 * For dotfiles (like .gitignore), returns the part after the leading dot.
 */
export const getFileExtension = (filename: string): string => {
  // Handle dotfiles (e.g., .gitignore, .editorconfig).
  if (filename.startsWith('.') && filename.indexOf('.', 1) === -1) {
    // File starts with dot and has no other dots - return the part after the dot.
    return filename.substring(1).toLowerCase();
  }

  const lastDotIndex = filename.lastIndexOf('.');

  // No extension if no dot, or dot is at the end.
  if (lastDotIndex <= 0 || lastDotIndex === filename.length - 1) {
    return '';
  }

  return filename.substring(lastDotIndex + 1).toLowerCase();
};

/**
 * Check if file is an image (excluding SVG).
 */
export const isImageFile = (filename: string): boolean => {
  const extension = getFileExtension(filename);
  return ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(extension);
};

/**
 * Check if file is SVG.
 */
export const isSvgFile = (filename: string): boolean => {
  return getFileExtension(filename) === 'svg';
};

/**
 * Check if file is a PDF file.
 */
export const isPdfFile = (filename: string): boolean => {
  return getFileExtension(filename) === 'pdf';
};

/**
 * Check if a file can be opened with OpenCOR.
 */
export const isOpenCORFile = (filename: string): boolean => {
  const extension = getFileExtension(filename);
  return ['omex', 'cellml', 'sedml'].includes(extension);
};

/**
 * Check if file is a markdown file.
 */
export const isMarkdownFile = (filename: string): boolean => {
  const extension = getFileExtension(filename);
  return ['md', 'markdown'].includes(extension);
};

/**
 * Check if file is a code/text file.
 */
export const isCodeFile = (filename: string): boolean => {
  const extension = getFileExtension(filename);
  const codeExtensions = [
    'bash',
    'c',
    'cellml',
    'cmake',
    'conf',
    'config',
    'cpp',
    'css',
    'csv',
    'dockerfile',
    'editorconfig',
    'env',
    'eslintrc',
    'exelem',
    'exf',
    'exnode',
    'gitattributes',
    'gitignore',
    'gitmodules',
    'go',
    'gradle',
    'h',
    'hgsub',
    'hpp',
    'html',
    'ini',
    'java',
    'js',
    'json',
    'lock',
    'm',
    'makefile',
    'matlab',
    'maven',
    'md',
    'neon',
    'php',
    'prettierrc',
    'proj',
    'py',
    'r',
    'rb',
    'rdf',
    'rs',
    'rst',
    'sedml',
    'sh',
    'sql',
    'toml',
    'ts',
    'txt',
    'xml',
    'xul',
    'yaml',
    'yml',
  ];

  // Check by extension first.
  if (codeExtensions.includes(extension)) {
    return true;
  }

  // Check for files that don't have extension (like Makefile, Dockerfile, etc.).
  const filenameExtensionless = [
    'Dockerfile',
    'Gemfile',
    'LICENSE',
    'Makefile',
    'Procfile',
    'README',
    'Rakefile',
    'Vagrantfile',
  ];
  return filenameExtensionless.includes(filename);
};

/**
 * Check if a file is likely a binary file based on extension.
 */
export const isBinaryFile = (filename: string): boolean => {
  const extension = getFileExtension(filename);
  const binaryExtensions = [
    '7z',
    'ai',
    'avi',
    'bmp',
    'dll',
    'doc',
    'docx',
    'dylib',
    'exe',
    'gif',
    'gz',
    'jpeg',
    'jpg',
    'mov',
    'mp3',
    'mp4',
    'omex',
    'pdf',
    'png',
    'ppt',
    'pptx',
    'rar',
    'so',
    'svg',
    'tar',
    'wav',
    'webp',
    'xls',
    'xlsx',
    'zip',
  ];
  return binaryExtensions.includes(extension);
};
