export function maskName(name: string | null | undefined): string {
  if (!name) return '***'
  if (name.length <= 2) return name
  return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1]
}
