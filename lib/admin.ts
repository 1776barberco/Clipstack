// Admin email allowlist — only these users can access /admin
export const ADMIN_EMAILS = [
  'apeltekci@gmail.com',
  'vhugo9021@icloud.com',
]

export function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}
