<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ActionButton from '@/components/atoms/ActionButton.vue'
import BackButton from '@/components/atoms/BackButton.vue'
import FormattedEmailText from '@/components/atoms/FormattedEmailText.vue'
import LoadingBox from '@/components/atoms/LoadingBox.vue'
import BugIcon from '@/components/icons/BugIcon.vue'
import DownloadIcon from '@/components/icons/DownloadIcon.vue'
import ErrorBlock from '@/components/molecules/ErrorBlock.vue'
import PageHeader from '@/components/molecules/PageHeader.vue'
import WorkspaceFileBrowser from '@/components/molecules/WorkspaceFileBrowser.vue'
import { GITHUB_ISSUES_URL } from '@/constants/global'
import { getWorkspaceArchiveUrl } from '@/services/downloadUrlService'
import { useWorkspaceStore } from '@/stores/workspace'
import type { ErrorInfo } from '@/types/error'
import type { WorkspaceInfo } from '@/types/workspace'
import { generateWorkspaceTitle } from '@/utils/workspace'

const props = defineProps<{
  alias: string
  commitId?: string
  path?: string
}>()

const router = useRouter()
const workspaceStore = useWorkspaceStore()
const workspaceInfo = ref<WorkspaceInfo | null>(null)
const error = ref<ErrorInfo | null>(null)
const isLoading = ref(true)
const requestCounter = ref(0)

const backPath = computed(() => {
  if (!props.path) {
    // Root workspace - go to workspaces listing.
    return '/workspaces'
  }
  // Extract parent folder path.
  const lastSlash = props.path.lastIndexOf('/')
  if (lastSlash === -1) {
    // File/folder in root - go to root workspace
    return `/workspaces/${props.alias}`
  }
  // Go to parent folder.
  const parentPath = props.path.substring(0, lastSlash)
  return `/workspaces/${props.alias}/file/${props.commitId}/${parentPath}`
})

const goBack = () => {
  const basePath = !props.path ? '/workspaces' : `/workspaces/${props.alias}`

  // Check browser history to preserve query state (search filters).
  if (
    window.history.state.back?.includes(basePath) &&
    !window.history.state.back?.includes(`${basePath}/`)
  ) {
    // Go back in browser history to preserve filters.
    router.back()
  } else {
    // Navigate to computed back path.
    router.push(backPath.value)
  }
}

const backButtonText = computed(() => {
  return !props.path ? 'Back to workspaces' : `Back to ${props.path}`
})

const workspaceArchiveFilename = computed(() => {
  if (!workspaceInfo.value) return ''

  return workspaceInfo.value.workspace.description || props.alias
})

const workspaceArchiveUrlBase = computed(() => {
  if (!workspaceInfo.value) return ''

  return getWorkspaceArchiveUrl(props.alias, workspaceInfo.value.commit.commit_id)
})

const pageTitle = computed(() => {
  return generateWorkspaceTitle(
    workspaceInfo.value?.workspace.description,
    workspaceInfo.value?.workspace.id,
  )
})

const workspaceIssueUrl = computed(() => {
  const workspaceUrl = workspaceInfo.value?.workspace.url

  if (!workspaceUrl) {
    return `${GITHUB_ISSUES_URL}/new`
  }

  const params = new URLSearchParams({
    labels: 'workspace',
    template: 'workspace.yml',
    title: '[Workspace]: ',
    'workspace-url': workspaceUrl,
  })

  return `${GITHUB_ISSUES_URL}/new?${params.toString()}`
})

const loadWorkspaceInfo = async () => {
  isLoading.value = true
  error.value = null

  const currentRequest = ++requestCounter.value

  try {
    const alias = props.alias
    const commitId = props.commitId || ''
    const path = props.path || ''
    const workspaceData = await workspaceStore.getWorkspaceInfo(alias, commitId, path)

    if (currentRequest === requestCounter.value) {
      workspaceInfo.value = workspaceData
    }
  } catch (err) {
    if (currentRequest === requestCounter.value) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load workspace.'

      if (errorMessage.toLowerCase().includes('not found')) {
        error.value = {
          title: 'Workspace not found',
          message: 'The workspace you are looking for does not exist or has been removed.',
        }
      } else {
        error.value = {
          title: 'Error loading workspace',
          message: errorMessage,
        }
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
  <BackButton
    :label="backButtonText"
    content-section="Workspace Detail"
    :on-click="goBack"
  />

  <ErrorBlock
    v-if="error"
    :title="error.title"
    :error="error.message"
  />

  <LoadingBox v-else-if="isLoading" message="Loading workspace..." />

  <div v-else-if="workspaceInfo">
    <PageHeader
      :title="pageTitle"
    />

    <div class="mb-6 space-y-4">
      <div class="flex flex-col lg:flex-row items-start lg:items-center gap-2">
        <span class="font-bold text-gray-600 dark:text-gray-400">Git repository:</span>
        <a
          :href="workspaceInfo.workspace.url"
          target="_blank"
          rel="noopener noreferrer"
          class="text-link"
        >
          {{ workspaceInfo.workspace.url }}
        </a>
      </div>

      <div class="flex flex-col lg:flex-row items-start lg:items-center gap-2" v-if="workspaceInfo.commit.author">
        <span class="font-bold text-gray-600 dark:text-gray-400">Author:</span>
        <FormattedEmailText :text="workspaceInfo.commit.author" />
      </div>

      <div class="flex flex-col lg:flex-row items-start lg:items-center gap-2">
        <span class="font-bold text-gray-600 dark:text-gray-400">Downloads:</span>
        <div class="flex flex-col lg:flex-row items-start gap-2">
          <ActionButton
            variant="secondary"
            size="sm"
            :href="`${workspaceArchiveUrlBase}zip`"
            :download="`${workspaceArchiveFilename}.zip`"
            content-section="Workspace Detail"
          >
            <DownloadIcon class="w-4 h-4" />
            <span>Complete archive (as a <code class="code-inline bg-gray-100 dark:bg-gray-700">.zip</code> file)</span>
          </ActionButton>
          <ActionButton
            variant="secondary"
            size="sm"
            :href="`${workspaceArchiveUrlBase}tgz`"
            :download="`${workspaceArchiveFilename}.tgz`"
            content-section="Workspace Detail"
          >
            <DownloadIcon class="w-4 h-4" />
            <span>Complete archive (as a <code class="code-inline bg-gray-100 dark:bg-gray-700">.tgz</code> file)</span>
          </ActionButton>
        </div>
      </div>

      <div class="flex flex-col lg:flex-row items-start lg:items-center gap-2">
        <span class="font-bold text-gray-600 dark:text-gray-400">Report issue:</span>
        <ActionButton
          variant="secondary"
          size="sm"
          :href="workspaceIssueUrl"
          target="_blank"
          rel="noopener noreferrer"
          content-section="Workspace Detail"
        >
          <BugIcon class="w-4 h-4" />
          <span>Report issue</span>
        </ActionButton>
      </div>
    </div>

    <WorkspaceFileBrowser
      :alias="props.alias"
      :commit-id="workspaceInfo.commit.commit_id"
      :path="props.path"
    />
  </div>
</template>

<style scoped>
@import '@/assets/text-link.css';
@import '@/assets/box.css';

.code-inline {
  display: inline-block;
  padding: 0 0.25em;
  border-radius: 0.25rem;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}
</style>
