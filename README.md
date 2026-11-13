# Carroll Construction LLC | Free Estimate Funnel

Production-oriented, mobile-first, four-question funnel for Carroll Construction LLC in Chicagoland. Built by Ignite Co. to reflect the supplied Carroll branding. This repository started empty; the funnel is a lightweight static site with a Vercel serverless lead handler and no frontend framework.

**Status:** The server-side endpoint now forwards estimate requests to the user-provided n8n **test** listener at https://ignite.grunagency.com/webhook-test/carroll-lead. **Do not run paid traffic using this test endpoint.** n8n test listeners typically accept a single submission while a workflow is listening. For permanent lead intake, switch to the active production webhook and verify end-to-end delivery. Failed webhook responses do not show false success.

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

Browser posts to POST /api/lead. The server validates all four qualifying answers and contact fields, normalizes US phone numbers, records separate SMS permissions and consent evidence, assigns a UUID, and sends the full lead JSON to the configured Carroll n8n test listener. This endpoint is called server-side, not directly from a visitor's browser.

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

1. This Vercel project deploys from ignite-company/carroll-funnel on main.
2. Current server-side destination: https://ignite.grunagency.com/webhook-test/carroll-lead (n8n test listener).
3. **Before real ad traffic, activate the n8n workflow and change the server-side destination to its production /webhook/ URL.** Test-mode /webhook-test/ listeners are short-lived and can accept only one submission per listening session.
4. Confirm n8n receives all four answers, full name, phone, email, street address, city, state, ZIP, optional notes, ad tracking and separate project/marketing SMS consent flags.
5. Configure downstream CRM creation and opt-out enforcement. Only text contacts for purposes they opted into.
6. Run an end-to-end lead test to confirm receipt and CRM persistence before using the URL in campaigns.

**Failure behavior**: If the n8n test webhook is not waiting, n8n may reject the request; the API returns an error and the form asks the visitor to retry or call. It does not falsely claim success.

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
