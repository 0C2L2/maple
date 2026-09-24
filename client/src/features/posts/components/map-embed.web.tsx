/** Google Maps link for an address or place name (opens the app on phones). */
export const mapsUrl = (query: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

// An embedded Google Map of the event's place (web). Google's basic embed needs no API key.
export function MapEmbed({ query }: { query: string }) {
  return (
    <iframe
      title={`Map: ${query}`}
      src={`https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      style={{ border: 0, width: '100%', height: 320, borderRadius: 16 }}
    />
  );
}
