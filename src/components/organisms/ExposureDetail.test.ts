import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import ExposureDetail from '@/components/organisms/ExposureDetail.vue'
import { mockExposureInfo, mockGeneratedCode, mockMetadata } from '@/mocks/exposureInfo'
import { useExposureStore } from '@/stores/exposure'
import { useSearchStore } from '@/stores/search'

// Mock Vue Router.
vi.mock('vue-router', () => ({
  useRoute: () => ({}),
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}))

// Mock analytics.
vi.mock('@/utils/analytics', () => ({
  trackButtonClick: vi.fn(),
}))

describe('ExposureDetail', () => {
  let exposureStore: ReturnType<typeof useExposureStore>
  let searchStore: ReturnType<typeof useSearchStore>

  const mountComponent = async ({
    props = {},
    stubs = {},
    generatedCode = '',
    mathsJSON = '[]',
  }: {
    props?: Partial<{
      alias: string
      file: string
      view: string
    }>
    stubs?: Record<string, unknown>
    generatedCode?: string
    mathsJSON?: string
  } = {}) => {
    vi.spyOn(exposureStore, 'getExposureInfo').mockResolvedValue(mockExposureInfo)
    vi.spyOn(exposureStore, 'getExposureSafeHTML').mockImplementation(
      async (_id, _fileId, _view, filename) => {
        if (filename === 'index.html') return '<h4>Model Status</h4>'
        if (filename === 'license.txt') return 'https://creativecommons.org/licenses/by/3.0/'
        return ''
      },
    )
    vi.spyOn(exposureStore, 'getExposureRawContent').mockImplementation(
      async (_id, _fileId, _view, filename) => {
        if (filename === 'cmeta.json') return JSON.stringify(mockMetadata)
        if (filename === 'math.json') return mathsJSON
        if (filename === 'code.C.c') return generatedCode
        return ''
      },
    )
    // Mock search results for other related models.
    vi.spyOn(searchStore, 'searchIndexTerm').mockResolvedValue([
      {
        resource_path: '/exposure/999/file.cellml',
        data: {
          aliased_uri: [],
          description: [],
          cellml_keyword: [],
          commit_authored_ts: [],
          created_ts: [],
          exposure_alias: [],
          citation_author_family_name: [],
          citation_id: [],
          model_author: [],
        },
      },
    ])

    const wrapper = mount(ExposureDetail, {
      props: {
        alias: mockExposureInfo.exposure_alias,
        file: '',
        view: '',
        ...props,
      },
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
          BackButton: true,
          CodeBlock: true,
          CopyButton: true,
          WrapButton: true,
          LoadingBox: true,
          ErrorBlock: true,
          TermButton: { template: '<button><slot /></button>' },
          ChevronDownIcon: true,
          DownloadIcon: true,
          FileIcon: true,
          ...stubs,
        },
      },
    })

    await flushPromises()
    await nextTick()

    return wrapper
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    exposureStore = useExposureStore()
    searchStore = useSearchStore()
    vi.clearAllMocks()
  })

  const mountWithError = async (errorMessage: string) => {
    vi.spyOn(exposureStore, 'getExposureInfo').mockRejectedValue(new Error(errorMessage))

    const wrapper = mount(ExposureDetail, {
      props: {
        alias: 'test-alias',
        file: '',
        view: '',
      },
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
          BackButton: true,
          CodeBlock: true,
          CopyButton: true,
          WrapButton: true,
          LoadingBox: true,
          ErrorBlock: true,
          TermButton: { template: '<button><slot /></button>' },
          ChevronDownIcon: true,
          DownloadIcon: true,
          FileIcon: true,
        },
      },
    })

    await flushPromises()
    await nextTick()

    return wrapper
  }

  it('shows "Exposure not found" error when getExposureInfo rejects with a not-found message', async () => {
    const wrapper = await mountWithError('Exposure not found')

    const errorBlock = wrapper.findComponent({ name: 'ErrorBlock' })
    expect(errorBlock.exists()).toBe(true)
    expect(errorBlock.attributes('title')).toBe('Exposure not found')
    expect(errorBlock.attributes('error')).toBe(
      'The exposure you are looking for does not exist or has been removed.',
    )
  })

  it('shows generic load error when getExposureInfo rejects with an unexpected error', async () => {
    const wrapper = await mountWithError('Network timeout')

    const errorBlock = wrapper.findComponent({ name: 'ErrorBlock' })
    expect(errorBlock.exists()).toBe(true)
    expect(errorBlock.attributes('title')).toBe('Error loading exposure')
    expect(errorBlock.attributes('error')).toBe('Network timeout')
  })

  it('renders title with correct description', async () => {
    const wrapper = await mountComponent()
    const titleText = mockExposureInfo.exposure.description

    const title = wrapper.find('h1')
    expect(title.exists()).toBe(true)
    expect(title.text()).toBe(titleText)
  })

  it('renders html-view with content', async () => {
    const wrapper = await mountComponent()

    const htmlView = wrapper.find('.html-view')
    expect(htmlView.exists()).toBe(true)

    const modelStatusHeading = htmlView.find('h4')
    expect(modelStatusHeading.exists()).toBe(true)
    expect(modelStatusHeading.text()).toBe('Model Status')
  })

  it('loads the default generated code when the codegen view is opened', async () => {
    const wrapper = await mountComponent({
      props: {
        view: 'cellml_codegen',
      },
      generatedCode: mockGeneratedCode,
      stubs: {
        CodeBlock: {
          name: 'CodeBlock',
          props: ['code', 'filename'],
          template: '<div class="code-block-stub" />',
        },
        WrapButton: {
          name: 'WrapButton',
          props: ['active'],
          template: '<button class="wrap-button-stub">Wrap</button>',
        },
        CopyButton: {
          name: 'CopyButton',
          props: ['text', 'title'],
          template: '<button class="copy-button-stub">Copy</button>',
        },
      },
    })

    expect(exposureStore.getExposureRawContent).toHaveBeenCalledWith(
      mockExposureInfo.exposure.id,
      mockExposureInfo.exposure.files?.[0]?.id ?? 598,
      'cellml_codegen',
      'code.C.c',
    )

    const codeBlock = wrapper.findComponent({ name: 'CodeBlock' })
    expect(codeBlock.exists()).toBe(true)
    expect(codeBlock.props('code')).toBe(mockGeneratedCode)
    expect(codeBlock.props('filename')).toBe('code.c')

    const codegenView = wrapper.find('article > div.relative')
    expect(codegenView.exists()).toBe(true)

    const wrapButton = codegenView.findComponent({ name: 'WrapButton' })
    expect(wrapButton.exists()).toBe(true)
    expect(wrapButton.props('active')).toBeFalsy()

    const copyButton = codegenView.findComponent({ name: 'CopyButton' })
    expect(copyButton.exists()).toBe(true)
    expect(copyButton.props('text')).toBe(mockGeneratedCode)
    expect(copyButton.props('title')).toBe('Copy code')

    const downloadButton = codegenView.find('button[aria-label="Download"]')
    expect(downloadButton.exists()).toBe(true)

    const srOnlyText = downloadButton.find('.sr-only')
    expect(srOnlyText.exists()).toBe(true)
    expect(downloadButton.attributes('aria-label')).toBe(srOnlyText.text())
    expect(srOnlyText.text()).toBe('Download')
  })

  it('calls CodeBlock.toggleWrap when clicking the wrap button in codegen view', async () => {
    const toggleWrapMock = vi.fn()

    const wrapper = await mountComponent({
      props: {
        view: 'cellml_codegen',
      },
      generatedCode: mockGeneratedCode,
      stubs: {
        CodeBlock: {
          name: 'CodeBlock',
          props: ['code', 'filename'],
          methods: {
            toggleWrap: toggleWrapMock,
          },
          template: '<div class="code-block-stub" />',
        },
        WrapButton: {
          name: 'WrapButton',
          props: ['active'],
          template: '<button class="wrap-button-stub">Wrap</button>',
        },
      },
    })

    const wrapButton = wrapper.find('.wrap-button-stub')
    expect(wrapButton.exists()).toBe(true)

    await wrapButton.trigger('click')

    expect(toggleWrapMock).toHaveBeenCalledTimes(1)
  })

  it('renders files list with 7 items', async () => {
    const wrapper = await mountComponent()

    const filesList = wrapper.find('ul.divide-y')
    expect(filesList.exists()).toBe(true)

    const listItems = filesList.findAll('li')
    expect(listItems).toHaveLength(7)

    const fileCountText = wrapper.find('.text-gray-600')
    expect(fileCountText.exists()).toBe(true)
    expect(fileCountText.text()).toContain('7 items')
  })

  it('renders "Source" section with correct content', async () => {
    const wrapper = await mountComponent()

    const sectionHeading = wrapper
      .findAll('h4')
      .find((heading) => heading.text().trim() === 'Source')

    expect(sectionHeading?.exists()).toBe(true)
    expect(sectionHeading?.text()).toBe('Source')

    const sectionContent = sectionHeading?.element.nextElementSibling?.textContent
    expect(sectionContent).toContain('Baylor, Hollingworth, Chandler, 2002')
    expect(sectionContent).toContain('29a94f9c5718')
  })

  it('renders "About" section with correct content', async () => {
    const wrapper = await mountComponent()

    const sectionHeading = wrapper
      .findAll('h4')
      .find((heading) => heading.text().trim() === 'About')

    expect(sectionHeading?.exists()).toBe(true)
    expect(sectionHeading?.text()).toBe('About')

    const sectionContent = sectionHeading?.element.nextElementSibling?.textContent
    expect(sectionContent).toContain('Comparison of Simulated and Measured Calcium Sparks')
    expect(sectionContent).toContain('in Intact Skeletal Muscle Fibers of the Frog')
    expect(sectionContent).toContain('Catherine Lloyd')
    expect(sectionContent).toContain('Auckland Bioengineering Institute')
    expect(sectionContent).toContain('The University of Auckland')
  })

  it('renders "Keywords" section with correct content', async () => {
    const wrapper = await mountComponent()

    const sectionHeading = wrapper
      .findAll('h4')
      .find((heading) => heading.text().trim() === 'Keywords')

    expect(sectionHeading?.exists()).toBe(true)
    expect(sectionHeading?.text()).toBe('Keywords')

    const sectionContent = sectionHeading?.element.nextElementSibling
    const keywordButtons = sectionContent?.querySelectorAll('button')
    expect(keywordButtons).toHaveLength(2)
  })

  it('renders "Views available" section', async () => {
    const wrapper = await mountComponent()

    const sectionHeading = wrapper
      .findAll('h4')
      .find((heading) => heading.text().trim() === 'Views available')

    expect(sectionHeading?.exists()).toBe(true)
    expect(sectionHeading?.text()).toBe('Views available')

    const sectionContent = sectionHeading?.element.nextElementSibling
    const viewItems = sectionContent?.querySelectorAll('li')
    expect(viewItems).toHaveLength(3)
  })

  it('renders "Open with OpenCOR\'s Web app" link that opens in new tab', async () => {
    const wrapper = await mountComponent()

    const openCorLink = wrapper
      .findAll('a')
      .find((link) => link.text().trim() === "Open with OpenCOR's Web app")

    expect(openCorLink?.exists()).toBe(true)
    expect(openCorLink?.attributes('target')).toBe('_blank')
    expect(openCorLink?.attributes('rel')).toBe('noopener noreferrer')
  })

  it('renders "Navigation" section', async () => {
    const wrapper = await mountComponent()

    const sectionHeading = wrapper
      .findAll('h4')
      .find((heading) => heading.text().trim() === 'Navigation')

    expect(sectionHeading?.exists()).toBe(true)
    expect(sectionHeading?.text()).toBe('Navigation')

    const sectionContent = sectionHeading?.element.nextElementSibling
    const viewItems = sectionContent?.querySelectorAll('li')
    expect(viewItems).toHaveLength(6)
  })

  it('renders "Downloads" section', async () => {
    const wrapper = await mountComponent()

    const sectionHeading = wrapper
      .findAll('h4')
      .find((heading) => heading.text().trim() === 'Downloads')

    expect(sectionHeading?.exists()).toBe(true)
    expect(sectionHeading?.text()).toBe('Downloads')

    const sectionContent = sectionHeading?.element.nextElementSibling
    const viewItems = sectionContent?.querySelectorAll('li')
    expect(viewItems).toHaveLength(3)
  })

  it('renders "References" section with citations', async () => {
    const wrapper = await mountComponent()

    const sectionHeading = wrapper
      .findAll('h4')
      .find((heading) => heading.text().trim() === 'References')

    expect(sectionHeading?.exists()).toBe(true)
    expect(sectionHeading?.text()).toBe('References')

    const citationList = sectionHeading?.element.nextElementSibling
    const citationItems = citationList?.querySelectorAll('li')
    expect(citationItems?.length).toBeGreaterThan(0)
    expect(citationList?.textContent).toContain(
      'Baylor, S. M., Hollingworth, S., & Chandler, W. K. (2002)',
    )
    expect(citationList?.textContent).toContain(
      'Comparison of Simulated and Measured Calcium Sparks',
    )
    expect(citationList?.textContent).toContain('in Intact Skeletal Muscle Fibers of the Frog.')
    expect(citationList?.textContent).toContain('Journal of General Physiology, 120, 349-368.')

    const citationReferenceLink = citationList?.nextElementSibling
    expect(citationReferenceLink).toBeDefined()
    expect(citationReferenceLink?.textContent).toContain('See other models using this reference')

    const citationDetails = citationReferenceLink?.nextElementSibling
    expect(citationDetails).toBeDefined()
    const citationDetailsButton = citationDetails?.querySelector('button')
    expect(citationDetailsButton?.textContent).toBe('Details')

    citationDetailsButton?.dispatchEvent(new Event('click'))
    return nextTick().then(() => {
      const citationModal = wrapper.find('#citation-details')
      expect(citationModal.exists()).toBe(true)
      expect(citationModal.text()).toContain('S M. Baylor, S Hollingworth, W K. Chandler')
      expect(citationModal.text()).toContain('Comparison of Simulated and Measured Calcium Sparks')
      expect(citationModal.text()).toContain('in Intact Skeletal Muscle Fibers of the Frog')
      expect(citationModal.text()).toContain('urn:miriam:pubmed:12198091')
      expect(citationModal.text()).toContain('2002-09-01')
      expect(citationModal.text()).toContain('Journal of General Physiology')
    })
  })

  it('renders "Licence" section', async () => {
    const wrapper = await mountComponent()

    const sectionHeading = wrapper
      .findAll('h4')
      .find((heading) => heading.text().trim() === 'Licence')

    expect(sectionHeading?.exists()).toBe(true)
    expect(sectionHeading?.text()).toBe('Licence')

    const sectionContent = sectionHeading?.element.nextElementSibling?.textContent
    expect(sectionContent).toContain('CC BY 3.0')
  })

  describe('cellml_math view', () => {
    it('filters out entries with empty math arrays and renders only non-empty ones', async () => {
      const mathData = JSON.stringify([
        ['Component A', ['<math>x</math>', '<math>y</math>']],
        ['Component B', []],
        ['Component C', ['<math>z</math>']],
      ])

      const wrapper = await mountComponent({
        props: { view: 'cellml_math' },
        mathsJSON: mathData,
      })

      const mathBox = wrapper.find('.box')
      expect(mathBox.exists()).toBe(true)

      // Only the two non-empty components should have headings.
      const sectionHeadings = mathBox.findAll('h4')
      expect(sectionHeadings).toHaveLength(2)
      expect(sectionHeadings[0].text()).toBe('Component A')
      expect(sectionHeadings[1].text()).toBe('Component C')

      // The empty-array entry title must not appear.
      expect(mathBox.text()).not.toContain('Component B')
    })

    it('shows empty-state message and not the HTML view when all math sections are filtered out', async () => {
      const mathData = JSON.stringify([
        ['Component A', []],
        ['Component B', []],
      ])

      const wrapper = await mountComponent({
        props: { view: 'cellml_math' },
        mathsJSON: mathData,
      })

      // Empty-state message must be visible.
      const emptyMessage = wrapper.find('p.text-sm')
      expect(emptyMessage.exists()).toBe(true)
      expect(emptyMessage.text()).toBe('No mathematics content available.')

      // Must NOT fall through to the detailHTML block.
      expect(wrapper.find('.html-view').exists()).toBe(false)
    })
  })
})
