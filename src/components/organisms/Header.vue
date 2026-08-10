<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import ActionButton from '@/components/atoms/ActionButton.vue'
import SearchIcon from '@/components/icons/SearchIcon.vue'
import UserDropdown from '@/components/molecules/UserDropdown.vue'
import SearchOverlay from '@/components/organisms/SearchOverlay.vue'
import { useGlobalStateStore } from '@/stores/globalState'
import PreviewBanner from '@/components/molecules/PreviewBanner.vue'

const route = useRoute()
const isSearchOverlayVisible = ref(false)
const isMobileMenuOpen = ref(false)
const globalState = useGlobalStateStore()

const menuContainerClasses = computed(() => [
  isMobileMenuOpen.value ? 'block' : 'hidden',
  'absolute top-full left-0 w-full p-4 z-10',
  'bg-surface shadow-lg border-t border-gray-200 dark:border-gray-700',
  'md:flex md:w-auto md:static md:top-auto md:left-auto md:items-center md:p-0',
  'md:bg-transparent md:shadow-none md:border-0',
])

const menuBoxClasses = ['flex flex-col md:flex-row gap-4']

const navLinkClasses = [
  'block rounded-md px-3 py-2',
  'hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
]

const handleSearchClick = () => {
  isMobileMenuOpen.value = false

  if (route.name === 'search-results') {
    globalState.requestSearchFocus()
  } else {
    isSearchOverlayVisible.value = true
  }
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const navLinks = [
  { path: '/exposures', label: 'Exposures' },
  { path: '/workspaces', label: 'Workspaces' },
]

const isActive = (path: string) => computed(() => route.path.startsWith(path))

watch(
  () => route.fullPath,
  () => {
    closeMobileMenu()
  },
)
</script>

<template>
  <header class="header-border-top bg-surface border-b border-gray-200 dark:border-gray-700 sticky top-0 z-[100]">
    <PreviewBanner />
    <div class="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
      <RouterLink to="/" class="flex items-center" aria-label="Home">
        <img src="/logo.png" alt="Physiome Model Repository" width="48" height="48" />
      </RouterLink>

      <nav aria-label="Primary navigation">
        <ul class="flex items-center gap-4">
          <li>
            <ActionButton
              type="button"
              variant="icon"
              size="sm"
              aria-label="Open search"
              @click="handleSearchClick"
              content-section="Header navigation"
            >
              <span class="sr-only">Open search</span>
              <SearchIcon class="w-6 h-6" />
            </ActionButton>
          </li>
          <li class="md:hidden flex items-center">
            <ActionButton
              type="button"
              variant="icon"
              size="sm"
              aria-label="Toggle navigation menu"
              :aria-expanded="isMobileMenuOpen"
              aria-controls="mobile-navigation-menu"
              @click="toggleMobileMenu"
              content-section="Header navigation"
            >
              <span class="sr-only">Toggle navigation menu</span>
              <span class="mobile-menu-icon" :class="{ 'mobile-menu-icon-open': isMobileMenuOpen }" aria-hidden="true">
                <span class="mobile-menu-icon-bar" />
                <span class="mobile-menu-icon-bar" />
                <span class="mobile-menu-icon-bar" />
              </span>
            </ActionButton>
          </li>
          <li :class="menuContainerClasses" id="mobile-navigation-menu">
            <ul :class="menuBoxClasses">
              <li v-for="link in navLinks" :key="link.path">
                <RouterLink
                  :to="link.path"
                  :class="[{ 'text-primary': isActive(link.path).value }, navLinkClasses]"
                >
                  {{ link.label }}
                </RouterLink>
              </li>
            </ul>
          </li>
          <li class="user-dropdown-divider pl-4">
            <UserDropdown />
          </li>
        </ul>
      </nav>
    </div>
  </header>
  <SearchOverlay :show="isSearchOverlayVisible" @close="isSearchOverlayVisible = false" />
</template>

<style scoped>
@reference 'tailwindcss';
@reference '@/assets/main.css';

.header-border-top {
  @apply
    before:content-['']
    before:absolute
    before:left-0
    before:right-0
    before:h-[6px]
    before:bg-primary;

  &::before {
    top: var(--notification-bar-height);
  }
}

.mobile-menu-icon {
  @apply relative flex h-6 w-6 flex-col items-center justify-center gap-1;
}

.mobile-menu-icon-bar {
  @apply block h-0.5 w-5 rounded-full bg-current;
}

.mobile-menu-icon-open .mobile-menu-icon-bar:nth-child(1) {
  transform: translateY(6px) rotate(45deg);
}

.mobile-menu-icon-open .mobile-menu-icon-bar:nth-child(2) {
  opacity: 0;
}

.mobile-menu-icon-open .mobile-menu-icon-bar:nth-child(3) {
  transform: translateY(-6px) rotate(-45deg);
}

.user-dropdown-divider {
  @apply
    relative
    text-center
    before:content-['']
    before:absolute
    before:left-0
    before:top-1/2
    before:h-6
    before:-translate-y-1/2
    before:transform
    before:w-px
    before:bg-gray-300
    dark:before:bg-gray-600;
}
</style>
