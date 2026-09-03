import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router'
import { LOGIN_DISABLED } from '@/constants/auth'
import { TITLE } from '@/constants/global'
import { useAuthStore } from '@/stores/auth'
import { useExposureStore } from '@/stores/exposure'
import { useSearchStore } from '@/stores/search'
import { useWorkspaceStore } from '@/stores/workspace'
import { isJwtExpired } from '@/utils/auth'
import { generateExposureTitle, resolveExposureFileTitle } from '@/utils/exposure'
import { getQueryTextFromRouteQuery } from '@/utils/search'
import { generateWorkspaceTitle } from '@/utils/workspace'
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

const workspaceAliasBases = ['/workspace']
const workspaceDetailRouteSuffixes = ['/:alias', '/:alias/file', '/:alias/@@file']
const workspaceFileRouteSuffixes = [
  '/:alias/file/:commitId/:path(.+)',
  '/:alias/file/:commitId',
  '/:alias/@@file/:commitId/:path(.+)',
  '/:alias/@@file/:commitId',
]
const exposureAliasBases = ['/exposure', '/e']
const exposureFileRouteSuffixes = [
  '/:alias/:file',
  '/:alias/experiments/cell/:file',
  '/:alias/experiments/channel/:file',
  '/:alias/models/channels/:file',
  '/:alias/models/:file',
]
const exposureFileViewRouteSuffixes = [
  '/:alias/:file/:view',
  '/:alias/experiments/cell/:file/:view',
  '/:alias/experiments/channel/:file/:view',
  '/:alias/models/channels/:file/:view',
  '/:alias/models/:file/:view',
]

const createAliases = (bases: string[], ...suffixes: string[]) =>
  bases.flatMap((base) => suffixes.map((suffix) => `${base}${suffix}`))

const createPluralRouteAliases = (pluralBase: string, aliasBases: string[], suffixes: string[]) => [
  ...suffixes.slice(1).map((suffix) => `${pluralBase}${suffix}`),
  ...createAliases(aliasBases, ...suffixes),
]

const resolveExposureTitle = async (to: RouteLocationNormalized) => {
  const alias = to.params?.alias as string | undefined
  if (!alias) {
    return
  }

  const fileParam = to.params?.file
  const file = typeof fileParam === 'string' ? fileParam : undefined
  if (file) {
    try {
      const fileTitle = await resolveExposureFileTitle(alias, file, useSearchStore().searchQuery)
      if (fileTitle) {
        return fileTitle
      }
    } catch (error) {
      console.error(`Error fetching exposure file title for alias ${alias}:`, error)
    }
  }

  try {
    const exposureInfo = await useExposureStore().getExposureInfo(alias)

    return generateExposureTitle(
      exposureInfo?.exposure?.description,
      exposureInfo?.exposure?.id,
      true,
    )
  } catch (error) {
    console.error(`Error fetching exposure info for alias ${alias}:`, error)
  }
}

const resolveWorkspaceTitle = async (to: RouteLocationNormalized) => {
  const alias = to.params?.alias as string | undefined
  if (!alias) {
    return
  }

  try {
    const commitIdParam = to.params?.commitId
    const pathParam = to.params?.path
    const commitId = typeof commitIdParam === 'string' ? commitIdParam : ''
    const path = typeof pathParam === 'string' ? pathParam : ''
    const workspaceInfo = await useWorkspaceStore().getWorkspaceInfo(alias, commitId, path)

    return generateWorkspaceTitle(
      workspaceInfo?.workspace?.description,
      workspaceInfo?.workspace?.id,
      commitId,
      path,
      true,
    )
  } catch (error) {
    console.error(`Error fetching workspace info for alias ${alias}:`, error)
  }
}

const resolveRouteTitle = async (to: RouteLocationNormalized) => {
  const currentTitle = to.meta.title as string | undefined

  if (to.name?.toString().startsWith('exposure')) {
    return (await resolveExposureTitle(to)) || currentTitle
  }

  if (to.name?.toString().startsWith('workspace')) {
    return (await resolveWorkspaceTitle(to)) || currentTitle
  }

  return currentTitle
}

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
