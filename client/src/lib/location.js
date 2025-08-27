export function formatLocation(loc) {
  if (!loc) return '—';
  const parts = [loc.city, loc.state, loc.country].filter(Boolean);
  if (parts.length) return parts.join(', ');
  if (typeof loc.lat === 'number' && typeof loc.lon === 'number') {
    return `${loc.lat.toFixed(2)}, ${loc.lon.toFixed(2)}`;
  }
  return '—';
}
