<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ConfirmDialog from '@/components/atoms/ConfirmDialog.vue'
import UserIcon from '@/components/icons/UserIcon.vue'
import { getAuthService } from '@/services'
import { useAuthStore } from '@/stores/auth'
import { useGlobalStateStore } from '@/stores/globalState'

const authStore = useAuthStore()
const globalStateStore = useGlobalStateStore()
const router = useRouter()
const authService = getAuthService()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const showLogoutConfirm = ref(false)

const menuId = 'user-dropdown-menu'
const buttonLabel = computed(() =>
  authStore.username ? `${authStore.username} – user menu` : 'User menu'
)

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const closeDropdown = () => {
  isOpen.value = false
}

const confirmLogout = () => {
  closeDropdown()
  showLogoutConfirm.value = true
}

const handleLogout = async () => {
  showLogoutConfirm.value = false
  try {
    await authService.logout()
    authStore.clearAuth()
    router.push('/')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

const cancelLogout = () => {
  showLogoutConfirm.value = false
}

const handleLoginClick = () => {
  globalStateStore.requestLoginUsernameFocus()
}

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div v-if="authStore.isAuthenticated" ref="dropdownRef" class="relative">
    <button
      @click="toggleDropdown"
      class="nav-link p-2 transition-colors cursor-pointer relative"
      :aria-label="buttonLabel"
      aria-haspopup="true"
      :aria-expanded="isOpen"
      :aria-controls="menuId"
    >
      <UserIcon class="w-5 h-5" />
      <span class="absolute top-full left-1/2 transform -translate-x-1/2 -mt-2 text-xs text-gray-700 dark:text-gray-300 max-w-[4.6rem] truncate hidden sm:inline">
        {{ authStore.username }}
      </span>
      <span class="sr-only sm:hidden">
        {{ authStore.username }}
      </span>
    </button>

    <div
      v-if="isOpen"
      :id="menuId"
      role="menu"
      class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
    >
      <button
        @click="confirmLogout"
        class="w-full cursor-pointer text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        role="menuitem"
      >
        Log out
      </button>
    </div>
  </div>

  <RouterLink
    v-else
    to="/login"
    class="nav-link"
    @click="handleLoginClick"
  >
    Log in
  </RouterLink>

  <ConfirmDialog
    :show="showLogoutConfirm"
    title="Log out"
    message="Are you sure you want to log out?"
    confirm-label="Log out"
    cancel-label="Cancel"
    @confirm="handleLogout"
    @cancel="cancelLogout"
  />
</template>

<style scoped>
.nav-link {
  @apply hover:opacity-80 transition-opacity;
}
</style>
