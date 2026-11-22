export function userPath(username: string) {
  return `/user/${encodeURIComponent(username)}`
}
