import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CodeBlock from '@/components/atoms/CodeBlock.vue';

// Mock PrismJS to avoid real syntax highlighting in tests.
vi.mock('prismjs', () => ({
  default: {
    highlightElement: vi.fn(),
    plugins: {
      lineNumbers: {
        resize: vi.fn(),
      },
    },
  },
}));

// Mock PrismJS language and plugin imports.
vi.mock('prismjs/components/prism-markup', () => ({}));
vi.mock('prismjs/components/prism-css', () => ({}));
vi.mock('prismjs/components/prism-c', () => ({}));
vi.mock('prismjs/components/prism-cpp', () => ({}));
vi.mock('prismjs/components/prism-fortran', () => ({}));
vi.mock('prismjs/components/prism-javascript', () => ({}));
vi.mock('prismjs/components/prism-json', () => ({}));
vi.mock('prismjs/components/prism-python', () => ({}));
vi.mock('prismjs/components/prism-markdown', () => ({}));
vi.mock('prismjs/components/prism-matlab', () => ({}));
vi.mock('prismjs/plugins/line-numbers/prism-line-numbers.css', () => ({}));
vi.mock('prismjs/plugins/line-numbers/prism-line-numbers', () => ({}));
vi.mock('prismjs/themes/prism-okaidia.css?url', () => ({ default: '' }));
vi.mock('prismjs/themes/prism.css?url', () => ({ default: '' }));

beforeEach(() => {
  // ResizeObserver must be a proper constructor for the component's typeof check.
  class MockResizeObserver {
    observe = vi.fn();
    disconnect = vi.fn();
  }
  vi.stubGlobal('ResizeObserver', MockResizeObserver);

  // jsdom does not implement matchMedia; provide a minimal stub.
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
});

const smallCode = 'const x = 1';

describe('CodeBlock', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('renders code content', () => {
    const wrapper = mount(CodeBlock, {
      props: { code: smallCode, filename: 'example.js' },
    });
    expect(wrapper.find('code').text()).toBe(smallCode);
    wrapper.unmount();
  });

  it('includes the line-numbers class', () => {
    const wrapper = mount(CodeBlock, {
      props: { code: smallCode, filename: 'example.py' },
    });
    expect(wrapper.find('pre').classes()).toContain('line-numbers');
    wrapper.unmount();
  });

  it('applies the correct language class for .cellml files', () => {
    const wrapper = mount(CodeBlock, {
      props: { code: smallCode, filename: 'model.cellml' },
    });
    expect(wrapper.find('code').classes()).toContain('language-markup');
    wrapper.unmount();
  });

  it('applies plaintext language class for unknown extensions', () => {
    const wrapper = mount(CodeBlock, {
      props: { code: smallCode, filename: 'data.xyz' },
    });
    expect(wrapper.find('code').classes()).toContain('language-plaintext');
    wrapper.unmount();
  });

  it('updates code when props change', async () => {
    const wrapper = mount(CodeBlock, {
      props: { code: smallCode, filename: 'model.cellml' },
    });

    expect(wrapper.find('code').text()).toBe(smallCode);

    await wrapper.setProps({ code: 'new code' });
    await wrapper.vm.$nextTick();

    expect(wrapper.find('code').text()).toBe('new code');
    wrapper.unmount();
  });

  it('applies the correct language class for .neon files', () => {
    const wrapper = mount(CodeBlock, {
      props: { code: smallCode, filename: 'generated.neon' },
    });
    expect(wrapper.find('code').classes()).toContain('language-json');
    wrapper.unmount();
  });

  it('applies the correct language class for .xul files', () => {
    const wrapper = mount(CodeBlock, {
      props: { code: smallCode, filename: 'model.xul' },
    });
    expect(wrapper.find('code').classes()).toContain('language-markup');
    wrapper.unmount();
  });
});
