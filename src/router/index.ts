import { createRouter, createWebHistory } from 'vue-router'
import { LOGIN_DISABLED } from '@/constants/auth'
import { TITLE } from '@/constants/global'
import { useAuthStore } from '@/stores/auth'
import { isJwtExpired } from '@/utils/auth'
import { getQueryTextFromRouteQuery } from '@/utils/search'
import ExposureDetailView from '@/views/ExposureDetailView.vue'
import ExposureView from '@/views/ExposureView.vue'
import FeatureComparisonView from '@/views/FeatureComparisonView.vue'
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import ProfileView from '@/views/ProfileView.vue'
import SearchView from '@/views/SearchView.vue'
import WorkspaceDetailView from '@/views/WorkspaceDetailView.vue'
import WorkspaceView from '@/views/WorkspaceView.vue'

import {
  createAliases,
  createPluralRouteAliases,
  workspaceAliasBases,
  workspaceDetailRouteSuffixes,
  workspaceFileRouteSuffixes,
  exposureAliasBases,
  exposureFileRouteSuffixes,
  exposureFileViewRouteSuffixes,
  workspaceDetailCommitSuffixes
} from '@/router/routeAliases'
import { resolveRouteTitle } from '@/router/routeResolvers'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    // Don't scroll when only the query changes (same route path).
    if (to.path === from.path) {
      return false
    }
    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: TITLE },
    },
    {
      path: '/workspaces',
      name: 'workspaces',
      component: WorkspaceView,
      meta: { title: `Workspaces – ${TITLE}` },
    },
    {
      path: '/workspaces/:alias',
      name: 'workspace-detail',
      component: WorkspaceDetailView,
      alias: createPluralRouteAliases(
        '/workspaces',
        workspaceAliasBases,
        workspaceDetailRouteSuffixes,
      ),
      meta: { title: `Workspace Detail – ${TITLE}` },
    },
    {
      path: '/workspaces/:alias/file/:commitId',
      name: 'workspace-detail-alias-commit',
      component: WorkspaceDetailView,
      alias: createPluralRouteAliases(
        '/workspaces',
        workspaceAliasBases,
        workspaceDetailCommitSuffixes,
      ),
      meta: { title: `Workspace Detail – ${TITLE}` },
    },
    {
      path: '/workspaces/:alias/file/:commitId/:path(.+)',
      name: 'workspace-file-detail',
      component: WorkspaceDetailView,
      alias: createPluralRouteAliases(
        '/workspaces',
        workspaceAliasBases,
        workspaceFileRouteSuffixes,
      ),
      meta: { title: `Workspace File – ${TITLE}` },
    },
    {
      path: '/exposures',
      name: 'exposures',
      component: ExposureView,
      alias: createAliases(exposureAliasBases, ''),
      meta: { title: `Exposures – ${TITLE}` },
    },
    {
      path: '/exposures/:alias',
      name: 'exposure-detail',
      component: ExposureDetailView,
      alias: createAliases(exposureAliasBases, '/:alias', '/:alias/view'),
      meta: { title: `Exposure Detail – ${TITLE}` },
    },
    {
      path: '/exposures/:alias/:file(.+)/:view([^./]+)',
      name: 'exposure-file-detail-view',
      component: ExposureDetailView,
      // biome-ignore format: keep the formatting for readability
      alias: createPluralRouteAliases(
        '/exposures',
        exposureAliasBases,
        exposureFileViewRouteSuffixes
      ),
      meta: { title: `Exposure File – ${TITLE}` },
    },
    {
      path: '/exposures/:alias/:file(.+)',
      name: 'exposure-file-detail',
      component: ExposureDetailView,
      // biome-ignore format: keep the formatting for readability
      alias: createPluralRouteAliases(
        '/exposures',
        exposureAliasBases,
        exposureFileRouteSuffixes
      ),
      meta: { title: `Exposure File – ${TITLE}` },
    },
    {
      path: '/search',
      name: 'search-results',
      component: SearchView,
      meta: { title: `Search Results – ${TITLE}` },
    },
    {
      path: '/feature-comparison',
      name: 'feature-comparison',
      component: FeatureComparisonView,
      meta: { title: `Feature Comparison – ${TITLE}` },
    },
    {
      path: '/login',
      name: 'login',
      component: LOGIN_DISABLED ? NotFoundView : LoginView,
      meta: LOGIN_DISABLED ? { title: `Page Not Found – ${TITLE}` } : { title: `Login – ${TITLE}` },
    },
    {
      path: '/profile',
      name: 'profile',
      component: LOGIN_DISABLED ? NotFoundView : ProfileView,
      meta: LOGIN_DISABLED
        ? { title: `Page Not Found – ${TITLE}` }
        : { title: `Profile – ${TITLE}`, requiresAuth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundView,
      meta: { title: `Page Not Found – ${TITLE}` },
    },
  ],
})

router.beforeEach((to) => {
  if (to.path === '/search' && to.query.SearchableText !== undefined && to.query.query === undefined) {
    const legacyQuery = getQueryTextFromRouteQuery(to.query)

    if (legacyQuery) {
      const nextQuery = { ...to.query }
      delete nextQuery.SearchableText
      nextQuery.query = legacyQuery
      return { path: to.path, query: nextQuery, replace: true }
    }
  }

  const authStore = useAuthStore()
  const storedToken = localStorage.getItem('auth_token')
  const authMethod = localStorage.getItem('auth_method') as 'password' | 'github' | null
  const looksLikeJwt = storedToken?.split('.').length === 3

  // Only check JWT expiry for GitHub OAuth tokens, which use JWTs.
  // Password-auth tokens may not be JWTs, so skip the expiry check.
  if (storedToken && looksLikeJwt && authMethod === 'github' && isJwtExpired(storedToken)) {
    authStore.clearAuth()
    return { name: 'login' }
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.name === 'login' && authStore.isAuthenticated) {
    return { name: 'profile' }
  }
})

router.beforeResolve(async (to) => {
  const resolvedTitle = await resolveRouteTitle(to)
  if (resolvedTitle) {
    to.meta.title =
      resolvedTitle === TITLE || resolvedTitle.endsWith(` – ${TITLE}`)
        ? resolvedTitle
        : `${resolvedTitle} – ${TITLE}`
  }
})

router.afterEach((to) => {
  const title = to.meta.title as string | undefined
  if (title) {
    document.title = title
  }
})

export default router
