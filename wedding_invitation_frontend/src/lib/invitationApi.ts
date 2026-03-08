import { type EventDetails } from "@/lib/actions";

export type InvitationConfigPayload = {
  couple?: { partnerOneName?: string; partnerTwoName?: string };
  event?: {
    dateISO?: string;
    venueName?: string;
    address?: string;
    timezone?: string;
  };
  links?: { mapUrl?: string; calendarUrl?: string };
  assets?: { heroImageUrl?: string };
  ui?: { accentColor?: string; primaryColor?: string };
  featureFlags?: { rsvpEnabled?: boolean; [k: string]: unknown };
};

/**
 * Determine the backend base URL from the existing NEXT_PUBLIC_* env vars.
 * In static export mode, only NEXT_PUBLIC_* vars are available and code must not
 * require server-only environment access.
 */
function getBackendBaseUrl(): string | null {
  const raw =
    process.env.NEXT_PUBLIC_API_BASE ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/+$/, "");
}

/**
 * Join URL segments without introducing duplicate slashes.
 */
function joinUrl(base: string, path: string): string {
  if (!path) return base;
  if (path.startsWith("/")) return `${base}${path}`;
  return `${base}/${path}`;
}

// PUBLIC_INTERFACE
export async function fetchInvitationConfig(): Promise<{
  ok: boolean;
  data?: InvitationConfigPayload;
  error?: string;
}> {
  /** Fetch invitation/config payload from the backend. Safe for static export runtime. */
  const base = getBackendBaseUrl();
  if (!base) {
    return {
      ok: false,
      error:
        "No backend base URL configured (set NEXT_PUBLIC_API_BASE or NEXT_PUBLIC_BACKEND_URL).",
    };
  }

  const url = joinUrl(base, "/api/invitation/config");

  try {
    // Avoid any caching surprises in static export hosting environments.
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      return { ok: false, error: `Backend responded ${res.status}` };
    }

    const json = (await res.json()) as InvitationConfigPayload;
    return { ok: true, data: json };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown network error";
    return { ok: false, error: msg };
  }
}

// PUBLIC_INTERFACE
export function payloadToEventDetails(
  payload: InvitationConfigPayload,
  fallback: EventDetails,
): EventDetails {
  /** Convert backend payload to the EventDetails used by the UI/CTAs. */
  const dateISO = payload.event?.dateISO?.trim();
  const venueName = payload.event?.venueName?.trim();
  const address = payload.event?.address?.trim();

  // Backend only provides a single ISO datetime; keep a reasonable 6-hour window.
  const startIso = dateISO && Number.isFinite(Date.parse(dateISO)) ? dateISO : fallback.startIso;

  const startMs = Date.parse(startIso);
  const endIso =
    Number.isFinite(startMs) ? new Date(startMs + 6 * 60 * 60 * 1000).toISOString() : fallback.endIso;

  return {
    ...fallback,
    startIso,
    endIso,
    locationName: venueName || fallback.locationName,
    locationAddress: address || fallback.locationAddress,
  };
}
