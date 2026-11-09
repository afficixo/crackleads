const requireEnv = (name: string, isDev = false): string => {
  const value = process.env[name]?.trim()
  if (!value) {
    if (isDev && process.env.NODE_ENV === 'development') {
      console.warn(`Warning: ${name} environment variable is not set`)
      return ''
    }
    throw new Error(`${name} environment variable is required for security`)
  }
  return value
}

export const MANAGER_USERNAME = requireEnv('MANAGER_USERNAME')
export const MANAGER_PASSWORD = requireEnv('MANAGER_PASSWORD')
