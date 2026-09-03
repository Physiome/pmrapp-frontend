import type { RouteLocationNormalized } from 'vue-router'
import { useExposureStore } from '@/stores/exposure'
import { useSearchStore } from '@/stores/search'
import { useWorkspaceStore } from '@/stores/workspace'
import { generateExposureTitle, resolveExposureFileTitle } from '@/utils/exposure'
import { generateWorkspaceTitle } from '@/utils/workspace'

const resolveExposureTitle = async (to: RouteLocationNormalized) => {
  const alias = to.params?.alias as string | undefined
  if (!alias) {
    return
  }

  const fileParam = to.params?.file
  const file = typeof fileParam === 'string' ? fileParam.replace(/\/+$/, '') : undefined
  if (file) {
    try {
      const fileTitle = await resolveExposureFileTitle(alias, file, useSearchStore().searchQuery)
      if (fileTitle) {
        return fileTitle
      }
    } catch (error) {
      console.error(`Error fetching exposure file title for alias ${alias}:`, error)
    }
  }

  try {
    const exposureInfo = await useExposureStore().getExposureInfo(alias)

    return generateExposureTitle(
      exposureInfo?.exposure?.description,
      exposureInfo?.exposure?.id,
      true,
    )
  } catch (error) {
    console.error(`Error fetching exposure info for alias ${alias}:`, error)
  }
}

const resolveWorkspaceTitle = async (to: RouteLocationNormalized) => {
  const alias = to.params?.alias as string | undefined
  if (!alias) {
    return
  }

  try {
    const commitIdParam = to.params?.commitId
    const pathParam = to.params?.path
    const commitId = typeof commitIdParam === 'string' ? commitIdParam : ''
    const path = typeof pathParam === 'string' ? pathParam : ''
    const workspaceInfo = await useWorkspaceStore().getWorkspaceInfo(alias, commitId, path)

    return generateWorkspaceTitle(
      workspaceInfo?.workspace?.description,
      workspaceInfo?.workspace?.id,
      commitId,
      path,
      true,
    )
  } catch (error) {
    console.error(`Error fetching workspace info for alias ${alias}:`, error)
  }
}

export const resolveRouteTitle = async (to: RouteLocationNormalized) => {
  const currentTitle = to.meta.title as string | undefined

  if (to.name?.toString().startsWith('exposure')) {
    return (await resolveExposureTitle(to)) || currentTitle
  }

  if (to.name?.toString().startsWith('workspace')) {
    return (await resolveWorkspaceTitle(to)) || currentTitle
  }

  return currentTitle
}
