import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SearchComboBox from '@/components/molecules/SearchComboBox.vue'

const mockSearchCategories: Array<{
  kind: string
  loading: boolean
  kindInfo?: { terms?: string[] }
}> = []

vi.mock('@/stores/search', () => ({
  useSearchStore: () => ({
    categories: mockSearchCategories,
    isLoading: false,
    fetchCategories: vi.fn().mockResolvedValue(undefined),
  }),
}))

const mountComboBox = (props: Record<string, unknown> = {}) => {
  return mount(SearchComboBox, {
    props: { inOverlay: true, ...props },
    attachTo: document.body,
  })
}

const typeInto = async (wrapper: ReturnType<typeof mountComboBox>, value: string) => {
  const input = wrapper.get('input[aria-label="Search term"]')
  await input.setValue(value)
  await flushPromises()
  return input
}

const rowLabels = (wrapper: ReturnType<typeof mountComboBox>) =>
  wrapper.findAll('[data-suggestion-row]').map((row) => row.attributes('data-suggestion-row'))

describe('SearchComboBox.vue – type-first suggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = ''
    mockSearchCategories.splice(0)
    mockSearchCategories.push(
      {
        kind: 'citation_author_family_name',
        loading: false,
        kindInfo: { terms: ['abcdef', '123abc', 'Smith'] },
      },
      { kind: 'model_author', loading: false, kindInfo: { terms: ['Noble'] } },
      { kind: 'cellml_keyword', loading: false, kindInfo: { terms: ['cardiac', 'xabcx'] } },
      { kind: 'citation_id', loading: false, kindInfo: { terms: [] } },
    )
  })

  it('shows no dropdown when the input is empty', async () => {
    const wrapper = mountComboBox()
    await flushPromises()

    expect(wrapper.find('[data-suggestion-row]').exists()).toBe(false)
  })

  it('shows the free text row and only the categories with partial matches', async () => {
    const wrapper = mountComboBox()
    await typeInto(wrapper, 'abc')

    expect(rowLabels(wrapper)).toEqual([
      '_text_query',
      'citation_author_family_name',
      'cellml_keyword',
    ])
    expect(wrapper.text()).toContain('Free text')
    expect(wrapper.text()).toContain('Publication authors')
    expect(wrapper.text()).toContain('CellML keywords')
    expect(wrapper.text()).not.toContain('Model authors')

    const authorButtons = wrapper
      .findAll('[data-suggestion-row="citation_author_family_name"] button')
      .map((button) => button.text())
    expect(authorButtons).toEqual(['abcdef', '123abc'])
  })

  it('shows only the free text row when nothing matches', async () => {
    const wrapper = mountComboBox()
    await typeInto(wrapper, 'zzz')

    expect(rowLabels(wrapper)).toEqual(['_text_query'])
  })

  it('adds a category chip when a term is clicked and clears the input', async () => {
    const wrapper = mountComboBox()
    const input = await typeInto(wrapper, 'abc')

    await wrapper.get('button[aria-label="Add Publication author: abcdef"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Publication author: abcdef')
    expect((input.element as HTMLInputElement).value).toBe('')
    expect(wrapper.find('[data-suggestion-row]').exists()).toBe(false)
  })

  it('excludes terms already added as chips', async () => {
    const wrapper = mountComboBox({
      initialFilters: [{ kind: 'citation_author_family_name', term: 'abcdef' }],
    })
    await flushPromises()
    await typeInto(wrapper, 'abc')

    const authorButtons = wrapper
      .findAll('[data-suggestion-row="citation_author_family_name"] button')
      .map((button) => button.text())
    expect(authorButtons).toEqual(['123abc'])
  })

  it('adds a free text chip from the free text row', async () => {
    const wrapper = mountComboBox()
    await typeInto(wrapper, 'heart')

    await wrapper.get('button[aria-label="Add free text: heart"]').trigger('click')
    await flushPromises()

    const chipLabels = wrapper.findAll('.rounded-full span.whitespace-nowrap').map((s) => s.text())
    expect(chipLabels).toEqual(['heart'])
  })

  it('moves focus into and around the suggestions with Tab and arrow keys', async () => {
    const wrapper = mountComboBox()
    const input = await typeInto(wrapper, 'abc')
    ;(input.element as HTMLInputElement).focus()

    await input.trigger('keydown', { key: 'Tab' })
    expect(document.activeElement?.getAttribute('data-suggestion')).toBe('0:0')

    const first = wrapper.get('[data-suggestion="0:0"]')
    await first.trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement?.getAttribute('data-suggestion')).toBe('1:0')

    await wrapper.get('[data-suggestion="1:0"]').trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement?.getAttribute('data-suggestion')).toBe('1:1')

    await wrapper.get('[data-suggestion="1:1"]').trigger('keydown', { key: 'Tab' })
    expect(document.activeElement?.getAttribute('data-suggestion')).toBe('2:0')

    await wrapper.get('[data-suggestion="2:0"]').trigger('keydown', { key: 'Tab' })
    expect(document.activeElement).toBe(input.element)

    await first.trigger('keydown', { key: 'ArrowUp' })
    expect(document.activeElement).toBe(input.element)
  })

  it('emits querySearch with the typed text and chip filters on Enter', async () => {
    const wrapper = mountComboBox({
      initialFilters: [{ kind: 'model_author', term: 'Noble' }],
    })
    await flushPromises()
    const input = await typeInto(wrapper, 'cardiac')

    await input.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('querySearch')).toEqual([
      [{ query: 'cardiac', filters: [{ kind: 'model_author', term: 'Noble' }] }],
    ])
  })
})
