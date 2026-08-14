export function refreshActionsForRole(role) {
  if (role === 'student') return ['jobs', 'history', 'applications'];
  if (role === 'hr') return ['jobs', 'candidates'];
  if (role === 'admin') return ['jobs', 'accounts'];
  return [];
}
