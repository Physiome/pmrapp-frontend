import { downloadFileFromBlob } from '@/utils/download'

const DOWNLOAD_API = import.meta.env.VITE_DOWNLOAD_API
const DOWNLOAD_HOST = (import.meta.env.VITE_DOWNLOAD_HOST || '').trim().replace(/\/\/+$/, '')

export const getWorkspaceArchiveUrl = (alias: string, commitId: string): string => {
  return `${DOWNLOAD_HOST}/workspace/${alias}/archive/${commitId}/`
}

export const getWorkspaceFileUrl = (alias: string, commitId: string, path: string): string => {
  return `${DOWNLOAD_HOST}/workspace/${alias}/rawfile/${commitId}/${path}`
}

export const downloadWorkspaceArchive = async (
  url: string,
  alias: string,
  commitId: string,
  format: 'zip' | 'tgz',
  fileName?: string,
): Promise<void> => {
  if (!alias || !commitId) {
    console.error('Alias and commit ID are required to download workspace archive.')
    return
  }

  try {
    const params = new URLSearchParams({ workspaceURL: url, alias, commitId, format })
    const response = await fetch(`${DOWNLOAD_API}/download/workspace?${params}`)

    if (!response.ok) {
      throw new Error(`Failed to download workspace archive: ${response.statusText}`)
    }

    const blob = await response.blob()
    const fileNameWithExtension = `${fileName || alias}.${format === 'tgz' ? 'tar.gz' : format}`
    downloadFileFromBlob(blob, fileNameWithExtension)
  } catch (error) {
    console.error('Error downloading workspace archive:', error)
    throw error
  }
}

export const downloadCOMBINEArchive = async (alias: string, fileName: string): Promise<void> => {
  if (!alias) {
    console.error('Exposure alias is required to download COMBINE archive.')
    return
  }

  try {
    const params = new URLSearchParams({ alias: alias })
    const response = await fetch(`${DOWNLOAD_API}/download/exposure?${params}`)

    if (!response.ok) {
      throw new Error(`Failed to download COMBINE archive: ${response.statusText}`)
    }

    const blob = await response.blob()
    const fileNameWithExtension = `${fileName || alias}.omex`
    downloadFileFromBlob(blob, fileNameWithExtension)
  } catch (error) {
    console.error('Error downloading COMBINE archive:', error)
    throw error
  }
}
