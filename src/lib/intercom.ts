export const INTERCOM_APP_ID = (process.env.NEXT_PUBLIC_INTERCOM_APP_ID || '').trim()

export type IntercomBootUser = {
  userId: string
  name?: string | null
  email?: string | null
  createdAt?: string | Date | null
  publisherNumber?: number | null
  managerName?: string | null
  totalPaid?: string | number | null
  userHash?: string | null
}

declare global {
  interface Window {
    Intercom?: ((command: string, ...args: unknown[]) => void) & {
      booted?: boolean
      q?: unknown[]
      c?: (args: IArguments) => void
    }
    intercomSettings?: Record<string, unknown>
    attachEvent?: (event: string, listener: EventListener) => void
  }
}

export function hasIntercomApp(): boolean {
  return Boolean(INTERCOM_APP_ID)
}

export function showIntercomMessenger() {
  if (typeof window === 'undefined') return false
  if (typeof window.Intercom === 'function') {
    window.Intercom('show')
    return true
  }
  return false
}

export function updateIntercomMessenger(payload?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  if (typeof window.Intercom === 'function') {
    window.Intercom('update', payload || {})
  }
}

export function shutdownIntercomMessenger() {
  if (typeof window === 'undefined') return
  if (typeof window.Intercom === 'function') {
    try {
      window.Intercom('shutdown')
      window.Intercom('hide')
    } catch {
      // Widget may already be gone.
    }
  }
  if (window.Intercom) {
    window.Intercom.booted = false
  }
  // Strip leftover Affmine Intercom chrome so it cannot cover the project messenger.
  document
    .querySelectorAll(
      '.intercom-lightweight-app, .intercom-namespace, #intercom-container, #intercom-css-container, #intercom-modal-container, #intercom-frame, iframe[name="intercom-messenger-frame"], iframe[name="intercom-launcher-frame"]',
    )
    .forEach((node) => node.remove())
  delete window.intercomSettings
}

function buildSettings(user: IntercomBootUser): Record<string, unknown> {
  const createdAtSeconds = user.createdAt
    ? Math.floor(new Date(user.createdAt).getTime() / 1000)
    : undefined
  const hasIdentityHash = Boolean(user.userHash)

  // Affmine network.affmine.com intercomSettings keys.
  // This app_id enforces Identity Verification: identified boots without a valid
  // user_hash never mount a launcher. Without INTERCOM_IDENTITY_SECRET, boot as
  // a visitor so Support + the floating launcher still work.
  const settings: Record<string, unknown> = {
    app_id: INTERCOM_APP_ID,
    manager: user.managerName || 'John',
    total_paid: user.totalPaid != null ? String(user.totalPaid) : '0',
    custom_launcher_selector: '.launch_help',
    // Affmine launcher: 20px from bottom, 35px from right.
    vertical_padding: 20,
    horizontal_padding: 35,
  }

  if (hasIdentityHash) {
    settings.user_id = String(user.publisherNumber ?? user.userId)
    settings.user_hash = user.userHash
    if (user.name) settings.name = user.name
    if (user.email) settings.email = user.email
    if (createdAtSeconds && Number.isFinite(createdAtSeconds)) {
      settings.created_at = String(createdAtSeconds)
    }
  }

  return settings
}

function loadIntercomWidgetScript() {
  if (document.getElementById('intercom-widget-script')) return
  const script = document.createElement('script')
  script.id = 'intercom-widget-script'
  script.type = 'text/javascript'
  script.async = true
  script.src = `https://widget.intercom.io/widget/${INTERCOM_APP_ID}`
  const first = document.getElementsByTagName('script')[0]
  first?.parentNode?.insertBefore(script, first)
}

/**
 * Pixel/behavior match for Affmine: set window.intercomSettings, then run the
 * official Intercom snippet (same stub shape Affmine uses).
 */
export function bootIntercomMessenger(user: IntercomBootUser) {
  if (typeof window === 'undefined' || !INTERCOM_APP_ID) return

  window.intercomSettings = buildSettings(user)

  const w = window
  const ic = w.Intercom
  if (typeof ic === 'function') {
    ic('update', w.intercomSettings)
    return
  }

  const d = document
  // Official stub from Intercom/Affmine — must use .c(arguments), not a custom queue.
  const i = function () {
    // eslint-disable-next-line prefer-rest-params
    i.c(arguments)
  } as ((command?: string, ...args: unknown[]) => void) & {
    q: IArguments[]
    c: (args: IArguments) => void
  }
  i.q = []
  i.c = function (args: IArguments) {
    i.q.push(args)
  }
  w.Intercom = i as Window['Intercom']

  if (d.readyState === 'complete') {
    loadIntercomWidgetScript()
  } else if (w.attachEvent) {
    w.attachEvent('onload', loadIntercomWidgetScript)
  } else {
    w.addEventListener('load', loadIntercomWidgetScript, false)
  }
}
