# Carroll Construction LLC | Free Estimate Funnel

Production-oriented, mobile-first, four-question funnel for Carroll Construction LLC in Chicagoland. Built by Ignite Co. to reflect the supplied Carroll branding. This repository started empty; the funnel is a lightweight static site with a Vercel serverless lead handler and no frontend framework.

**Status:** Frontend + server endpoint are implemented. **A live webhook has not been supplied or configured**, so lead submissions will safely fail with a retry/call message until the owner or developer configures one. **Do not run traffic until a real end-to-end delivery test passes.**

## Funnel questions: exact wording and answer values

| Step | Question shown to visitor | Options shown to visitor | Field stored |
| --- | --- | --- | --- |
| 1 | **What can we help you build?** | Kitchen remodeling; Bathroom remodeling; Basement finishing; Home addition or major renovation; Electrical upgrade or EV charger; Something else | \`project_type\` |
| 2 | **How extensive is your project?** | A complete transformation; A partial remodel or upgrade; A specific repair or installation; Not sure yet, I need expert guidance | \`project_scope\` |
| 3 | **What budget are you considering?** | Under $5,000; $5,000–$15,000; $15,000–$30,000; $30,000–$60,000; $60,000+; Not sure yet | \`budget_range\` |
| 4 | **When would you like to get started?** | As soon as possible / within 30 days; Within 1–3 months; Within 3–6 months; More than 6 months away; Just exploring my options | \`timeline\` |
| 5 | **Let’s bring your vision to life.** | Full name, phone number, email address, project street address, city, state, ZIP, optional notes, two *optional and unchecked* SMS permissions | \`contact\`, \`consent\` |

**Question value mapping** (as sent to your webhook):

- \`project_type\`: \`kitchen_remodel\`, \`bathroom_remodel\`, \`basement_finishing\`, \`addition_or_renovation\`, \`electrical_or_ev\`, \`other\`.
- \`project_scope\`: \`full_transformation\`, \`partial_upgrade\`, \`repair_installation\`, \`need_guidance\`.
- \`budget_range\`: \`under_5k\`, \`5k_15k\`, \`15k_30k\`, \`30k_60k\`, \`60k_plus\`, \`unsure\`.
- \`timeline\`: \`asap_30_days\`, \`1_3_months\`, \`3_6_months\`, \`6_plus_months\`, \`exploring\`.

No prospects are auto-rejected by budget or timeline. Qualifying information is used for intelligent lead routing, not blanket rejection of smaller electrical or installation projects.

## Lead intake: webhook, data, mapping

Browser posts to \`POST /api/lead\`. Backend validates answers, normalizes phone to US E.164, generates a UUID, timestamps the submission, and POSTs JSON to **your own** configured \`LEAD_WEBHOOK_URL\`.

Sample outbound payload (illustrative data only):

\`\`\`json
{
  "source": "carroll_construction_funnel",
  "event": "new_estimate_request",
  "submitted_at": "2026-11-11T18:00:00.000Z",
  "lead_id": "example-uuid",
  "project_type": "kitchen_remodel",
  "project_scope": "full_transformation",
  "budget_range": "30k_60k",
  "timeline": "1_3_months",
  "answer_labels": {
    "project_type": "Kitchen remodeling",
    "project_scope": "A complete transformation",
    "budget_range": "$30,000 – $60,000",
    "timeline": "Within 1–3 months"
  },
  "full_name": "Jane Sample",
  "email": "jane@example.com",
  "phone": "+17735550123",
  "street_address": "123 Sample St",
  "city": "Chicago",
  "state": "IL",
  "zip": "60616",
  "address_full": "123 Sample St, Chicago, IL, 60616",
  "notes": "Would like new cabinets and countertops.",
  "sms_project_updates_opt_in": true,
  "sms_marketing_opt_in": false,
  "consent": {
    "project_updates": { "opted_in": true, "disclosure_text": "[full exact visible disclosure]" },
    "marketing": { "opted_in": false, "disclosure_text": "[full exact visible disclosure]" },
    "consent_copy_version": "carroll-sms-v1-2026-11-11",
    "consent_timestamp": "2026-11-11T18:00:00.000Z",
    "form_consent_timestamp": "2026-11-11T17:59:59.000Z",
    "method": "unchecked_optional_checkbox",
    "landing_page": "https://example.vercel.app/?utm_source=facebook",
    "ip_address": "example IP",
    "user_agent": "browser user agent"
  },
  "tracking": {
    "utm_source": "facebook",
    "utm_campaign": "kitchen_remodel_chicago",
    "landing_page": "https://example.vercel.app/?utm_source=facebook"
  }
}
\`\`\`

Recommended GHL / CRM custom fields:

| CRM field | Payload key |
| --- | --- |
| Contact name | \`full_name\` |
| Phone | \`phone\` |
| Email | \`email\` |
| Address | \`street_address\`, \`city\`, \`state\`, \`zip\` |
| Project type | \`project_type\` or \`answer_labels.project_type\` |
| Project scope | \`project_scope\` |
| Budget | \`budget_range\` |
| Start timeline | \`timeline\` |
| Project details | \`notes\` |
| Source | \`source\` and \`tracking.utm_source\` |
| Unique dedupe reference | \`lead_id\` (or match normalized phone/email) |
| Estimate/job pipeline stage | New Lead / Estimate Requested |
| Project SMS permission | \`sms_project_updates_opt_in\` |
| Marketing SMS permission | \`sms_marketing_opt_in\` |
| Consent evidence | \`consent\` |

Suggested lead follow-up: Create/merge the contact, create an opportunity in New Lead or Estimate Requested, notify Carroll internally of every submission, then contact based on actual permission. Prioritize urgent and near-term inquiries. Do not auto-book an estimate without checking schedules. Do not treat marketing permission as project permission or vice versa.

## SMS consent safeguards

There are **two separate optional checkboxes**, both blank on first load:

1. Project updates, scheduling, estimate communications via SMS.
2. Marketing/promotional SMS, potentially automated.

Both capture disclosure text, server timestamp, the landing page, IP, and user agent; the server also records the boolean separately. Consent is not required for lead submission or purchase. If one box is unchecked, no SMS workflow of that type may trigger. For either type, implement STOP opt-out, HELP response, sending-hour rules, suppression and opt-out sync in the actual SMS/CRM provider. **This repository does not send text messages.**

Existing business legal links:
- Privacy: https://carrollconstructco.net/privacy-policy
- SMS Terms: https://carrollconstructco.net/terms

A legal/compliance owner should verify the current legal language, message classification, service provider disclosures, opt-out procedures and carrier-registration requirements before ads or texting. This implementation supports, but does not itself certify, compliance.

## Required deployment configuration

1. Create or connect a Vercel project to \`ignite-company/carroll-funnel\`, root \`/\`, framework **Other / no framework**, production branch \`main\`.
2. Under Vercel Settings → Environment Variables, add **\`LEAD_WEBHOOK_URL\`** as a sensitive/encrypted variable for production and preview. It must be a real **HTTPS** webhook owned by Carroll's CRM/workflow, e.g. a new GHL inbound webhook or your custom ingestion service. Do not reuse another client's webhook. Never put this value in frontend code or GitHub.
3. Optional: set \`LEAD_WEBHOOK_SECRET\` if your receiving endpoint validates \`X-Lead-Webhook-Secret\`. A normal GHL webhook typically authenticates through its unique URL.
4. Redeploy after setting env vars, then test an actual form submission. Observe the CRM and verify data and consent values arrived.
5. Only after verification, connect Meta ads, Google Ads and analytics events. Preserve the querystring UTMs and \`fbclid\`/\`gclid\`.

**Failure behavior**: Missing webhook returns 503; webhook failure returns 502. In both cases, the UI keeps the visitor on the contact form with an explicit error and phone number. It never shows a false success screen.

## Test before publishing

- Desktop and phone widths; sticky content; no horizontal overflow.
- Each answer advances, back works, contact data remains when navigating back.
- Four answer keys reach the webhook with readable labels.
- Valid Chicago address/ZIP, normalized phone, required email.
- All four SMS states: neither; only project; only marketing; both.
- Verify **unchecked checkboxes remain false** in the CRM.
- Confirm that opting out with STOP stops future text messages in the actual provider.
- Submit with \`utm_source=facebook&utm_campaign=remodeling\` and check stored tracking.
- Failure with webhook unset, then successful delivery to a Carroll-owned webhook.
- Check that no paid ads point to the funnel before the webhook works.

## Files

- \`index.html\` – SEO metadata, header, hero, form markup, trust strip, portfolio section.
- \`styles.css\` – responsive visual design, accessibility and animation preferences.
- \`app.js\` – question selection, previous-step navigation, validation, consent collection, API submission.
- \`api/lead.js\` – server-side lead validation and secure webhook delivery.

Company references:
- Current visual-reference website: https://carrollconstruction.org/
- Logo and project photographs originate from Carroll Construction's published assets.
- Phone: (773) 603-6029.
