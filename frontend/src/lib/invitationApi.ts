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

export type RsvpSubmissionPayload = {
  name: string;
  phone?: string;
  attending: boolean;
  events: string[];
};

export type RsvpSubmissionResponse = {
  status: string;
  receivedAt: string;
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
  if (!trimmed) {
    // Local development fallback when frontend env vars are not set.
    if (typeof window !== "undefined") {
      const { protocol, hostname } = window.location;
      const isLocalHost =
        hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
      if (isLocalHost) return `${protocol}//${hostname}:3000`;
    }
    return null;
  }
  return trimmed.replace(/\/+$/, "");
}

function isLocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function pushUnique(target: string[], value: string) {
  const normalized = value.trim().replace(/\/+$/, "");
  if (!normalized) return;
  if (!target.includes(normalized)) target.push(normalized);
}

function getBackendBaseCandidates(): string[] {
  const bases: string[] = [];
  const fromEnv = getBackendBaseUrl();
  if (fromEnv) {
    pushUnique(bases, fromEnv);
    if (fromEnv.endsWith("/api")) {
      pushUnique(bases, fromEnv.replace(/\/api$/, ""));
    }
  }

  if (typeof window !== "undefined") {
    const { protocol, hostname, origin } = window.location;
    pushUnique(bases, origin);
    if (isLocalHost(hostname)) {
      pushUnique(bases, `${protocol}//${hostname}:3000`);
      pushUnique(bases, `${protocol}//${hostname}:3001`);
    }
  }

  return bases;
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
  const bases = getBackendBaseCandidates();
  if (!bases.length) {
    return {
      ok: false,
      error:
        "No backend base URL configured (set NEXT_PUBLIC_API_BASE or NEXT_PUBLIC_BACKEND_URL).",
    };
  }

  const attempted: string[] = [];

  for (const base of bases) {
    const url = joinUrl(base, "/api/invitation/config");
    attempted.push(url);
    try {
      // Avoid any caching surprises in static export hosting environments.
      const res = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (res.ok) {
        const json = (await res.json()) as InvitationConfigPayload;
        return { ok: true, data: json };
      }

      if (res.status === 404) continue;
      return { ok: false, error: `Backend responded ${res.status}` };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown network error";
      return { ok: false, error: msg };
    }
  }

  return {
    ok: false,
    error: `Invitation config endpoint not found. Tried: ${attempted.join(", ")}`,
  };
}

// PUBLIC_INTERFACE
export async function submitRsvp(
  payload: RsvpSubmissionPayload,
): Promise<{
  ok: boolean;
  data?: RsvpSubmissionResponse;
  error?: string;
}> {
  /** Submit RSVP payload to backend API. */
  const bases = getBackendBaseCandidates();
  if (!bases.length) {
    return {
      ok: false,
      error: "RSVP service is not connected.",
    };
  }

  const attempted: string[] = [];

  for (const base of bases) {
    const url = joinUrl(base, "/api/rsvp");
    attempted.push(url);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      });

      if (res.ok) {
        const json = (await res.json()) as RsvpSubmissionResponse;
        return { ok: true, data: json };
      }

      if (res.status === 404) continue;

      let serverMessage = "";
      try {
        const errorJson = (await res.json()) as { message?: string };
        serverMessage = errorJson.message ? `: ${errorJson.message}` : "";
      } catch {
        // Ignore parse errors and keep fallback status text.
      }
      return { ok: false, error: `Backend responded ${res.status}${serverMessage}` };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown network error";
      return { ok: false, error: msg };
    }
  }

  return {
    ok: false,
    error: `RSVP API endpoint not found. Tried: ${attempted.join(", ")}`,
  };
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
