<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import ActionButton from '@/components/atoms/ActionButton.vue'
import LoadingBox from '@/components/atoms/LoadingBox.vue'
import DownloadIcon from '@/components/icons/DownloadIcon.vue'
import ExternalLinkIcon from '@/components/icons/ExternalLinkIcon.vue'
import FileIcon from '@/components/icons/FileIcon.vue'
import FolderIcon from '@/components/icons/FolderIcon.vue'
import GitIcon from '@/components/icons/GitIcon.vue'
import ErrorBlock from '@/components/molecules/ErrorBlock.vue'
import FileBrowserBreadcrumb from '@/components/molecules/FileBrowserBreadcrumb.vue'
import { getWorkspaceFileUrl } from '@/services/downloadUrlService'
import { useWorkspaceStore } from '@/stores/workspace'
import type { ErrorInfo } from '@/types/error'
import type { WorkspaceInfo } from '@/types/workspace'
import { isOpenCORFile } from '@/utils/file'
import { formatFileCount } from '@/utils/format'

const props = defineProps<{
  alias: string
  commitId: string
  path?: string
  onFolderClick?: (name: string) => void
  onPathChange?: (path: string | undefined) => void
}>()

const workspaceStore = useWorkspaceStore()
const workspaceInfo = ref<WorkspaceInfo | null>(null)
const error = ref<ErrorInfo | null>(null)
const isLoading = ref(true)
const requestCounter = ref(0)

const fileCountText = computed(() => {
  const count = workspaceInfo.value?.target?.TreeInfo?.filecount
  return formatFileCount(count)
})

const sortedEntries = computed(() => {
  if (!workspaceInfo.value) return []

  const treeInfo = workspaceInfo.value.target?.TreeInfo
  if (!treeInfo?.entries) return []

  const entries = [...treeInfo.entries]

  return entries.sort((a, b) => {
    // Folders first.
    if (a.kind === 'tree' && b.kind !== 'tree') return -1
    if (a.kind !== 'tree' && b.kind === 'tree') return 1

    // Both folders or both files - sort by name.
    // Dotfiles (starting with ".") come before other files.
    const aIsDotfile = a.name.startsWith('.')
    const bIsDotfile = b.name.startsWith('.')

    if (aIsDotfile && !bIsDotfile) return -1
    if (!aIsDotfile && bIsDotfile) return 1

    // Alphabetically (case-insensitive, but capitals before lowercase for same letter).
    return a.name.localeCompare(b.name, 'en', { numeric: true })
  })
})

const buildOpenCorUrl = (filename: string): string => {
  if (!workspaceInfo.value) return ''

  const fullFilename = (props.path ? `${props.path}/` : '') + filename
  const baseURL = `${workspaceInfo.value.workspace.url}rawfile/${workspaceInfo.value.commit.commit_id}`
  const opencorLink = `opencor://openFile/${baseURL}/${fullFilename}`

  return `//opencor.ws/app/?${opencorLink}`
}

const buildWorkspaceFileUrl = (filename: string): string => {
  if (!workspaceInfo.value) return ''

  const fullFilename = (props.path ? `${props.path}/` : '') + filename
  return getWorkspaceFileUrl(props.alias, workspaceInfo.value.commit.commit_id, fullFilename)
}

const loadWorkspaceInfo = async () => {
  isLoading.value = true
  error.value = null

  const currentRequest = ++requestCounter.value

  try {
    const workspaceData = await workspaceStore.getWorkspaceInfo(
      props.alias,
      props.commitId || '',
      props.path || '',
    )

    if (currentRequest === requestCounter.value) {
      workspaceInfo.value = workspaceData
    }
  } catch (err) {
    if (currentRequest === requestCounter.value) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load workspace.'
      error.value = {
        title: 'Error loading files',
        message: errorMessage,
      }
      console.error('Error loading workspace:', err)
    }
  } finally {
    if (currentRequest === requestCounter.value) {
      isLoading.value = false
    }
  }
}

onMounted(loadWorkspaceInfo)

// Watch for changes in props to reload data when navigating between folders.
watch(() => [props.alias, props.commitId, props.path], loadWorkspaceInfo)
</script>

<template>
  <ErrorBlock
    v-if="error"
    :title="error.title"
    :error="error.message"
  />

  <LoadingBox v-else-if="isLoading" message="Loading files..." />

  <div v-else class="box p-0! overflow-hidden">
    <div class="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-4">
      <FileBrowserBreadcrumb
        v-if="props.path"
        :alias="alias"
        :commit-id="props.commitId"
        :path="props.path"
        :on-path-change="onPathChange"
      />
      <span class="text-gray-600 dark:text-gray-400 shrink-0">
        {{ fileCountText }}
      </span>
    </div>
    <ul class="divide-y divide-gray-200 dark:divide-gray-700">
      <li
        v-for="entry in sortedEntries"
        :key="entry.id"
        class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div class="px-4 py-3 flex items-center justify-between">
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <FolderIcon v-if="entry.kind === 'tree'" class="text-gray-500 dark:text-gray-400 flex-shrink-0 w-4 h-4" />
            <GitIcon v-else-if="entry.kind === 'commit'" class="text-gray-500 dark:text-gray-400 flex-shrink-0 w-4 h-4" />
            <FileIcon v-else class="text-gray-500 dark:text-gray-400 flex-shrink-0 w-4 h-4" />

            <RouterLink
              v-if="entry.kind === 'commit'"
              :to="`/workspaces/${entry.name}/file/${entry.id}`"
              class="text-link font-medium truncate text-left cursor-pointer"
            >
              {{ entry.name }}
            </RouterLink>
            <button
              v-else-if="entry.kind === 'tree' && onFolderClick"
              class="text-link font-medium truncate text-left cursor-pointer"
              @click="onFolderClick(entry.name)"
            >
              {{ entry.name }}
            </button>
            <RouterLink
              v-else
              :to="`/workspaces/${alias}/file/${workspaceInfo?.commit.commit_id}/${(path ? path + '/' : '') + entry.name}`"
              class="text-link font-medium truncate text-left cursor-pointer"
            >
              {{ entry.name }}
            </RouterLink>
          </div>
          <div class="flex items-center gap-2 ml-4 flex-shrink-0">
            <ActionButton
              v-if="entry.kind !== 'tree' && entry.kind !== 'commit' && isOpenCORFile(entry.name)"
              variant="icon"
              size="sm"
              :href="buildOpenCorUrl(entry.name)"
              target="_blank"
              rel="noopener noreferrer"
              content-section="Workspace Detail"
              tooltip="Open with OpenCOR's Web app"
              aria-label="Open with OpenCOR's Web app"
            >
              <ExternalLinkIcon class="w-4 h-4" />
              <span class="sr-only">Open {{ entry.name }} with OpenCOR's Web app</span>
            </ActionButton>
            <ActionButton
              v-if="entry.kind !== 'tree' && entry.kind !== 'commit'"
              variant="icon"
              size="sm"
              :href="buildWorkspaceFileUrl(entry.name)"
              :download="entry.name"
              content-section="Workspace Detail"
              tooltip="Download"
              aria-label="Download"
            >
              <DownloadIcon class="w-4 h-4" />
              <span class="sr-only">Download {{ entry.name }}</span>
            </ActionButton>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
@import '@/assets/text-link.css';
@import '@/assets/box.css';
</style>
