const pageLoadRoutes = new Set([
  '/dashboard',
])

export function shouldShowPageLoader(pathname: string) {
  return pageLoadRoutes.has(pathname.replace(/\/+$/, ''))
}
