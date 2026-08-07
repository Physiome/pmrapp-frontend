<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import ActionButton from '@/components/atoms/ActionButton.vue'
import BackButton from '@/components/atoms/BackButton.vue'
import CodeBlock from '@/components/atoms/CodeBlock.vue'
import CopyButton from '@/components/atoms/CopyButton.vue'
import LoadingBox from '@/components/atoms/LoadingBox.vue'
import WrapButton from '@/components/atoms/WrapButton.vue'
import CodeIcon from '@/components/icons/CodeIcon.vue'
import DownloadIcon from '@/components/icons/DownloadIcon.vue'
import ExternalLinkIcon from '@/components/icons/ExternalLinkIcon.vue'
import PreviewIcon from '@/components/icons/PreviewIcon.vue'
import ErrorBlock from '@/components/molecules/ErrorBlock.vue'
import PageHeader from '@/components/molecules/PageHeader.vue'
import { useBackNavigation } from '@/composables/useBackNavigation'
import { getWorkspaceService } from '@/services'
import { getWorkspaceFileUrl } from '@/services/downloadUrlService'
import { useWorkspaceStore } from '@/stores/workspace'
import type { WorkspaceInfo } from '@/types/workspace'
import { trackButtonClick } from '@/utils/analytics'
import { downloadWorkspaceFile } from '@/utils/download'
import {
  isCodeFile,
  isImageFile,
  isMarkdownFile,
  isOpenCORFile,
  isPdfFile,
  isSvgFile,
} from '@/utils/file'
import { renderMarkdown } from '@/utils/markdown'
import { generateWorkspaceTitle } from '@/utils/workspace'

// Files with size above this threshold are not rendered in the preview to prevent browser freeze.
const MAX_PREVIEW_FILE_SIZE_BYTES = 500 * 1024 // ~500 KB

const props = defineProps<{
  alias: string
  commitId: string
  path: string
}>()

const fileContent = ref<string>('')
const fileBlob = ref<Blob>(new Blob())
const fileBlobUrl = ref<string>('')
const fileSizeBytes = ref(0)
const workspaceInfo = ref<WorkspaceInfo | null>(null)
const workspaceInfoLoading = ref(true)
const error = ref<string | null>(null)
const isLoading = ref(true)
const isCodeButtonActive = ref(false)
const isCodeViewVisible = ref(false)
const previewPanelId = useId()
const codePanelId = useId()
const codeWrapActive = ref(false)

// Extract filename from full path for download purposes.
const filename = computed(() => {
  const lastSlash = props.path.lastIndexOf('/')
  return lastSlash === -1 ? props.path : props.path.substring(lastSlash + 1)
})

const backPath = computed(() => {
  const lastSlash = props.path.lastIndexOf('/')
  if (lastSlash === -1) {
    // File in root - go to root workspace.
    return `/workspaces/${props.alias}`
  }
  // Go to parent folder.
  const parentPath = props.path.substring(0, lastSlash)
  return `/workspaces/${props.alias}/file/${props.commitId}/${parentPath}`
})

const { goBack } = useBackNavigation(backPath.value)
const workspaceStore = useWorkspaceStore()

const tabButtonClasses = {
  base: 'flex items-center gap-1.5 px-3 py-1.5 transition-colors',
  active: 'text-gray-900 dark:text-gray-100 bg-gray-200 dark:bg-gray-700 z-0',
  inactive: 'text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 cursor-pointer z-1',
  hover: 'hover:text-gray-700 dark:hover:text-gray-200',
  shadow: 'shadow-[0_0_12px_6px_rgba(0,0,0,0.15)] dark:shadow-none',
}

const previewButtonClass = computed(() => {
  const classes = [tabButtonClasses.base]

  if (isCodeButtonActive.value) {
    classes.push(tabButtonClasses.inactive)
    classes.push(tabButtonClasses.hover)
    classes.push(tabButtonClasses.shadow)
  } else {
    classes.push(tabButtonClasses.active)
  }
  return classes
})

const codeButtonClass = computed(() => {
  const classes = [tabButtonClasses.base]

  if (isCodeButtonActive.value) {
    classes.push(tabButtonClasses.active)
  } else {
    classes.push(tabButtonClasses.inactive)
    classes.push(tabButtonClasses.hover)
    classes.push(tabButtonClasses.shadow)
  }
  return classes
})

const isImage = computed(() => isImageFile(props.path))
const isPDF = computed(() => isPdfFile(props.path))
const isSvg = computed(() => isSvgFile(props.path))
const isMarkdown = computed(() => isMarkdownFile(props.path))
const isCode = computed(() => isCodeFile(props.path))
const isOpenCOR = computed(() => isOpenCORFile(props.path))
const canShowOpenCORButton = computed(() => isOpenCOR.value && !!openCORFileURL.value)

const openCORFileURL = computed(() => {
  const url = workspaceInfo.value?.workspace.url
  if (!url) return ''

  const rawFileURL = `${url}rawfile/${props.commitId}/${props.path}`
  const opencorLink = `opencor://openFile/${rawFileURL}`
  return `//opencor.ws/app/?${opencorLink}`
})

const shouldShowAsText = computed(() => {
  return isCode.value || isSvg.value || isMarkdown.value
})

const shouldShowPreview = computed(() => {
  return (isSvg.value || isMarkdown.value) && !isCodeViewVisible.value
})

const renderedMarkdown = computed(() => {
  if (!isMarkdown.value || !fileContent.value) return ''
  return renderMarkdown(fileContent.value)
})

const imageDataUrl = computed(() => {
  if (!isImage.value) return ''
  return fileBlobUrl.value
})

// Fast guard: avoid rendering very large payloads in the browser preview.
const isTooLargeForPreview = computed(() => fileSizeBytes.value > MAX_PREVIEW_FILE_SIZE_BYTES)

const downloadUrl = computed(() => {
  return getWorkspaceFileUrl(props.alias, props.commitId, props.path)
})

const downloadWorkspaceFileDetail = async (event: Event) => {
  event.preventDefault()

  try {
    await downloadWorkspaceFile(props.alias, props.commitId, props.path)
  } catch (err) {
    console.error('Error downloading file:', err)
  }
}

const toggleCodeWrap = () => {
  codeWrapActive.value = !codeWrapActive.value
}

const loadWorkspaceInfo = async () => {
  try {
    workspaceInfo.value = await workspaceStore.getWorkspaceInfo(props.alias, props.commitId, '')
  } catch (workspaceErr) {
    console.error('Error loading workspace info:', workspaceErr)
  } finally {
    workspaceInfoLoading.value = false
  }
}

const pageTitle = computed(() => {
  const title = generateWorkspaceTitle(
    workspaceInfo.value?.workspace.description,
    workspaceInfo.value?.workspace.id,
    props.commitId,
    props.path,
    false,
  )

  return title
})

onMounted(async () => {
  void loadWorkspaceInfo()

  try {
    const blob = await getWorkspaceService().getRawFileBlob(props.alias, props.commitId, props.path)
    fileBlob.value = blob
    fileSizeBytes.value = blob.size

    // Image-like previews use an object URL from the blob.
    if (isImage.value || isSvg.value || isPDF.value) {
      fileBlobUrl.value = URL.createObjectURL(blob)

      // For SVG, also get text content for code view.
      if (isSvg.value) {
        fileContent.value = await blob.text()
      }
    } else {
      // Skip text decode for oversized code-like previews; download remains available via blob.
      if (!isTooLargeForPreview.value || isMarkdown.value) {
        fileContent.value = await blob.text()
      }
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load file.'
    console.error('Error loading file:', err)
  } finally {
    isLoading.value = false
  }
})

onBeforeUnmount(() => {
  // Revoke blob URL to prevent memory leaks.
  if (fileBlobUrl.value) {
    URL.revokeObjectURL(fileBlobUrl.value)
  }
})

// Update button styling state separately from the actual view state
// so the button appearance can change independently while the view finishes rendering.
const switchCodeView = async (event: Event, showCodeView: boolean) => {
  const buttonText = (event.currentTarget as HTMLElement)?.textContent?.trim() || ''

  isCodeButtonActive.value = showCodeView

  // Wait for DOM updates and a short delay for smooth transition.
  await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 100))

  isCodeViewVisible.value = showCodeView

  trackButtonClick({
    button_name: buttonText,
    content_section: pageTitle.value,
    link_category: `/workspaces/${props.alias}/file/${props.commitId}/${props.path}`,
  })
}
</script>

<template>
  <BackButton
    label="Back"
    :contentSection="pageTitle"
    :on-click="goBack"
  />

  <PageHeader v-if="!workspaceInfoLoading" :title="pageTitle" titleSize="small" />

  <ErrorBlock
    v-if="error"
    title="Error loading file"
    :error="error"
  />

  <LoadingBox v-else-if="isLoading" message="Loading file..." />

  <div v-else>
    <div class="box p-0! overflow-hidden">
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div>
          {{ filename }}
        </div>
        <div class="flex items-center gap-2">
          <div
            v-if="isSvg || isMarkdown"
            class="flex items-center border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden text-sm"
            role="tablist"
            aria-label="File view tabs"
          >
            <button
              type="button"
              role="tab"
              @click="switchCodeView($event, false)"
              :aria-selected="!isCodeViewVisible"
              :aria-controls="previewPanelId"
              :class="previewButtonClass"
            >
              <PreviewIcon class="w-4 h-4" />
              Preview
            </button>
            <button
              type="button"
              role="tab"
              @click="switchCodeView($event, true)"
              :aria-selected="isCodeViewVisible"
              :aria-controls="codePanelId"
              :class="codeButtonClass"
            >
              <CodeIcon class="w-4 h-4" />
              Code
            </button>
          </div>
          <WrapButton
            v-if="shouldShowAsText && !isTooLargeForPreview"
            :disabled="!shouldShowAsText || isTooLargeForPreview || ((isSvg || isMarkdown) ? !isCodeViewVisible : false)"
            :active="codeWrapActive"
            @click="toggleCodeWrap"
          />
          <CopyButton
            v-if="shouldShowAsText && !isTooLargeForPreview"
            :disabled="!shouldShowAsText || isTooLargeForPreview || (isSvg ? !isCodeViewVisible : false)"
            :text="fileContent"
            title="Copy code"
          />
          <ActionButton
            v-if="canShowOpenCORButton"
            variant="icon"
            size="sm"
            :contentSection="pageTitle"
            :href="openCORFileURL"
            target="_blank"
            rel="noopener noreferrer"
            tooltip="Open with OpenCOR's Web app"
            aria-label="Open with OpenCOR's Web app"
          >
            <ExternalLinkIcon class="w-4 h-4" />
            <span class="sr-only">Open with OpenCOR's Web app</span>
          </ActionButton>
          <ActionButton
            variant="icon"
            size="sm"
            :contentSection="pageTitle"
            :href="downloadUrl"
            :download="filename"
            @click.prevent="downloadWorkspaceFileDetail"
            tooltip="Download"
            aria-label="Download"
          >
            <DownloadIcon class="w-4 h-4" />
            <span class="sr-only">Download</span>
          </ActionButton>
        </div>
      </div>

      <!-- SVG Rendered View -->
      <div :id="previewPanelId" role="tabpanel" v-if="isSvg && shouldShowPreview" class="flex justify-center p-4 bg-gray-50 dark:bg-gray-900 rounded">
        <img :src="fileBlobUrl" :alt="path" class="max-w-full h-auto" />
      </div>

      <!-- Markdown Preview -->
      <div :id="previewPanelId" role="tabpanel" v-else-if="isMarkdown && shouldShowPreview" class="p-4">
        <div class="max-w-none" v-html="renderedMarkdown"></div>
      </div>

      <!-- Image View -->
      <div v-else-if="isImage && imageDataUrl" class="flex justify-center p-4 bg-gray-50 dark:bg-gray-900 rounded">
        <img :src="imageDataUrl" :alt="path" class="max-w-full h-auto" />
      </div>

      <!-- PDF View -->
      <div v-else-if="isPDF" class="flex justify-center">
        <embed :src="fileBlobUrl" type="application/pdf" width="100%" height="800px" />
      </div>

      <!-- Code/Text View (Too Large) -->
      <div v-else-if="shouldShowAsText && isTooLargeForPreview" class="text-center py-8 text-gray-500 dark:text-gray-400">
        <p class="mb-4">This file is too large to preview in the browser.</p>
        <ActionButton
          variant="primary"
          size="lg"
          :href="downloadUrl"
          :download="filename"
          :contentSection="pageTitle"
        >
          <DownloadIcon class="w-4 h-4" />
          Download
        </ActionButton>
      </div>

      <!-- Code/Text View -->
      <div :id="codePanelId" role="tabpanel" v-else-if="shouldShowAsText" class="relative">
        <CodeBlock
          :code="fileContent"
          :filename="filename"
          :startWrapped="codeWrapActive"
        />
      </div>

      <!-- Binary/Unknown File Type -->
      <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
        <p class="mb-4">This file type cannot be displayed.</p>
        <ActionButton
          variant="primary"
          size="lg"
          :href="downloadUrl"
          :download="filename"
          :contentSection="pageTitle"
        >
          <DownloadIcon class="w-4 h-4" />
          Download
        </ActionButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import '@/assets/box.css';
</style>
