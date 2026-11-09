export const ADMIN_EMAIL = 'armansomani786@gmail.com'

export const isDesignatedAdminEmail = (email) =>
  String(email || '').trim().toLowerCase() === ADMIN_EMAIL
