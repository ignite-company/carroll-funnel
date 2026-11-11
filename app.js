/* Carroll Construction LLC estimate funnel | 4 questions + contact details */
(() => {
  "use strict";
  const questions = [
    {
      key: "project_type",
      badge: "01 / YOUR PROJECT",
      heading: "What can we help you build?",
      intro: "Select the project that best matches what you have in mind.",
      options: [
        ["kitchen_remodel", "Kitchen remodeling"],
        ["bathroom_remodel", "Bathroom remodeling"],
        ["basement_finishing", "Basement finishing"],
        ["addition_or_renovation", "Home addition or major renovation"],
        ["electrical_or_ev", "Electrical upgrade or EV charger"],
        ["other", "Something else"]
      ]
    },
    {
      key: "project_scope",
      badge: "02 / THE DETAILS",
      heading: "How extensive is your project?",
      intro: "This helps us understand the level of work you're considering.",
      options: [
        ["full_transformation", "A complete transformation"],
        ["partial_upgrade", "A partial remodel or upgrade"],
        ["repair_installation", "A specific repair or installation"],
        ["need_guidance", "Not sure yet, I need expert guidance"]
      ]
    },
    {
      key: "budget_range",
      badge: "03 / YOUR INVESTMENT",
      heading: "What budget are you considering?",
      intro: "An estimate is tailored to your goals. A general range is all we need.",
      options: [
        ["under_5k", "Under $5,000"],
        ["5k_15k", "$5,000 – $15,000"],
        ["15k_30k", "$15,000 – $30,000"],
        ["30k_60k", "$30,000 – $60,000"],
        ["60k_plus", "$60,000+"],
        ["unsure", "Not sure yet"]
      ]
    },
    {
      key: "timeline",
      badge: "04 / PROJECT TIMELINE",
      heading: "When would you like to get started?",
      intro: "We’ll use this to prioritize the right next step for you.",
      options: [
        ["asap_30_days", "As soon as possible / within 30 days"],
        ["1_3_months", "Within 1–3 months"],
        ["3_6_months", "Within 3–6 months"],
        ["6_plus_months", "More than 6 months away"],
        ["exploring", "Just exploring my options"]
      ]
    }
  ];

  const answers = {};
  let step = 0;
  let submitting = false;
  const initiatedAt = new Date().toISOString();
  const byId = (id) => document.getElementById(id);
  const content = byId("step-content");
  const optionsNode = byId("options");
  const contactForm = byId("contact-form");
  const backButton = byId("back-button");
  const stepLabel = byId("step-label");
  const stepPercent = byId("step-percent");
  const progressTrack = byId("progress-track");
  const progressFill = byId("progress-fill");
  const navHint = byId("nav-hint");
  const wizard = byId("wizard");
  const success = byId("success-state");
  const errorNode = byId("form-error");
  const submitButton = byId("submit-button");

  byId("year").textContent = new Date().getFullYear();

  const escapeHtml = (input) => String(input).replace(/[&<>"']/g, (ch) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]
  );

  function render() {
    const onContact = step === questions.length;
    const percent = step * 20;
    stepLabel.textContent = onContact ? "FINAL STEP / YOUR DETAILS" : "QUESTION " + String(step + 1).padStart(2, "0") + " OF 04";
    stepPercent.textContent = percent + "% COMPLETE";
    progressFill.style.width = percent + "%";
    progressTrack.setAttribute("aria-valuenow", String(percent));
    content.hidden = onContact;
    contactForm.hidden = !onContact;
    backButton.hidden = step === 0;
    navHint.textContent = onContact ? "Almost there" : "Takes less than a minute";

    if (!onContact) {
      const q = questions[step];
      const accentBreak = q.heading.lastIndexOf(" ");
      const title = escapeHtml(q.heading.slice(0, accentBreak)) + ' <span class="accent-text">' + escapeHtml(q.heading.slice(accentBreak + 1)) + "</span>";
      content.innerHTML = '<div class="question-badge">' + escapeHtml(q.badge) + '</div>' +
        '<h2 id="question-title" tabindex="-1">' + title + '</h2>' +
        '<p class="step-description">' + escapeHtml(q.intro) + '</p>' +
        '<div id="options" class="option-list" role="group" aria-labelledby="question-title"></div>';
      const holder = byId("options");
      q.options.forEach(([value, label], index) => {
        const button = document.createElement("button");
        button.className = "option";
        button.type = "button";
        button.setAttribute("aria-label", label);
        button.innerHTML = '<span class="option-number">' + String(index + 1).padStart(2, "0") + '</span><span class="option-label">' + escapeHtml(label) + '</span><span class="option-arrow" aria-hidden="true">↗</span>';
        button.addEventListener("click", () => {
          answers[q.key] = { value, label };
          step = Math.min(step + 1, questions.length);
          render();
          if (window.innerWidth < 920) byId("estimate").scrollIntoView({ behavior: "smooth", block: "start" });
          const target = step === questions.length ? byId("fullName") : byId("question-title");
          if (target) target.focus({ preventScroll: true });
        });
        holder.appendChild(button);
      });
    }
  }

  backButton.addEventListener("click", () => {
    if (submitting) return;
    step = Math.max(0, step - 1);
    render();
    if (window.innerWidth < 920) byId("estimate").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  function getTracking() {
    const params = new URLSearchParams(window.location.search);
    const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid"];
    const tracking = {};
    keys.forEach((key) => {
      const value = params.get(key);
      if (value) tracking[key] = value.slice(0, 200);
    });
    return tracking;
  }

  function validate() {
    errorNode.hidden = true;
    const required = ["fullName", "phone", "email", "address", "city", "state", "zip"];
    for (const id of required) {
      const input = byId(id);
      input.setAttribute("aria-invalid", "false");
      if (!input.value.trim()) {
        input.setAttribute("aria-invalid", "true");
        input.focus();
        return "Please complete all required contact and project address fields.";
      }
    }
    const phone = byId("phone").value.replace(/\D/g, "");
    if (!(phone.length === 10 || (phone.length === 11 && phone.startsWith("1")))) {
      byId("phone").focus();
      return "Enter a valid 10-digit US phone number.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(byId("email").value.trim())) {
      byId("email").focus();
      return "Enter a valid email address.";
    }
    if (!/^\d{5}(-\d{4})?$/.test(byId("zip").value.trim())) {
      byId("zip").focus();
      return "Enter a valid US ZIP code.";
    }
    if (questions.some((q) => !answers[q.key])) return "Please complete all four project questions.";
    return "";
  }

  function showError(message) {
    errorNode.textContent = message;
    errorNode.hidden = false;
    errorNode.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submitting) return;
    const error = validate();
    if (error) { showError(error); return; }
    submitting = true;
    errorNode.hidden = true;
    submitButton.disabled = true;
    submitButton.innerHTML = 'Sending your request… <span aria-hidden="true">↗</span>';
    const answerValues = {};
    const answerLabels = {};
    questions.forEach((q) => {
      answerValues[q.key] = answers[q.key].value;
      answerLabels[q.key] = answers[q.key].label;
    });
    const payload = {
      ...answerValues,
      answer_labels: answerLabels,
      contact: {
        full_name: byId("fullName").value.trim(),
        phone: byId("phone").value.trim(),
        email: byId("email").value.trim(),
        street_address: byId("address").value.trim(),
        city: byId("city").value.trim(),
        state: byId("state").value,
        zip: byId("zip").value.trim(),
        notes: byId("notes").value.trim()
      },
      consent: {
        sms_project_updates: byId("smsUpdates").checked,
        sms_marketing: byId("smsMarketing").checked,
        consent_copy_version: "carroll-sms-v1-2026-11-11",
        consent_timestamp: new Date().toISOString(),
        sms_project_updates_text: "I agree to receive SMS messages from Carroll Construction LLC regarding my estimate request, appointment scheduling, and project updates at the phone number provided. Message frequency varies. Message and data rates may apply. Reply STOP to opt out or HELP for help.",
        sms_marketing_text: "I agree to receive promotional and marketing SMS messages from Carroll Construction LLC, including offers and service updates, at the phone number provided. Messages may be sent using automated technology. Message frequency varies. Message and data rates may apply. Reply STOP to opt out or HELP for help. Consent is not a condition of purchase."
      },
      tracking: {
        ...getTracking(),
        landing_page: window.location.href.slice(0, 1500),
        referrer: document.referrer.slice(0, 1000),
        form_started_at: initiatedAt
      },
      website: byId("companyWebsite").value
    };
    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success !== true) throw new Error(data.error || "Your request could not be sent right now.");
      wizard.hidden = true;
      success.hidden = false;
      success.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (_error) {
      showError("We couldn’t submit your request right now. Please try again or call (773) 603-6029 for assistance.");
    } finally {
      submitting = false;
      submitButton.disabled = false;
      submitButton.innerHTML = 'Request my free estimate <span>↗</span>';
    }
  });
  render();
})();