<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import ChevronRightIcon from '@/components/icons/ChevronRightIcon.vue'
import HomeIcon from '@/components/icons/HomeIcon.vue'
import type { BreadcrumbItem } from '@/types/breadcrumb'

const props = defineProps<{
  items: BreadcrumbItem[]
}>()

// Trails longer than this collapse their middle items on small screens.
const COLLAPSE_THRESHOLD = 4

// Labels this short (e.g. "Exposures", "Mathematics") never truncate.
const SHORT_LABEL_LENGTH = 16

const isExpanded = ref(false)
const listRef = ref<HTMLOListElement | null>(null)

const allItems = computed<BreadcrumbItem[]>(() => [{ label: 'Home', to: '/' }, ...props.items])

const lastIndex = computed(() => allItems.value.length - 1)

const isCollapsible = computed(() => allItems.value.length > COLLAPSE_THRESHOLD)

// Keep "Home", the parent and the current page visible; collapse everything in between.
const hiddenCount = computed(() => (isCollapsible.value ? allItems.value.length - 3 : 0))

const isCollapsedItem = (index: number) =>
  !isExpanded.value && index > 0 && index <= hiddenCount.value

// The toggle disappears once clicked, so move focus to the first revealed link.
const expand = async () => {
  isExpanded.value = true
  await nextTick()
  listRef.value?.querySelectorAll<HTMLElement>('a')[1]?.focus()
}

const focusClasses = 'rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'

const shrinkClasses = (item: BreadcrumbItem, index: number) => {
  if (index === 0 || item.label.length <= SHORT_LABEL_LENGTH) return 'shrink-0'
  // Ancestors give up space first so the current page stays readable.
  return index === lastIndex.value ? 'min-w-0' : 'min-w-0 shrink-4'
}

const labelWidthClasses = 'max-w-32 sm:max-w-48 lg:max-w-72'

// Collapse again when navigating to another page.
watch(
  () => props.items,
  () => {
    isExpanded.value = false
  },
  { deep: true },
)
</script>

<template>
  <nav aria-label="Breadcrumb" class="min-w-0">
    <ol
      ref="listRef"
      class="flex items-center min-w-0 text-sm"
      :class="{ 'flex-wrap gap-y-1': isExpanded }"
    >
      <template v-for="(item, index) in allItems" :key="index">
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

          <span
            v-if="!item.to"
            class="block truncate font-medium text-gray-800 dark:text-gray-200"
            :title="item.label"
            :aria-current="index === lastIndex ? 'page' : undefined"
          >
            {{ item.label }}
          </span>

          <RouterLink
            v-else-if="index === 0"
            :to="item.to"
            class="text-link inline-flex items-center"
            :class="focusClasses"
          >
            <HomeIcon class="w-4 h-4 sm:hidden" aria-hidden="true" />
            <span class="sr-only sm:not-sr-only">{{ item.label }}</span>
          </RouterLink>

          <RouterLink
            v-else
            :to="item.to"
            class="text-link block truncate"
            :class="[focusClasses, labelWidthClasses]"
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
