<script setup lang="ts">
import { ref } from 'vue'
import { type RouteLocationRaw, useRoute } from 'vue-router'
import Tooltip from '@/components/atoms/Tooltip.vue'
import { trackButtonClick } from '@/utils/analytics'

type ButtonVariant = 'primary' | 'secondary' | 'link' | 'icon'
type ButtonSize = 'sm' | 'md' | 'lg'

interface Props {
  type?: 'button' | 'submit' | 'reset'
  variant?: ButtonVariant
  size?: ButtonSize
  to?: RouteLocationRaw
  href?: string
  disabled?: boolean
  contentSection?: string
  download?: string | boolean
  target?: string
  rel?: string
  tooltip?: string
  customClasses?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  type: 'button',
  size: 'md',
  disabled: false,
  contentSection: 'global',
  target: '_self',
  rel: '',
})

const route = useRoute()

const buttonEl = ref<HTMLElement | null>(null)
const isHovered = ref(false)

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
  secondary: 'disabled:opacity-60 disabled:cursor-not-allowed',
  link: 'disabled:opacity-60 disabled:cursor-not-allowed',
  icon: 'disabled:opacity-60 disabled:cursor-not-allowed',
}

const secondaryLightModeClasses =
  'bg-gray-100 hover:bg-gray-100 border-primary hover:text-link-hover'
const secondaryDarkModeClasses =
  'dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-700 dark:hover:text-link!'

const transitionClasses = 'transition duration-200 ease-linear'

const variantClasses = {
  primary: `px-3 py-1 rounded border border-primary bg-primary text-white hover:opacity-90 ${transitionClasses}`,
  secondary: `px-3 py-1 rounded border text-link ${transitionClasses} ${secondaryLightModeClasses} ${secondaryDarkModeClasses}`,
  link: `text-primary hover:text-primary-hover ${transitionClasses}`,
  icon: `p-2 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${transitionClasses}`,
}

const sizeClasses = {
  sm: 'text-sm rounded',
  md: 'text-base rounded-md',
  lg: 'text-base px-4 py-2 rounded-lg',
}

const buttonClasses =
  'inline-flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary'
</script>

<template>
  <a
    v-if="href"
    ref="buttonEl"
    :href="href"
    :class="[variantClasses[variant], sizeClasses[size], disabledClasses[variant], buttonClasses, customClasses]"
    :download="download || undefined"
    :target="target"
    :rel="rel"
    @click="handleClick"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @focus="isHovered = true"
    @blur="isHovered = false"
  >
    <slot />
    <Tooltip v-if="tooltip" :visible="isHovered" :anchor-el="buttonEl">{{ tooltip }}</Tooltip>
  </a>
  <RouterLink
    v-else-if="to"
    :to="to"
    :class="[variantClasses[variant], sizeClasses[size], buttonClasses, customClasses]"
    @click="handleClick"
  >
    <slot />
  </RouterLink>
  <button
    v-else
    ref="buttonEl"
    :class="[variantClasses[variant], sizeClasses[size], disabledClasses[variant], buttonClasses, customClasses]"
    :type="type"
    :disabled="disabled"
    @click="handleClick"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @focus="isHovered = true"
    @blur="isHovered = false"
  >
    <slot />
    <Tooltip v-if="tooltip" :visible="isHovered" :anchor-el="buttonEl">{{ tooltip }}</Tooltip>
  </button>
</template>
