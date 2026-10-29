<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import ChevronRightIcon from '@/components/icons/ChevronRightIcon.vue'
import type { BreadcrumbItem } from '@/types/breadcrumb'

const props = defineProps<{
  items: BreadcrumbItem[]
}>()

// Trails longer than this collapse their middle items on small screens.
const COLLAPSE_THRESHOLD = 4

// Ancestors with labels this short (e.g. "src", "models") give up space after longer ones.
const SHORT_LABEL_LENGTH = 16

const isExpanded = ref(false)
const listRef = ref<HTMLOListElement | null>(null)

const lastIndex = computed(() => props.items.length - 1)

const isCollapsible = computed(() => props.items.length > COLLAPSE_THRESHOLD)

// Keep the first item, the parent and the current page visible; collapse everything in between.
const hiddenCount = computed(() => (isCollapsible.value ? props.items.length - 3 : 0))

const isCollapsedItem = (index: number) =>
  !isExpanded.value && index > 0 && index <= hiddenCount.value

// The toggle disappears once clicked, so move focus to the first revealed link.
// Look it up by item index: the first item is not always a link (e.g. while it loads).
const expand = async () => {
  isExpanded.value = true
  await nextTick()
  listRef.value?.querySelector<HTMLElement>('[data-index="1"] a')?.focus()
}

const focusClasses = 'rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'

const shrinkClasses = (item: BreadcrumbItem, index: number) => {
  if (item.loading) return 'shrink-0'
  // The current page shrinks least so it stays readable.
  if (index === lastIndex.value) return 'min-w-0'
  // Ancestors give up space first, long labels before short ones.
  return item.label.length > SHORT_LABEL_LENGTH ? 'min-w-0 shrink-4' : 'min-w-0 shrink-2'
}

// Identifies the page by where the crumbs point, not by their labels,
// so a label that finishes loading (or a parent recomputing the same items) doesn't count as navigation.
// The current page's label is kept to tell sibling files apart.
const trailKey = computed(() =>
  JSON.stringify(
    props.items.map((item, index) => item.to ?? (index === lastIndex.value ? item.label : '')),
  ),
)

// Collapse again when navigating to another page.
watch(trailKey, () => {
  isExpanded.value = false
})
</script>

<template>
  <nav aria-label="Breadcrumb" class="min-w-0">
    <ol
      ref="listRef"
      class="flex items-center min-w-0 text-sm"
      :class="{ 'flex-wrap gap-y-1': isExpanded }"
    >
      <template v-for="(item, index) in items" :key="index">
        <li
          v-if="index === 1 && hiddenCount > 0 && !isExpanded"
          class="flex items-center shrink-0 sm:hidden"
        >
          <ChevronRightIcon class="w-3 h-3 mx-1.5 text-gray-400 dark:text-gray-500 shrink-0" aria-hidden="true" />
          <button
            type="button"
            class="text-link px-1 py-1 leading-none"
            :class="focusClasses"
            :aria-label="`Show ${hiddenCount} more breadcrumb ${hiddenCount === 1 ? 'item' : 'items'}`"
            :aria-expanded="isExpanded"
            @click="expand"
          >
            &hellip;
          </button>
        </li>

        <li
          :data-index="index"
          class="items-center py-1"
          :class="[
            isCollapsedItem(index) ? 'hidden sm:flex' : 'flex',
            shrinkClasses(item, index),
          ]"
        >
          <ChevronRightIcon
            v-if="index > 0"
            class="w-3 h-3 mx-1.5 text-gray-400 dark:text-gray-500 shrink-0"
            aria-hidden="true"
          />

          <span v-if="item.loading" class="flex items-center h-5" role="status">
            <span
              class="block h-3 w-32 sm:w-48 rounded bg-gray-200 dark:bg-gray-700 animate-pulse"
              aria-hidden="true"
            />
            <span class="sr-only">Loading…</span>
          </span>

          <span
            v-else-if="!item.to"
            class="block truncate font-medium text-gray-800 dark:text-gray-200"
            :title="item.label"
            :aria-current="index === lastIndex ? 'page' : undefined"
          >
            {{ item.label }}
          </span>

          <RouterLink
            v-else
            :to="item.to"
            class="text-link block truncate"
            :class="focusClasses"
            :title="item.label"
          >
            {{ item.label }}
          </RouterLink>
        </li>
      </template>
    </ol>
  </nav>
</template>

<style scoped>
@import '@/assets/text-link.css';
</style>
