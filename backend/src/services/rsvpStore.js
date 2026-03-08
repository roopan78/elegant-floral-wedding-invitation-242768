const DEFAULT_SUPABASE_TABLE = 'rsvp_responses';

function isPlaceholder(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return true;
  return (
    normalized.includes('your_') ||
    normalized.includes('your-project') ||
    normalized.includes('your_project') ||
    normalized.includes('replace_me') ||
    normalized.includes('example')
  );
}

class RsvpStore {
  getConfig() {
    const rawBaseUrl = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
    const rawServiceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
    const table = (process.env.SUPABASE_RSVP_TABLE || DEFAULT_SUPABASE_TABLE).trim();
    const baseUrl = isPlaceholder(rawBaseUrl) ? '' : rawBaseUrl;
    const serviceRoleKey = isPlaceholder(rawServiceRoleKey)
      ? ''
      : rawServiceRoleKey;
    return { baseUrl, serviceRoleKey, table };
  }

  async save(rsvp) {
    const { baseUrl, serviceRoleKey, table } = this.getConfig();

    if (!baseUrl || !serviceRoleKey) {
      const notConfiguredError = new Error('RSVP database is not configured.');
      notConfiguredError.code = 'RSVP_DB_NOT_CONFIGURED';
      throw notConfiguredError;
    }

    const insertUrl = `${baseUrl}/rest/v1/${encodeURIComponent(table)}`;
    const payload = {
      guest_name: rsvp.name,
      phone: rsvp.phone || null,
      attending: Boolean(rsvp.attending),
      events: Array.isArray(rsvp.events) ? rsvp.events : [],
      submitted_at: new Date().toISOString(),
    };

    let response;
    try {
      response = await fetch(insertUrl, {
        method: 'POST',
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      const networkError = new Error('Failed to connect to RSVP database.');
      networkError.code = 'RSVP_DB_WRITE_FAILED';
      networkError.cause = error;
      throw networkError;
    }

    if (!response.ok) {
      let details = '';
      try {
        details = await response.text();
      } catch (error) {
        details = '';
      }
      const writeError = new Error(
        `RSVP database write failed (${response.status})${details ? `: ${details}` : ''}`
      );
      writeError.code = 'RSVP_DB_WRITE_FAILED';
      throw writeError;
    }

    let rowId = null;
    try {
      const result = await response.json();
      if (Array.isArray(result) && result.length > 0) {
        rowId = result[0] && result[0].id ? result[0].id : null;
      }
    } catch (error) {
      rowId = null;
    }

    return {
      provider: 'supabase',
      table,
      rowId,
      persisted: true,
    };
  }
}

module.exports = new RsvpStore();
