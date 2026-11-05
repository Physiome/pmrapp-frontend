<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    anchorEl?: HTMLElement | null;
    offset?: number;
    visible: boolean;
  }>(),
  {
    anchorEl: null,
    offset: 8,
  },
);

const tooltipTop = ref(0);
const tooltipLeft = ref(0);
const tooltipEl = ref<HTMLElement | null>(null);

const VIEWPORT_PADDING = 8;

const updatePosition = () => {
  if (!props.anchorEl || !tooltipEl.value) return;

  const anchorRect = props.anchorEl.getBoundingClientRect();
  const tooltipRect = tooltipEl.value.getBoundingClientRect();

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Default to centered above the anchor.
  let nextLeft = anchorRect.left + anchorRect.width / 2 - tooltipRect.width / 2;
  let nextTop = anchorRect.top - tooltipRect.height - props.offset;

  // Keep the tooltip fully visible horizontally.
  nextLeft = Math.max(
    VIEWPORT_PADDING,
    Math.min(nextLeft, viewportWidth - tooltipRect.width - VIEWPORT_PADDING),
  );

  // If there is no room above, place it below the anchor.
  if (nextTop < VIEWPORT_PADDING) {
    nextTop = anchorRect.bottom + props.offset;
  }

  // Clamp vertically to viewport if still overflowing.
  nextTop = Math.max(
    VIEWPORT_PADDING,
    Math.min(nextTop, viewportHeight - tooltipRect.height - VIEWPORT_PADDING),
  );

  tooltipTop.value = nextTop;
  tooltipLeft.value = nextLeft;
};

watch(
  () => props.visible,
  async (isVisible) => {
    if (isVisible) {
      await nextTick();
      updatePosition();
    }
  },
  { immediate: true },
);

watch(
  () => props.anchorEl,
  (anchor) => {
    if (props.visible && anchor) {
      updatePosition();
    }
  },
);

const handleViewportChange = () => {
  if (props.visible) {
    updatePosition();
  }
};

onMounted(() => {
  window.addEventListener('scroll', handleViewportChange, true);
  window.addEventListener('resize', handleViewportChange);
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleViewportChange, true);
  window.removeEventListener('resize', handleViewportChange);
});
</script>

<template>
  <Teleport to="body">
    <span
      v-if="visible"
      ref="tooltipEl"
      class="fixed z-[9999] bg-gray-800 dark:bg-gray-700 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none"
      :style="{ top: `${tooltipTop}px`, left: `${tooltipLeft}px` }"
    >
      <slot />
    </span>
  </Teleport>
</template>
