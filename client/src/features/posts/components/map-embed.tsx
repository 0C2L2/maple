/** Google Maps link for an address or place name (opens the app on phones). */
export const mapsUrl = (query: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

// iOS/Android show no embedded map; the post page's "Open in Google Maps" button opens the Maps app instead.
export function MapEmbed(_: { query: string }) {
  return null;
}
