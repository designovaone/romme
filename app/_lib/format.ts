const dateFmt = new Intl.DateTimeFormat('de-DE', {
  timeZone: 'Europe/Berlin',
  dateStyle: 'long',
  timeStyle: 'short',
});

export function formatDateTime(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return dateFmt.format(date);
}

export function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}
