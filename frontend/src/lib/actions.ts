export type EventDetails = {
  title: string;
  description: string;
  locationName: string;
  locationAddress: string;
  startIso: string;
  endIso: string;
  url?: string;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toIcsUtc(dt: Date) {
  // YYYYMMDDTHHMMSSZ
  return (
    dt.getUTCFullYear() +
    pad2(dt.getUTCMonth() + 1) +
    pad2(dt.getUTCDate()) +
    "T" +
    pad2(dt.getUTCHours()) +
    pad2(dt.getUTCMinutes()) +
    pad2(dt.getUTCSeconds()) +
    "Z"
  );
}

// PUBLIC_INTERFACE
export function buildGoogleMapsUrl(addressOrPlace: string): string {
  /** Build a Google Maps search URL for an address/place string. */
  const q = encodeURIComponent(addressOrPlace);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

// PUBLIC_INTERFACE
export function buildGoogleCalendarUrl(event: EventDetails): string {
  /** Build a Google Calendar "create event" URL. */
  const start = new Date(event.startIso);
  const end = new Date(event.endIso);
  const dates = `${toIcsUtc(start)}/${toIcsUtc(end)}`;

  const text = encodeURIComponent(event.title);
  const details = encodeURIComponent(event.description);
  const location = encodeURIComponent(
    `${event.locationName} — ${event.locationAddress}`,
  );
  const sprop = event.url ? `&sprop=${encodeURIComponent(event.url)}` : "";

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}${sprop}`;
}

// PUBLIC_INTERFACE
export function buildIcsFile(event: EventDetails): { filename: string; data: string } {
  /**
   * Build a minimal RFC5545 ICS payload for download.
   * Uses UTC timestamps for interoperability.
   */
  const uid = `${Math.random().toString(16).slice(2)}@wedding-invitation`;
  const dtstamp = toIcsUtc(new Date());
  const dtstart = toIcsUtc(new Date(event.startIso));
  const dtend = toIcsUtc(new Date(event.endIso));

  const escapeText = (s: string) =>
    s
      .replaceAll("\\", "\\\\")
      .replaceAll("\n", "\\n")
      .replaceAll(",", "\\,")
      .replaceAll(";", "\\;");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Wedding Invitation//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
    `LOCATION:${escapeText(`${event.locationName} — ${event.locationAddress}`)}`,
    event.url ? `URL:${escapeText(event.url)}` : undefined,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean) as string[];

  return {
    filename: "wedding.ics",
    data: lines.join("\r\n"),
  };
}
