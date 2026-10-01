import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import SearchComboBox from '@/components/molecules/SearchComboBox.vue'
import { SEARCH_CATEGORIES } from '@/constants/search'
import { searchCategories } from '@/mocks/search'
import type { CategoryData } from '@/stores/search'
import type { SearchFilter } from '@/types/search'

const { mockSearchStore } = vi.hoisted(() => ({
  mockSearchStore: {
    categories: [] as CategoryData[],
    isLoading: false,
    fetchCategories: vi.fn<(kinds?: string[]) => Promise<void>>(),
  },
}))

vi.mock('@/stores/search', () => ({
  useSearchStore: () => mockSearchStore,
}))

interface MountProps {
  initialQuery?: string
  initialFilters?: SearchFilter[]
  inOverlay?: boolean
}

let wrapper: VueWrapper | null = null

const mountComboBox = async (props: MountProps = { inOverlay: true }) => {
  wrapper = mount(SearchComboBox, { props, attachTo: document.body })
  await flushPromises()
  return wrapper
}

const getInput = (w: VueWrapper) => w.get('input[role="combobox"]')

const press = async (w: VueWrapper, key: string) => {
  await getInput(w).trigger('keydown', { key })
  await nextTick()
}

const categoryOptions = (w: VueWrapper) =>
  w.findAll('[aria-label="Search categories"] [role="option"]')

const termOptions = (w: VueWrapper) => w.findAll('[aria-label$="suggestions"] [role="option"]')

const chipLabels = (w: VueWrapper) =>
  w.findAll('button[aria-label^="Remove "]').map((b) => b.attributes('aria-label')?.slice(7))

const statusText = (w: VueWrapper) => w.get('[role="status"]').text()

const selectCategory = async (w: VueWrapper, label: string) => {
  const option = categoryOptions(w).find((o) => o.text().includes(label))
  expect(option).toBeDefined()
  await option?.trigger('click')
  await nextTick()
}

describe('SearchComboBox', () => {
  beforeEach(() => {
    mockSearchStore.categories = structuredClone(searchCategories)
    mockSearchStore.isLoading = false
    mockSearchStore.fetchCategories.mockReset()
    mockSearchStore.fetchCategories.mockResolvedValue(undefined)
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
  })

  describe('initialisation', () => {
    it('fetches all search categories on mount', async () => {
      await mountComboBox()

      expect(mockSearchStore.fetchCategories).toHaveBeenCalledWith(
        SEARCH_CATEGORIES.map((c) => c.value),
      )
    })

    it('renders chips from initial filters and query, skipping incomplete filters', async () => {
      const w = await mountComboBox({
        initialQuery: 'sodium channel',
        initialFilters: [
          { kind: 'model_author', term: 'Noble' },
          { kind: '', term: 'ignored' },
          { kind: 'cellml_keyword', term: '' },
        ],
      })

      expect(chipLabels(w)).toEqual(['Model author: Noble', 'sodium channel'])
    })

    it('rebuilds chips when the initial search params change', async () => {
      const w = await mountComboBox({ initialQuery: 'first' })

      await w.setProps({ initialQuery: 'second' })

      expect(chipLabels(w)).toEqual(['second'])
    })

    it('keeps typed input when props change to equal values', async () => {
      const w = await mountComboBox({ initialFilters: [{ kind: 'model_author', term: 'Noble' }] })

      await getInput(w).setValue('in progress')
      await w.setProps({ initialFilters: [{ kind: 'model_author', term: 'Noble' }] })

      expect((getInput(w).element as HTMLInputElement).value).toBe('in progress')
    })
  })

  describe('category menu', () => {
    it('shows all categories when opened in the overlay', async () => {
      const w = await mountComboBox()
      const input = getInput(w)

      expect(categoryOptions(w).map((o) => o.text())).toEqual(SEARCH_CATEGORIES.map((c) => c.label))
      expect(input.attributes('aria-expanded')).toBe('true')
      expect(input.attributes('aria-controls')).toBe(
        w.get('[aria-label="Search categories"]').attributes('id'),
      )
      expect(input.attributes('placeholder')).toBe('Type to search or add a category below...')
      expect(statusText(w)).toBe(
        '4 categories available. Use up and down arrows or Tab to navigate.',
      )
    })

    it('hides the menu and shows the free-text hint while typing', async () => {
      const w = await mountComboBox()

      await getInput(w).setValue('calcium')

      expect(categoryOptions(w)).toHaveLength(0)
      expect(w.text()).toContain('to search for calcium')
      expect(getInput(w).attributes('aria-describedby')).toBeDefined()
    })

    it('shows the menu again when the input is cleared', async () => {
      const w = await mountComboBox()

      await getInput(w).setValue('calcium')
      await getInput(w).setValue('')

      expect(categoryOptions(w)).toHaveLength(4)
    })

    it('wraps around with arrow keys and tracks the active option', async () => {
      const w = await mountComboBox()
      const input = getInput(w)

      await press(w, 'ArrowUp')
      let options = categoryOptions(w)
      expect(options[3]?.attributes('aria-selected')).toBe('true')
      expect(input.attributes('aria-activedescendant')).toBe(options[3]?.attributes('id'))

      await press(w, 'ArrowDown')
      options = categoryOptions(w)
      expect(options[0]?.attributes('aria-selected')).toBe('true')
      expect(options[3]?.attributes('aria-selected')).toBe('false')
      expect(input.attributes('aria-activedescendant')).toBe(options[0]?.attributes('id'))
    })

    it('cycles through categories with Tab, looping back to the input', async () => {
      const w = await mountComboBox()
      const input = getInput(w)
      const activeIndex = () =>
        categoryOptions(w).findIndex((o) => o.attributes('aria-selected') === 'true')

      for (const expected of [0, 1, 2, 3]) {
        await press(w, 'Tab')
        expect(activeIndex()).toBe(expected)
        expect(input.attributes('aria-activedescendant')).toBe(
          categoryOptions(w)[expected]?.attributes('id'),
        )
      }

      await press(w, 'Tab')
      expect(activeIndex()).toBe(-1)
      expect(input.attributes('aria-activedescendant')).toBeUndefined()
      expect(categoryOptions(w)).toHaveLength(4)
    })

    it('cycles backwards with Shift+Tab', async () => {
      const w = await mountComboBox()
      const activeIndex = () =>
        categoryOptions(w).findIndex((o) => o.attributes('aria-selected') === 'true')

      await getInput(w).trigger('keydown', { key: 'Tab', shiftKey: true })
      expect(activeIndex()).toBe(3)

      await press(w, 'Tab')
      expect(activeIndex()).toBe(-1)
    })

    it('does not trap Tab once the category menu is closed with Escape', async () => {
      const w = await mountComboBox()

      await press(w, 'Escape')
      const event = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true })
      getInput(w).element.dispatchEvent(event)

      expect(event.defaultPrevented).toBe(false)
    })

    it('selects the highlighted category on Enter', async () => {
      const w = await mountComboBox()

      await press(w, 'ArrowDown')
      await press(w, 'ArrowDown')
      await press(w, 'Enter')

      expect(w.text()).toContain('Model author:')
      expect(getInput(w).attributes('placeholder')).toBe('Type to filter...')
      expect(termOptions(w).map((o) => o.text())).toEqual([
        'Catherine Lloyd',
        'Noble',
        'Penny Noble',
      ])
    })

    it('closes the menu on Escape, then emits close on a second Escape', async () => {
      const w = await mountComboBox()

      await press(w, 'Escape')
      expect(categoryOptions(w)).toHaveLength(0)
      expect(w.emitted('close')).toBeUndefined()

      await press(w, 'Escape')
      expect(w.emitted('close')).toHaveLength(1)
    })
  })

  describe('term suggestions', () => {
    it('lists only valid terms for the selected category', async () => {
      const w = await mountComboBox()

      await selectCategory(w, 'Publication authors')

      expect(termOptions(w).map((o) => o.text())).toEqual(['Hodgkin', 'Huxley', 'Noble'])
    })

    it('filters terms case-insensitively as the user types', async () => {
      const w = await mountComboBox()

      await selectCategory(w, 'Model authors')
      await getInput(w).setValue('NOBLE')

      expect(termOptions(w).map((o) => o.text())).toEqual(['Noble', 'Penny Noble'])
      expect(statusText(w)).toBe(
        '2 Model author suggestions available. Use up and down arrows or Tab to navigate.',
      )
    })

    it('adds a chip when a term is clicked and returns to the category menu', async () => {
      const w = await mountComboBox()

      await selectCategory(w, 'CellML keywords')
      await termOptions(w)[1]?.trigger('click')
      await nextTick()

      expect(chipLabels(w)).toEqual(['CellML keyword: cardiac'])
      expect(w.find('span.select-none').exists()).toBe(false)
      expect(termOptions(w)).toHaveLength(0)
      expect(categoryOptions(w)).toHaveLength(4)
    })

    it('cycles through terms with Tab, keeping the selected category', async () => {
      const w = await mountComboBox()
      const activeIndex = () =>
        termOptions(w).findIndex((o) => o.attributes('aria-selected') === 'true')

      await selectCategory(w, 'Publication authors')
      for (const expected of [0, 1, 2, -1]) {
        await press(w, 'Tab')
        expect(activeIndex()).toBe(expected)
      }

      await getInput(w).trigger('keydown', { key: 'Tab', shiftKey: true })
      expect(activeIndex()).toBe(2)
      expect(w.text()).toContain('Publication author:')
    })

    it('selects the highlighted term on Enter', async () => {
      const w = await mountComboBox()

      await selectCategory(w, 'CellML keywords')
      await press(w, 'ArrowDown')
      await press(w, 'Enter')

      expect(chipLabels(w)).toEqual(['CellML keyword: calcium'])
    })

    it('selects an exact typed match on Enter without highlighting', async () => {
      const w = await mountComboBox()

      await selectCategory(w, 'Model authors')
      await getInput(w).setValue('noble')
      await press(w, 'Enter')

      expect(chipLabels(w)).toEqual(['Model author: noble'])
      expect(w.emitted('querySearch')).toBeUndefined()
    })

    it('excludes terms that are already selected as chips', async () => {
      const w = await mountComboBox({
        inOverlay: true,
        initialFilters: [{ kind: 'model_author', term: 'Noble' }],
      })

      await selectCategory(w, 'Model authors')

      expect(termOptions(w).map((o) => o.text())).toEqual(['Catherine Lloyd', 'Penny Noble'])
    })

    it('falls back to a free-text search when Enter is pressed on a non-matching term', async () => {
      const w = await mountComboBox()

      await selectCategory(w, 'Model authors')
      await getInput(w).setValue('xyz')
      await press(w, 'Enter')

      expect(w.emitted('querySearch')?.[0]).toEqual([{ query: 'xyz', filters: undefined }])
      expect(chipLabels(w)).toEqual(['xyz'])
    })

    it('shows a no-match message with an Esc hint', async () => {
      const w = await mountComboBox()

      await selectCategory(w, 'Model authors')
      await getInput(w).setValue('xyz')

      expect(termOptions(w)).toHaveLength(0)
      expect(w.text()).toContain('No Model author available for xyz')
      expect(w.findAll('kbd').some((k) => k.text() === 'Esc')).toBe(true)
      expect(statusText(w)).toBe(
        'No Model author available for "xyz". Try a different term or press Escape to pick another category.',
      )
    })

    it('shows an empty message when the category has no terms', async () => {
      const modelAuthor = mockSearchStore.categories.find((c) => c.kind === 'model_author')
      if (modelAuthor?.kindInfo) modelAuthor.kindInfo.terms = []
      const w = await mountComboBox()

      await selectCategory(w, 'Model authors')

      expect(w.text()).toContain('No Model author suggestions available')
    })

    it('shows a loading message while the store is loading', async () => {
      mockSearchStore.isLoading = true
      mockSearchStore.categories = []
      const w = await mountComboBox()

      await selectCategory(w, 'Model authors')

      expect(w.text()).toContain('Loading Model author suggestions...')
    })

    it('shows a loading message while the selected category is loading', async () => {
      const keyword = mockSearchStore.categories.find((c) => c.kind === 'cellml_keyword')
      if (keyword) {
        keyword.loading = true
        keyword.kindInfo = null
      }
      const w = await mountComboBox()

      await selectCategory(w, 'CellML keywords')

      expect(w.text()).toContain('Loading CellML keyword suggestions...')
    })

    it('returns to the category menu and clears input on Escape', async () => {
      const w = await mountComboBox()

      await selectCategory(w, 'Model authors')
      await getInput(w).setValue('nob')
      await press(w, 'Escape')

      expect((getInput(w).element as HTMLInputElement).value).toBe('')
      expect(w.text()).not.toContain('Model author:')
      expect(termOptions(w)).toHaveLength(0)
      expect(categoryOptions(w)).toHaveLength(4)
      expect(w.emitted('close')).toBeUndefined()
    })

    it('cancels the selected category on Backspace with empty input', async () => {
      const w = await mountComboBox()

      await selectCategory(w, 'Model authors')
      await press(w, 'Backspace')

      expect(w.text()).not.toContain('Model author:')
      expect(categoryOptions(w)).toHaveLength(4)
    })

    it('removes the last chip on Backspace with empty input and no category', async () => {
      const w = await mountComboBox({
        inOverlay: true,
        initialFilters: [
          { kind: 'model_author', term: 'Noble' },
          { kind: 'cellml_keyword', term: 'cardiac' },
        ],
      })

      await press(w, 'Backspace')

      expect(chipLabels(w)).toEqual(['Model author: Noble'])
    })
  })

  describe('searching', () => {
    it('emits a free-text search on Enter and commits the text as a chip', async () => {
      const w = await mountComboBox()

      await getInput(w).setValue('calcium')
      await press(w, 'Enter')

      expect(w.emitted('querySearch')?.[0]).toEqual([{ query: 'calcium', filters: undefined }])
      expect(chipLabels(w)).toEqual(['calcium'])
      expect((getInput(w).element as HTMLInputElement).value).toBe('')
    })

    it('emits filters with the typed text replacing an existing free-text chip', async () => {
      const w = await mountComboBox({
        inOverlay: true,
        initialQuery: 'old query',
        initialFilters: [{ kind: 'model_author', term: 'Noble' }],
      })

      await getInput(w).setValue('new query')
      await press(w, 'Enter')

      expect(w.emitted('querySearch')?.[0]).toEqual([
        { query: 'new query', filters: [{ kind: 'model_author', term: 'Noble' }] },
      ])
      expect(chipLabels(w)).toEqual(['Model author: Noble', 'new query'])
    })

    it('emits the existing free-text chip when nothing is typed', async () => {
      const w = await mountComboBox({ inOverlay: true, initialQuery: 'cardiac' })

      await press(w, 'Enter')

      expect(w.emitted('querySearch')?.[0]).toEqual([{ query: 'cardiac', filters: undefined }])
    })

    it('does not emit when there is nothing to search', async () => {
      const w = await mountComboBox()

      await press(w, 'Enter')

      expect(w.emitted('querySearch')).toBeUndefined()
      expect(w.get('button[aria-label="Search"]').attributes('disabled')).toBeDefined()
    })

    it('commits typed text as a chip on Tab and reopens the category menu', async () => {
      const w = await mountComboBox()

      await getInput(w).setValue('calcium')
      await press(w, 'Tab')

      expect(chipLabels(w)).toEqual(['calcium'])
      expect((getInput(w).element as HTMLInputElement).value).toBe('')
      expect(categoryOptions(w)).toHaveLength(4)
      expect(getInput(w).attributes('placeholder')).toBe(
        'Type to replace search query or add a category below…',
      )
    })

    it('emits a search when the search button is clicked', async () => {
      const w = await mountComboBox()

      await getInput(w).setValue('cardiac')
      const searchButton = w.get('button[aria-label="Search"]')
      expect(searchButton.attributes('disabled')).toBeUndefined()
      await searchButton.trigger('click')

      expect(w.emitted('querySearch')?.[0]).toEqual([{ query: 'cardiac', filters: undefined }])
    })

    it('clears all chips and input with the clear button', async () => {
      const w = await mountComboBox({
        inOverlay: true,
        initialQuery: 'cardiac',
        initialFilters: [{ kind: 'model_author', term: 'Noble' }],
      })

      await getInput(w).setValue('typed')
      await w.get('button[aria-label="Clear search"]').trigger('click')

      expect(chipLabels(w)).toEqual([])
      expect((getInput(w).element as HTMLInputElement).value).toBe('')
      expect(w.find('button[aria-label="Clear search"]').exists()).toBe(false)
      expect(categoryOptions(w)).toHaveLength(4)
    })

    it('removes only the chip whose remove button is clicked', async () => {
      const w = await mountComboBox({
        inOverlay: true,
        initialFilters: [
          { kind: 'model_author', term: 'Noble' },
          { kind: 'cellml_keyword', term: 'cardiac' },
        ],
      })

      await w.get('button[aria-label="Remove Model author: Noble"]').trigger('click')

      expect(chipLabels(w)).toEqual(['CellML keyword: cardiac'])
    })
  })

  describe('focus and blur outside the overlay', () => {
    it('opens the category menu on focus and closes it on blur', async () => {
      const w = await mountComboBox({ inOverlay: false })
      expect(categoryOptions(w)).toHaveLength(0)

      await getInput(w).trigger('focus')
      expect(categoryOptions(w)).toHaveLength(4)

      await getInput(w).trigger('blur', { relatedTarget: null })
      expect(categoryOptions(w)).toHaveLength(0)
    })

    it('keeps the menu open when focus moves into the dropdown', async () => {
      const w = await mountComboBox({ inOverlay: false })

      await getInput(w).trigger('focus')
      const option = categoryOptions(w)[0]
      await getInput(w).trigger('blur', { relatedTarget: option?.element })

      expect(categoryOptions(w)).toHaveLength(4)
    })
  })
})
