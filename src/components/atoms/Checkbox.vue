<script setup lang="ts">
interface Props {
  modelValue?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const toggle = () => {
  if (props.disabled) return
  emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <label
    class="group inline-flex cursor-pointer items-center gap-2 select-none focus:outline-none"
    :class="{ 'opacity-50 cursor-not-allowed': disabled }"
    role="checkbox"
    :aria-checked="modelValue"
    :aria-disabled="disabled"
    :tabindex="disabled ? -1 : 0"
    @keydown.space.prevent="toggle"
    @keydown.enter.prevent="toggle"
  >
    <span
      class="relative inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all duration-200 ease-linear"
      :class="[
        modelValue
          ? 'bg-primary border-primary'
          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600',
        !disabled && 'group-hover:border-primary dark:group-hover:border-primary',
        !disabled && 'group-focus-visible:ring-2 group-focus-visible:ring-primary group-focus-visible:ring-offset-2 dark:group-focus-visible:ring-offset-gray-900',
      ]"
    >
      <!-- Checkmark icon -->
      <svg
        v-if="modelValue"
        class="h-3 w-3 text-primary-fg pointer-events-none"
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M2 6L5 9L10 3"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </span>

    <input
      type="checkbox"
      class="sr-only"
      :checked="modelValue"
      :disabled="disabled"
      tabindex="-1"
      aria-hidden="true"
      @change="toggle"
    />

    <slot />
  </label>
</template>

<style scoped>
@reference "tailwindcss";
</style>
