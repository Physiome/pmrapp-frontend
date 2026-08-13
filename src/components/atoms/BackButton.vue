<script setup lang="ts">
import ActionButton from '@/components/atoms/ActionButton.vue'

interface Props {
  label?: string
  contentSection?: string
  onClick?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Back',
  contentSection: 'navigation',
})

const handleClick = () => {
  if (props.onClick) {
    props.onClick()
  }
}
</script>

<template>
  <ActionButton
    variant="link"
    :content-section="contentSection"
    @click="handleClick"
    class="back-button"
  >
    {{ label }}
  </ActionButton>
</template>

<style scoped>
  .back-button {
    &::before {
      content: '\2190';
      display: inline-block;
    }
  }
</style>
