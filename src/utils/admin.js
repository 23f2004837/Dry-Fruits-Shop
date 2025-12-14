export const ADMIN_EMAIL = 'vinilcapricorn@gmail.com';

export const isAdminUser = (user) => {
  if (!user) return false;
  const email = (user.email ?? '').toLowerCase();
  return email === ADMIN_EMAIL.toLowerCase();
};
