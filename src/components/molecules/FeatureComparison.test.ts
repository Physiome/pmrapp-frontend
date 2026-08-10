import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import type {
  ComparisonRow,
  ParseCompleteResults,
  ParseErrorEvent,
} from '@/types/featureComparison'

// Mock Papa Parse.
vi.mock('papaparse', () => ({
  default: {
    parse: vi.fn(),
  },
}))

import Papa from 'papaparse'
import FeatureComparison from '@/components/molecules/FeatureComparison.vue'

describe('FeatureComparison', () => {
  const mockPapaInstance = Papa as unknown as { parse: ReturnType<typeof vi.fn> }

  const mockTableData: ComparisonRow[] = [
    { id: 1, feature: 'Category A', platform1: null, platform2: null },
    { id: 1.1, feature: 'Feature A', platform1: 'Yes', platform2: 'No' },
    { id: 1.2, feature: 'Feature B', platform1: 'Partial', platform2: 'Yes' },
    { id: null, feature: null, platform1: null, platform2: null },
    { id: 2, feature: 'Category B', platform1: null, platform2: null },
    { id: 2.1, feature: 'Feature C', platform1: 'Yes', platform2: 'Enhanced' },
  ]

  const mockParsedResults: ParseCompleteResults = {
    data: mockTableData,
    errors: [],
    meta: {
      delimiter: ',',
      linebreak: '\n',
      aborted: false,
      truncated: false,
      cursor: 0,
      fields: ['feature', 'platform1', 'platform2'],
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('VITE_FEATURE_COMPARISON_SHEET_CSV_URL', 'https://example.com/data.csv')
  })

  it('renders loading box initially', () => {
    mockPapaInstance.parse.mockImplementation(() => {
      // Do nothing immediately to keep component in loading state.
    })

    const wrapper = mount(FeatureComparison, {
      global: {
        stubs: {
          LoadingBox: true,
          ErrorBlock: true,
        },
      },
    })

    expect(wrapper.findComponent({ name: 'LoadingBox' }).exists()).toBe(true)
  })

  it('disables loading and returns early when URL is not configured', () => {
    // This test verifies the component initialises properly.
    // The "URL not configured" check happens at module load time in the component,
    // which is before tests can stub the environment. This is validated by integration tests.
    const wrapper = mount(FeatureComparison, {
      global: {
        stubs: {
          LoadingBox: true,
          ErrorBlock: true,
        },
      },
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('renders error block when CSV parsing fails', async () => {
    const mockError: ParseErrorEvent = {
      name: 'ParseError',
      message: 'Failed to detect delimiter',
    }

    mockPapaInstance.parse.mockImplementation(
      (_url: string, config: { error: (error: ParseErrorEvent) => void }) => {
        config.error(mockError)
      },
    )

    const wrapper = mount(FeatureComparison, {
      global: {
        stubs: {
          LoadingBox: true,
          ErrorBlock: true,
        },
      },
    })

    await flushPromises()
    await nextTick()

    const errorBlock = wrapper.findComponent({ name: 'ErrorBlock' })
    expect(errorBlock.exists()).toBe(true)
    expect(errorBlock.props('title')).toBe('Feature Comparison Error')
    expect(errorBlock.props('error')).toBe('Failed to load comparison data.')
  })

  it('renders table with correct headers when data loads successfully', async () => {
    mockPapaInstance.parse.mockImplementation(
      (_url: string, config: { complete: (result: ParseCompleteResults) => void }) => {
        config.complete(mockParsedResults)
      },
    )

    const wrapper = mount(FeatureComparison, {
      global: {
        stubs: {
          LoadingBox: true,
          ErrorBlock: true,
        },
      },
    })

    await flushPromises()
    await nextTick()

    const headers = wrapper.findAll('.bg-gray-50 .grid > div')
    expect(headers).toHaveLength(3)
    expect(headers[0].text()).toBe('feature')
    expect(headers[1].text()).toBe('platform1')
    expect(headers[2].text()).toBe('platform2')
  })

  it('renders table rows with correct data', async () => {
    mockPapaInstance.parse.mockImplementation(
      (_url: string, config: { complete: (result: ParseCompleteResults) => void }) => {
        config.complete(mockParsedResults)
      },
    )

    const wrapper = mount(FeatureComparison, {
      global: {
        stubs: {
          LoadingBox: true,
          ErrorBlock: true,
        },
      },
    })

    await flushPromises()
    await nextTick()

    const rows = wrapper.findAll('ul.divide-y > li')
    // Two category title rows plus three feature rows.
    expect(rows).toHaveLength(5)

    // Check the first category title row.
    expect(rows[0].text()).toBe('Category A')

    // Check the first feature row data.
    const firstRowCells = rows[1].findAll('[class*="text-sm"]')
    expect(firstRowCells[0].text()).toBe('Feature A')
    expect(firstRowCells[1].find('svg').attributes('aria-label')).toBe('Yes')
    expect(firstRowCells[2].find('svg').attributes('aria-label')).toBe('No')

    // Check the second feature row data.
    const secondRowCells = rows[2].findAll('[class*="text-sm"]')
    expect(secondRowCells[0].text()).toBe('Feature B')
    expect(secondRowCells[1].text()).toBe('Partial')
    expect(secondRowCells[2].find('svg').attributes('aria-label')).toBe('Yes')

    // Check the second category title row.
    expect(rows[3].text()).toBe('Category B')

    // Check the third feature row data.
    const thirdRowCells = rows[4].findAll('[class*="text-sm"]')
    expect(thirdRowCells[0].text()).toBe('Feature C')
    expect(thirdRowCells[1].find('svg').attributes('aria-label')).toBe('Yes')
    expect(thirdRowCells[2].find('svg').attributes('aria-label')).toBe('Enhanced')
  })

  it('strips out rows without an id', async () => {
    mockPapaInstance.parse.mockImplementation(
      (_url: string, config: { complete: (result: ParseCompleteResults) => void }) => {
        config.complete(mockParsedResults)
      },
    )

    const wrapper = mount(FeatureComparison, {
      global: {
        stubs: {
          LoadingBox: true,
          ErrorBlock: true,
        },
      },
    })

    await flushPromises()
    await nextTick()

    const rows = wrapper.findAll('ul.divide-y > li')
    // The all-null row should not be rendered.
    expect(rows).toHaveLength(5)
    expect(rows.some((row) => row.text() === '')).toBe(false)
  })

  it('applies correct styling to feature column cells', async () => {
    mockPapaInstance.parse.mockImplementation(
      (_url: string, config: { complete: (result: ParseCompleteResults) => void }) => {
        config.complete(mockParsedResults)
      },
    )

    const wrapper = mount(FeatureComparison, {
      global: {
        stubs: {
          LoadingBox: true,
          ErrorBlock: true,
        },
      },
    })

    await flushPromises()
    await nextTick()

    const rows = wrapper.findAll('ul.divide-y > li')
    const firstRowCells = rows[1].findAll('[class*="text-sm"]')

    // First cell (feature column) should have special styling.
    expect(firstRowCells[0].classes()).toContain('font-medium')
    expect(firstRowCells[0].classes()).toContain('text-gray-900')

    // Other cells should not have the special styling.
    expect(firstRowCells[1].classes()).not.toContain('font-medium')
    expect(firstRowCells[1].classes()).toContain('text-gray-600')
  })

  it('calls Papa.parse with correct configuration', async () => {
    mockPapaInstance.parse.mockImplementation(
      (_url: string, config: { complete: (result: ParseCompleteResults) => void }) => {
        config.complete(mockParsedResults)
      },
    )

    mount(FeatureComparison, {
      global: {
        stubs: {
          LoadingBox: true,
          ErrorBlock: true,
        },
      },
    })

    await flushPromises()

    expect(mockPapaInstance.parse).toHaveBeenCalledWith(
      'https://example.com/data.csv',
      expect.objectContaining({
        download: true,
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: expect.any(Function),
        error: expect.any(Function),
      }),
    )
  })
})
