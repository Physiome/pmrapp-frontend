<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ActionButton from '@/components/atoms/ActionButton.vue'
import { getAuthService } from '@/services'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const username = ref('')
const password = ref('')
const error = ref<string | null>(null)
const isLoading = ref(false)

const authService = getAuthService()

const handleSubmit = async () => {
  error.value = null

  if (!username.value || !password.value) {
    error.value = 'Please enter both username and password'
    return
  }

  isLoading.value = true

  try {
    const token = await authService.login({
      login: username.value,
      password: password.value,
    })

    // Store auth state.
    authStore.setAuth(token, username.value)

    // Redirect to home page.
    router.push('/')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Login failed'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="max-w-md mx-auto box">
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Error message -->
      <div v-if="error" class="error-box">
        <p class="text-sm">{{ error }}</p>
      </div>

      <!-- Username field -->
      <div>
        <label for="username" class="label-field block mb-2">
          Username
        </label>
        <input
          id="username"
          v-model="username"
          type="text"
          autocomplete="username"
          required
          class="input-field w-full"
          placeholder="Enter your username"
        />
      </div>

      <!-- Password field -->
      <div>
        <label for="password" class="label-field block mb-2">
          Password
        </label>
        <input
          id="password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
          class="input-field w-full"
          placeholder="Enter your password"
        />
      </div>

      <!-- Submit button -->
      <ActionButton
        type="submit"
        variant="primary"
        size="lg"
        :disabled="isLoading"
        class="w-full"
        contentSection="login_page"
      >
        {{ isLoading ? 'Logging in...' : 'Login' }}
      </ActionButton>
    </form>
  </div>
</template>

<style scoped>
@import '@/assets/label.css';
@import '@/assets/input.css';
@import '@/assets/box.css';
@import '@/assets/error-box.css';
</style>
