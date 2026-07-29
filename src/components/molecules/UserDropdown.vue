<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ConfirmDialog from '@/components/atoms/ConfirmDialog.vue'
import LogoutIcon from '@/components/icons/LogoutIcon.vue'
import UserIcon from '@/components/icons/UserIcon.vue'
import { LOGOUT_ERROR_MESSAGES } from '@/constants/auth'
import { getAuthService } from '@/services'
import { useAuthStore } from '@/stores/auth'
import { useGlobalStateStore } from '@/stores/globalState'

const authStore = useAuthStore()
const globalStateStore = useGlobalStateStore()
const router = useRouter()
const route = useRoute()
const authService = getAuthService()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const showLogoutConfirm = ref(false)

const menuId = 'user-dropdown-menu'
const buttonLabel = computed(() =>
  authStore.username ? `${authStore.username} – user menu` : 'User menu',
)

const menuDividerClasses = [
  'relative before:absolute before:top-0 before:left-0 before:right-0',
  'before:border-t before:border-gray-200 dark:before:border-gray-700',
]

const accountButtonClasses = computed(() => {
  const buttonClasses = [
    'block cursor-pointer relative rounded-full',
    'bg-gray-200 dark:bg-gray-700',
  ]

  if (!authStore.avatarUrl) {
    buttonClasses.push('p-1')
  }

  return buttonClasses
})

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
    if (route.path === '/profile') {
      router.push('/')
    }
  } catch (error) {
    console.error(LOGOUT_ERROR_MESSAGES.generic, error)
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

const isActive = (path: string) => route.path.startsWith(path)

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

watch(
  () => route.fullPath,
  () => {
    if (isOpen.value) {
      closeDropdown()
    }
  },
)

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div v-if="authStore.isAuthenticated" ref="dropdownRef" class="relative pl-4">
    <button
      @click="toggleDropdown"
      :class="accountButtonClasses"
      :aria-label="buttonLabel"
      aria-haspopup="true"
      :aria-expanded="isOpen"
      :aria-controls="menuId"
    >
      <template v-if="authStore.avatarUrl">
        <img
          :src="authStore.avatarUrl"
          :alt="authStore.username ?? ''"
          class="w-8 h-8 rounded-full object-cover"
        />
      </template>
      <template v-else>
        <UserIcon class="w-6 h-6" />
      </template>
      <span class="sr-only sm:hidden">
        {{ authStore.username }}
      </span>
    </button>

    <div
      v-if="isOpen"
      :id="menuId"
      role="menu"
      class="absolute right-0 mt-2 min-w-64 bg-white dark:bg-gray-800 rounded-md overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 z-50"
    >
      <ul>
        <li class="flex items-center gap-2 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
          <div class="shrink-0">
            <template v-if="authStore.avatarUrl">
              <img
                :src="authStore.avatarUrl"
                :alt="authStore.username ?? ''"
                class="w-8 h-8 rounded-full object-cover"
                width="32"
                height="32"
              />
            </template>
            <template v-else>
              <UserIcon class="w-6 h-6" />
            </template>
          </div>
          <div class="flex flex-col items-start text-left min-w-0">
            <span class="text-gray-400 truncate max-w-45">{{ authStore.username }}</span>
            <span class="font-medium truncate max-w-45" v-if="authStore.name">{{ authStore.name }}</span>
          </div>
        </li>
        <li :class="menuDividerClasses">
          <RouterLink
            to="/profile"
            class="flex items-center w-full cursor-pointer px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            role="menuitem"
          >
            <UserIcon class="w-4 h-4 shrink-0 mr-2" />
            Profile
          </RouterLink>
        </li>
        <li :class="menuDividerClasses">
          <button
            @click="confirmLogout"
            class="flex items-center w-full cursor-pointer px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            role="menuitem"
          >
            <LogoutIcon class="w-4 h-4 shrink-0 mr-2" />
            Log out
          </button>
        </li>
      </ul>
    </div>
  </div>

  <RouterLink
    v-else
    to="/login"
    class="nav-link ml-4"
    :class="{ 'text-primary': isActive('/login') }"
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
