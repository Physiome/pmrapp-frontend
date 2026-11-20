<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, provide, ref } from 'vue';
import { FILE_PANEL_SCROLL_SYNC } from '@/constants/filePanel';
import type { FilePanelScrollSync } from '@/types/filePanel';
import { syncHeightToCssProperty } from '@/utils/elementHeight';

const props = defineProps<{
  title: string;
  /**
   * Stick the panel, with its toolbar, below the site header, and let a code viewer inside it
   * scroll with the page instead of showing its own scrollbar. This is read once, when the
   * panel is created.
   */
  sticky?: boolean;
}>();

// Top and bottom panel borders, which are part of the panel's height.
const PANEL_BORDERS_PX = 2;

const trackEl = ref<HTMLElement | null>(null);
const panelEl = ref<HTMLElement | null>(null);
const toolbarEl = ref<HTMLElement | null>(null);
const contentHeight = ref<number | null>(null);
let pageScrollHandler: ((offset: number) => void) | null = null;
let stopToolbarHeightSync: (() => void) | null = null;

// The track is as tall as the panel would be if the viewer showed all of its content, so the
// page scrolls by the same distance as the viewer's content while the panel stays stuck.
const trackStyle = computed(() =>
  props.sticky && contentHeight.value !== null
    ? {
        height: `calc(var(--file-panel-toolbar-height, 0px) + ${PANEL_BORDERS_PX + contentHeight.value}px)`,
      }
    : undefined,
);

/**
 * How far the page has scrolled past the point where the panel sticks below the header. This is
 * how far the sticky panel has been pushed down inside its track.
 */
const stuckOffset = (): number => {
  if (!trackEl.value || !panelEl.value) return 0;
  return panelEl.value.getBoundingClientRect().top - trackEl.value.getBoundingClientRect().top;
};

const handlePageScroll = () => {
  pageScrollHandler?.(stuckOffset());
};

const scrollSync: FilePanelScrollSync = {
  setContentHeight: (height) => {
    contentHeight.value = height;
  },
  onPageScroll: (handler) => {
    pageScrollHandler = handler;
    handlePageScroll();
  },
  scrollPageTo: (offset) => {
    if (!trackEl.value || !panelEl.value) return;
    // Scroll so that the track's top is `offset` above the panel's sticky position, which works
    // whether or not the panel is already stuck.
    const stickyTop = Number.parseFloat(getComputedStyle(panelEl.value).top) || 0;
    const delta = trackEl.value.getBoundingClientRect().top - stickyTop + offset;
    if (Math.abs(delta) >= 1) window.scrollBy(0, delta);
  },
};

if (props.sticky) provide(FILE_PANEL_SCROLL_SYNC, scrollSync);

onMounted(() => {
  // The code viewer subtracts the toolbar height so that the whole panel fits below the header.
  if (trackEl.value && toolbarEl.value) {
    stopToolbarHeightSync = syncHeightToCssProperty(
      toolbarEl.value,
      '--file-panel-toolbar-height',
      trackEl.value,
    );
  }
  if (props.sticky) {
    window.addEventListener('scroll', handlePageScroll, { passive: true });
    window.addEventListener('resize', handlePageScroll);
  }
});

onBeforeUnmount(() => {
  stopToolbarHeightSync?.();
  window.removeEventListener('scroll', handlePageScroll);
  window.removeEventListener('resize', handlePageScroll);
});
</script>

<template>
  <div ref="trackEl" class="file-panel-track" :style="trackStyle">
    <div
      ref="panelEl"
      class="box p-0! overflow-hidden"
      :class="{ 'file-panel-sticky': sticky }"
      :data-sticky="sticky ? 'true' : undefined"
    >
      <div
        ref="toolbarEl"
        class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700"
      >
        <span>{{ title }}</span>
        <div class="flex items-center gap-2">
          <slot name="actions" />
        </div>
      </div>
      <slot />
    </div>
  </div>
</template>

<style scoped>
@import "@/assets/box.css";

.file-panel-sticky {
  position: sticky;
  top: var(--header-height, 0px);
}
</style>
