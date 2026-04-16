<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import SearchIcon from '@/components/icons/SearchIcon.vue'
import UserDropdown from '@/components/molecules/UserDropdown.vue'
import SearchOverlay from '@/components/organisms/SearchOverlay.vue'
import { useGlobalStateStore } from '@/stores/globalState'
import ActionButton from '../atoms/ActionButton.vue'

const route = useRoute()
const isSearchOverlayVisible = ref(false)
const globalState = useGlobalStateStore()

const handleSearchClick = () => {
  if (route.name === 'search-results') {
    globalState.requestSearchFocus()
  } else {
    isSearchOverlayVisible.value = true
  }
}

const navLinks = [
  { path: '/exposures', label: 'Exposures' },
  { path: '/workspaces', label: 'Workspaces' },
]

const isActive = (path: string) => computed(() => route.path.startsWith(path))
</script>

<template>
  <header class="header-border-top bg-surface border-b border-gray-200 dark:border-gray-700 sticky top-0 z-[100]">
    <div class="container mx-auto px-4 py-4 flex items-center justify-between">
      <RouterLink to="/" class="flex items-center nav-link">
        <img src="/logo.png" alt="Physiome Model Repository" width="48" height="48" />
      </RouterLink>

      <nav>
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
              <SearchIcon class="w-5 h-5" />
            </ActionButton>
          </li>
          <li v-for="link in navLinks" :key="link.path">
            <RouterLink
              :to="link.path"
              class="nav-link"
              :class="{ 'text-primary': isActive(link.path).value }"
            >
              {{ link.label }}
            </RouterLink>
          </li>
          <li class="user-dropdown-divider">
            <UserDropdown />
          </li>
        </ul>
      </nav>
    </div>
    <SearchOverlay :show="isSearchOverlayVisible" @close="isSearchOverlayVisible = false" />
  </header>
</template>

<style scoped>
@reference 'tailwindcss';
@reference '@/assets/main.css';

.header-border-top {
  @apply
    before:content-['']
    before:absolute
    before:top-0
    before:left-0
    before:right-0
    before:h-[6px]
    before:bg-primary;
}

.nav-link {
  @apply hover:opacity-80 transition-opacity;
}

.user-dropdown-divider {
  @apply
    relative
    w-[5rem]
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
