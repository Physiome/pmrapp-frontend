import { TITLE } from '@/constants/global'
import type { BreadcrumbItem } from '@/types/breadcrumb'
import type { WorkspaceInfo } from '@/types/workspace'
import { encodePathSegments, getPathSegments } from '@/utils/path'

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
  const segments = getPathSegments(path)

  return segments.map((segment, index) =>
    index === segments.length - 1
      ? { label: segment.name }
      : {
          label: segment.name,
          to: `/workspace/${alias}/file/${commitId}/${encodePathSegments(segment.path)}`,
        },
  )
}

/**
 * Generate the breadcrumb trail for a workspace page: the workspace itself,
 * then each folder and file in the path.
 *
 * @param info The workspace info, or null while it loads or if it failed to load.
 * @param alias The workspace alias, used as the label until the info is available.
 * @param commitId The commit being viewed, or an empty string for the latest commit.
 * @param path The folder or file path within the workspace, or an empty string for the root.
 * @param loading Whether the workspace info is still loading.
 * @returns The workspace crumb, linked to the root unless it is the current page, followed by the path crumbs.
 */
export const generateWorkspaceBreadcrumbs = (
  info: WorkspaceInfo | null,
  alias: string,
  commitId: string,
  path: string,
  loading: boolean,
): BreadcrumbItem[] => {
  // Link back to the workspace root at the same commit when there is one.
  const workspaceRoot = commitId
    ? { name: 'workspace-detail-alias-commit', params: { alias, commitId } }
    : { name: 'workspace-detail', params: { alias } }

  return [
    {
      label: info ? generateWorkspaceTitle(info.workspace.description, info.workspace.id) : alias,
      to: path ? workspaceRoot : undefined,
      loading,
    },
    ...generateWorkspacePathBreadcrumbs(alias, commitId, path),
  ]
}
