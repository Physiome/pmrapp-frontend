import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import List from '@/components/molecules/List.vue';

const mockRouterReplace = vi.fn();
const mockRouteQuery = ref<Record<string, string>>({});

// Mock Vue Router.
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: mockRouteQuery.value }),
  useRouter: () => ({
    replace: mockRouterReplace,
  }),
}));

type TestItem = {
  alias: string;
  entity: {
    id: number;
    created_ts: number;
    description: string | null;
  };
};

const testItems: TestItem[] = [
  { alias: 'item-1', entity: { id: 1, created_ts: 1000, description: 'Alpha' } },
  { alias: 'item-2', entity: { id: 2, created_ts: 2000, description: 'Beta' } },
  { alias: 'item-3', entity: { id: 3, created_ts: 3000, description: 'Gamma' } },
];

// Shared base stubs (ListItem does NOT render the #title slot — used for filtering tests).
const baseStubs = {
  RouterLink: { template: '<a><slot /></a>' },
  ListToolbar: {
    name: 'ListToolbar',
    template: '<div />',
    props: ['filterQuery', 'sortBy', 'isLoading', 'contentSection'],
    emits: ['update:filterQuery', 'update:sortBy', 'refresh'],
  },
  ListContent: {
    template: '<div><slot name="item" /></div>',
    props: ['items', 'error', 'isLoading', 'errorTitle', 'emptyMessage'],
  },
  ListItem: {
    template: '<div data-testid="list-item">{{ title }}</div>',
    props: ['title', 'link'],
  },
};

// ListItem stub that renders the #title slot so highlight markup is visible.
const listItemWithTitleSlotStub = {
  template: '<div data-testid="list-item"><slot name="title">{{ title }}</slot></div>',
  props: ['title', 'link'],
};

const mountList = (queryOverrides: Record<string, string> = {}, items = testItems) => {
  mockRouteQuery.value = queryOverrides;

  return mount(List, {
    props: {
      items,
      isLoading: false,
      error: null,
      errorTitle: 'Error',
      contentSection: 'Test Listing',
      emptyMessage: 'No items.',
      routeBase: '/test',
      getTitle: (item: TestItem) => item.entity.description || item.alias,
    },
    global: { stubs: baseStubs },
  });
};

const mountListWithHighlightStub = (filter: string, items: TestItem[]) => {
  mockRouteQuery.value = filter ? { filter } : {};
  return mount(List, {
    props: {
      items,
      isLoading: false,
      error: null,
      errorTitle: 'Error',
      contentSection: 'Test Listing',
      emptyMessage: 'No items.',
      routeBase: '/test',
      getTitle: (item: TestItem) => item.entity.description || item.alias,
    },
    global: {
      stubs: {
        ...baseStubs,
        ListItem: listItemWithTitleSlotStub,
      },
    },
  });
};

describe('List.vue – sort URL persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRouteQuery.value = {};
  });

  it('initialises sortBy to DEFAULT_SORT_OPTION when no sort query param is present', async () => {
    const wrapper = mountList();
    await flushPromises();
    await nextTick();

    const toolbar = wrapper.findComponent({ name: 'ListToolbar' });
    expect(toolbar.props('sortBy')).toBe('description-asc');
  });

  it('initialises sortBy from a valid sort query param in the URL', async () => {
    const wrapper = mountList({ sort: 'id-desc' });
    await flushPromises();
    await nextTick();

    const toolbar = wrapper.findComponent({ name: 'ListToolbar' });
    expect(toolbar.props('sortBy')).toBe('id-desc');
  });

  it('ignores an invalid sort query param and falls back to DEFAULT_SORT_OPTION', async () => {
    const wrapper = mountList({ sort: 'invalid-value' });
    await flushPromises();
    await nextTick();

    const toolbar = wrapper.findComponent({ name: 'ListToolbar' });
    expect(toolbar.props('sortBy')).toBe('description-asc');
  });

  it('initialises filterQuery from filter query param and sortBy from sort query param', async () => {
    const wrapper = mountList({ filter: 'alpha', sort: 'date-asc' });
    await flushPromises();
    await nextTick();

    const toolbar = wrapper.findComponent({ name: 'ListToolbar' });
    expect(toolbar.props('filterQuery')).toBe('alpha');
    expect(toolbar.props('sortBy')).toBe('date-asc');
  });

  it('updates the URL when sortBy changes, preserving existing filter', async () => {
    const wrapper = mountList({ filter: 'beta' });
    await flushPromises();
    await nextTick();

    mockRouterReplace.mockClear();

    // Simulate user changing the sort option via the toolbar emit.
    await wrapper.findComponent({ name: 'ListToolbar' }).vm.$emit('update:sortBy', 'id-asc');
    await nextTick();

    const lastCall = mockRouterReplace.mock.calls.at(-1)?.[0];
    expect(lastCall?.query?.filter).toBe('beta');
    expect(lastCall?.query?.sort).toBe('id-asc');
  });

  it('removes the sort query param when sortBy is reset to the default', async () => {
    const wrapper = mountList({ sort: 'id-desc' });
    await flushPromises();
    await nextTick();

    mockRouterReplace.mockClear();

    // Simulate user resetting sort back to description-asc (the default).
    await wrapper
      .findComponent({ name: 'ListToolbar' })
      .vm.$emit('update:sortBy', 'description-asc');
    await nextTick();

    const lastCall = mockRouterReplace.mock.calls.at(-1)?.[0];
    expect(lastCall?.query?.sort).toBeUndefined();
  });
});

describe('List.vue – filtering behaviour', () => {
  const specialItems: TestItem[] = [
    {
      alias: 'ohara',
      entity: { id: 10, created_ts: 1000, description: "O'Hara-Rudy-CiPA-v1.0 (2017)" },
    },
    {
      alias: 'noble',
      entity: { id: 11, created_ts: 2000, description: 'Garny, Kohl, Hunter, Boyett, Noble, 2003' },
    },
    { alias: 'plain', entity: { id: 12, created_ts: 3000, description: 'Plain text item' } },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockRouteQuery.value = {};
  });

  it('shows all items when filter is empty', async () => {
    const wrapper = mountList({}, specialItems);
    await nextTick();
    expect(wrapper.findAll('[data-testid="list-item"]')).toHaveLength(3);
  });

  it('matches description using spaces in place of punctuation (normalised AND-token matching)', async () => {
    // "O Hara Rudy CiPA" should normalise to tokens ["o", "hara", "rudy", "cipa"]
    // which all appear in the normalised form of "O'Hara-Rudy-CiPA-v1.0 (2017)".
    const wrapper = mountList({ filter: 'O Hara Rudy CiPA' }, specialItems);
    await nextTick();
    const items = wrapper.findAll('[data-testid="list-item"]');
    expect(items).toHaveLength(1);
    expect(items[0].text()).toContain("O'Hara-Rudy-CiPA-v1.0 (2017)");
  });

  it('matches description using original punctuation in query', async () => {
    // The query is normalised before tokenising, so "O'Hara-Rudy" → tokens ["o", "hara", "rudy"].
    const wrapper = mountList({ filter: "O'Hara-Rudy" }, specialItems);
    await nextTick();
    const items = wrapper.findAll('[data-testid="list-item"]');
    expect(items).toHaveLength(1);
    expect(items[0].text()).toContain("O'Hara-Rudy-CiPA-v1.0 (2017)");
  });

  it('applies AND semantics — excludes items missing any token', async () => {
    // "Noble" and "Garny" are both in item 11 only.
    // Only item 11 ("Garny, Kohl, Hunter, Boyett, Noble, 2003") contains BOTH tokens.
    const wrapper = mountList({ filter: 'Noble Garny' }, specialItems);
    await nextTick();
    const items = wrapper.findAll('[data-testid="list-item"]');
    expect(items).toHaveLength(1);
    expect(items[0].text()).toContain('Garny, Kohl, Hunter, Boyett, Noble, 2003');
  });

  it('excludes items where no tokens match description or ID', async () => {
    const wrapper = mountList({ filter: 'unrelated' }, specialItems);
    await nextTick();
    expect(wrapper.findAll('[data-testid="list-item"]')).toHaveLength(0);
  });

  it('is case-insensitive for description matching', async () => {
    const wrapper = mountList({ filter: 'plain TEXT' }, specialItems);
    await nextTick();
    const items = wrapper.findAll('[data-testid="list-item"]');
    expect(items).toHaveLength(1);
    expect(items[0].text()).toContain('Plain text item');
  });

  it('matches item by ID exact substring', async () => {
    const wrapper = mountList({ filter: '10' }, specialItems);
    await nextTick();
    const items = wrapper.findAll('[data-testid="list-item"]');
    const titles = items.map((i) => i.text());
    expect(titles).toContain("O'Hara-Rudy-CiPA-v1.0 (2017)");
  });

  it('does not match items where neither description tokens nor ID match', async () => {
    const wrapper = mountList({ filter: '99' }, specialItems);
    await nextTick();
    expect(wrapper.findAll('[data-testid="list-item"]')).toHaveLength(0);
  });

  it('handles null description gracefully (matches by ID only)', async () => {
    const nullDescItems: TestItem[] = [
      { alias: 'null-desc', entity: { id: 20, created_ts: 1000, description: null } },
    ];
    const wrapper = mountList({ filter: '20' }, nullDescItems);
    await nextTick();
    expect(wrapper.findAll('[data-testid="list-item"]')).toHaveLength(1);
  });
});

describe('List.vue – highlight rendering', () => {
  const highlightItems: TestItem[] = [
    {
      alias: 'ohara',
      entity: { id: 10, created_ts: 1000, description: "O'Hara-Rudy-CiPA-v1.0 (2017)" },
    },
    { alias: 'plain', entity: { id: 12, created_ts: 3000, description: 'Plain text item' } },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockRouteQuery.value = {};
  });

  it('wraps matched tokens in <mark> in the title', async () => {
    const wrapper = mountListWithHighlightStub('Hara', highlightItems);
    await nextTick();

    // Only the O'Hara item should be visible.
    const marks = wrapper.findAll('mark');
    expect(marks.length).toBeGreaterThan(0);
    expect(marks[0].text().toLowerCase()).toBe('hara');
  });

  it('renders no <mark> elements when filter is empty', async () => {
    const wrapper = mountListWithHighlightStub('', highlightItems);
    await nextTick();
    expect(wrapper.findAll('mark')).toHaveLength(0);

    // When the filter is empty, the plain title text should still render.
    const textContent = wrapper.text();
    expect(textContent).toContain("O'Hara-Rudy-CiPA-v1.0 (2017)");
    expect(textContent).toContain('Plain text item');
  });

  it('renders no <mark> when query does not match any item', async () => {
    const wrapper = mountListWithHighlightStub('unrelated', highlightItems);
    await nextTick();
    expect(wrapper.findAll('mark')).toHaveLength(0);
  });
});
