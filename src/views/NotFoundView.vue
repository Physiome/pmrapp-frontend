<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ActionButton from '@/components/atoms/ActionButton.vue'

const router = useRouter()
const hasHistory = ref(false)

onMounted(() => {
  // Check if there's a previous page in history.
  hasHistory.value = window.history.length > 2
})

const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="max-w-2xl mx-auto text-center">
    <h1 class="text-6xl font-bold mb-4">404</h1>
    <h2 class="text-3xl font-semibold mb-4">Page Not Found</h2>
    <p class="text-lg mb-8">
      The page you are looking for doesn't exist or has been moved.
    </p>
    
    <ActionButton
      v-if="hasHistory"
      @click="goBack"
      variant="primary"
      size="lg"
      class="inline-block"
      contentSection="not_found_view"
    >
      Go Back
    </ActionButton>
    <ActionButton
      v-else
      :to="'/'"
      variant="primary"
      size="lg"
      class="inline-block"
      contentSection="not_found_view"
    >
      Go to Home
    </ActionButton>
  </div>      
</template>
