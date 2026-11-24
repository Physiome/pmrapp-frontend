import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, inject } from 'vue';
import FilePanel from '@/components/atoms/FilePanel.vue';
import { FILE_PANEL_SCROLL_SYNC } from '@/constants/filePanel';
import type { FilePanelScrollSync } from '@/types/filePanel';

// Records the scroll link that the panel provides, as the code viewer would use it.
let scrollSync: FilePanelScrollSync | null = null;
const Viewer = defineComponent({
  setup() {
    scrollSync = inject(FILE_PANEL_SCROLL_SYNC, null);
    return () => null;
  },
});

const rect = (top: number) => ({ top }) as DOMRect;

describe('FilePanel', () => {
  let wrapper: VueWrapper | null = null;

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
    scrollSync = null;
    vi.restoreAllMocks();
  });

  const mountPanel = (sticky: boolean) => {
    wrapper = mount(FilePanel, {
      props: { title: 'model.cellml', sticky },
      slots: { default: Viewer, actions: '<button>Copy</button>' },
      attachTo: document.body,
    });
    return wrapper;
  };

  const track = () => wrapper?.find('.file-panel-track').element as HTMLElement;
  const panel = () => wrapper?.find('.box').element as HTMLElement;

  it('shows the title and actions', () => {
    mountPanel(false);

    expect(wrapper?.text()).toContain('model.cellml');
    expect(wrapper?.find('button').text()).toBe('Copy');
  });

  it('only sticks and links the scroll when sticky', () => {
    mountPanel(false);
    expect(panel().classList).not.toContain('file-panel-sticky');
    expect(scrollSync).toBeNull();

    wrapper?.unmount();
    mountPanel(true);
    expect(panel().classList).toContain('file-panel-sticky');
    expect(scrollSync).not.toBeNull();
  });

  it('makes the track as tall as the full content', async () => {
    mountPanel(true);

    scrollSync?.setContentHeight(42000);
    await wrapper?.vm.$nextTick();
    expect(track().style.height).toBe('calc(var(--file-panel-toolbar-height, 0px) + 42002px)');

    scrollSync?.setContentHeight(null);
    await wrapper?.vm.$nextTick();
    expect(track().style.height).toBe('');
  });

  it('passes the distance scrolled past the sticky point to the viewer', () => {
    mountPanel(true);
    vi.spyOn(track(), 'getBoundingClientRect').mockReturnValue(rect(-700));
    vi.spyOn(panel(), 'getBoundingClientRect').mockReturnValue(rect(84));
    const followPage = vi.fn();

    scrollSync?.onPageScroll(followPage);
    expect(followPage).toHaveBeenLastCalledWith(784);

    window.dispatchEvent(new Event('scroll'));
    expect(followPage).toHaveBeenCalledTimes(2);
  });

  it('scrolls the page so that the viewer shows an offset', () => {
    mountPanel(true);
    panel().style.top = '84px';
    vi.spyOn(track(), 'getBoundingClientRect').mockReturnValue(rect(300));
    const scrollBy = vi.spyOn(window, 'scrollBy').mockImplementation(() => {});

    scrollSync?.scrollPageTo(1000);

    // 216 px to bring the panel up to the header, then 1000 px further.
    expect(scrollBy).toHaveBeenCalledWith(0, 1216);
  });
});
