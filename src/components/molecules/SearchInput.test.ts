import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import SearchInput from '@/components/molecules/SearchInput.vue';

const mockRouterPush = vi.fn();
const mockRoute = { query: {} as Record<string, string> };
const mockSearchCategories: Array<{
  kind: string;
  loading: boolean;
  kindInfo?: { terms?: string[] };
}> = [];

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => ({ push: mockRouterPush }),
}));

vi.mock('@/stores/search', () => ({
  useSearchStore: () => ({
    categories: mockSearchCategories,
    isLoading: false,
    fetchCategories: vi.fn().mockResolvedValue(undefined),
  }),
}));

const mountSearchInput = (initialTerm = '', initialKind = 'citation_author_family_name') => {
  return mount(SearchInput, {
    props: {
      initialTerm,
      initialKind,
      inOverlay: true,
    },
    global: {
      stubs: {
        SearchField: {
          name: 'SearchField',
          template: `<input
              :value="modelValue"
              @input="$emit('update:modelValue', $event.target.value)"
              @focus="$emit('focus')"
              @blur="$emit('blur')"
            />`,
          props: ['modelValue'],
          emits: ['update:modelValue', 'focus', 'blur', 'search'],
          expose: ['inputRef'],
        },
        TermButton: {
          template: '<button class="term-button">{{ term }}</button>',
          props: ['term'],
        },
      },
    },
    attachTo: document.body,
  });
};

describe('SearchInput.vue – category groups', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRoute.query = {};
    mockSearchCategories.splice(0);
  });

  it('shows all categories with up to ten items when search input is empty', async () => {
    mockSearchCategories.push(
      {
        kind: 'citation_author_family_name',
        loading: false,
        kindInfo: {
          terms: [
            'Alice',
            'Bob',
            'Carol',
            'Dave',
            'Eve',
            'Frank',
            'Grace',
            'Heidi',
            'Ivan',
            'Judy',
            'Ken',
          ],
        },
      },
      {
        kind: 'cellml_keyword',
        loading: false,
        kindInfo: {
          terms: ['Keyword A', 'Keyword B'],
        },
      },
    );

    const wrapper = mountSearchInput();
    await flushPromises();

    const advancedSearchButton = wrapper.find('button[aria-label="Advanced Search"]');
    await advancedSearchButton.trigger('click');
    await nextTick();

    const termButtons = wrapper.findAll('button.term-button');
    expect(termButtons).toHaveLength(12);
    expect(wrapper.text()).toContain('Alice');
    expect(wrapper.text()).toContain('Keyword A');
    expect(wrapper.findAll('button').some((b) => b.text().trim() === '... more')).toBe(true);

    wrapper.unmount();
  });

  it('shows "no results" message when query matches nothing in any category', async () => {
    const wrapper = mountSearchInput();
    await flushPromises();

    const advancedSearchButton = wrapper.find('button[aria-label="Advanced Search"]');
    await advancedSearchButton.trigger('click');
    await nextTick();

    const input = wrapper.find('input[placeholder="Filter terms..."]');
    await input.setValue('unrelated-xyzzy-nope');
    await nextTick();

    expect(wrapper.text()).toContain('No authors, keywords, or publication references found for');

    wrapper.unmount();
  });

  it('limits each category group to ten term suggestions', async () => {
    mockSearchCategories.push({
      kind: 'citation_author_family_name',
      loading: false,
      kindInfo: {
        terms: [
          'Noble 1',
          'Noble 2',
          'Noble 3',
          'Noble 4',
          'Noble 5',
          'Noble 6',
          'Noble 7',
          'Noble 8',
          'Noble 9',
          'Noble 10',
          'Noble 11',
        ],
      },
    });

    const wrapper = mountSearchInput();
    await flushPromises();

    const advancedSearchButton = wrapper.find('button[aria-label="Advanced Search"]');
    await advancedSearchButton.trigger('click');
    await nextTick();

    const input = wrapper.find('input[placeholder="Filter terms..."]');
    await input.setValue('Noble');
    await nextTick();

    let termButtons = wrapper.findAll('button.term-button');
    expect(termButtons).toHaveLength(10);
    expect(wrapper.text()).toContain('Noble 10');
    expect(wrapper.text()).not.toContain('Noble 11');

    const moreButton = wrapper.findAll('button').find((b) => b.text().trim() === '... more');
    expect(moreButton).toBeDefined();
    await moreButton?.trigger('click');
    await nextTick();

    termButtons = wrapper.findAll('button.term-button');
    expect(termButtons).toHaveLength(11);

    const lessButton = wrapper.findAll('button').find((b) => b.text().trim() === 'Show less');
    expect(lessButton).toBeDefined();
    await lessButton?.trigger('click');
    await nextTick();

    termButtons = wrapper.findAll('button.term-button');
    expect(termButtons).toHaveLength(10);
    expect(wrapper.findAll('button').some((b) => b.text().trim() === '... more')).toBe(true);

    wrapper.unmount();
  });

  it('can focus first category "... more" toggle by tabbing from its last visible term', async () => {
    mockSearchCategories.push({
      kind: 'citation_author_family_name',
      loading: false,
      kindInfo: {
        terms: [
          'Noble 1',
          'Noble 2',
          'Noble 3',
          'Noble 4',
          'Noble 5',
          'Noble 6',
          'Noble 7',
          'Noble 8',
          'Noble 9',
          'Noble 10',
          'Noble 11',
        ],
      },
    });

    const wrapper = mountSearchInput();
    await flushPromises();

    const advancedSearchButton = wrapper.find('button[aria-label="Advanced Search"]');
    await advancedSearchButton.trigger('click');
    await nextTick();

    const input = wrapper.find('input[placeholder="Filter terms..."]');
    await input.setValue('Noble');
    await nextTick();

    const termButtons = wrapper.findAll('button.term-button');
    const lastVisibleTermButton = termButtons[termButtons.length - 1];
    const moreButton = wrapper.findAll('button').find((b) => b.text().trim() === '... more');

    expect(lastVisibleTermButton).toBeDefined();
    expect(moreButton).toBeDefined();

    await lastVisibleTermButton?.trigger('focus');
    await nextTick();
    await lastVisibleTermButton?.trigger('keydown', { key: 'Tab' });
    await nextTick();

    expect(document.activeElement).toBe(moreButton?.element);

    wrapper.unmount();
  });

  it('moves focus to the first newly revealed term when pressing Enter on "... more"', async () => {
    mockSearchCategories.push({
      kind: 'citation_author_family_name',
      loading: false,
      kindInfo: {
        terms: [
          'Noble 1',
          'Noble 2',
          'Noble 3',
          'Noble 4',
          'Noble 5',
          'Noble 6',
          'Noble 7',
          'Noble 8',
          'Noble 9',
          'Noble 10',
          'Noble 11',
        ],
      },
    });

    const wrapper = mountSearchInput();
    await flushPromises();

    const advancedSearchButton = wrapper.find('button[aria-label="Advanced Search"]');
    await advancedSearchButton.trigger('click');
    await nextTick();

    const input = wrapper.find('input[placeholder="Filter terms..."]');
    await input.setValue('Noble');
    await nextTick();

    const moreButton = wrapper.findAll('button').find((b) => b.text().trim() === '... more');
    expect(moreButton).toBeDefined();

    await moreButton?.trigger('focus');
    await nextTick();
    await moreButton?.trigger('keydown', { key: 'Enter' });
    await nextTick();

    expect(document.activeElement?.textContent?.trim()).toBe('Noble 11');

    wrapper.unmount();
  });

  it('keeps focus on "Show less" after Enter so next Tab goes to next category term', async () => {
    mockSearchCategories.push(
      {
        kind: 'citation_author_family_name',
        loading: false,
        kindInfo: {
          terms: [
            'Alpha 1',
            'Alpha 2',
            'Alpha 3',
            'Alpha 4',
            'Alpha 5',
            'Alpha 6',
            'Alpha 7',
            'Alpha 8',
            'Alpha 9',
            'Alpha 10',
            'Alpha 11',
          ],
        },
      },
      {
        kind: 'cellml_keyword',
        loading: false,
        kindInfo: {
          terms: ['Alpha keyword'],
        },
      },
    );

    const wrapper = mountSearchInput();
    await flushPromises();

    const advancedSearchButton = wrapper.find('button[aria-label="Advanced Search"]');
    await advancedSearchButton.trigger('click');
    await nextTick();

    const input = wrapper.find('input[placeholder="Filter terms..."]');
    await input.setValue('Alpha');
    await nextTick();

    let moreButton = wrapper.findAll('button').find((b) => b.text().trim() === '... more');
    expect(moreButton).toBeDefined();

    await moreButton?.trigger('focus');
    await nextTick();
    await moreButton?.trigger('keydown', { key: 'Enter' });
    await nextTick();

    const showLessButton = wrapper.findAll('button').find((b) => b.text().trim() === 'Show less');
    expect(showLessButton).toBeDefined();

    await showLessButton?.trigger('focus');
    await nextTick();
    await showLessButton?.trigger('keydown', { key: 'Enter' });
    await nextTick();

    moreButton = wrapper.findAll('button').find((b) => b.text().trim() === '... more');
    expect(moreButton).toBeDefined();
    expect(document.activeElement).toBe(moreButton?.element);

    await moreButton?.trigger('keydown', { key: 'Tab' });
    await nextTick();
    expect(document.activeElement?.textContent?.trim()).toBe('Alpha keyword');

    wrapper.unmount();
  });
});

describe('SearchInput.vue – getMatchingCount logic', () => {
  it('emits querySearch when SearchField emits search', async () => {
    const wrapper = mountSearchInput('Noble', 'model_author');
    await flushPromises();

    wrapper.findComponent({ name: 'SearchField' }).vm.$emit('search');
    await nextTick();

    // expect(wrapper.emitted('querySearch')?.[0]).toEqual(['Noble'])
    expect(wrapper.emitted('querySearch')?.[0]).toEqual([
      {
        query: 'Noble',
        filters: [{ kind: 'model_author', term: 'Noble' }],
      },
    ]);

    wrapper.unmount();
  });

  it('trims query text before emitting querySearch from SearchField search event', async () => {
    const wrapper = mountSearchInput('  Noble  ', 'not_a_real_kind');
    await flushPromises();

    wrapper.findComponent({ name: 'SearchField' }).vm.$emit('search');
    await nextTick();

    // expect(wrapper.emitted('querySearch')?.[0]).toEqual(['Noble'])
    expect(wrapper.emitted('querySearch')?.[0]).toEqual([
      {
        query: 'Noble',
        filters: [{ kind: 'not_a_real_kind', term: 'Noble' }],
      },
    ]);

    wrapper.unmount();
  });

  it('does not emit querySearch when SearchField emits search with empty query', async () => {
    const wrapper = mountSearchInput('   ', 'model_author');
    await flushPromises();

    wrapper.findComponent({ name: 'SearchField' }).vm.$emit('search');
    await nextTick();

    expect(wrapper.emitted('querySearch')).toBeUndefined();

    wrapper.unmount();
  });
});
