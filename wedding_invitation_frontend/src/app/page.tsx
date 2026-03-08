"use client";

import React, { useEffect, useMemo, useState } from "react";
import { FloralCorner } from "@/components/FloralCorner";
import { ParallaxBand } from "@/components/ParallaxBand";
import { Countdown } from "@/components/Countdown";
import { EventCtas } from "@/components/EventCtas";
import { type EventDetails } from "@/lib/actions";
import {
  fetchInvitationConfig,
  payloadToEventDetails,
  type InvitationConfigPayload,
} from "@/lib/invitationApi";

const FALLBACK_EVENT: EventDetails = {
  title: "Wedding Celebration",
  description:
    "We’d love for you to join us for our wedding celebration. Ceremony followed by reception.",
  locationName: "The Garden Hall",
  locationAddress: "123 Evergreen Lane, Springvale",
  // Note: keep dates realistic; adjust as desired.
  startIso: "2026-06-20T16:30:00-04:00",
  endIso: "2026-06-20T22:30:00-04:00",
  url: process.env.NEXT_PUBLIC_FRONTEND_URL ?? "",
};

const FALLBACK_COUPLE = {
  partnerOneName: "Avery",
  partnerTwoName: "Jordan",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "Date TBD";
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "Time TBD";
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export default function Home() {
  const [payload, setPayload] = useState<InvitationConfigPayload | null>(null);

  useEffect(() => {
    let alive = true;

    // Fetch after hydration so static export remains buildable and deployable
    // without the backend being present at build time.
    fetchInvitationConfig().then((res) => {
      if (!alive) return;
      if (res.ok && res.data) setPayload(res.data);
    });

    return () => {
      alive = false;
    };
  }, []);

  const couple = useMemo(() => {
    const p1 = payload?.couple?.partnerOneName?.trim();
    const p2 = payload?.couple?.partnerTwoName?.trim();
    return {
      partnerOneName: p1 || FALLBACK_COUPLE.partnerOneName,
      partnerTwoName: p2 || FALLBACK_COUPLE.partnerTwoName,
    };
  }, [payload]);

  const event = useMemo(() => {
    if (!payload) return FALLBACK_EVENT;
    return payloadToEventDetails(payload, FALLBACK_EVENT);
  }, [payload]);

  return (
    <div className="appShell">
      <a className="sr-only" href="#details">
        Skip to invitation details
      </a>

      <header className="hero">
        <div className="heroInner">
          <main className="invitationCard" aria-label="Wedding invitation">
            <div className="cardFrame" aria-hidden="true" />
            <FloralCorner className="floralCorner floralTopLeft" />
            <FloralCorner className="floralCorner floralTopRight" />
            <FloralCorner className="floralCorner floralBottomLeft" />
            <FloralCorner className="floralCorner floralBottomRight" />

            <p className="kicker">You’re invited</p>
            <h1 className="title">
              {couple.partnerOneName} & {couple.partnerTwoName}
            </h1>
            <p className="subtitle">
              With joy in our hearts, we invite you to celebrate our wedding day.
            </p>

            <div className="hrOrnament" aria-hidden="true" />

            <div className="metaGrid" id="details">
              <div className="metaItem">
                <div className="metaLabel">Date</div>
                <div className="metaValue">{formatDate(event.startIso)}</div>
              </div>
              <div className="metaItem">
                <div className="metaLabel">Time</div>
                <div className="metaValue">{formatTime(event.startIso)}</div>
              </div>
              <div className="metaItem">
                <div className="metaLabel">Venue</div>
                <div className="metaValue">{event.locationName}</div>
              </div>
              <div className="metaItem">
                <div className="metaLabel">Address</div>
                <div className="metaValue">{event.locationAddress}</div>
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <EventCtas event={event} />
              <p className="smallNote">
                Tip: If you don’t use Google Calendar, the <strong>.ics</strong>{" "}
                download works with Apple Calendar, Outlook, and most calendar apps.
              </p>
              <p className="smallNote">
                {payload
                  ? "Loaded invitation details from the backend."
                  : "Showing offline defaults (backend config not loaded)."}
              </p>
            </div>

            <div style={{ marginTop: 20 }}>
              <div className="metaLabel" style={{ marginBottom: 8 }}>
                Countdown
              </div>
              <Countdown isoDateTime={event.startIso} />
            </div>
          </main>
        </div>
      </header>

      <ParallaxBand id="story" title="Our story" strength={20}>
        <div className="sectionInner">
          <h2 className="sectionTitle">Our Story</h2>
          <p className="sectionText">
            We met, we laughed, we adventured—and somehow every ordinary day became
            extraordinary. Thank you for being part of our lives; we can’t wait to
            celebrate this moment with you.
          </p>

          <div className="callouts" style={{ marginTop: 16 }}>
            <div className="calloutCard">
              <div className="metaLabel">Ceremony</div>
              <p className="sectionText" style={{ marginTop: 8 }}>
                Please arrive 15 minutes early so we can begin on time. Seating is open.
              </p>
            </div>
            <div className="calloutCard">
              <div className="metaLabel">Reception</div>
              <p className="sectionText" style={{ marginTop: 8 }}>
                Dinner, dancing, and heartfelt toasts will follow. We’ll celebrate into the
                evening.
              </p>
            </div>
          </div>
        </div>
      </ParallaxBand>

      <section className="section" aria-labelledby="schedule-title">
        <div className="sectionInner">
          <h2 className="sectionTitle" id="schedule-title">
            Schedule
          </h2>
          <p className="sectionText">A gentle outline of the day—timing may shift slightly.</p>

          <div className="callouts" style={{ marginTop: 16 }}>
            <div className="calloutCard">
              <div className="metaLabel">4:30 PM</div>
              <p className="sectionText" style={{ marginTop: 8 }}>
                Ceremony begins
              </p>
            </div>
            <div className="calloutCard">
              <div className="metaLabel">6:00 PM</div>
              <p className="sectionText" style={{ marginTop: 8 }}>
                Reception + dinner
              </p>
            </div>
            <div className="calloutCard">
              <div className="metaLabel">7:30 PM</div>
              <p className="sectionText" style={{ marginTop: 8 }}>
                Toasts + first dance
              </p>
            </div>
            <div className="calloutCard">
              <div className="metaLabel">9:00 PM</div>
              <p className="sectionText" style={{ marginTop: 8 }}>
                Dancing
              </p>
            </div>
          </div>
        </div>
      </section>

      <ParallaxBand id="travel" title="Travel and stay" strength={24}>
        <div className="sectionInner">
          <h2 className="sectionTitle">Travel & Stay</h2>
          <p className="sectionText">
            If you’re coming from out of town, we recommend booking early. There’s ample
            parking on-site, and rideshare pickup is available at the main entrance.
          </p>

          <div className="callouts" style={{ marginTop: 16 }}>
            <div className="calloutCard">
              <div className="metaLabel">Parking</div>
              <p className="sectionText" style={{ marginTop: 8 }}>
                On-site lot behind the venue. Follow the “Garden Hall” signs.
              </p>
            </div>
            <div className="calloutCard">
              <div className="metaLabel">Accessibility</div>
              <p className="sectionText" style={{ marginTop: 8 }}>
                Step-free entrance and accessible restrooms are available.
              </p>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <div className="metaLabel">Quick links</div>
            <EventCtas event={event} />
          </div>
        </div>
      </ParallaxBand>

      <section className="section" aria-labelledby="rsvp-title">
        <div className="sectionInner">
          <h2 className="sectionTitle" id="rsvp-title">
            RSVP
          </h2>
          <p className="sectionText">
            We’re keeping this site lightweight and static. If you’d like RSVP functionality
            wired to the backend, it can be added as a follow-up step.
          </p>

          <div className="calloutCard" style={{ marginTop: 16 }}>
            <div className="metaLabel">For now</div>
            <p className="sectionText" style={{ marginTop: 8 }}>
              Please reply via the message thread or email you received with this invitation.
            </p>
          </div>
        </div>
      </section>

      <footer className="footer">
        <p>
          With love, <strong>{couple.partnerOneName}</strong> &{" "}
          <strong>{couple.partnerTwoName}</strong>
        </p>
        <p style={{ marginTop: 6 }}>
          Designed with the Ink theme: slate accents + green florals.
        </p>
      </footer>
    </div>
  );
}
