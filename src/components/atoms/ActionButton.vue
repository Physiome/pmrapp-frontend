<script setup lang="ts">
import { useRoute, type RouteLocationRaw } from 'vue-router'
import { trackButtonClick } from '@/utils/analytics'

type ButtonVariant = 'primary' | 'secondary' | 'link'
type ButtonSize = 'sm' | 'md' | 'lg'

interface Props {
  type?: 'button' | 'submit' | 'reset'
  variant?: ButtonVariant
  size?: ButtonSize
  to?: RouteLocationRaw
  disabled?: boolean
  contentSection?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  type: 'button',
  size: 'md',
  disabled: false,
  contentSection: 'global',
})

const route = useRoute()

const handleClick = (event: Event) => {
  const buttonText = (event.currentTarget as HTMLElement)?.textContent?.trim() || ''

  trackButtonClick({
    button_name: buttonText,
    content_section: props.contentSection,
    link_category: route.path,
  })
}

const disabledClasses = {
  primary: 'disabled:opacity-60 disabled:cursor-not-allowed',
  secondary: 'disabled:opacity-60 disabled:cursor-not-allowed hover:bg-transparent',
  link: 'disabled:opacity-60 disabled:cursor-not-allowed',
}

const variantClasses = {
  primary:
    'px-3 py-1 rounded border border-primary bg-primary text-white hover:opacity-90 transition-opacity',
  secondary:
    'px-3 py-1 rounded border border-primary text-primary hover:bg-primary/10 transition-colors',
  link: 'text-primary hover:text-primary-hover transition-colors',
}

const sizeClasses = {
  sm: 'text-sm rounded',
  md: 'text-base rounded-md',
  lg: 'text-base px-8 py-2 rounded-lg',
}

const buttonClasses = 'inline-flex items-center justify-center gap-2'
</script>

<template>
  <RouterLink
    v-if="to"
    :to="to"
    :class="[variantClasses[variant], sizeClasses[size], buttonClasses]"
    @click="handleClick"
  >
    <slot />
  </RouterLink>
  <button
    v-else
    :class="[variantClasses[variant], sizeClasses[size], disabledClasses[variant], buttonClasses]"
    :type="type"
    :disabled="disabled"
    @click="handleClick"
  >
    <slot />
  </button>
</template>
