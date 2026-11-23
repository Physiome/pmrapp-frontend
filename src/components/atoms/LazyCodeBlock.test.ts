import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LazyCodeBlock from '@/components/atoms/LazyCodeBlock.vue';

// The real CodeBlock needs Monaco, so a stub records the props it receives.
// The mock is registered per test, after the module cache is reset,
// so that each test can make the import fail or succeed.
const mockCodeBlock = (fail: boolean) => {
  vi.doMock('@/components/atoms/CodeBlock.vue', () => {
    if (fail) throw new Error('Failed to fetch dynamically imported module');
    return {
      default: {
        name: 'CodeBlock',
        props: ['code', 'filename', 'startWrapped'],
        template: '<div class="code-block-stub">{{ code }}</div>',
      },
    };
  });
};

describe('LazyCodeBlock', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.doUnmock('@/components/atoms/CodeBlock.vue');
  });

  it('loads the code viewer and passes its props on', async () => {
    mockCodeBlock(false);
    const wrapper = mount(LazyCodeBlock, {
      props: { code: 'const x = 1', filename: 'example.js', startWrapped: true },
    });
    await vi.waitFor(() =>
      expect(wrapper.findComponent({ name: 'CodeBlock' }).exists()).toBe(true),
    );

    const codeBlock = wrapper.findComponent({ name: 'CodeBlock' });
    expect(codeBlock.props()).toEqual({
      code: 'const x = 1',
      filename: 'example.js',
      startWrapped: true,
    });
    expect(wrapper.find('pre').exists()).toBe(false);
  });

  it('shows the code as plain text when the code viewer fails to load', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockCodeBlock(true);

    const wrapper = mount(LazyCodeBlock, {
      props: { code: '<model/>', filename: 'model.cellml' },
    });
    await vi.waitFor(() => expect(wrapper.find('pre').exists()).toBe(true));

    expect(wrapper.find('.code-block-stub').exists()).toBe(false);
    expect(wrapper.find('pre').text()).toBe('<model/>');
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
