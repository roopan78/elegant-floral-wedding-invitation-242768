"use client";

import React, { useEffect, useMemo, useState } from "react";
import { FloralCorner } from "@/components/FloralCorner";
import { ParallaxBand } from "@/components/ParallaxBand";
import { Countdown } from "@/components/Countdown";
import { EventCtas } from "@/components/EventCtas";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { type EventDetails } from "@/lib/actions";
import {
  fetchInvitationConfig,
  payloadToEventDetails,
  submitRsvp,
  type InvitationConfigPayload,
} from "@/lib/invitationApi";

const FALLBACK_EVENT: EventDetails = {
  title: "Prabakaran & Deepika Wedding",
  description:
    "We cordially solicit your esteemed presence with family and friends on the auspicious occasion of the wedding ceremony of Selvan P.K. Prabakaran and Selvi T. Deepika.",
  locationName: "Arulmigu Palayam Salaikumara Swamy Temple",
  locationAddress: "Tirunelveli Junction, Tirunelveli, Tamil Nadu",
  startIso: "2026-04-20T09:05:00+05:30",
  endIso: "2026-04-20T10:25:00+05:30",
  url: process.env.NEXT_PUBLIC_FRONTEND_URL ?? "",
};

const FALLBACK_COUPLE = {
  partnerOneName: "P.K. Prabakaran",
  partnerTwoName: "T. Deepika",
};

const TEMPLE_MAP_EMBED_SRC =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4410.882766853741!2d77.70619784122458!3d8.729361812851037!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b041185ce20dfb5%3A0x8d343647e3d0b641!2sArulmigu%20Sri%20Salai%20Kumaraswamy%20Temple!5e0!3m2!1sen!2sin!4v1772959330492!5m2!1sen!2sin";

const HALL_MAP_EMBED_SRC =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3943.031602253767!2d77.71988827445215!3d8.783096892790825!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b04103f5524cf13%3A0x95721fa86c6d33ed!2sDr.Sivanthi%20Aditanar%20Kalyana%20Mandapam!5e0!3m2!1sen!2sin!4v1772961030608!5m2!1sen!2sin";

const INVITE_LOCALE = "en-GB";
const INVITE_TIMEZONE = "Asia/Kolkata";

const RSVP_EVENT_OPTIONS = [
  { key: "betrothal", label: "Betrothal" },
  { key: "ceremony", label: "Ceremony" },
  { key: "afterCeremony", label: "After Ceremony" },
] as const;

type RsvpEventKey = (typeof RSVP_EVENT_OPTIONS)[number]["key"];

function MapPinIcon() {
  return (
    <svg
      className="mapPinIcon"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 22C12 22 4 14.9 4 9.6C4 5.4 7.6 2 12 2C16.4 2 20 5.4 20 9.6C20 14.9 12 22 12 22Z"
        fill="currentColor"
        fillOpacity="0.16"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="9.4" r="2.8" fill="currentColor" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg
      className="musicIcon"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8 6L18 12L8 18V6Z" fill="currentColor" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg
      className="musicIcon"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="7" y="6" width="4" height="12" rx="1" fill="currentColor" />
      <rect x="13" y="6" width="4" height="12" rx="1" fill="currentColor" />
    </svg>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "Date TBD";
  const parts = new Intl.DateTimeFormat(INVITE_LOCALE, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: INVITE_TIMEZONE,
  }).formatToParts(d);

  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${part("weekday")}, ${part("day")} ${part("month")} ${part("year")}`.trim();
}

function formatTime(iso: string) {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "Time TBD";
  const parts = new Intl.DateTimeFormat(INVITE_LOCALE, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: INVITE_TIMEZONE,
  }).formatToParts(d);
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const dayPeriod = part("dayPeriod").toLowerCase();
  return `${part("hour")}:${part("minute")} ${dayPeriod}`.trim();
}

export default function Home() {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const firstInteractionHandledRef = React.useRef(false);
  const [payload, setPayload] = useState<InvitationConfigPayload | null>(null);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const [rsvpName, setRsvpName] = useState("");
  const [rsvpPhone, setRsvpPhone] = useState("");
  const [rsvpEvents, setRsvpEvents] = useState<Record<RsvpEventKey, boolean>>({
    betrothal: false,
    ceremony: false,
    afterCeremony: false,
  });
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  useScrollReveal();
  useScrollProgress();

  const attemptPlay = React.useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return false;
    try {
      audio.muted = false;
      audio.volume = 1;
      await audio.play();
      return true;
    } catch {
      setMusicPlaying(false);
      return false;
    }
  }, []);

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

  useEffect(() => {
    if (!rsvpOpen) return;
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setRsvpOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [rsvpOpen]);

  useEffect(() => {
    let disposed = false;
    let retries = 0;
    let retryTimer: number | null = null;

    const tryAutoplay = () => {
      if (disposed) return;
      const audio = audioRef.current;
      if (!audio) return;
      if (!audio.paused) return;
      void attemptPlay();
    };

    // Immediate attempt
    tryAutoplay();

    // Retry a few times while the media is buffering/loading.
    retryTimer = window.setInterval(() => {
      const audio = audioRef.current;
      if (disposed || !audio) return;
      if (!audio.paused) {
        if (retryTimer !== null) {
          window.clearInterval(retryTimer);
          retryTimer = null;
        }
        return;
      }
      retries += 1;
      void attemptPlay();
      if (retries >= 10 && retryTimer !== null) {
        window.clearInterval(retryTimer);
        retryTimer = null;
      }
    }, 1200);

    window.addEventListener("load", tryAutoplay, { once: true });
    window.addEventListener("pageshow", tryAutoplay, { once: true });

    const audio = audioRef.current;
    audio?.addEventListener("loadeddata", tryAutoplay);
    audio?.addEventListener("canplay", tryAutoplay);
    audio?.addEventListener("canplaythrough", tryAutoplay);

    return () => {
      disposed = true;
      if (retryTimer !== null) window.clearInterval(retryTimer);
      window.removeEventListener("load", tryAutoplay);
      window.removeEventListener("pageshow", tryAutoplay);
      audio?.removeEventListener("loadeddata", tryAutoplay);
      audio?.removeEventListener("canplay", tryAutoplay);
      audio?.removeEventListener("canplaythrough", tryAutoplay);
    };
  }, [attemptPlay]);

  useEffect(() => {
    const startPlaybackOnFirstInteraction = () => {
      if (firstInteractionHandledRef.current) return;
      firstInteractionHandledRef.current = true;
      void attemptPlay();
    };

    window.addEventListener("pointerdown", startPlaybackOnFirstInteraction, {
      once: true,
      passive: true,
    });
    window.addEventListener("touchstart", startPlaybackOnFirstInteraction, {
      once: true,
      passive: true,
    });
    window.addEventListener("scroll", startPlaybackOnFirstInteraction, {
      once: true,
      passive: true,
    });
    window.addEventListener("keydown", startPlaybackOnFirstInteraction, {
      once: true,
    });

    return () => {
      window.removeEventListener("pointerdown", startPlaybackOnFirstInteraction);
      window.removeEventListener("touchstart", startPlaybackOnFirstInteraction);
      window.removeEventListener("scroll", startPlaybackOnFirstInteraction);
      window.removeEventListener("keydown", startPlaybackOnFirstInteraction);
    };
  }, [attemptPlay]);

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

  const selectedRsvpEvents = useMemo(
    () =>
      RSVP_EVENT_OPTIONS.filter((opt) => rsvpEvents[opt.key]).map((opt) => opt.label),
    [rsvpEvents],
  );

  const toggleRsvpEvent = (key: RsvpEventKey) => {
    setRsvpEvents((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const resetRsvpForm = () => {
    setRsvpName("");
    setRsvpPhone("");
    setRsvpEvents({
      betrothal: false,
      ceremony: false,
      afterCeremony: false,
    });
  };

  const playMusic = async () => {
    void attemptPlay();
  };

  const pauseMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setMusicPlaying(false);
  };

  const toggleMusic = () => {
    if (musicPlaying) {
      pauseMusic();
      return;
    }
    void playMusic();
  };

  const handleRsvpSubmit = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    if (rsvpSubmitting) return;

    const name = rsvpName.trim();
    const phone = rsvpPhone.trim();
    const events = RSVP_EVENT_OPTIONS.filter((opt) => rsvpEvents[opt.key]).map(
      (opt) => opt.label,
    );

    if (!name) {
      setRsvpStatus({ tone: "error", message: "Please enter your name." });
      return;
    }
    if (!events.length) {
      setRsvpStatus({
        tone: "error",
        message: "Please select at least one function you can attend.",
      });
      return;
    }

    setRsvpSubmitting(true);
    setRsvpStatus(null);

    const res = await submitRsvp({
      name,
      phone: phone || undefined,
      attending: true,
      events,
    });

    setRsvpSubmitting(false);

    if (!res.ok) {
      const genericError =
        "RSVP service is currently unavailable. Please confirm through phone/message.";
      setRsvpStatus({
        tone: "error",
        message: res.error || genericError,
      });
      return;
    }

    setRsvpStatus({
      tone: "success",
      message: "RSVP submitted successfully. Thank you.",
    });
    setRsvpOpen(false);
    resetRsvpForm();
  };

  return (
    <div className="appShell">
      <div className="scrollProgress" aria-hidden="true" />
      <a className="sr-only" href="#details">
        Skip to invitation details
      </a>
      <audio
        ref={audioRef}
        src="/music/WeddingMusic.mp3"
        autoPlay
        loop
        playsInline
        preload="auto"
        onPlay={() => setMusicPlaying(true)}
        onPause={() => setMusicPlaying(false)}
        onEnded={() => setMusicPlaying(false)}
      />
      <button
        className={`musicToggle button ${musicPlaying ? "musicToggleActive" : ""}`}
        type="button"
        onClick={toggleMusic}
        title={musicPlaying ? "Pause music" : "Play music"}
        aria-label={musicPlaying ? "Pause wedding music" : "Play wedding music"}
        aria-pressed={musicPlaying}
      >
        {musicPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>

      <header className="hero sectionBgHero">
        <div className="heroInner">
          <div className="introWrap revealUp" data-reveal data-reveal-delay={20}>
            <main className="invitationCard introCard" aria-label="Wedding invitation introduction">
              <div className="cardFrame" aria-hidden="true" />
              <FloralCorner className="floralCorner floralTopLeft" />
              <FloralCorner className="floralCorner floralTopRight" />
              <FloralCorner className="floralCorner floralBottomLeft" />
              <FloralCorner className="floralCorner floralBottomRight" />

              <div className="introFrontFace">
                <p className="kicker revealUp" data-reveal data-reveal-delay={80}>
                  Wedding Invitation
                </p>
                <p className="title inviteHost revealUp" data-reveal data-reveal-delay={120}>
                  Mr. P. Kannan <small>M.Com., M.Phil.,</small> & Mrs. K. Vanitha,
                </p>
                <p className="subtitle inviteLead revealUp" data-reveal data-reveal-delay={170}>
                  We Cordially Solicit your esteemed presence with family
                </p>
                <p className="sectionText revealUp inviteHeroLine" data-reveal data-reveal-delay={210}>
                  and friends on the auspicious occasion of the Wedding Ceremony of
                  our
                </p>
                <h2 className="sectionTitle revealUp inviteHeroName" data-reveal data-reveal-delay={250}>
                  Son {couple.partnerOneName}
                </h2>
                <p className="sectionText revealUp inviteHeroWith" data-reveal data-reveal-delay={290}>
                  with
                </p>
                <h2 className="sectionTitle revealUp inviteHeroName" data-reveal data-reveal-delay={330}>
                  Selvi {couple.partnerTwoName}
                </h2>
              </div>
            </main>
          </div>
        </div>
      </header>

      <section
        className="section revealUp"
        aria-labelledby="details-title"
        data-reveal
        data-reveal-delay={40}
      >
        <div className="sectionInner">
          <div className="invitationCard revealUp" id="details" data-reveal>
            <h2 className="sectionTitle revealUp" id="details-title" data-reveal>
              Wedding Details
            </h2>
            <p className="sectionText revealUp" data-reveal data-reveal-delay={70}>
              Ceremony, venue and calendar links.
            </p>

            <div className="metaGrid" style={{ marginTop: 16 }}>
              <div className="metaItem revealUp" data-reveal data-reveal-delay={120}>
                <div className="metaLabel">Date</div>
                <div className="metaValue">{formatDate(event.startIso)}</div>
              </div>
              <div className="metaItem revealUp" data-reveal data-reveal-delay={170}>
                <div className="metaLabel">Time</div>
                <div className="metaValue">{formatTime(event.startIso)}</div>
              </div>
              <div className="metaItem revealUp" data-reveal data-reveal-delay={220}>
                <div className="metaLabel">Venue</div>
                <div className="metaValue">{event.locationName}</div>
              </div>
              <div className="metaItem revealUp" data-reveal data-reveal-delay={270}>
                <div className="metaLabel">Address</div>
                <div className="metaValue">{event.locationAddress}</div>
              </div>
            </div>

            <div
              className="revealUp"
              style={{ marginTop: 18 }}
              data-reveal
              data-reveal-delay={320}
            >
              <EventCtas event={event} />
              <p className="smallNote">
                Tip: If you don’t use Google Calendar, the <strong>.ics</strong>{" "}
                download works with Apple Calendar, Outlook, and most calendar apps.
              </p>
              <p className="smallNote">
                Invitation details are prepared from the wedding card schedule and
                venue details.
              </p>
            </div>

            <div
              className="revealUp"
              style={{ marginTop: 20 }}
              data-reveal
              data-reveal-delay={360}
            >
              <div className="metaLabel" style={{ marginBottom: 8 }}>
                Countdown
              </div>
              <Countdown isoDateTime={event.startIso} />
            </div>
          </div>
        </div>
      </section>

      <ParallaxBand
        id="story"
        title="Wedding invitation"
        strength={20}
        revealDelay={55}
      >
        <div className="sectionInner">
          <h2 className="sectionTitle revealUp" data-reveal>
            Wedding Invitation
          </h2>
          <p className="sectionText revealUp" data-reveal data-reveal-delay={70}>
            Mr. P. Kannan, M.Com., M.Phil., and Mrs. K. Vanitha, Tirunelveli,
            warmly invite you to bless the wedding of their son.
          </p>

          <div className="callouts" style={{ marginTop: 16 }}>
            <div className="calloutCard revealUp" data-reveal data-reveal-delay={120}>
              <div className="metaLabel">Groom</div>
              <p className="sectionText" style={{ marginTop: 8 }}>
                Selvan <strong>P.K. Prabakaran, B.E.</strong>
                <br />
                Deputy Manager - Bank of Maharashtra
              </p>
            </div>
            <div className="calloutCard revealUp" data-reveal data-reveal-delay={170}>
              <div className="metaLabel">Bride</div>
              <p className="sectionText" style={{ marginTop: 8 }}>
                Selvi <strong>T. Deepika, B.Sc.</strong>
                <br />
                Assistant Manager - Central Bank of India
                <br />
                D/o. Mr. N. Tirupathi & Mrs. T. Radhika, Chennai
              </p>
            </div>
          </div>
        </div>
      </ParallaxBand>

      <section
        className="section revealUp"
        aria-labelledby="schedule-title"
        data-reveal
        data-reveal-delay={70}
      >
        <div className="sectionInner">
          <h2 className="sectionTitle revealUp" id="schedule-title" data-reveal>
            Schedule
          </h2>
          <p className="sectionText revealUp" data-reveal data-reveal-delay={70}>
            Timings from the invitation card.
          </p>

          <div className="callouts" style={{ marginTop: 16 }}>
            <div className="calloutCard revealUp" data-reveal data-reveal-delay={120}>
              <div className="metaLabel">Sunday, 19 April 2026</div>
              <p className="sectionText" style={{ marginTop: 8 }}>
                Betrothal: 6:00 PM to 7:00 PM at Dr. Sivanthi Adhithanar Kalyana
                Mahal, Sankarnagar
              </p>
            </div>
            <div className="calloutCard revealUp" data-reveal data-reveal-delay={170}>
              <div className="metaLabel">Monday, 20 April 2026</div>
              <p className="sectionText" style={{ marginTop: 8 }}>
                Muhurtham: 9:05 AM to 10:25 AM at Arulmigu Palayam Salaikumara
                Swamy Temple, Tirunelveli Junction
              </p>
            </div>
            <div className="calloutCard revealUp" data-reveal data-reveal-delay={220}>
              <div className="metaLabel">After Muhurtham</div>
              <p className="sectionText" style={{ marginTop: 8 }}>
                Function at Dr. Sivanthi Adhithanar Kalyana Mahal, Sankarnagar,
                Tirunelveli
              </p>
            </div>
          </div>
        </div>
      </section>

      <ParallaxBand
        id="travel"
        title="Venue details"
        strength={24}
        revealDelay={85}
      >
        <div className="sectionInner">
          <h2 className="sectionTitle revealUp" data-reveal>
            Venue Details
          </h2>
          <p className="sectionText revealUp" data-reveal data-reveal-delay={70}>
            Wedding ceremony and function are in Tirunelveli at two nearby venues.
          </p>

          <div className="callouts" style={{ marginTop: 16 }}>
            <div className="calloutCard revealUp" data-reveal data-reveal-delay={120}>
              <div className="metaLabel">Wedding Ceremony</div>
              <p className="sectionText" style={{ marginTop: 8 }}>
                Arulmigu Palayam Salaikumara Swamy Temple
                <br />
                Tirunelveli Junction, Tirunelveli
              </p>
              <div className="venueMapEmbed" style={{ marginTop: 12 }}>
                <div className="venueMapTitle">
                  <MapPinIcon />
                  <span>Temple Map</span>
                </div>
                <iframe
                  className="venueMapFrame"
                  src={TEMPLE_MAP_EMBED_SRC}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Arulmigu Sri Salai Kumaraswamy Temple map"
                />
              </div>
            </div>
            <div className="calloutCard revealUp" data-reveal data-reveal-delay={170}>
              <div className="metaLabel">Function / Betrothal</div>
              <p className="sectionText" style={{ marginTop: 8 }}>
                Dr. Sivanthi Adhithanar Kalyana Mahal
                <br />
                Sankarnagar, Tirunelveli
              </p>
              <div className="venueMapEmbed" style={{ marginTop: 12 }}>
                <div className="venueMapTitle">
                  <MapPinIcon />
                  <span>Hall Map</span>
                </div>
                <iframe
                  className="venueMapFrame"
                  src={HALL_MAP_EMBED_SRC}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Dr. Sivanthi Aditanar Kalyana Mandapam map"
                />
              </div>
            </div>
          </div>

          <div
            className="revealUp"
            style={{ marginTop: 14 }}
            data-reveal
            data-reveal-delay={220}
          >
            <div className="metaLabel">Quick links</div>
            <EventCtas event={event} />
          </div>
        </div>
      </ParallaxBand>

      <section
        className="section revealUp"
        aria-labelledby="rsvp-title"
        data-reveal
        data-reveal-delay={95}
      >
        <div className="sectionInner">
          <h2 className="sectionTitle revealUp" id="rsvp-title" data-reveal>
            RSVP
          </h2>
          <p className="sectionText revealUp" data-reveal data-reveal-delay={70}>
            Please share your RSVP to help us make arrangements for the ceremony and
            function.
          </p>

          <div
            className="calloutCard revealUp"
            style={{ marginTop: 16 }}
            data-reveal
            data-reveal-delay={130}
          >
            <div className="metaLabel">RSVP Form</div>
            <p className="sectionText" style={{ marginTop: 8 }}>
              Submit your RSVP and select which function you are attending.
            </p>
            <div className="btnRow">
              <button
                className="button buttonPrimary"
                type="button"
                onClick={() => setRsvpOpen(true)}
              >
                RSVP
              </button>
            </div>
            {selectedRsvpEvents.length ? (
              <p className="smallNote" style={{ marginTop: 10 }}>
                Selected: {selectedRsvpEvents.join(", ")}
              </p>
            ) : null}
            {rsvpStatus ? (
              <p
                className={`smallNote ${
                  rsvpStatus.tone === "success" ? "noteSuccess" : "noteError"
                }`}
                style={{ marginTop: 10 }}
              >
                {rsvpStatus.message}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {rsvpOpen ? (
        <div className="modalOverlay" role="presentation" onClick={() => setRsvpOpen(false)}>
          <div
            className="modalCard"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rsvp-modal-title"
            onClick={(ev) => ev.stopPropagation()}
          >
            <h3 id="rsvp-modal-title" className="sectionTitle">
              RSVP
            </h3>
            <p className="sectionText" style={{ marginTop: 6 }}>
              Please tell us which functions you can attend.
            </p>

            <form onSubmit={handleRsvpSubmit} className="modalForm">
              <label className="fieldLabel" htmlFor="rsvp-name">
                Name
              </label>
              <input
                id="rsvp-name"
                className="fieldInput"
                type="text"
                value={rsvpName}
                onChange={(ev) => setRsvpName(ev.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />

              <label className="fieldLabel" htmlFor="rsvp-phone">
                Phone (optional)
              </label>
              <input
                id="rsvp-phone"
                className="fieldInput"
                type="tel"
                value={rsvpPhone}
                onChange={(ev) => setRsvpPhone(ev.target.value)}
                placeholder="Phone number"
                autoComplete="tel"
              />

              <div className="fieldLabel" style={{ marginTop: 6 }}>
                I can attend
              </div>
              <div className="choiceGrid">
                {RSVP_EVENT_OPTIONS.map((opt) => (
                  <label
                    key={opt.key}
                    className={`choiceChip ${
                      rsvpEvents[opt.key] ? "choiceChipActive" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={rsvpEvents[opt.key]}
                      onChange={() => toggleRsvpEvent(opt.key)}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>

              {rsvpStatus?.tone === "error" ? (
                <p className="smallNote noteError">{rsvpStatus.message}</p>
              ) : null}

              <div className="modalActions">
                <button
                  className="button"
                  type="button"
                  onClick={() => setRsvpOpen(false)}
                  disabled={rsvpSubmitting}
                >
                  Cancel
                </button>
                <button className="button buttonPrimary" type="submit" disabled={rsvpSubmitting}>
                  {rsvpSubmitting ? "Submitting..." : "Submit RSVP"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <footer className="footer revealUp" data-reveal data-reveal-delay={40}>
        <p>
          With love, <strong>{couple.partnerOneName}</strong> &{" "}
          <strong>{couple.partnerTwoName}</strong>
        </p>
        <p style={{ marginTop: 6 }}>
          Designed with a classic invitation palette: charcoal, silver, and pink.
        </p>
      </footer>
    </div>
  );
}
