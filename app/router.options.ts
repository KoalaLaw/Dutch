// Type Dutch adaptation: modified 2026-11-10. Upstream: zyronon/TypeWords, GPL-3.0.
import type { RouterConfig } from '@nuxt/schema'

export default <RouterConfig>{
  hashMode: true,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    }
    return { top: 0 }
  },
}
