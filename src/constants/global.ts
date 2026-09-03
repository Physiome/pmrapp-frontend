/**
 * Global constants.
 */

export const TITLE = 'Physiome Model Repository'

/**
 * URL for reporting bugs or providing feedback via GitHub issues.
 */
export const GITHUB_ISSUES_URL = import.meta.env.VITE_GITHUB_ISSUES_URL || 'https://github.com/Physiome/pmrapp-frontend/issues'

export const COOKIE = {
  /**
   * Cookie name for the cookie banner dismissal.
   */
  BANNER_NAME: 'pmr_cookie_banner_dismissed',
  /**
   * Number of days the cookie banner dismissal is stored for.
   */
  BANNER_DAYS: 30,
  /**
   * Cookie name for the notification bar dismissal.
   */
  NOTIFICATION_NAME: 'pmr_notification_dismissed',
  /**
   * Number of days the notification bar dismissal is stored for.
   */
  NOTIFICATION_DAYS: 7,
}

export const PMR2_URL = 'https://models.physiomeproject.org'
