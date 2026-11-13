"use strict";

/**
 * Vercel serverless endpoint for Carroll Construction's 4-step lead funnel.
 * Carroll's requested n8n test webhook is configured server-side, never in the browser.
 * IMPORTANT: n8n /webhook-test/ URLs only listen in test mode and are not reliable
 * destinations for ongoing ad traffic. Replace with Carroll's active /webhook/
 * production URL before using this funnel for live lead acquisition.
 */
const allowed = {
  project_type: ["kitchen_remodel", "bathroom_remodel", "basement_finishing", "addition_or_renovation", "electrical_or_ev", "other"],
  project_scope: ["full_transformation", "partial_upgrade", "repair_installation", "need_guidance"],
  budget_range: ["under_5k", "5k_15k", "15k_30k", "30k_60k", "60k_plus", "unsure"],
  timeline: ["asap_30_days", "1_3_months", "3_6_months", "6_plus_months", "exploring"]
};
const labelMap = {
  project_type: {
    kitchen_remodel: "Kitchen remodeling", bathroom_remodel: "Bathroom remodeling",
    basement_finishing: "Basement finishing", addition_or_renovation: "Home addition or major renovation",
    electrical_or_ev: "Electrical upgrade or EV charger", other: "Something else"
  },
  project_scope: {
    full_transformation: "A complete transformation", partial_upgrade: "A partial remodel or upgrade",
    repair_installation: "A specific repair or installation", need_guidance: "Not sure yet, I need expert guidance"
  },
  budget_range: {
    under_5k: "Under $5,000", "5k_15k": "$5,000 – $15,000",
    "15k_30k": "$15,000 – $30,000", "30k_60k": "$30,000 – $60,000",
    "60k_plus": "$60,000+", unsure: "Not sure yet"
  },
  timeline: {
    asap_30_days: "As soon as possible / within 30 days", "1_3_months": "Within 1–3 months",
    "3_6_months": "Within 3–6 months", "6_plus_months": "More than 6 months away",
    exploring: "Just exploring my options"
  }
};
const CONSENT_COPY = {
  project_updates: "I agree to receive SMS messages from Carroll Construction LLC regarding my estimate request, appointment scheduling, and project updates at the phone number provided. Message frequency varies. Message and data rates may apply. Reply STOP to opt out or HELP for help.",
  marketing: "I agree to receive promotional and marketing SMS messages from Carroll Construction LLC, including offers and service updates, at the phone number provided. Messages may be sent using automated technology. Message frequency varies. Message and data rates may apply. Reply STOP to opt out or HELP for help. Consent is not a condition of purchase."
};
function str(value, max = 200) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
function error(res, status, message) { res.status(status).json({ success: false, error: message }); }
function trackingFilter(source) {
  const allowedKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid", "landing_page", "referrer", "form_started_at"];
  return Object.fromEntries(allowedKeys.map((k) => [k, str(source?.[k], k === "landing_page" ? 1500 : 250)]).filter(([, v]) => v));
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return error(res, 405, "Method not allowed");
  }

  // Requested destination. Keep this inside the serverless API so visitors' form
  // submissions are validated before forwarding to n8n. A test webhook is temporary:
  // the n8n workflow must be listening at submission time.
  const webhook = "https://ignite.grunagency.com/webhook-test/carroll-lead";
  if (Number(req.headers["content-length"] || 0) > 25_000) return error(res, 413, "Submission too large");

  let body;
  try { body = typeof req.body === "string" ? JSON.parse(req.body) : req.body; }
  catch (_) { return error(res, 400, "Invalid JSON"); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return error(res, 400, "Invalid submission");

  // Honeypot: acknowledge silently but do not forward bot entries.
  if (str(body.website)) return res.status(200).json({ success: true });

  for (const [key, values] of Object.entries(allowed)) {
    if (!values.includes(body[key])) return error(res, 400, "Please complete all four project questions.");
  }

  const c = body.contact || {};
  const name = str(c.full_name, 120);
  const email = str(c.email, 254).toLowerCase();
  const digits = str(c.phone, 24).replace(/\D/g, "");
  const phone = digits.length === 10 ? "+1" + digits : digits.length === 11 && digits.startsWith("1") ? "+" + digits : "";
  const street = str(c.street_address, 200);
  const city = str(c.city, 100);
  const state = str(c.state, 10);
  const zip = str(c.zip, 10);

  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !phone ||
      !street || !city || !["IL", "IN", "WI", "OTHER"].includes(state) ||
      !/^\d{5}(-\d{4})?$/.test(zip)) {
    return error(res, 400, "Please provide valid name, phone, email, and project address.");
  }

  const receivedAt = new Date().toISOString();
  const consent = body.consent || {};
  const optinUpdates = consent.sms_project_updates === true;
  const optinMarketing = consent.sms_marketing === true;
  const rawIp = str(req.headers["x-forwarded-for"], 150).split(",")[0]?.trim() || "";
  const lead = {
    source: "carroll_construction_funnel",
    event: "new_estimate_request",
    submitted_at: receivedAt,
    // Use a stable ID in the CRM to prevent duplicate processing on webhook retries.
    lead_id: require("node:crypto").randomUUID(),
    project_type: body.project_type,
    project_scope: body.project_scope,
    budget_range: body.budget_range,
    timeline: body.timeline,
    answer_labels: Object.fromEntries(Object.keys(allowed).map((key) => [key, labelMap[key][body[key]]])),
    full_name: name,
    email,
    phone,
    street_address: street,
    city,
    state,
    zip,
    address_full: [street, city, state, zip].join(", "),
    notes: str(c.notes, 1500),
    sms_project_updates_opt_in: optinUpdates,
    sms_marketing_opt_in: optinMarketing,
    consent: {
      project_updates: {
        opted_in: optinUpdates,
        disclosure_text: CONSENT_COPY.project_updates
      },
      marketing: {
        opted_in: optinMarketing,
        disclosure_text: CONSENT_COPY.marketing
      },
      consent_copy_version: "carroll-sms-v1-2026-11-11",
      consent_timestamp: receivedAt,
      form_consent_timestamp: str(consent.consent_timestamp, 80),
      method: "unchecked_optional_checkbox",
      landing_page: str(body.tracking?.landing_page, 1500),
      ip_address: rawIp,
      user_agent: str(req.headers["user-agent"], 500)
    },
    tracking: trackingFilter(body.tracking)
  };

  // For convenience in GHL / downstream webhooks. NO texting unless the matching
  // consent boolean is true; asking for an estimate does not imply marketing opt-in.
  let response;
  const timeout = AbortSignal.timeout(12000);
  try {
    response = await fetch(webhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.LEAD_WEBHOOK_SECRET ? { "X-Lead-Webhook-Secret": process.env.LEAD_WEBHOOK_SECRET } : {})
      },
      body: JSON.stringify(lead),
      signal: timeout
    });
  } catch (_e) {
    console.error("Carroll webhook delivery error");
    return error(res, 502, "Could not deliver request. Please try again.");
  }
  if (!response.ok) {
    console.error("Carroll webhook rejected lead", response.status);
    return error(res, 502, "Could not deliver request. Please try again.");
  }
  return res.status(200).json({ success: true });
};