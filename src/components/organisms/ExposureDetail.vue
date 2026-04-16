<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ActionButton from '@/components/atoms/ActionButton.vue'
import BackButton from '@/components/atoms/BackButton.vue'
import CodeBlock from '@/components/atoms/CodeBlock.vue'
import CopyButton from '@/components/atoms/CopyButton.vue'
import LoadingBox from '@/components/atoms/LoadingBox.vue'
import WrapButton from '@/components/atoms/WrapButton.vue'
import ChevronDownIcon from '@/components/icons/ChevronDownIcon.vue'
import DownloadIcon from '@/components/icons/DownloadIcon.vue'
import FileIcon from '@/components/icons/FileIcon.vue'
import LoadingIcon from '@/components/icons/LoadingIcon.vue'
import ErrorBlock from '@/components/molecules/ErrorBlock.vue'
import PageHeader from '@/components/molecules/PageHeader.vue'
import { useBackNavigation } from '@/composables/useBackNavigation'
import { downloadCOMBINEArchive, downloadWorkspaceArchive } from '@/services/downloadUrlService'
import { useExposureStore } from '@/stores/exposure'
import { useSearchStore } from '@/stores/search'
import type { ErrorInfo } from '@/types/error'
import type { ExposureInfo, Metadata, ViewEntry } from '@/types/exposure'
import { formatCitation, formatCitationAuthor } from '@/utils/citation'
import { downloadFileFromContent, downloadWorkspaceFile } from '@/utils/download'
import { getExposureIdFromResourcePath } from '@/utils/exposure'
import { formatFileCount } from '@/utils/format'
import { formatLicenseUrl } from '@/utils/license'
import { buildSearchQuery, isValidTerm } from '@/utils/search'
import TermButton from '../atoms/TermButton.vue'

const props = defineProps<{
  alias: string
  file: string
  view: string
}>()

const DEFAULT_LICENSE = 'https://creativecommons.org/licenses/by/3.0/'
const AVAILABLE_VIEWS = [
  {
    name: 'Generate code',
    view_key: 'cellml_codegen',
  },
  {
    name: 'Mathematics',
    view_key: 'cellml_math',
  },
]
const CODEGEN_LANGUAGES = [
  {
    name: 'C',
    path: 'code.C.c',
    fileName: 'code.c',
  },
  {
    name: 'C (IDA solver)',
    path: 'code.C_IDA.c',
    fileName: 'code.ida.c',
  },
  {
    name: 'FORTRAN 77',
    path: 'code.F77.f77',
    fileName: 'code.f77',
  },
  {
    name: 'MATLAB',
    path: 'code.MATLAB.m',
    fileName: 'code.m',
  },
  {
    name: 'Python',
    path: 'code.Python.py',
    fileName: 'code.py',
  },
]

const exposureStore = useExposureStore()
const exposureInfo = ref<ExposureInfo | null>(null)
const error = ref<ErrorInfo | null>(null)
const isLoading = ref(true)
const exposureId = ref<number>(NaN)
const exposureFilePath = ref<string>(props.file)
const exposureFileId = ref<number>(NaN)
const detailHTML = ref<string>('')
const generatedCode = ref<string>('')
const generatedCodeFilename = ref<string>('')
const codeBlockRef = ref<InstanceType<typeof CodeBlock> | null>(null)
const mathsJSON = ref<[string, string[]][]>([])
const metadataJSON = ref<Metadata>({})
const htmlViewRef = ref<HTMLElement | null>(null)
const licenseInfo = ref<string>(DEFAULT_LICENSE)
const availableViews = ref<ViewEntry[]>([])
const isCitationDetailsOpen = ref(false)
const hasOtherRelatedModels = ref(false)
const isDownloadingWorkspaceZip = ref(false)
const isDownloadingWorkspaceTgz = ref(false)
const isDownloadingCOMBINE = ref(false)
const { goBack } = useBackNavigation('/exposures')

const router = useRouter()
const searchStore = useSearchStore()

// This route path is used to fix relative paths in the HTML content.
// It is not a part of the API request parameters.
// Note: Keep as "exposure" (singular) to match server file paths, not the router path.
const routePath = `/exposure/${props.alias}`

const pageTitle = computed(() => {
  if (props.view) {
    const viewEntry = AVAILABLE_VIEWS.find((v) => v.view_key === props.view)
    if (viewEntry) {
      if (viewEntry.view_key === 'view') {
        return `${exposureFilePath.value}`
      }
      return `${viewEntry.name}`
    }
  }
  if (!exposureInfo.value) return ''
  return exposureInfo.value.exposure.description || `Exposure ${exposureInfo.value.exposure.id}`
})

const openCORFiles = computed(() => {
  if (!exposureInfo.value) return []

  return exposureInfo.value.files.filter((entry) => {
    const filename = entry[0]
    return filename.endsWith('.omex') || filename.endsWith('.cellml') || filename.endsWith('.sedml')
  })
})

const navigationFiles = computed(() => {
  if (!exposureInfo.value) return []

  return exposureInfo.value.files.filter((entry) => entry[1] === true)
})

const handleDownloadWorkspaceArchive = async (format: 'zip' | 'tgz') => {
  if (!exposureInfo.value) return

  const fileName = exposureInfo.value.exposure.description || ''
  const loadingRef = format === 'zip' ? isDownloadingWorkspaceZip : isDownloadingWorkspaceTgz
  loadingRef.value = true

  try {
    await downloadWorkspaceArchive(
      exposureInfo.value.workspace.url,
      exposureInfo.value.workspace_alias,
      exposureInfo.value.exposure.commit_id,
      format,
      fileName,
    )
  } catch (err) {
    console.error('Error downloading workspace archive:', err)
  } finally {
    loadingRef.value = false
  }
}

const handleDownloadCOMBINEArchive = async () => {
  const exposureAlias = props.alias
  const fileName = exposureInfo.value
    ? `${exposureInfo.value.exposure.description}`
    : `${exposureAlias}`

  isDownloadingCOMBINE.value = true

  try {
    await downloadCOMBINEArchive(exposureAlias, fileName)
  } catch (err) {
    console.error('Error downloading COMBINE archive:', err)
  } finally {
    isDownloadingCOMBINE.value = false
  }
}

const buildOpenCORURL = (option?: string) => {
  if (!exposureInfo.value || openCORFiles.value.length === 0) return ''

  const baseURL = `${exposureInfo.value.workspace.url}rawfile/${exposureInfo.value.exposure.commit_id}`

  const sortedFiles = [...openCORFiles.value].sort((a, b) => {
    const getOrder = (filename: string) => {
      if (filename.endsWith('.cellml')) return 1
      if (filename.endsWith('.sedml')) return 2
      if (filename.endsWith('.omex')) return 3
      return 4
    }
    return getOrder(a[0]) - getOrder(b[0])
  })

  const fileURLs = sortedFiles.map((entry) => `${baseURL}/${entry[0]}`).join('%7C')
  const command = sortedFiles.length > 1 ? 'openFiles' : 'openFile'

  const opencorLink = `opencor://${command}/${fileURLs}`
  if (option !== 'desktop') {
    return `//opencor.ws/app/?${opencorLink}`
  }
  return opencorLink
}

const convertFirstTextNodeToTitle = () => {
  if (!htmlViewRef.value) return

  const firstChild = htmlViewRef.value.firstChild
  if (firstChild && firstChild.nodeType === 3) {
    const textContent = firstChild.textContent?.trim()
    if (textContent) {
      const h2 = document.createElement('h2')
      h2.textContent = textContent
      htmlViewRef.value.replaceChild(h2, firstChild)
    }
  }
}

const downloadFile = async (filename: string) => {
  if (!exposureInfo.value) return

  const alias = exposureInfo.value.workspace_alias
  const commitId = exposureInfo.value.exposure.commit_id
  if (!commitId) return
  await downloadWorkspaceFile(alias, commitId, filename)
}

const fileCountText = computed(() => {
  const count = exposureInfo.value?.files?.length
  return formatFileCount(count)
})

const generateCode = async (langPath: string, fileName: string) => {
  const code = await exposureStore.getExposureRawContent(
    exposureId.value,
    exposureFileId.value,
    'cellml_codegen',
    langPath,
  )
  generatedCode.value = code
  generatedCodeFilename.value = fileName
}

const downloadCode = () => {
  downloadFileFromContent(generatedCode.value, generatedCodeFilename.value)
}

const toggleCodeWrap = () => {
  codeBlockRef.value?.toggleWrap()
}

const generateMath = async () => {
  error.value = null

  try {
    const response = await exposureStore.getExposureRawContent(
      exposureId.value,
      exposureFileId.value,
      'cellml_math',
      'math.json',
    )
    const mathResponseJSON = JSON.parse(response)
    const filteredMathsJSON = Array.isArray(mathResponseJSON)
      ? mathResponseJSON.filter(
          (value): value is [string, string[]] => Array.isArray(value[1]) && value[1].length > 0,
        )
      : []
    mathsJSON.value = filteredMathsJSON
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to parse mathematics data.'
    error.value = {
      title: 'Error parsing mathematics',
      message: errorMessage,
    }
    console.error('Error parsing mathematics JSON:', err)
  }
}

const generateMetadata = async () => {
  error.value = null

  try {
    const metadata = await exposureStore.getExposureRawContent(
      exposureId.value,
      exposureFileId.value,
      'cellml_metadata',
      'cmeta.json',
    )
    metadataJSON.value = JSON.parse(metadata)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to parse metadata JSON.'
    error.value = {
      title: 'Error parsing metadata',
      message: errorMessage,
    }
    console.error('Error parsing metadata JSON:', err)
  }
}

const loadDefaultView = async () => {
  detailHTML.value = await exposureStore.getExposureSafeHTML(
    exposureId.value,
    exposureFileId.value,
    'view',
    'index.html',
    routePath,
  )
}

const loadCodegenView = async () => {
  if (!exposureInfo.value) return
  // Load code generation view with the first language as default.
  await generateCode(
    CODEGEN_LANGUAGES[0]?.path || 'code.C.c',
    CODEGEN_LANGUAGES[0]?.fileName || 'code.c',
  )
}

const handleKeywordClick = (kind: string, keyword: string) => {
  const currentQuery = router.currentRoute.value.query
  router.push({ path: '/search', query: buildSearchQuery(kind, keyword, currentQuery) })
}

const handleCitationAuthorClick = (authorParts: string[]) => {
  const familyName = authorParts[0]
  if (familyName) {
    handleKeywordClick('citation_author_family_name', familyName)
  }
}

const filteredKeywords = computed(() => {
  const originalKeywords = metadataJSON.value.keywords || []
  return originalKeywords
    .filter(
      (keywordTuple) => Array.isArray(keywordTuple) && keywordTuple.length >= 2 && keywordTuple[1],
    )
    .map((keywordTuple) => keywordTuple[1] || '')
})

const checkOtherRelatedModels = async () => {
  const term = metadataJSON.value.citation_id
  const kind = 'citation_id'

  if (!term || !isValidTerm(term)) {
    hasOtherRelatedModels.value = false
    return
  }

  try {
    const searchResults = await searchStore.searchIndexTerm(kind, term)

    if (!Array.isArray(searchResults)) {
      hasOtherRelatedModels.value = false
      return
    }

    const otherRelatedModels = searchResults.filter((result) => {
      const _exposureId = getExposureIdFromResourcePath(result.resource_path)
      return Number(_exposureId) !== exposureId.value
    })

    hasOtherRelatedModels.value = otherRelatedModels.length > 0
  } catch (err) {
    console.error('Error checking related models:', err)
    hasOtherRelatedModels.value = false
  }
}

const loadInitialView = async () => {
  if (!exposureInfo.value) return

  const filesWithViews = exposureInfo.value.exposure?.files?.filter(
    (file) => file.views && file.views.length > 0,
  )
  let fileWithViews = filesWithViews?.[0]

  if (props.file) {
    fileWithViews = filesWithViews?.find((file) => file.workspace_file_path === props.file)
  }

  if (fileWithViews) {
    availableViews.value = AVAILABLE_VIEWS.filter((view) =>
      fileWithViews.views.some((v) => v.view_key === view.view_key),
    )
    exposureFileId.value = fileWithViews.id
    exposureFilePath.value = fileWithViews.workspace_file_path
    exposureId.value = fileWithViews.exposure_id

    const viewEntry = fileWithViews.views.find((v) => v.view_key === 'view')
    const licenseEntry = fileWithViews.views.find((v) => v.view_key === 'license_citation')

    // Show metadata onload.
    await generateMetadata()
    await checkOtherRelatedModels()

    if (viewEntry) {
      detailHTML.value = await exposureStore.getExposureSafeHTML(
        exposureId.value,
        viewEntry.exposure_file_id,
        'view',
        'index.html',
        routePath,
      )
    }

    if (licenseEntry) {
      licenseInfo.value = await exposureStore.getExposureSafeHTML(
        exposureId.value,
        licenseEntry.exposure_file_id,
        'license_citation',
        'license.txt',
        routePath,
      )
    }

    // Load codegen view with default language.
    if (props.view === 'cellml_codegen') {
      await loadCodegenView()
    }

    if (props.view === 'cellml_math') {
      await generateMath()
    }
  }
}

watch(detailHTML, async () => {
  if (detailHTML.value) {
    await nextTick()
    convertFirstTextNodeToTitle()
  }
})

watch(
  () => props.file,
  async (newFile, oldFile) => {
    if (newFile === oldFile) return
    await loadInitialView()
  },
)

watch(
  () => props.view,
  async (newView) => {
    if (newView === 'cellml_codegen') {
      await loadCodegenView()
    } else if (newView === 'cellml_math') {
      await generateMath()
    } else {
      await loadDefaultView()
    }
  },
)

onMounted(async () => {
  error.value = null

  try {
    exposureInfo.value = await exposureStore.getExposureInfo(props.alias)
    await loadInitialView()
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load exposure.'
    if (errorMessage.toLowerCase().includes('not found')) {
      error.value = {
        title: 'Exposure not found',
        message: 'The exposure you are looking for does not exist or has been removed.',
      }
    } else {
      error.value = {
        title: 'Error loading exposure',
        message: errorMessage,
      }
    }
    console.error('Error loading exposure:', err)
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <BackButton
    label="Back to exposures"
    content-section="Exposure Detail"
    :on-click="goBack"
  />

  <ErrorBlock
    v-if="error"
    :title="error.title"
    :error="error.message"
  />

  <LoadingBox v-else-if="isLoading" message="Loading exposure..." />

  <div v-else-if="exposureInfo" class="flex flex-col lg:flex-row gap-8">
    <article class="w-full lg:flex-1 lg:min-w-0 space-y-6">
      <PageHeader
        :title="pageTitle"
      />

      <div v-if="props.view === 'cellml_codegen'" class="relative">
        <nav>
          <ul class="space-x-2 mb-4 inline-flex">
            <li
              v-for="lang in CODEGEN_LANGUAGES"
              :key="lang.name"
            >
              <ActionButton
                :variant="generatedCodeFilename === lang.fileName ? 'primary' : 'secondary'"
                size="sm"
                @click="generateCode(lang.path, lang.fileName)"
              >
                {{ lang.name }}
              </ActionButton>
            </li>
          </ul>
        </nav>
        <div class="box p-0! overflow-hidden">
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <span>{{ generatedCodeFilename }}</span>
            <div class="flex items-center gap-2">
              <WrapButton :active="codeBlockRef?.isWrapped" @click="toggleCodeWrap" />
              <CopyButton :text="generatedCode" title="Copy code" />
              <ActionButton
                @click="downloadCode"
                variant="icon"
                content-section="Exposure Detail"
                tooltip="Download"
                aria-label="Download"
              >
                <DownloadIcon class="w-4 h-4" />
                <span class="sr-only">Download</span>
              </ActionButton>
            </div>
          </div>
          <CodeBlock
            ref="codeBlockRef"
            :code="generatedCode"
            :filename="generatedCodeFilename"
          />
        </div>
      </div>

      <div v-else-if="props.view === 'cellml_math'" class="box">
        <p v-if="!mathsJSON.length" class="text-sm text-gray-500 dark:text-gray-400">No mathematics content available.</p>
        <template v-else>
          <div v-for="value in mathsJSON" :key="value[0]"
            class="mb-6 pb-6 last:mb-0 last:pb-0 border-b border-gray-200 dark:border-gray-700 last:border-0"
          >
            <h4 class="font-semibold mb-4">{{ value[0] }}</h4>
            <div v-for="math in value[1]" :key="math">
              <div v-html="math" class="math-view"></div>
            </div>
          </div>
        </template>
      </div>

      <div v-else-if="detailHTML" class="box">
        <div ref="htmlViewRef" v-html="detailHTML" class="html-view"></div>
      </div>

      <div class="box p-0! overflow-hidden">
        <div class="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <span class="text-gray-600 dark:text-gray-400">
            {{ fileCountText }}
          </span>
        </div>
        <ul class="divide-y divide-gray-200 dark:divide-gray-700">
          <li
            v-for="entry in exposureInfo.files"
            :key="entry[0]"
            class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div class="px-4 py-3 flex items-center justify-between">
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <FileIcon class="text-gray-500 dark:text-gray-400 flex-shrink-0 w-4 h-4" />
                <RouterLink
                  :to="`/workspaces/${exposureInfo.workspace_alias}/file/${exposureInfo.exposure.commit_id}/${entry[0]}`"
                  class="text-link font-medium truncate"
                >
                  {{ entry[0] }}
                </RouterLink>
              </div>
              <div class="flex items-center gap-2 ml-4 flex-shrink-0">
                <ActionButton
                  @click="downloadFile(entry[0])"
                  variant="icon"
                  content-section="Exposure Detail"
                  :tooltip="`Download ${entry[0]}`"
                  :aria-label="`Download ${entry[0]}`"
                >
                  <DownloadIcon class="w-4 h-4" />
                  <span class="sr-only">Download {{ entry[0] }}</span>
                </ActionButton>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </article>
    <aside class="w-full lg:w-70 xl:w-80 lg:flex-shrink-0">
      <section class="pb-6">
        <h4 class="text-lg font-semibold mb-3">Source</h4>
        <div class="text-sm leading-relaxed">
          Derived from workspace
          <RouterLink
            :to="`/workspaces/${exposureInfo.workspace_alias}`"
            class="text-link dark:underline dark:decoration-dotted"
          >
            {{ exposureInfo.exposure.description }}
          </RouterLink>
          at changeset
          <RouterLink
            :to="`/workspaces/${exposureInfo.workspace_alias}/file/${exposureInfo.exposure.commit_id}`"
            class="text-link font-mono dark:underline dark:decoration-dotted"
          >
            {{ exposureInfo.exposure.commit_id.substring(0, 12) }}
          </RouterLink>.
        </div>
      </section>
      <section v-if="metadataJSON.model_title" class="pt-6 pb-6 border-t border-gray-200 dark:border-gray-700">
        <h4 class="text-lg font-semibold mb-3">About</h4>
        <dl class="text-sm leading-relaxed space-y-4">
          <div v-if="metadataJSON.model_title">
            <dt class="font-semibold mb-1">Model title</dt>
            <dd>{{ metadataJSON.model_title }}</dd>
          </div>
          <div v-if="metadataJSON.model_author && isValidTerm(metadataJSON.model_author)">
            <dt class="font-semibold mb-1">Model authors</dt>
            <dd>
              <button
                class="cursor-pointer hover:text-primary-hover transition-colors"
                @click="handleKeywordClick('model_author', metadataJSON.model_author!)"
              >
                {{ metadataJSON.model_author }}
              </button>
            </dd>
          </div>
          <div v-if="metadataJSON.model_author_org && isValidTerm(metadataJSON.model_author_org)">
            <dt class="font-semibold mb-1">Authoring organisation</dt>
            <dd>{{ metadataJSON.model_author_org }}</dd>
          </div>
        </dl>
      </section>
      <section v-if="metadataJSON.keywords?.length" class="pt-6 pb-6 border-t border-gray-200 dark:border-gray-700">
        <h4 class="text-lg font-semibold mb-3">Keywords</h4>
        <div class="flex flex-wrap gap-2">
          <TermButton
            v-for="term in filteredKeywords"
            :key="term"
            :term="term"
            @click="handleKeywordClick('cellml_keyword', term)"
          />
        </div>
      </section>
      <section v-if="openCORFiles.length > 0" class="pt-6 pb-6 border-t border-gray-200 dark:border-gray-700">
        <h4 class="text-lg font-semibold mb-3">Views available</h4>
        <nav>
          <ul class="space-y-2">
            <li class="text-sm">
              <ActionButton
                variant="secondary"
                size="sm"
                :href="buildOpenCORURL()"
                target="_blank"
                rel="noopener noreferrer"
                :content-section="`Exposure Detail - ${pageTitle}`"
              >
                Open with OpenCOR's Web app
              </ActionButton>
            </li>
            <li
              class="text-sm"
              v-for="view in availableViews"
              :key="view.view_key"
            >
              <ActionButton
                variant="secondary"
                size="sm"
                :to="`/exposures/${props.alias}/${exposureFilePath}/${view.view_key}`"
                content-section="Exposure Detail"
              >
                {{ view.name }}
              </ActionButton>
            </li>
          </ul>
        </nav>
      </section>
      <section v-if="navigationFiles.length > 0" class="pt-6 pb-6 border-t border-gray-200 dark:border-gray-700">
        <h4 class="text-lg font-semibold mb-3">Navigation</h4>
        <nav>
          <ul class="space-y-2">
            <li
              v-for="entry in navigationFiles"
              :key="entry[0]"
              class="text-sm"
            >
              <RouterLink
                :to="`/exposures/${props.alias}/${entry[0]}`"
                class="text-link inline-flex items-center gap-2 break-all"
              >
                <span class="text-foreground">›</span>
                {{ entry[0] }}
              </RouterLink>
            </li>
          </ul>
        </nav>
      </section>
      <section class="pt-6 pb-6 border-t border-gray-200 dark:border-gray-700">
        <h4 class="text-lg font-semibold mb-3">Downloads</h4>
        <nav>
          <ul class="space-y-2">
            <li class="text-sm">
              <ActionButton
                variant="secondary"
                size="sm"
                :disabled="isDownloadingWorkspaceZip"
                @click="handleDownloadWorkspaceArchive('zip')"
                content-section="Exposure Detail"
              >
                <LoadingIcon v-if="isDownloadingWorkspaceZip" class="w-4 h-4" />
                <DownloadIcon v-else class="w-4 h-4" />
                <span>Complete archive (as a <code class="code-inline bg-gray-100 dark:bg-gray-700">.zip</code> file)</span>
              </ActionButton>
            </li>
            <li class="text-sm">
              <ActionButton
                variant="secondary"
                size="sm"
                :disabled="isDownloadingWorkspaceTgz"
                @click="handleDownloadWorkspaceArchive('tgz')"
                content-section="Exposure Detail"
              >
                <LoadingIcon v-if="isDownloadingWorkspaceTgz" class="w-4 h-4" />
                <DownloadIcon v-else class="w-4 h-4" />
                <span>Complete archive (as a <code class="code-inline bg-gray-100 dark:bg-gray-700">.tgz</code> file)</span>
              </ActionButton>
            </li>
            <li class="text-sm">
              <ActionButton
                variant="secondary"
                size="sm"
                :disabled="isDownloadingCOMBINE"
                @click="handleDownloadCOMBINEArchive"
                content-section="Exposure Detail"
              >
                <LoadingIcon v-if="isDownloadingCOMBINE" class="w-4 h-4" />
                <DownloadIcon v-else class="w-4 h-4" />
                COMBINE archive
              </ActionButton>
            </li>
          </ul>
        </nav>
      </section>
      <section v-if="metadataJSON.citations?.length" class="pt-6 pb-6 border-t border-gray-200 dark:border-gray-700">
        <h4 class="text-lg font-semibold mb-3">References</h4>
        <ul class="space-y-4 text-sm mb-2" v-if="metadataJSON.citations && metadataJSON.citations.length > 0">
          <li v-for="citation in metadataJSON.citations" :key="citation.id">
            <div class="group p-4 pr-8 bg-gray-50 dark:bg-gray-800 rounded-md relative">
              {{ formatCitation(citation) }}
              <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <CopyButton
                  :text="formatCitation(citation)"
                  title="Copy citation"
                />
              </div>
            </div>
          </li>
        </ul>
        <div v-if="hasOtherRelatedModels" class="mb-4">
          <RouterLink
            :to="`/search?kind=citation_id&term=${metadataJSON.citation_id}`"
            class="text-link text-sm inline-flex items-center gap-2 break-all"
          >
            <span class="text-foreground">›</span>
            See other models using this reference
          </RouterLink>
        </div>
        <div>
          <button
            @click="isCitationDetailsOpen = !isCitationDetailsOpen"
            class="text-link text-sm flex items-center gap-2 text-left"
            :aria-expanded="isCitationDetailsOpen"
            aria-controls="citation-details"
          >
            <span>Details</span>
            <span
              class="transition-transform duration-200"
              :class="{ 'rotate-180': isCitationDetailsOpen }"
            >
              <ChevronDownIcon class="w-4 h-4"/>
            </span>
          </button>
          <dl
            v-if="isCitationDetailsOpen"
            id="citation-details"
            class="text-sm leading-relaxed space-y-4 mt-4"
          >
            <div v-if="metadataJSON.citation_authors">
              <dt class="font-semibold mb-1">Authors</dt>
              <dd>
                <template v-for="(authorParts, index) in metadataJSON.citation_authors" :key="index">
                  <button
                    class="cursor-pointer hover:text-primary-hover transition-colors"
                    @click="handleCitationAuthorClick(authorParts)"
                  >
                    {{ formatCitationAuthor(authorParts) }}
                  </button>
                  <span v-if="index < metadataJSON.citation_authors.length - 1">, </span>
                </template>
              </dd>
            </div>
            <div v-if="metadataJSON.citation_title">
              <dt class="font-semibold mb-1">Title</dt>
              <dd>{{ metadataJSON.citation_title }}</dd>
            </div>
            <div v-if="metadataJSON.citation_id && isValidTerm(metadataJSON.citation_id)">
              <dt class="font-semibold mb-1">ID</dt>
              <dd>
                <button
                  class="cursor-pointer hover:text-primary-hover transition-colors"
                  @click="handleKeywordClick('citation_id', metadataJSON.citation_id!)"
                >
                  {{ metadataJSON.citation_id }}
                </button>
              </dd>
            </div>
            <div v-if="metadataJSON.citation_issued">
              <dt class="font-semibold mb-1">Issued</dt>
              <dd>{{ metadataJSON.citation_issued }}</dd>
            </div>
            <div v-if="metadataJSON.citation_bibliographicCitation">
              <dt class="font-semibold mb-1">Bibliographic citation</dt>
              <dd>{{ metadataJSON.citation_bibliographicCitation }}</dd>
            </div>
          </dl>
        </div>
      </section>
      <section v-if="licenseInfo" class="pt-6 border-t border-gray-200 dark:border-gray-700">
        <h4 class="text-lg font-semibold mb-3">Licence</h4>
        <nav>
          <ul class="space-y-2">
            <li class="text-sm">
              <a :href="licenseInfo" class="text-link" target="_blank" rel="noopener noreferrer">
                {{ formatLicenseUrl(licenseInfo) }}
              </a>
            </li>
          </ul>
        </nav>
      </section>
    </aside>
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

.html-view {
  @apply text-sm;

  & :deep(a) {
    @apply text-link dark:underline dark:decoration-dotted hover:text-link-hover transition;
  }

  & :deep(h2) {
    @apply text-2xl font-semibold mt-0 mb-8;
  }

  & :deep(h3),
  & :deep(h4) {
    @apply text-xl font-semibold mt-8 mb-4;
  }

  & :deep(> div > h2),
  & :deep(> div > h3),
  & :deep(> div > h4) {
    @apply mt-0;
  }

  & :deep(dl),
  & :deep(p) {
    @apply text-sm mb-4;
  }

  & :deep(dt) {
    @apply font-semibold;
  }

  & :deep(img) {
    @apply max-w-full h-auto mx-auto;
  }

  & :deep(table) {
    @apply w-full border border-collapse border-gray-300 dark:border-gray-600 mb-4 table-fixed;
  }

  & :deep(table caption) {
    @apply text-sm font-medium mb-2;
  }

  & :deep(table td), & :deep(table th) {
    @apply border border-gray-300 dark:border-gray-600 p-2;
  }

  & :deep(table td) {
    @apply align-top text-sm;
  }
}

.math-view {
  @apply p-2 text-center text-sm overflow-auto;

  & :deep(math) {
    @apply flex flex-col gap-4;
  }
}
</style>
