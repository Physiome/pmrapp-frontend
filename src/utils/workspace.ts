import { TITLE } from '@/constants/global'
import type { BreadcrumbItem } from '@/types/breadcrumb'

/**
 * Generate workspace page title from description or ID.
 *
 * @param description The description of the workspace, if available.
 * @param id The ID of the workspace, used as a fallback if description is not available.
 * @param withTitleSuffix When true, appends the site title suffix. Defaults to false.
 * @returns A string representing the title for the workspace page.
 */
export const generateWorkspaceTitle = (
  description: string | null | undefined,
  id: number | null | undefined,
  commitId?: string,
  path?: string,
  withTitleSuffix = false,
): string => {
  let title: string

  // Generic title if neither description nor ID is available.
  if (!description && !id) {
    title = 'Workspace Detail'
  } else if (description && description.trim() !== '') {
    // Title using description.
    title = description
  } else {
    // Fallback title using ID.
    title = `Workspace ${id}`
  }

  if (commitId && path) {
    const truncatedCommitId = commitId.substring(0, 12)
    const pathsWithSpace = path.split('/').join(' / ')
    title = `${title} @ ${truncatedCommitId} / ${pathsWithSpace}`
  }

  return withTitleSuffix ? `${title} – ${TITLE}` : title
}

/**
 * Generate breadcrumb items for each folder and file in a workspace path.
 *
 * @param alias The workspace alias.
 * @param commitId The commit the path belongs to.
 * @param path The folder or file path within the workspace, e.g. "src/models/model.cellml".
 * @returns One item per path segment; every segment links to its folder except the last (current page).
 */
export const generateWorkspacePathBreadcrumbs = (
  alias: string,
  commitId: string,
  path: string,
): BreadcrumbItem[] => {
  const segments = path.split('/').filter(Boolean)

  return segments.map((segment, index) =>
    index === segments.length - 1
      ? { label: segment }
      : {
          label: segment,
          to: `/workspace/${alias}/file/${commitId}/${segments.slice(0, index + 1).join('/')}`,
        },
  )
}
