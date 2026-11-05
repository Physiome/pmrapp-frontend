<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import ActionButton from '@/components/atoms/ActionButton.vue';
import ArrowUpIcon from '@/components/icons/ArrowUpIcon.vue';
import CheckmarkIcon from '@/components/icons/CheckmarkIcon.vue';
import ChevronDownIcon from '@/components/icons/ChevronDownIcon.vue';
import type { SortOption } from '@/types/common';
import type { SortOptionGroup } from '@/utils/sort';

interface Props {
  modelValue: SortOption;
  options: SortOptionGroup[];
  disabled?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: SortOption];
}>();

const isOpen = ref(false);
const dropdownRef = ref<HTMLDivElement | null>(null);

// Parse current sort option into field and direction.
const currentSort = computed(() => {
  const [field, direction] = props.modelValue.split('-') as [string, string];
  return { field, direction };
});

const currentFieldLabel = computed(() => {
  const fieldsGroup = props.options.find((g) => g.group === 'Fields');
  return (
    fieldsGroup?.options.find((o) => o.value === currentSort.value.field)?.label ||
    currentSort.value.field
  );
});

const getDirectionArrowClass = (direction: string) => {
  const classes = ['w-4 h-4 transition-transform'];
  if (direction === 'desc') {
    classes.push('rotate-180');
  }
  return classes.join(' ');
};

const isOptionSelected = (option: { value: string; type: 'field' | 'direction' }) => {
  return option.type === 'field'
    ? props.modelValue.startsWith(option.value)
    : props.modelValue.endsWith(option.value);
};

const handleSelectOption = (value: string, type: 'field' | 'direction') => {
  let newSortOption: SortOption;

  if (type === 'field') {
    // Update field, keep direction.
    newSortOption = `${value}-${currentSort.value.direction}` as SortOption;
  } else {
    // Update direction, keep field.
    newSortOption = `${currentSort.value.field}-${value}` as SortOption;
  }

  emit('update:modelValue', newSortOption);
};

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div ref="dropdownRef" class="relative inline-block">
    <ActionButton
      variant="secondary"
      size="lg"
      aria-haspopup="true"
      :aria-expanded="isOpen"
      aria-label="Sort options"
      @click="isOpen = !isOpen"
      content-section="List toolbar: sort dropdown"
      :disabled="props.disabled"
    >
      <ArrowUpIcon :class="getDirectionArrowClass(currentSort.direction)" />
      <span>{{ currentFieldLabel }}</span>
      <ChevronDownIcon class="w-4 h-4" />
    </ActionButton>

    <transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        role="menu"
        class="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-background border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
      >
        <div class="py-1">
          <div
            v-for="(group, index) in options"
            :key="group.group"
            class="py-2"
            :class="{ 'border-b border-gray-200 dark:border-gray-700': index < options.length - 1 }"
          >
            <button
              type="button"
              v-for="option in group.options"
              :key="option.value"
              role="menuitem"
              class="w-full text-left px-3 py-2 text-sm cursor-pointer text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
              :class="{
                'bg-gray-100 dark:bg-gray-700': isOptionSelected(option),
              }"
              @click="handleSelectOption(option.value, option.type)"
            >
              <CheckmarkIcon
                v-if="isOptionSelected(option)"
                class="w-4 h-4 text-primary flex-shrink-0"
              />
              <span v-else class="w-4 flex-shrink-0" />
              <ArrowUpIcon
                v-if="option.type === 'direction'"
                :class="getDirectionArrowClass(option.value)"
              />
              <span>{{ option.label }}</span>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>
