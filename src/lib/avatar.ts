const AVATAR_COLORS = ['#25D366', '#075E54', '#34B7F1', '#E67E22', '#9B59B6', '#E74C3C', '#1ABC9C', '#3498DB'];

export function avatarColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}
