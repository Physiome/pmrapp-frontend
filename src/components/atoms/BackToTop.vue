<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import ArrowUpIcon from '@/components/icons/ArrowUpIcon.vue'

const isVisible = ref(false)

const checkScroll = () => {
  // Show button if user has scrolled down more than 300px.
  isVisible.value = window.scrollY > 300
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

onMounted(() => {
  checkScroll() // Check initial scroll position.
  window.addEventListener('scroll', checkScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', checkScroll)
})
</script>

<template>
  <Transition name="fade">
    <button
      v-if="isVisible"
      @click="scrollToTop"
      class="fixed bottom-8 right-8 button-rounded-full z-40 cursor-pointer"
      type="button"
      aria-label="Back to top"
    >
      <ArrowUpIcon />
    </button>
  </Transition>
</template>

<style scoped>
@import '@/assets/button.css';

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
