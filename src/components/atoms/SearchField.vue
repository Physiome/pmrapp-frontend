<script setup lang="ts">
import { computed, ref } from 'vue'
import SearchIcon from '@/components/icons/SearchIcon.vue'
import CloseButton from './CloseButton.vue'

interface Props {
  modelValue: string
  placeholder: string
  ariaLabel: string
  inputClass?: string
  withSearchButton?: boolean
  searchEnabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: 'Search...',
  ariaLabel: 'Search',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  search: []
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  keyup: [event: KeyboardEvent]
}>()

const inputRef = ref<HTMLInputElement | null>(null)

const searchButtonClasses = [
  'flex items-center justify-center p-3',
  'border-l border-gray-200 dark:border-gray-700',
  'bg-gray-200 dark:bg-gray-700',
  'focus-visible:ring-2 focus-visible:ring-primary focus:outline-none',
  'disabled:opacity-50 disabled:cursor-default',
  'transition duration-200 ease-linear',
  'cursor-pointer',
].join(' ')

const searchEnabled = computed(() => Boolean(props.modelValue) || props.searchEnabled)

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

const handleClear = () => {
  emit('update:modelValue', '')
  inputRef.value?.focus()
}

const handleSearchClick = () => {
  emit('search')
}

const handleKeyup = (event: KeyboardEvent) => {
  emit('keyup', event)
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  emit('blur', event)
}

defineExpose({
  inputRef,
  focus: () => inputRef.value?.focus(),
})
</script>

<template>
  <div class="relative flex items-center" :class="{ 'overflow-hidden': props.withSearchButton }">
    <div class="relative flex items-center w-full">
      <input
        ref="inputRef"
        type="text"
        :value="modelValue"
        :placeholder="placeholder"
        :aria-label="ariaLabel"
        :class="inputClass"
        @input="handleInput"
        @keyup="handleKeyup"
        @focus="handleFocus"
        @blur="handleBlur"
      />
      <div
        v-if="modelValue"
        class="flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full cursor-pointer p-1"
        :class="props.withSearchButton ? 'mr-1' : 'absolute right-2'"
      >
        <CloseButton @click="handleClear" aria-label="Clear search" />
      </div>
    </div>
    <button
      v-if="props.withSearchButton"
      type="button"
      :class="searchButtonClasses"
      aria-label="Search"
      :disabled="!searchEnabled"
      @click="handleSearchClick"
    >
      <SearchIcon class="w-4 h-4" />
    </button>
  </div>
</template>

<style scoped>
@import "@/assets/input.css";
</style>
