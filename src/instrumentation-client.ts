import { shouldShowPageLoader } from '@/lib/ui/page-load-routes'

let isLoading = shouldShowPageLoader(window.location.pathname)
let documentLoaded = document.readyState === 'complete'
let pendingRequests = 0
let idleTimer: number | undefined

const idleDelay = 500

function publishLoadingState() {
  document.documentElement.dataset.appLoading = String(isLoading)
  window.dispatchEvent(new Event('app:loading-change'))
}

function finishWhenIdle() {
  if (!documentLoaded || pendingRequests > 0) return

  window.clearTimeout(idleTimer)
  idleTimer = window.setTimeout(() => {
    if (!documentLoaded || pendingRequests > 0) return
    isLoading = false
    publishLoadingState()
  }, idleDelay)
}

function beginLoading() {
  window.clearTimeout(idleTimer)
  isLoading = true
  publishLoadingState()
  finishWhenIdle()
}

function stopLoading() {
  window.clearTimeout(idleTimer)
  isLoading = false
  publishLoadingState()
}

window.addEventListener('app:route-committed', stopLoading)

publishLoadingState()

if (isLoading && !documentLoaded) {
  window.addEventListener(
    'load',
    () => {
      documentLoaded = true
      finishWhenIdle()
    },
    { once: true },
  )
} else if (isLoading) {
  finishWhenIdle()
}

const originalFetch = window.fetch.bind(window)
window.fetch = async (...args: Parameters<typeof window.fetch>) => {
  const trackRequest = isLoading
  if (trackRequest) {
    pendingRequests += 1
    window.clearTimeout(idleTimer)
  }

  try {
    return await originalFetch(...args)
  } finally {
    if (trackRequest) {
      pendingRequests -= 1
      finishWhenIdle()
    }
  }
}

export function onRouterTransitionStart(url: string) {
  const pathname = new URL(url, window.location.href).pathname
  if (shouldShowPageLoader(pathname)) {
    beginLoading()
  } else {
    stopLoading()
  }
}
