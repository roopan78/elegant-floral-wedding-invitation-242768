"use client";

import React from "react";
import {
  buildGoogleCalendarUrl,
  buildGoogleMapsUrl,
  buildIcsFile,
  type EventDetails,
} from "@/lib/actions";

function downloadTextFile(filename: string, data: string) {
  const blob = new Blob([data], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

type EventCtasProps = {
  event: EventDetails;
  className?: string;
};

/**
 * Client component for interactive calendar/map/ICS actions.
 * Keeping this in a client component avoids passing event handlers from a server component.
 */
export function EventCtas({ event, className }: EventCtasProps) {
  const mapsUrl = buildGoogleMapsUrl(`${event.locationName}, ${event.locationAddress}`);
  const gcalUrl = buildGoogleCalendarUrl(event);

  return (
    <div className={className ?? "btnRow"} role="group" aria-label="Actions">
      <a className="button buttonPrimary" href={gcalUrl} target="_blank" rel="noreferrer">
        Add to Google Calendar
      </a>
      <a className="button" href={mapsUrl} target="_blank" rel="noreferrer">
        Open in Maps
      </a>
      <button
        className="button buttonSuccess"
        type="button"
        onClick={() => {
          const ics = buildIcsFile(event);
          downloadTextFile(ics.filename, ics.data);
        }}
      >
        Download .ics
      </button>
    </div>
  );
}
