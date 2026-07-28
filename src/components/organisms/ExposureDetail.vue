<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ActionButton from '@/components/atoms/ActionButton.vue'
import BackButton from '@/components/atoms/BackButton.vue'
import Citation from '@/components/atoms/Citation.vue'
import CodeBlock from '@/components/atoms/CodeBlock.vue'
import CopyButton from '@/components/atoms/CopyButton.vue'
import LoadingBox from '@/components/atoms/LoadingBox.vue'
import TermButton from '@/components/atoms/TermButton.vue'
import WrapButton from '@/components/atoms/WrapButton.vue'
import ChevronDownIcon from '@/components/icons/ChevronDownIcon.vue'
import DownloadIcon from '@/components/icons/DownloadIcon.vue'
import ExternalLinkIcon from '@/components/icons/ExternalLinkIcon.vue'
import LoadingIcon from '@/components/icons/LoadingIcon.vue'
import ErrorBlock from '@/components/molecules/ErrorBlock.vue'
import MathTransformOptions from '@/components/molecules/MathTransformOptions.vue'
import PageHeader from '@/components/molecules/PageHeader.vue'
import WorkspaceFileBrowser from '@/components/molecules/WorkspaceFileBrowser.vue'
import { useBackNavigation } from '@/composables/useBackNavigation'
import { TITLE } from '@/constants/global'
import { downloadCOMBINEArchive, downloadWorkspaceArchive } from '@/services/downloadUrlService'
import { useExposureStore } from '@/stores/exposure'
import { useSearchStore } from '@/stores/search'
import type { ErrorInfo } from '@/types/error'
import type { ExposureInfo, Metadata, ViewEntry } from '@/types/exposure'
import type { MathMLFormatOptions } from '@/types/mathml'
import { formatCitation, formatCitationAuthor, parseFullNameToAuthor } from '@/utils/citation'
import { downloadFileFromContent } from '@/utils/download'
import {
  generateExposureTitle,
  getExposureIdFromResourcePath,
  resolveExposureFileTitle,
} from '@/utils/exposure'
import { getFileExtension, isOpenCORFile } from '@/utils/file'
import { formatYear } from '@/utils/format'
import { formatLicenseUrl } from '@/utils/license'
import { formatMathMLTable, initMathPolyfills, transformMathString } from '@/utils/mathTransformer'
import { buildSearchQuery, isValidTerm } from '@/utils/search'

type ExposureFileEntry = ExposureInfo['files'][number]

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
const DEFAULT_MATH_FORMAT_OPTIONS: Required<MathMLFormatOptions> = {
  digitGrouping: false,
  greekSymbols: false,
  subscripts: false,
}

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
const codeWrapActive = ref(false)
const rawMathsData = ref<[string, string[]][]>([])
const mathFormatOptions = ref<MathMLFormatOptions>({ ...DEFAULT_MATH_FORMAT_OPTIONS })
const mathsJSON = computed<[string, string[]][]>(() => {
  const appliedOptions = Object.values(mathFormatOptions.value).some(Boolean)
    ? mathFormatOptions.value
    : DEFAULT_MATH_FORMAT_OPTIONS

  return rawMathsData.value.map((entry): [string, string[]] => {
    const mathMLArray = entry[1].map((mathML) =>
      formatMathMLTable(mathML, {
        digitGrouping: appliedOptions.digitGrouping,
        greekSymbols: appliedOptions.greekSymbols,
        subscripts: appliedOptions.subscripts,
      }),
    )
    return [entry[0], mathMLArray]
  })
})
const metadataJSON = ref<Metadata>({})
const htmlViewRef = ref<HTMLElement | null>(null)
const licenseInfo = ref<string>(DEFAULT_LICENSE)
const availableViews = ref<ViewEntry[]>([])
const isCitationDetailsOpen = ref(false)
const hasOtherRelatedModels = ref(false)
const isDownloadingWorkspaceZip = ref(false)
const isDownloadingWorkspaceTgz = ref(false)
const isDownloadingCOMBINE = ref(false)
const loadedFileTitle = ref('')
const { goBack } = useBackNavigation('/exposures')

const router = useRouter()
const route = useRoute()
const searchStore = useSearchStore()

const fileBrowserPath = computed(() => {
  const p = route.query.path
  return typeof p === 'string' ? p : undefined
})

// Generates a citation URL from the current route, excluding query parameters and the hash.
// It resolves the application's base path from vite.config to construct the complete URL.
// It also maintains reactivity for navigations.
const citationUrl = computed(() => {
  const resolved = router.resolve({ name: route.name, params: route.params })
  const resolvedURL = new URL(resolved.href, window.location.origin)
  const decodedHref = decodeURIComponent(resolved.href)

  return resolvedURL.origin + decodedHref
})

const handleFileBrowserFolderClick = (name: string) => {
  const currentPath = fileBrowserPath.value
  const newPath = currentPath ? `${currentPath}/${name}` : name
  router.push({ query: { ...route.query, path: newPath } })
}

const handleFileBrowserPathChange = (newPath: string | undefined) => {
  const { path: _removed, ...restQuery } = route.query
  router.push({ query: newPath ? { ...restQuery, path: newPath } : restQuery })
}

// This route path is used to fix relative paths in the HTML content.
// It is not a part of the API request parameters.
// Note: Keep as "exposure" (singular) to match server file paths, not the router path.
const routePath = `/exposure/${props.alias}`

const loadTitle = async (file: string) =>
  resolveExposureFileTitle(props.alias, file, (request) => searchStore.searchQuery(request))

const refreshLoadedFileTitle = async () => {
  loadedFileTitle.value = ''

  if (!props.file) {
    return
  }

  try {
    loadedFileTitle.value = await loadTitle(props.file)
  } catch (err) {
    console.error('Error loading exposure title:', err)
  }
}

const exposureTitle = computed(() => {
  if (loadedFileTitle.value) {
    return loadedFileTitle.value
  }

  return generateExposureTitle(
    exposureInfo.value?.exposure.description,
    exposureInfo.value?.exposure.id,
    false,
  )
})

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

  return exposureTitle.value
})

const openCORFiles = computed(() => {
  if (!exposureInfo.value) return []

  return exposureInfo.value.files.filter((entry) => {
    if (props.file) {
      return entry[0] === props.file && isOpenCORFile(entry[0])
    }
    return isOpenCORFile(entry[0])
  })
})

const navigationFiles = computed(() => {
  if (!exposureInfo.value) return []

  return exposureInfo.value.files.filter((entry) => entry[1] === true)
})

const createdYear = computed(() => {
  if (!exposureInfo.value) return ''

  return formatYear(exposureInfo.value.exposure.created_ts)
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

const getOpenCORFilesToOpen = (files: ExposureFileEntry[], targetFile?: string) => {
  let openCORFilesToOpen = files
  const selectedCellmlFile = props.file?.endsWith('.cellml')
    ? files.find((entry) => entry[0] === props.file)
    : undefined

  if (targetFile) {
    openCORFilesToOpen = files.filter((entry) => entry[0] === targetFile)
  } else if (selectedCellmlFile) {
    openCORFilesToOpen = [selectedCellmlFile]
  }

  return openCORFilesToOpen
}

const getOrder = (filename: string) => {
  const extension = getFileExtension(filename)

  if (extension === 'cellml') return 1
  if (extension === 'sedml') return 2
  if (extension === 'omex') return 3
  return 4
}

const sortOpenCORFiles = (files: ExposureFileEntry[]) => {
  return [...files].sort((a, b) => getOrder(a[0]) - getOrder(b[0]))
}

const generateOpenCORLink = (files: ExposureFileEntry[], baseURL: string, option?: string) => {
  const fileURLs = files.map((entry) => `${baseURL}/${entry[0]}`).join('%7C')
  const command = files.length > 1 ? 'openFiles' : 'openFile'
  const opencorLink = `opencor://${command}/${fileURLs}`

  if (option !== 'desktop') {
    return `//opencor.ws/app/?${opencorLink}`
  }
  return opencorLink
}

const buildOpenCORURL = (option?: string, targetFile?: string) => {
  if (!exposureInfo.value || openCORFiles.value.length === 0) return ''

  const baseURL = `${exposureInfo.value.workspace.url}rawfile/${exposureInfo.value.exposure.commit_id}`
  const filesToOpen = getOpenCORFilesToOpen(openCORFiles.value, targetFile)
  const sortedFiles = sortOpenCORFiles(filesToOpen)

  return generateOpenCORLink(sortedFiles, baseURL, option)
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
  codeWrapActive.value = !codeWrapActive.value
}

const generateMath = async () => {
  error.value = null

  await initMathPolyfills()

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
    rawMathsData.value = filteredMathsJSON.map((entry): [string, string[]] => {
      const mathMLArray = entry[1].map((mathML) => transformMathString(mathML))
      return [entry[0], mathMLArray]
    })
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
  // Only load the HTML view if we have the necessary exposure ID and file ID.
  if (exposureId.value && exposureFileId.value) {
    detailHTML.value = await exposureStore.getExposureSafeHTML(
      exposureId.value,
      exposureFileId.value,
      'view',
      'index.html',
      routePath,
    )
  }
}

const loadCodegenView = async () => {
  if (!exposureInfo.value) return
  // Load code generation view with the first language as default.
  await generateCode(
    CODEGEN_LANGUAGES[0]?.path || 'code.C.c',
    CODEGEN_LANGUAGES[0]?.fileName || 'code.c',
  )
}

const isAboutSectionAvailable = computed(() => {
  return (
    metadataJSON.value.model_title ||
    metadataJSON.value.model_author_org ||
    (metadataJSON.value.model_author && isValidTerm(metadataJSON.value.model_author))
  )
})

const citationTitle = computed(() => {
  return metadataJSON.value.model_title || exposureTitle.value
})

const citationAuthors = computed(() => {
  if (!metadataJSON.value.model_author) return []
  const author = parseFullNameToAuthor(metadataJSON.value.model_author)
  return author ? [author] : []
})

const modelCitation = computed(() => {
  return {
    title: citationTitle.value,
    authors: citationAuthors.value,
    issued: createdYear.value,
    url: citationUrl.value,
    publisher: TITLE,
  }
})

// Although metadataJSON.value.citations is an array,
// it contains only one citation because metadataJSON.value.citation_id and citation_title are single values.
const publicationCitation = computed(() => {
  return metadataJSON.value.citations?.length ? metadataJSON.value.citations[0] : null
})

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

// Reset all state variables that are specific to a file or view.
const resetState = () => {
  availableViews.value = []
  detailHTML.value = ''
  exposureFileId.value = Number.NaN
  exposureFilePath.value = ''
  generatedCode.value = ''
  generatedCodeFilename.value = ''
  hasOtherRelatedModels.value = false
  licenseInfo.value = DEFAULT_LICENSE
  metadataJSON.value = {}
  rawMathsData.value = []
}

const loadInitialView = async () => {
  if (!exposureInfo.value) return

  // Reset per-file state before selecting a new file to avoid stale view content.
  resetState()
  exposureId.value = exposureInfo.value.exposure?.id
  const exposureFiles = exposureInfo.value.exposure?.files || []
  const filesWithViews = exposureFiles.filter((file) => file.views?.length > 0)
  const defaultFileWithViews =
    filesWithViews.find((file) => file.workspace_file_path.endsWith('.cellml')) || filesWithViews[0]
  let fileWithViews: (typeof filesWithViews)[number] | undefined = defaultFileWithViews

  if (props.file) {
    exposureFilePath.value = props.file
    fileWithViews = filesWithViews.find((file) => file.workspace_file_path === props.file)
  } else {
    exposureFilePath.value = defaultFileWithViews?.workspace_file_path || ''
  }

  if (!fileWithViews) {
    return
  }

  availableViews.value = AVAILABLE_VIEWS.filter((view) =>
    fileWithViews.views.some((v) => v.view_key === view.view_key),
  )
  exposureFileId.value = fileWithViews.id
  exposureFilePath.value = fileWithViews.workspace_file_path
  exposureId.value = fileWithViews.exposure_id

  const viewEntry = fileWithViews.views.find((v) => v.view_key === 'view')
  const licenseEntry = fileWithViews.views.find((v) => v.view_key === 'license_citation')
  const metaEntry = fileWithViews.views.find((v) => v.view_key === 'cellml_metadata')

  // Show metadata onload.
  if (metaEntry) {
    await generateMetadata()
  }
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
    void refreshLoadedFileTitle()
    await loadInitialView()
  },
)

watch(
  () => props.alias,
  async (newAlias, oldAlias) => {
    if (newAlias === oldAlias) return
    await refreshLoadedFileTitle()
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
    void refreshLoadedFileTitle()
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
              <WrapButton :active="codeWrapActive" @click="toggleCodeWrap" />
              <CopyButton :text="generatedCode" title="Copy code" />
              <ActionButton
                @click="downloadCode"
                variant="icon"
                size="sm"
                content-section="Exposure Detail"
                tooltip="Download"
                :aria-label="`Download ${generatedCodeFilename}`"
              >
                <DownloadIcon class="w-4 h-4" />
                <span class="sr-only">Download {{ generatedCodeFilename }}</span>
              </ActionButton>
            </div>
          </div>
          <CodeBlock
            :code="generatedCode"
            :filename="generatedCodeFilename"
            :startWrapped="codeWrapActive"
          />
        </div>
      </div>

      <div v-else-if="props.view === 'cellml_math'" class="box p-0!">
        <MathTransformOptions
          :has-maths-data="rawMathsData.length > 0"
          :options="mathFormatOptions"
          @update:options="mathFormatOptions = $event"
        />
        <div class="p-4">
          <p v-if="!mathsJSON.length" class="text-sm text-gray-500 dark:text-gray-400">No mathematics content available.</p>
          <template v-else>
            <div v-for="value in mathsJSON" :key="value[0]"
              class="mb-6 pb-6 last:mb-0 last:pb-0 border-b border-gray-200 dark:border-gray-700 last:border-0"
            >
              <h4 class="font-semibold mb-4">{{ value[0] }}</h4>
              <div v-for="(math, mathIndex) in value[1]" :key="`${value[0]}-${mathIndex}`">
                <div v-html="math" class="math-view"></div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <div v-else-if="detailHTML" class="box">
        <div ref="htmlViewRef" v-html="detailHTML" class="html-view"></div>
      </div>

      <WorkspaceFileBrowser
        :alias="exposureInfo.workspace_alias"
        :commit-id="exposureInfo.exposure.commit_id"
        :path="fileBrowserPath"
        :on-folder-click="handleFileBrowserFolderClick"
        :on-path-change="handleFileBrowserPathChange"
      />
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
      <section
        v-if="isAboutSectionAvailable"
        class="pt-6 pb-6 border-t border-gray-200 dark:border-gray-700"
      >
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
      <section class="pt-6 pb-6 border-t border-gray-200 dark:border-gray-700">
        <div class="flex flex-row justify-between mb-3">
          <h4 class="text-lg font-semibold">Citation</h4>
          <CopyButton
            :text="formatCitation(modelCitation)"
            title="Copy citation"
            :withHTML="true"
          />
        </div>
        <Citation :content="formatCitation(modelCitation)" />
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
                <ExternalLinkIcon class="w-4 h-4" />
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
                class="inline-flex items-center gap-2 break-all transition-colors"
                :class="
                  props.file === entry[0]
                    ? 'text-foreground dark:text-primary cursor-default'
                    : 'text-link'
                "
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
      <section v-if="publicationCitation" class="pt-6 pb-6 border-t border-gray-200 dark:border-gray-700">
        <div class="flex flex-row justify-between mb-3">
          <h4 class="text-lg font-semibold">References</h4>
          <CopyButton
            :text="formatCitation(publicationCitation)"
            title="Copy citation"
          />
        </div>
        <Citation
          :content="formatCitation(publicationCitation)"
          class="mb-4"
        />
        <div v-if="hasOtherRelatedModels" class="mb-4">
          <RouterLink
            :to="{ path: '/search', query: { citation_id: metadataJSON.citation_id } }"
            class="text-link text-sm inline-flex items-center gap-2 break-all"
          >
            <span class="text-foreground">›</span>
            See other models using this reference
          </RouterLink>
        </div>
        <div class="mt-4">
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

  & :deep(h1) {
    @apply text-3xl font-bold mt-8 mb-8;
  }

  & :deep(> h1:first-child),
  & :deep(> div > h1:first-child) {
    @apply mt-0;
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

  & :deep(blockquote) {
    @apply border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-600 dark:text-gray-400 my-4;
  }

  & :deep(ul) {
    @apply list-disc pl-6 mb-4;
  }

  & :deep(ol) {
    @apply list-decimal pl-6 mb-4;
  }

  & :deep(li) {
    @apply mb-2;

    p {
      @apply mb-0;
    }

    p + p {
      @apply mt-2;
    }
  }

  & :deep(dd) {
    @apply pl-4 mb-2;
  }

  & :deep(strong),
  & :deep(b) {
    @apply font-semibold;
  }

  & :deep(em),
  & :deep(i) {
    @apply italic;
  }

  & :deep(code) {
    @apply font-mono bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded text-sm px-1 py-[0.125em];
  }

  & :deep(pre) {
    @apply bg-gray-100 dark:bg-gray-800 rounded p-4 overflow-auto mb-4 text-sm font-mono;
  }

  & :deep(pre code) {
    @apply bg-transparent p-0;
  }

  & :deep(hr) {
    @apply border-t border-gray-300 dark:border-gray-600 my-6;
  }
}

.math-view {
  @apply p-2 text-center text-base overflow-auto;

  & :deep(math > mtable) {
    border-spacing: 0.5em 0.75em;
  }

  & :deep(math mi),
  & :deep(math mo),
  & :deep(math mn) {
    line-height: 1.4;
    padding-left: 0.05em;
    padding-right: 0.05em;
  }

  & :deep(math mi) {
    font-style: italic;
  }

  /* Override sup and sub script text size for nested levels. */
  & :deep(math msub > msub > :nth-child(2)),
  & :deep(math msup > :nth-child(2)) {
    font-size: 0.7rem;
  }

  & :deep(math msub > msub + mi),
  & :deep(math msup msup > :nth-child(2)) {
    font-size: 0.58rem;
  }

  /* Keep first-level fraction content at the parent math font size. */
  & :deep(math mfrac > :first-child),
  & :deep(math mfrac > :nth-child(2)) {
    font-size: 1em;
  }

  & :deep(math mfrac > :first-child) {
    padding-bottom: 0.14em;
  }

  & :deep(math mfrac > :nth-child(2)) {
    padding-top: 0.14em;
  }

  & :deep(math > mtable > mtr + mtr > mtd) {
    padding-top: 0.5em;
  }

  & :deep(math > mtable > mtr > mtd:nth-child(1)) {
    display: flex;
    justify-content: flex-end;
    padding-right: 0.5em;
  }

  & :deep(math > mtable > mtr > mtd[data-math-operator='equals']) {
    text-align: center;
    padding-left: 0.25em;
    padding-right: 0.25em;
  }

  & :deep(math > mtable > mtr > mtd:nth-child(3)) {
    text-align: left;
    padding-left: 0.5em;
  }

  & :deep(mtable[data-math-piecewise='true']) {
    border-spacing: 0.5em 0.35em;
  }

  & :deep(mtable[data-math-piecewise='true'] > mtr > mtd[data-math-piecewise='expression']) {
    white-space: nowrap;
  }

  & :deep(mtable[data-math-piecewise='true'] > mtr > mtd[data-math-piecewise='keyword']) {
    text-align: left;
    white-space: nowrap;
    padding-left: 0.15em;
    padding-right: 0.35em;
  }

  & :deep(mtable[data-math-piecewise='true'] > mtr > mtd[data-math-piecewise='condition']) {
    white-space: nowrap;
  }
}
</style>
