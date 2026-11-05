import { getWorkspaceService } from '@/services';
import { isBinaryFile } from './file';

/**
 * Download a file from content string.
 */
export const downloadFileFromContent = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'application/octet-stream' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Download a file from a Blob.
 */
export const downloadFileFromBlob = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Download a workspace file by fetching it and detecting binary vs text files.
 */
export const downloadWorkspaceFile = async (
  alias: string,
  commitId: string,
  filename: string,
): Promise<void> => {
  try {
    if (isBinaryFile(filename)) {
      // Download as binary blob.
      const blob = await getWorkspaceService().getRawFileBlob(alias, commitId, filename);
      downloadFileFromBlob(blob, filename);
    } else {
      // Download as text.
      const content = await getWorkspaceService().getRawFile(alias, commitId, filename);
      downloadFileFromContent(content, filename);
    }
  } catch (err) {
    console.error('Error downloading file:', err);
    throw err;
  }
};
