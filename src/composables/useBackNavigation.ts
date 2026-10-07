import { useRouter } from 'vue-router'

/**
 * Composable for back navigation that preserves filter state.
 *
 * @param basePath - The base path to check in history and navigate to (e.g., '/exposure', '/workspace').
 * @returns A function that navigates back or to the base path.
 */
export function useBackNavigation(basePath: string) {
  const router = useRouter()

  const goBack = () => {
    // If there's history, go back to it.
    // Otherwise, navigate to the base path.
    if (router.options.history.state.back) {
      router.back()
    } else {
      router.push(basePath)
    }
  }

  return { goBack }
}
