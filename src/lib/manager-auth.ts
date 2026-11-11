/** Runtime manager bootstrap credentials (read per-request, not build-time frozen). */
export function getManagerEnvCredentials() {
  const username = (process.env.MANAGER_USERNAME || '').trim()
  const password = (process.env.MANAGER_PASSWORD || '').trim()
  return { username, password }
}

export function isManagerEnvLoginAttempt(usernameOrEmail: string, password: string): boolean {
  const { username: managerUsername, password: managerPassword } = getManagerEnvCredentials()
  if (!managerUsername || !managerPassword) return false
  if (password !== managerPassword) return false

  const entered = usernameOrEmail.trim().toLowerCase()
  const expected = managerUsername.toLowerCase()
  if (!entered || !expected) return false

  return (
    entered === expected
    || entered === `${expected}@example.com`
    || entered.startsWith(`${expected}@`)
  )
}

export function isManagerEnvUsername(usernameOrEmail: string | null | undefined): boolean {
  const { username: managerUsername } = getManagerEnvCredentials()
  if (!managerUsername || !usernameOrEmail) return false
  const entered = usernameOrEmail.trim().toLowerCase()
  const expected = managerUsername.toLowerCase()
  return (
    entered === expected
    || entered === `${expected}@example.com`
    || entered.startsWith(`${expected}@`)
  )
}
