import { event } from 'vue-gtag'
import type { ButtonClickPayload } from "@/types/analytics"

export function trackButtonClick(payload: ButtonClickPayload): void {
  const {
    button_name,
    content_section,
    link_category
  } = payload

  event("button_click", {
    button_name,
    content_section,
    link_category: link_category
  });

  console.log('button_click', {
    button_name,
    content_section,
    link_category: link_category
  })
}
