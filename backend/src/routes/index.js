const express = require('express');
const healthController = require('../controllers/health');
const rsvpStore = require('../services/rsvpStore');

const router = express.Router();
// Health endpoint

/**
 * @swagger
 * /:
 *   get:
 *     tags: [Health]
 *     summary: Health endpoint
 *     responses:
 *       200:
 *         description: Service health check passed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 message:
 *                   type: string
 *                   example: Service is healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 environment:
 *                   type: string
 *                   example: development
 */
router.get('/', healthController.check.bind(healthController));

/**
 * @swagger
 * /api/invitation/config:
 *   get:
 *     tags: [Invitation]
 *     summary: Get invitation configuration payload
 *     description: >
 *       Returns the invitation configuration used by the Next.js frontend to render the wedding invitation page.
 *       Values may be overridden via environment variables for deployment.
 *     responses:
 *       200:
 *         description: Invitation configuration payload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InvitationConfig'
 */
router.get('/api/invitation/config', (req, res) => {
  // Environment overrides (optional). Defaults are safe placeholders for development.
  const partnerOneName = process.env.INVITE_PARTNER_ONE_NAME || 'P.K. Prabakaran';
  const partnerTwoName = process.env.INVITE_PARTNER_TWO_NAME || 'T. Deepika';
  const dateISO =
    process.env.INVITE_EVENT_DATE_ISO || '2026-04-20T09:05:00+05:30';
  const venueName =
    process.env.INVITE_VENUE_NAME || 'Arulmigu Palayam Salaikumara Swamy Temple';
  const address =
    process.env.INVITE_VENUE_ADDRESS ||
    'Tirunelveli Junction, Tirunelveli, Tamil Nadu';
  const timezone = process.env.INVITE_EVENT_TIMEZONE || 'Asia/Kolkata';

  const mapUrl =
    process.env.INVITE_MAP_URL ||
    'https://maps.google.com/?q=Arulmigu+Palayam+Salaikumara+Swamy+Temple+Tirunelveli+Junction';
  const calendarUrl = process.env.INVITE_CALENDAR_URL || '';

  // Feature flags may come from NEXT_PUBLIC_FEATURE_FLAGS as JSON string.
  // Example: {"rsvpEnabled":true}
  let featureFlags = { rsvpEnabled: false };
  if (process.env.NEXT_PUBLIC_FEATURE_FLAGS) {
    try {
      featureFlags = {
        ...featureFlags,
        ...JSON.parse(process.env.NEXT_PUBLIC_FEATURE_FLAGS),
      };
    } catch (e) {
      // Ignore malformed JSON; keep defaults to avoid breaking the frontend.
    }
  }

  return res.status(200).json({
    couple: { partnerOneName, partnerTwoName },
    event: { dateISO, venueName, address, timezone },
    links: { mapUrl, calendarUrl },
    assets: {
      heroImageUrl: process.env.INVITE_HERO_IMAGE_URL || '',
    },
    ui: {
      accentColor: process.env.INVITE_ACCENT_COLOR || '#16A34A',
      primaryColor: process.env.INVITE_PRIMARY_COLOR || '#0F172A',
    },
    featureFlags,
  });
});

/**
 * RSVP:
 * Persists submissions to Supabase Postgres (via REST API) when configured.
 */

/**
 * @swagger
 * /api/rsvp:
 *   post:
 *     tags: [RSVP]
 *     summary: Submit an RSVP (optional)
 *     description: >
 *       Accepts an RSVP submission and stores it in the configured database.
 *       When database credentials are not configured, the endpoint returns 503.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RsvpRequest'
 *     responses:
 *       200:
 *         description: RSVP receipt
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RsvpResponse'
 *       400:
 *         description: Invalid payload
 */
router.post('/api/rsvp', async (req, res) => {
  const { name, attending, events, phone } = req.body || {};

  if (!name || typeof name !== 'string') {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid payload: name is required.',
    });
  }
  if (typeof attending !== 'boolean') {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid payload: attending must be a boolean.',
    });
  }

  const normalizedEvents = Array.isArray(events)
    ? events
        .filter((v) => typeof v === 'string')
        .map((v) => v.trim())
        .filter(Boolean)
    : [];

  if (events !== undefined && !Array.isArray(events)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid payload: events must be an array of strings.',
    });
  }

  if (
    phone !== undefined &&
    phone !== null &&
    (typeof phone !== 'string' || !phone.trim())
  ) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid payload: phone must be a non-empty string when provided.',
    });
  }

  const normalizedRsvp = {
    name: name.trim(),
    attending,
    phone: typeof phone === 'string' ? phone.trim() : undefined,
    events: normalizedEvents,
  };

  try {
    const stored = await rsvpStore.save(normalizedRsvp);
    return res.status(200).json({
      status: 'received',
      receivedAt: new Date().toISOString(),
      storage: stored,
      rsvp: normalizedRsvp,
    });
  } catch (error) {
    if (error && error.code === 'RSVP_DB_NOT_CONFIGURED') {
      return res.status(503).json({
        status: 'error',
        message:
          'RSVP database is not configured. Set valid SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY values on the backend.',
      });
    }
    if (error && error.code === 'RSVP_DB_WRITE_FAILED') {
      return res.status(502).json({
        status: 'error',
        message: 'Unable to store RSVP at the moment. Please try again.',
      });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Unexpected RSVP processing error.',
    });
  }
});

module.exports = router;
