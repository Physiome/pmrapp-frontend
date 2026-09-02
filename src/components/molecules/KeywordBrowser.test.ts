import { mount, type VueWrapper } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import KeywordBrowser from '@/components/molecules/KeywordBrowser.vue'
import { createPinia, setActivePinia } from 'pinia'
import { useSearchStore } from '@/stores/search'
import type { IndexKindResponse } from '@/types/search'

const createKindInfo = (terms: string[]): IndexKindResponse => ({
  kind: { id: 1, description: 'CellML keyword' },
  terms,
})

// Mock child components.
vi.mock('@/components/atoms/SearchField.vue', () => ({
  default: {
    name: 'SearchField',
    template:
      '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'placeholder', 'ariaLabel', 'inputClass'],
    emits: ['update:modelValue'],
  },
}))

vi.mock('@/components/atoms/TermButton.vue', () => ({
  default: {
    name: 'TermButton',
    template: '<button @click="$emit(\'click\')">{{ term }}</button>',
    props: ['term'],
    emits: ['click'],
  },
}))

// Mock utility functions.
vi.mock('@/utils/search', () => ({
  buildSearchQuery: vi.fn((kind, term, query) => ({
    ...query,
    kind,
    term,
  })),
  isValidTerm: vi.fn((term) => term && term.length > 0),
}))

describe('KeywordBrowser', () => {
  let wrapper: VueWrapper
  let searchStore: ReturnType<typeof useSearchStore>

  beforeEach(() => {
    // Create a fresh Pinia instance for each test.
    setActivePinia(createPinia())

    // Initialise the search store.
    searchStore = useSearchStore()
  })

  const createWrapper = (props = {}) => {
    return mount(KeywordBrowser, {
      props: { inSidebar: false, ...props },
      global: {
        stubs: {
          SearchField: true,
          TermButton: true,
        },
      },
    })
  }

  it('renders the loading state while categories are being fetched', () => {
    searchStore.isLoading = true
    searchStore.categories = []

    wrapper = createWrapper()
    expect(wrapper.text()).toContain('Loading categories...')
    wrapper.unmount()
  })

  it('renders the error state when the search store has an error', () => {
    searchStore.isLoading = false
    searchStore.error = 'Failed to load categories'
    searchStore.categories = []

    wrapper = createWrapper()
    expect(wrapper.text()).toContain('Failed to load categories')
    wrapper.unmount()
  })

  it('displays the title when inSidebar is false', () => {
    searchStore.isLoading = false
    searchStore.error = null
    searchStore.categories = []

    wrapper = createWrapper({ inSidebar: false })
    expect(wrapper.find('h2').text()).toBe('Browse by keyword')
    wrapper.unmount()
  })

  it('does not display the title when inSidebar is true', () => {
    searchStore.isLoading = false
    searchStore.error = null
    searchStore.categories = []

    wrapper = createWrapper({ inSidebar: true })
    expect(wrapper.find('h2').exists()).toBe(false)
    wrapper.unmount()
  })

  it('displays the keywords section header when inSidebar is true', () => {
    searchStore.isLoading = false
    searchStore.error = null
    searchStore.categories = [
      {
        kind: 'cellml_keyword',
        kindInfo: createKindInfo(['term1', 'term2']),
        loading: false,
        error: null,
      },
    ]

    wrapper = createWrapper({ inSidebar: true })
    expect(wrapper.text()).toContain('Keywords')
    wrapper.unmount()
  })

  it('renders the category filter field', () => {
    searchStore.isLoading = false
    searchStore.error = null
    searchStore.categories = [
      {
        kind: 'cellml_keyword',
        kindInfo: createKindInfo(['action_potential', 'activation', 'binding']),
        loading: false,
        error: null,
      },
    ]

    wrapper = createWrapper()
    expect(wrapper.findComponent({ name: 'SearchField' }).exists()).toBe(true)
    wrapper.unmount()
  })

  it('renders term buttons for valid, filtered terms', () => {
    searchStore.isLoading = false
    searchStore.error = null
    searchStore.categories = [
      {
        kind: 'cellml_keyword',
        kindInfo: createKindInfo(['action_potential', 'activation', 'binding']),
        loading: false,
        error: null,
      },
    ]

    wrapper = createWrapper()
    const termButtons = wrapper.findAllComponents({ name: 'TermButton' })
    expect(termButtons.length).toBe(3)
    expect(termButtons[0].props('term')).toBe('action_potential')
    expect(termButtons[1].props('term')).toBe('activation')
    expect(termButtons[2].props('term')).toBe('binding')
    wrapper.unmount()
  })

  it('displays "No matching keywords found" when no terms match the filter', async () => {
    searchStore.isLoading = false
    searchStore.error = null
    searchStore.categories = [
      {
        kind: 'cellml_keyword',
        kindInfo: createKindInfo(['action_potential', 'activation']),
        loading: false,
        error: null,
      },
    ]

    wrapper = createWrapper()
    const searchField = wrapper.findComponent({ name: 'SearchField' })
    await searchField.vm.$emit('update:modelValue', 'nonexistent')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('No matching keywords found')
    wrapper.unmount()
  })

  it('filters terms based on the search input', async () => {
    searchStore.isLoading = false
    searchStore.error = null
    searchStore.categories = [
      {
        kind: 'cellml_keyword',
        kindInfo: createKindInfo(['action_potential', 'activation', 'binding']),
        loading: false,
        error: null,
      },
    ]

    wrapper = createWrapper()
    const searchField = wrapper.findComponent({ name: 'SearchField' })
    await searchField.vm.$emit('update:modelValue', 'act')
    await wrapper.vm.$nextTick()

    const termButtons = wrapper.findAllComponents({ name: 'TermButton' })
    expect(termButtons.length).toBe(2)
    expect(termButtons[0].props('term')).toBe('action_potential')
    expect(termButtons[1].props('term')).toBe('activation')
    wrapper.unmount()
  })

  it('renders the category error state', () => {
    searchStore.isLoading = false
    searchStore.error = null
    searchStore.categories = [
      {
        kind: 'cellml_keyword',
        kindInfo: null,
        loading: false,
        error: 'Failed to load keywords',
      },
    ]

    wrapper = createWrapper()
    expect(wrapper.text()).toContain('Failed to load keywords')
    wrapper.unmount()
  })

  it('renders the category loading state', () => {
    searchStore.isLoading = false
    searchStore.error = null
    searchStore.categories = [
      {
        kind: 'cellml_keyword',
        kindInfo: null,
        loading: true,
        error: null,
      },
    ]

    wrapper = createWrapper()
    expect(wrapper.text()).toContain('Loading...')
    wrapper.unmount()
  })

  it('applies the correct input class when inSidebar is true', () => {
    searchStore.isLoading = false
    searchStore.error = null
    searchStore.categories = [
      {
        kind: 'cellml_keyword',
        kindInfo: createKindInfo(['term1']),
        loading: false,
        error: null,
      },
    ]

    wrapper = createWrapper({ inSidebar: true })
    const searchField = wrapper.findComponent({ name: 'SearchField' })
    expect(searchField.props('inputClass')).toContain('w-full')
    wrapper.unmount()
  })

  it('applies the correct input class when inSidebar is false', () => {
    searchStore.isLoading = false
    searchStore.error = null
    searchStore.categories = [
      {
        kind: 'cellml_keyword',
        kindInfo: createKindInfo(['term1']),
        loading: false,
        error: null,
      },
    ]

    wrapper = createWrapper({ inSidebar: false })
    const searchField = wrapper.findComponent({ name: 'SearchField' })
    expect(searchField.props('inputClass')).not.toContain('w-full')
    wrapper.unmount()
  })

  it('handles null or undefined terms gracefully', () => {
    searchStore.isLoading = false
    searchStore.error = null
    searchStore.categories = [
      {
        kind: 'cellml_keyword',
        kindInfo: {
          kind: { id: 1, description: 'CellML keyword' },
          terms: null,
        } as unknown as IndexKindResponse,
        loading: false,
        error: null,
      },
    ]

    wrapper = createWrapper()
    const termButtons = wrapper.findAllComponents({ name: 'TermButton' })
    expect(termButtons.length).toBe(0)
    wrapper.unmount()
  })

  it('applies box styling when inSidebar is true', () => {
    searchStore.isLoading = false
    searchStore.error = null
    searchStore.categories = []

    wrapper = createWrapper({ inSidebar: true })
    const rootDiv = wrapper.find('.box')
    expect(rootDiv.exists()).toBe(true)
    wrapper.unmount()
  })

  it('does not apply box styling to the root element when inSidebar is false', () => {
    searchStore.isLoading = false
    searchStore.error = null
    searchStore.categories = []

    wrapper = createWrapper({ inSidebar: false })
    expect(wrapper.find('.box.box-small').exists()).toBe(false)
    wrapper.unmount()
  })

  it('filters terms case-insensitively', async () => {
    searchStore.isLoading = false
    searchStore.error = null
    searchStore.categories = [
      {
        kind: 'cellml_keyword',
        kindInfo: createKindInfo(['Action_Potential', 'activation']),
        loading: false,
        error: null,
      },
    ]

    wrapper = createWrapper()
    const searchField = wrapper.findComponent({ name: 'SearchField' })
    await searchField.vm.$emit('update:modelValue', 'ACTION')
    await wrapper.vm.$nextTick()

    const termButtons = wrapper.findAllComponents({ name: 'TermButton' })
    expect(termButtons.length).toBe(1)
    expect(termButtons[0].props('term')).toBe('Action_Potential')
    wrapper.unmount()
  })

  it('handles multiple categories', () => {
    searchStore.isLoading = false
    searchStore.error = null
    searchStore.categories = [
      {
        kind: 'cellml_keyword',
        kindInfo: createKindInfo(['term1', 'term2']),
        loading: false,
        error: null,
      },
      {
        kind: 'cellml_keyword',
        kindInfo: createKindInfo(['term3', 'term4']),
        loading: false,
        error: null,
      },
    ]

    wrapper = createWrapper()
    const termButtons = wrapper.findAllComponents({ name: 'TermButton' })
    expect(termButtons.length).toBe(4)
    wrapper.unmount()
  })
})
