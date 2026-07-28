<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    offset?: number
    maxWidth?: string
  }>(),
  {
    disabled: false,
    offset: 6,
    maxWidth: '260px',
  },
)

const active = ref(false)
const positioned = ref(false)
const triggerEl = ref<HTMLElement | null>(null)
const popoverEl = ref<HTMLElement | null>(null)
const top = ref(0)
const left = ref(0)

const VIEWPORT_PADDING = 8
let hideTimer: ReturnType<typeof setTimeout> | null = null

const updatePosition = () => {
  if (!triggerEl.value || !popoverEl.value) return

  const triggerRect = triggerEl.value.getBoundingClientRect()
  const popoverRect = popoverEl.value.getBoundingClientRect()

  // If the popover hasn't been laid out yet, try again on the next frame.
  if (popoverRect.width === 0 || popoverRect.height === 0) {
    requestAnimationFrame(updatePosition)
    return
  }

  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  // Default: position below the trigger, centered.
  let nextTop = triggerRect.bottom + props.offset
  let nextLeft = triggerRect.left + triggerRect.width / 2 - popoverRect.width / 2

  // Keep within viewport horizontally.
  nextLeft = Math.max(
    VIEWPORT_PADDING,
    Math.min(nextLeft, viewportWidth - popoverRect.width - VIEWPORT_PADDING),
  )

  // If no room below, place above.
  if (nextTop + popoverRect.height > viewportHeight - VIEWPORT_PADDING) {
    nextTop = triggerRect.top - popoverRect.height - props.offset
  }

  // Clamp vertically to viewport.
  nextTop = Math.max(
    VIEWPORT_PADDING,
    Math.min(nextTop, viewportHeight - popoverRect.height - VIEWPORT_PADDING),
  )

  top.value = nextTop
  left.value = nextLeft
  positioned.value = true
}

const show = () => {
  if (props.disabled) return
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }

  if (!active.value) {
    active.value = true
    positioned.value = false

    // Wait for DOM to render the teleported popover, then measure and position it.
    nextTick(() => {
      requestAnimationFrame(() => {
        updatePosition()
      })
    })
  }
}

const hide = () => {
  hideTimer = setTimeout(() => {
    active.value = false
    positioned.value = false
  }, 100)
}

const popupContainerClasses = computed(() => [
  'fixed z-[9999] p-3',
  'leading-relaxed text-sm text-gray-700 dark:text-gray-300',
  'bg-white dark:bg-gray-800',
  'rounded-lg border border-gray-200 dark:border-gray-600',
  'opacity-0 shadow-lg transition-opacity duration-100',
  { 'opacity-100': positioned.value },
])

const handleViewportChange = () => {
  if (active.value) updatePosition()
}

onMounted(() => {
  window.addEventListener('scroll', handleViewportChange, true)
  window.addEventListener('resize', handleViewportChange)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleViewportChange, true)
  window.removeEventListener('resize', handleViewportChange)
  if (hideTimer) clearTimeout(hideTimer)
})
</script>

<template>
  <span
    ref="triggerEl"
    class="inline-flex"
    @mouseenter="show"
    @mouseleave="hide"
    @focusin="show"
    @focusout="hide"
  >
    <slot name="trigger" />
    <Teleport to="body">
      <div
        v-if="active"
        ref="popoverEl"
        role="tooltip"
        :class="popupContainerClasses"
        :style="{ top: `${top}px`, left: `${left}px`, maxWidth: props.maxWidth }"
        @mouseenter="show"
        @mouseleave="hide"
      >
        <slot name="content" />
      </div>
    </Teleport>
  </span>
</template>
