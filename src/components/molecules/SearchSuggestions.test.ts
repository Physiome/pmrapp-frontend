import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import SearchSuggestions from '@/components/molecules/SearchSuggestions.vue';

const { mockSearchStore } = vi.hoisted(() => ({
  mockSearchStore: {
    categories: [] as Array<{
      kind: string;
      kindInfo: { kind: { id: number; description: string }; terms: string[] } | null;
      loading: boolean;
      error: string | null;
    }>,
    isLoading: false,
    fetchCategories: vi.fn<() => Promise<void>>(),
  },
}));

vi.mock('@/stores/search', () => ({
  useSearchStore: () => mockSearchStore,
}));

const SearchFieldStub = defineComponent({
  name: 'SearchField',
  props: {
    modelValue: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue', 'keydown'],
  setup(props, { emit, expose }) {
    const inputRef = ref<HTMLInputElement | null>(null);
    expose({ inputRef });

    return () =>
      h('input', {
        ref: inputRef,
        value: props.modelValue,
        onInput: (event: Event) =>
          emit('update:modelValue', (event.target as HTMLInputElement).value),
        onKeydown: (event: KeyboardEvent) => emit('keydown', event),
      });
  },
});

const TermButtonStub = defineComponent({
  name: 'TermButton',
  props: {
    term: {
      type: String,
      required: true,
    },
    active: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['click', 'keydown'],
  setup(props, { emit }) {
    return () =>
      h(
        'button',
        {
          class: 'term-button',
          'data-active': String(props.active),
          onClick: () => emit('click'),
          onKeydown: (event: KeyboardEvent) => emit('keydown', event),
        },
        props.term,
      );
  },
});

const ChipStub = defineComponent({
  name: 'Chip',
  props: {
    label: {
      type: String,
      required: true,
    },
  },
  emits: ['click'],
  setup(props) {
    return () => h('button', { class: 'chip-button' }, props.label);
  },
});

describe('SearchSuggestions', () => {
  beforeEach(() => {
    mockSearchStore.categories = [
      {
        kind: 'model_author',
        kindInfo: {
          kind: { id: 1, description: 'Model authors' },
          terms: ['Alpha term'],
        },
        loading: false,
        error: null,
      },
    ];
    mockSearchStore.isLoading = false;
    mockSearchStore.fetchCategories.mockReset();
    mockSearchStore.fetchCategories.mockResolvedValue(undefined);
  });

  it('toggles a selected term off when clicked again', async () => {
    const wrapper = mount(SearchSuggestions, {
      props: {
        isSuggestionsVisible: true,
        searchInput: '',
      },
      global: {
        stubs: {
          SearchField: SearchFieldStub,
          TermButton: TermButtonStub,
          Chip: ChipStub,
        },
      },
    });

    await nextTick();

    const termButton = wrapper.find('.term-button');
    expect(termButton.exists()).toBe(true);
    expect(termButton.attributes('data-active')).toBe('false');

    await termButton.trigger('click');
    await nextTick();

    expect(wrapper.emitted('searchTermClick')?.[0]?.[0]).toEqual([
      { kind: 'model_author', term: 'Alpha term' },
    ]);
    expect(wrapper.find('.term-button').attributes('data-active')).toBe('true');

    await wrapper.find('.term-button').trigger('click');
    await nextTick();

    expect(wrapper.emitted('searchTermClick')?.[1]?.[0]).toEqual([]);
    expect(wrapper.find('.term-button').attributes('data-active')).toBe('false');
  });

  it('clears all filters when clear all button is clicked', async () => {
    const wrapper = mount(SearchSuggestions, {
      props: {
        isSuggestionsVisible: true,
        searchInput: '',
        initialFilters: [
          { kind: 'model_author', term: 'Alpha term' },
          { kind: 'cellml_keyword', term: 'Beta term' },
        ],
      },
      global: {
        stubs: {
          SearchField: SearchFieldStub,
          TermButton: TermButtonStub,
          Chip: ChipStub,
        },
      },
    });

    await nextTick();

    const clearAllButton = wrapper.find('button[aria-label="Clear all filters"]');
    expect(clearAllButton.exists()).toBe(true);

    await clearAllButton.trigger('click');
    await nextTick();

    expect(wrapper.emitted('searchTermClick')?.[0]?.[0]).toEqual([]);
  });

  it('includes clear all button in tab navigation', async () => {
    const wrapper = mount(SearchSuggestions, {
      props: {
        isSuggestionsVisible: true,
        searchInput: '',
        initialFilters: [{ kind: 'model_author', term: 'Alpha term' }],
      },
      global: {
        stubs: {
          SearchField: SearchFieldStub,
          TermButton: TermButtonStub,
          Chip: ChipStub,
        },
      },
    });

    await nextTick();

    const clearAllButton = wrapper.find('button[aria-label="Clear all filters"]');
    expect(clearAllButton.exists()).toBe(true);

    clearAllButton.element.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }),
    );
    await nextTick();

    expect(clearAllButton.classes()).toContain('focus-visible:ring-2');
  });

  it('preserves the filter input when the search input prop changes', async () => {
    const wrapper = mount(SearchSuggestions, {
      props: {
        isSuggestionsVisible: true,
        searchInput: '',
      },
      global: {
        stubs: {
          SearchField: SearchFieldStub,
          TermButton: TermButtonStub,
          Chip: ChipStub,
        },
      },
    });

    await nextTick();

    const filterInput = wrapper.find('input');
    await filterInput.setValue('author');
    await nextTick();

    expect(filterInput.element.value).toBe('author');

    await wrapper.setProps({ searchInput: 'Rodriguez' });
    await nextTick();

    expect(wrapper.find('input').element.value).toBe('author');
  });
});
