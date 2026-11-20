import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CodeBlock from '@/components/atoms/CodeBlock.vue';
import { FILE_PANEL_SCROLL_SYNC } from '@/constants/filePanel';
import type { FilePanelScrollSync } from '@/types/filePanel';

// Monaco does not run in jsdom, so the editor is replaced with a fake that records its calls.
// Real rendering is covered by the Cypress tests.
const monacoMock = vi.hoisted(() => {
  const model = {
    value: '',
    getValue: vi.fn(() => model.value),
    setValue: vi.fn((value: string) => {
      model.value = value;
    }),
    dispose: vi.fn(),
  };
  const editor = {
    onDidContentSizeChange: vi.fn(),
    onDidScrollChange: vi.fn(),
    setScrollTop: vi.fn(),
    getContentHeight: vi.fn(() => 120),
    getModel: vi.fn(() => model),
    updateOptions: vi.fn(),
    dispose: vi.fn(),
  };
  const monaco = {
    editor: {
      // Like Monaco, the editor creates its own model from the `value` option.
      create: vi.fn((_host: HTMLElement, options: Record<string, unknown>) => {
        model.value = String(options.value ?? '');
        return editor;
      }),
      setModelLanguage: vi.fn(),
      setTheme: vi.fn(),
    },
  };
  return { model, editor, monaco, loadMonaco: vi.fn(() => Promise.resolve(monaco)) };
});

vi.mock('@/utils/monaco', () => ({ loadMonaco: monacoMock.loadMonaco }));

const { model, editor, monaco, loadMonaco } = monacoMock;

const createOptions = () => monaco.editor.create.mock.calls[0]?.[1] ?? {};

describe('CodeBlock', () => {
  let wrapper: VueWrapper | null = null;
  let colourSchemeListeners: ((event: MediaQueryListEvent) => void)[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    loadMonaco.mockImplementation(() => Promise.resolve(monaco));
    colourSchemeListeners = [];
    window.matchMedia = vi.fn(
      (media: string) =>
        ({
          matches: false,
          media,
          addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
            colourSchemeListeners.push(listener);
          },
          removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
            colourSchemeListeners = colourSchemeListeners.filter((item) => item !== listener);
          },
        }) as unknown as MediaQueryList,
    );
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  const mountCodeBlock = async (
    props: Record<string, unknown>,
    scrollSync: FilePanelScrollSync | null = null,
  ) => {
    wrapper = mount(CodeBlock, {
      props: { code: 'const x = 1', filename: 'example.js', ...props },
      attachTo: document.body,
      global: scrollSync ? { provide: { [FILE_PANEL_SCROLL_SYNC]: scrollSync } } : {},
    });
    await flushPromises();
    return wrapper;
  };

  it('creates a read-only editor without a minimap', async () => {
    await mountCodeBlock({});

    expect(monaco.editor.create).toHaveBeenCalledOnce();
    expect(createOptions()).toMatchObject({
      readOnly: true,
      domReadOnly: true,
      minimap: { enabled: false },
      largeFileOptimizations: false,
      value: 'const x = 1',
    });
    expect(createOptions()).not.toHaveProperty('model');
  });

  it.each([
    ['model.cellml', 'xml', 'xml'],
    ['script.js', 'javascript', 'typescript'],
    ['model.f77', 'fortran', 'fortran'],
    ['model.m', 'matlab', 'matlab'],
    ['data.xyz', 'plaintext', 'plaintext'],
  ])('uses the language detected for %s', async (filename, dataLanguage, monacoLanguage) => {
    await mountCodeBlock({ code: 'x', filename });

    expect(createOptions()).toMatchObject({ value: 'x', language: monacoLanguage });
    expect(wrapper?.attributes('data-language')).toBe(dataLanguage);
  });

  it('labels the editor with the filename', async () => {
    await mountCodeBlock({ filename: 'model.cellml' });

    expect(createOptions()).toMatchObject({ ariaLabel: 'Code view of model.cellml' });
  });

  it('updates the code when the prop changes', async () => {
    await mountCodeBlock({});

    await wrapper?.setProps({ code: 'new code' });

    expect(model.setValue).toHaveBeenCalledWith('new code');
  });

  it('updates the language and label when the filename changes', async () => {
    await mountCodeBlock({ filename: 'example.js' });

    await wrapper?.setProps({ filename: 'model.py' });

    expect(monaco.editor.setModelLanguage).toHaveBeenCalledWith(model, 'python');
    expect(editor.updateOptions).toHaveBeenCalledWith({ ariaLabel: 'Code view of model.py' });
  });

  it('starts wrapped when startWrapped is true', async () => {
    await mountCodeBlock({ startWrapped: true });

    expect(createOptions()).toMatchObject({ wordWrap: 'on' });
    expect(wrapper?.attributes('data-wrapped')).toBe('true');
  });

  it('toggles word wrap when startWrapped changes', async () => {
    await mountCodeBlock({});
    expect(createOptions()).toMatchObject({ wordWrap: 'off' });

    await wrapper?.setProps({ startWrapped: true });
    expect(editor.updateOptions).toHaveBeenLastCalledWith({ wordWrap: 'on' });
    expect(wrapper?.attributes('data-wrapped')).toBe('true');

    await wrapper?.setProps({ startWrapped: false });
    expect(editor.updateOptions).toHaveBeenLastCalledWith({ wordWrap: 'off' });
  });

  it('fits short content and caps the height of long content', async () => {
    await mountCodeBlock({});

    const host = wrapper?.find('.code-block-editor').element as HTMLElement;
    expect(host.style.height).toContain('120px');
    expect(host.style.height).toContain('min(');
  });

  it('follows the system colour scheme', async () => {
    await mountCodeBlock({});
    expect(createOptions()).toMatchObject({ theme: 'pmr-light' });

    for (const listener of colourSchemeListeners) {
      listener({ matches: true } as MediaQueryListEvent);
    }

    expect(monaco.editor.setTheme).toHaveBeenCalledWith('pmr-dark');
  });

  it('disposes the editor, which owns its model, on unmount', async () => {
    await mountCodeBlock({});

    wrapper?.unmount();
    wrapper = null;

    expect(editor.dispose).toHaveBeenCalledOnce();
    expect(model.dispose).not.toHaveBeenCalled();
    expect(colourSchemeListeners).toHaveLength(0);
  });

  it('does not create an editor when unmounted before Monaco has loaded', async () => {
    let resolveMonaco: (value: typeof monaco) => void = () => {};
    loadMonaco.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveMonaco = resolve;
        }),
    );
    wrapper = mount(CodeBlock, { props: { code: 'x', filename: 'example.js' } });

    wrapper.unmount();
    wrapper = null;
    resolveMonaco(monaco);
    await flushPromises();

    expect(monaco.editor.create).not.toHaveBeenCalled();
  });

  it('shows the code as plain text when Monaco fails to load', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    loadMonaco.mockImplementation(() => Promise.reject(new Error('network error')));

    await mountCodeBlock({ code: '<model/>' });

    expect(wrapper?.find('pre').text()).toBe('<model/>');
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  describe('inside a sticky file panel', () => {
    const createScrollSync = () => ({
      setContentHeight: vi.fn(),
      onPageScroll: vi.fn(),
      scrollPageTo: vi.fn(),
    });

    it('hides the vertical scrollbar and reports the content height', async () => {
      const scrollSync = createScrollSync();
      await mountCodeBlock({}, scrollSync);

      expect(createOptions()).toMatchObject({ scrollbar: { vertical: 'hidden' } });
      expect(scrollSync.setContentHeight).toHaveBeenCalledWith(120);
    });

    it('scrolls the editor when the page scrolls', async () => {
      const scrollSync = createScrollSync();
      await mountCodeBlock({}, scrollSync);

      const followPage = scrollSync.onPageScroll.mock.calls[0]?.[0];
      followPage(840);

      expect(editor.setScrollTop).toHaveBeenCalledWith(840);
    });

    it('scrolls the page when the editor scrolls itself, but not when it follows the page', async () => {
      const scrollSync = createScrollSync();
      editor.setScrollTop.mockImplementation((scrollTop: number) => {
        for (const [listener] of editor.onDidScrollChange.mock.calls) {
          listener({ scrollTop, scrollTopChanged: true });
        }
      });
      await mountCodeBlock({}, scrollSync);

      scrollSync.onPageScroll.mock.calls[0]?.[0](300);
      expect(scrollSync.scrollPageTo).not.toHaveBeenCalled();

      // For example, a search match further down the file.
      const [onScroll] = editor.onDidScrollChange.mock.calls[0] ?? [];
      onScroll({ scrollTop: 4200, scrollTopChanged: true });
      expect(scrollSync.scrollPageTo).toHaveBeenCalledWith(4200);
      editor.setScrollTop.mockReset();
    });

    it('sends vertical wheel scrolling to the page and keeps horizontal scrolling', async () => {
      await mountCodeBlock({}, createScrollSync());
      const host = wrapper?.find('.code-block-editor').element as HTMLElement;
      const child = document.createElement('div');
      host.appendChild(child);
      const reachedEditor = vi.fn();
      child.addEventListener('wheel', reachedEditor);

      child.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, bubbles: true }));
      expect(reachedEditor).not.toHaveBeenCalled();

      child.dispatchEvent(new WheelEvent('wheel', { deltaX: 100, bubbles: true }));
      expect(reachedEditor).toHaveBeenCalledOnce();
    });

    it('stops following the page on unmount', async () => {
      const scrollSync = createScrollSync();
      await mountCodeBlock({}, scrollSync);

      wrapper?.unmount();
      wrapper = null;

      expect(scrollSync.onPageScroll).toHaveBeenLastCalledWith(null);
      expect(scrollSync.setContentHeight).toHaveBeenLastCalledWith(null);
    });
  });
});
