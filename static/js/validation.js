/**
 * validation.js
 * =============
 * Client-side form validation and UX enhancements
 * for the Placement Prediction System prediction form.
 *
 * Features:
 * - Real-time field validation with visual feedback
 * - Animated range input feedback
 * - Loading overlay on form submission
 * - Step progress indicator animation
 * - Input formatting and constraints
 * - Accessible error messaging
 *
 * @version 1.0.0
 */

"use strict";

/* ─────────────────────────────────────────────────────────────
   CONFIGURATION
   ───────────────────────────────────────────────────────────── */

const VALIDATION_CONFIG = {
  ssc_p: { min: 0, max: 100, label: "SSC Percentage" },
  hsc_p: { min: 0, max: 100, label: "HSC Percentage" },
  degree_p: { min: 0, max: 100, label: "Degree Percentage" },
  etest_p: { min: 0, max: 100, label: "Employability Test %" },
  mba_p: { min: 0, max: 100, label: "MBA Percentage" }
};

const REQUIRED_SELECTS = [
  "gender", "ssc_b", "hsc_b", "hsc_s",
  "degree_t", "workex", "specialisation"
];

const STEP_FIELDS = {
  1: ["gender", "ssc_p", "ssc_b"],
  2: ["hsc_p", "hsc_b", "hsc_s"],
  3: ["degree_p", "degree_t", "workex"],
  4: ["etest_p", "mba_p", "specialisation"]
};

/* ─────────────────────────────────────────────────────────────
   INITIALIZATION
   ───────────────────────────────────────────────────────────── */

document.addEventListener("DOMContentLoaded", function () {
  initNavbarScroll();
  initFormValidation();
  initRangeInputs();
  initLoadingOverlay();
  initStepNavigation();
  initFlashAutoClose();
  initAnimations();
  initTooltips();
});

/* ─────────────────────────────────────────────────────────────
   NAVBAR SCROLL EFFECT
   ───────────────────────────────────────────────────────────── */

function initNavbarScroll() {
  const navbar = document.querySelector(".navbar-custom");
  if (!navbar) return;

  const onScroll = () => {
    if (window.scrollY > 20) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll(); // Run on load
}

/* ─────────────────────────────────────────────────────────────
   FORM VALIDATION
   ───────────────────────────────────────────────────────────── */

function initFormValidation() {
  const form = document.getElementById("predictionForm");
  if (!form) return;

  // Attach real-time validation to numeric inputs
  Object.keys(VALIDATION_CONFIG).forEach((fieldName) => {
    const field = form.querySelector(`[name="${fieldName}"]`);
    if (!field) return;

    field.addEventListener("input", () => validateNumericField(field, fieldName));
    field.addEventListener("blur", () => validateNumericField(field, fieldName));
    field.addEventListener("change", () => validateNumericField(field, fieldName));
  });

  // Attach validation to selects
  REQUIRED_SELECTS.forEach((fieldName) => {
    const field = form.querySelector(`[name="${fieldName}"]`);
    if (!field) return;

    field.addEventListener("change", () => validateSelectField(field, fieldName));
  });

  // Form submit handler
  form.addEventListener("submit", function (e) {
    if (!validateAllFields(form)) {
      e.preventDefault();
      scrollToFirstError(form);
      showSubmitError();
      return false;
    }
    showLoadingOverlay("Analyzing your profile with AI...");
  });
}

/**
 * Validate a numeric input field.
 * @param {HTMLElement} field - The input element
 * @param {string} fieldName - The field name key in VALIDATION_CONFIG
 * @returns {boolean} Is the field valid?
 */
function validateNumericField(field, fieldName) {
  const config = VALIDATION_CONFIG[fieldName];
  if (!config) return true;

  const rawValue = field.value.trim();
  const wrapper = field.closest(".field-wrapper") || field.parentElement;

  clearFieldState(field, wrapper);

  if (rawValue === "") {
    setFieldError(field, wrapper, `${config.label} is required.`);
    return false;
  }

  const value = parseFloat(rawValue);
  if (isNaN(value)) {
    setFieldError(field, wrapper, `${config.label} must be a valid number.`);
    return false;
  }

  if (value < config.min || value > config.max) {
    setFieldError(
      field, wrapper,
      `${config.label} must be between ${config.min} and ${config.max}.`
    );
    return false;
  }

  setFieldSuccess(field, wrapper);
  updateScoreIndicator(fieldName, value);
  return true;
}

/**
 * Validate a select dropdown field.
 * @param {HTMLElement} field
 * @param {string} fieldName
 * @returns {boolean}
 */
function validateSelectField(field, fieldName) {
  const wrapper = field.closest(".field-wrapper") || field.parentElement;
  clearFieldState(field, wrapper);

  if (!field.value || field.value === "") {
    const label = field.options[0]?.text || fieldName;
    setFieldError(field, wrapper, `Please select a valid ${label}.`);
    return false;
  }

  setFieldSuccess(field, wrapper);
  return true;
}

/**
 * Validate all form fields.
 * @param {HTMLFormElement} form
 * @returns {boolean}
 */
function validateAllFields(form) {
  let isValid = true;

  Object.keys(VALIDATION_CONFIG).forEach((fieldName) => {
    const field = form.querySelector(`[name="${fieldName}"]`);
    if (field && !validateNumericField(field, fieldName)) {
      isValid = false;
    }
  });

  REQUIRED_SELECTS.forEach((fieldName) => {
    const field = form.querySelector(`[name="${fieldName}"]`);
    if (field && !validateSelectField(field, fieldName)) {
      isValid = false;
    }
  });

  return isValid;
}

/* ─────────────────────────────────────────────────────────────
   FIELD STATE HELPERS
   ───────────────────────────────────────────────────────────── */

function clearFieldState(field, wrapper) {
  field.classList.remove("is-valid-custom", "is-invalid-custom");
  const existingFeedback = wrapper?.querySelector(".field-feedback");
  if (existingFeedback) existingFeedback.remove();
}

function setFieldError(field, wrapper, message) {
  field.classList.add("is-invalid-custom");
  field.classList.remove("is-valid-custom");
  field.style.borderColor = "var(--secondary)";
  field.style.boxShadow = "0 0 0 3px rgba(247,37,133,0.15)";

  if (wrapper) {
    const feedback = document.createElement("div");
    feedback.className = "field-feedback text-danger-custom mt-1";
    feedback.style.cssText = `
      font-size: 0.78rem;
      color: #ff6baf;
      display: flex;
      align-items: center;
      gap: 4px;
      animation: fadeIn 0.2s ease;
    `;
    feedback.innerHTML = `<i class="bi bi-exclamation-circle-fill"></i> ${message}`;

    const existingFeedback = wrapper.querySelector(".field-feedback");
    if (existingFeedback) existingFeedback.remove();
    wrapper.appendChild(feedback);
  }
}

function setFieldSuccess(field, wrapper) {
  field.classList.remove("is-invalid-custom");
  field.classList.add("is-valid-custom");
  field.style.borderColor = "var(--accent-green)";
  field.style.boxShadow = "0 0 0 3px rgba(6,214,160,0.12)";

  if (wrapper) {
    const existingFeedback = wrapper.querySelector(".field-feedback");
    if (existingFeedback) existingFeedback.remove();
  }
}

function scrollToFirstError(form) {
  const firstError = form.querySelector(".is-invalid-custom");
  if (firstError) {
    firstError.scrollIntoView({ behavior: "smooth", block: "center" });
    firstError.focus();
  }
}

function showSubmitError() {
  const alertEl = document.getElementById("formSubmitAlert");
  if (alertEl) {
    alertEl.style.display = "flex";
    alertEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    setTimeout(() => {
      alertEl.style.display = "none";
    }, 5000);
  }
}

/* ─────────────────────────────────────────────────────────────
   SCORE INDICATOR UPDATES
   ───────────────────────────────────────────────────────────── */

function updateScoreIndicator(fieldName, value) {
  const indicator = document.getElementById(`score-indicator-${fieldName}`);
  if (!indicator) return;

  const bar = indicator.querySelector(".score-bar");
  const label = indicator.querySelector(".score-label");
  const category = indicator.querySelector(".score-category");

  if (bar) {
    bar.style.width = `${value}%`;
    bar.style.background = getScoreColor(value);
  }

  if (label) label.textContent = `${value.toFixed(1)}%`;

  if (category) {
    const cat = getScoreCategory(value);
    category.textContent = cat.label;
    category.style.color = cat.color;
  }
}

function getScoreColor(value) {
  if (value >= 75) return "var(--gradient-success)";
  if (value >= 60) return "var(--gradient-primary)";
  if (value >= 45) return "linear-gradient(135deg, #ffd166, #ef476f)";
  return "linear-gradient(135deg, #f72585, #7209b7)";
}

function getScoreCategory(value) {
  if (value >= 80) return { label: "Excellent", color: "var(--accent-green)" };
  if (value >= 65) return { label: "Good", color: "var(--primary-light)" };
  if (value >= 50) return { label: "Average", color: "var(--accent-yellow)" };
  if (value >= 35) return { label: "Below Avg", color: "#ef476f" };
  return { label: "Needs Work", color: "var(--secondary)" };
}

/* ─────────────────────────────────────────────────────────────
   RANGE INPUT STYLING
   ───────────────────────────────────────────────────────────── */

function initRangeInputs() {
  const rangeInputs = document.querySelectorAll('input[type="range"]');
  rangeInputs.forEach((input) => {
    updateRangeBackground(input);
    input.addEventListener("input", () => {
      updateRangeBackground(input);
      const output = document.getElementById(`${input.id}-value`);
      if (output) output.textContent = `${parseFloat(input.value).toFixed(1)}%`;
    });
  });
}

function updateRangeBackground(input) {
  const min = parseFloat(input.min) || 0;
  const max = parseFloat(input.max) || 100;
  const val = parseFloat(input.value) || 0;
  const percent = ((val - min) / (max - min)) * 100;
  input.style.background = `linear-gradient(to right, var(--primary) 0%, var(--primary-light) ${percent}%, var(--bg-elevated) ${percent}%)`;
}

/* ─────────────────────────────────────────────────────────────
   LOADING OVERLAY
   ───────────────────────────────────────────────────────────── */

function initLoadingOverlay() {
  // Ensure overlay exists in DOM
  if (!document.getElementById("loadingOverlay")) {
    const overlay = document.createElement("div");
    overlay.id = "loadingOverlay";
    overlay.className = "loading-overlay";
    overlay.innerHTML = `
      <div class="loading-ring"></div>
      <p class="loading-text" id="loadingText">Processing...</p>
    `;
    document.body.appendChild(overlay);
  }
}

function showLoadingOverlay(message = "Processing...") {
  const overlay = document.getElementById("loadingOverlay");
  const text = document.getElementById("loadingText");
  if (overlay) {
    if (text) text.textContent = message;
    overlay.classList.add("active");
  }
}

function hideLoadingOverlay() {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) overlay.classList.remove("active");
}

/* ─────────────────────────────────────────────────────────────
   STEP NAVIGATION
   ───────────────────────────────────────────────────────────── */

let currentStep = 1;
const totalSteps = 4;

function initStepNavigation() {
  updateStepUI();

  const nextBtns = document.querySelectorAll("[data-step-next]");
  const prevBtns = document.querySelectorAll("[data-step-prev]");

  nextBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (validateCurrentStep()) {
        if (currentStep < totalSteps) {
          goToStep(currentStep + 1);
        }
      }
    });
  });

  prevBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (currentStep > 1) {
        goToStep(currentStep - 1);
      }
    });
  });
}

function goToStep(step) {
  const currentPanel = document.getElementById(`formStep${currentStep}`);
  const nextPanel = document.getElementById(`formStep${step}`);

  if (currentPanel) {
    currentPanel.style.animation = "fadeOut 0.25s ease forwards";
    setTimeout(() => {
      currentPanel.style.display = "none";
      if (nextPanel) {
        nextPanel.style.display = "block";
        nextPanel.style.animation = "fadeInUp 0.3s ease forwards";
      }
    }, 200);
  } else if (nextPanel) {
    nextPanel.style.display = "block";
    nextPanel.style.animation = "fadeInUp 0.3s ease forwards";
  }

  currentStep = step;
  updateStepUI();

  // Scroll to top of form
  const formCard = document.querySelector(".predict-form-card");
  if (formCard) formCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

function validateCurrentStep() {
  const form = document.getElementById("predictionForm");
  if (!form) return true;

  const fields = STEP_FIELDS[currentStep] || [];
  let isValid = true;

  fields.forEach((fieldName) => {
    const field = form.querySelector(`[name="${fieldName}"]`);
    if (!field) return;

    if (field.tagName === "SELECT") {
      if (!validateSelectField(field, fieldName)) isValid = false;
    } else if (field.type === "number" || field.type === "text") {
      if (VALIDATION_CONFIG[fieldName] && !validateNumericField(field, fieldName)) {
        isValid = false;
      }
    }
  });

  return isValid;
}

function updateStepUI() {
  // Update step circles
  for (let i = 1; i <= totalSteps; i++) {
    const stepEl = document.getElementById(`step-indicator-${i}`);
    if (!stepEl) continue;

    const circle = stepEl.querySelector(".step-circle");
    const label = stepEl.querySelector(".step-label");

    if (i < currentStep) {
      stepEl.className = "step-item completed";
      if (circle) circle.innerHTML = '<i class="bi bi-check-lg"></i>';
    } else if (i === currentStep) {
      stepEl.className = "step-item active";
      if (circle) circle.textContent = i;
    } else {
      stepEl.className = "step-item";
      if (circle) circle.textContent = i;
    }
  }

  // Update navigation buttons
  const prevBtn = document.querySelector("[data-step-prev]");
  const nextBtn = document.querySelector("[data-step-next]");
  const submitBtn = document.querySelector("[data-step-submit]");

  if (prevBtn) prevBtn.style.display = currentStep === 1 ? "none" : "inline-flex";
  if (nextBtn) nextBtn.style.display = currentStep === totalSteps ? "none" : "inline-flex";
  if (submitBtn) submitBtn.style.display = currentStep === totalSteps ? "inline-flex" : "none";

  // Update progress
  const progressBar = document.getElementById("formProgress");
  if (progressBar) {
    const pct = ((currentStep - 1) / (totalSteps - 1)) * 100;
    progressBar.style.width = `${pct}%`;
  }
}

/* ─────────────────────────────────────────────────────────────
   FLASH AUTO-CLOSE
   ───────────────────────────────────────────────────────────── */

function initFlashAutoClose() {
  const flashMessages = document.querySelectorAll(".flash-alert");
  flashMessages.forEach((flash) => {
    const closeBtn = flash.querySelector(".btn-close-flash");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        flash.style.animation = "fadeOut 0.3s ease forwards";
        setTimeout(() => flash.remove(), 300);
      });
    }

    // Auto close after 6 seconds
    setTimeout(() => {
      if (document.body.contains(flash)) {
        flash.style.animation = "fadeOut 0.5s ease forwards";
        setTimeout(() => flash.remove(), 500);
      }
    }, 6000);
  });
}

/* ─────────────────────────────────────────────────────────────
   SCROLL ANIMATIONS
   ───────────────────────────────────────────────────────────── */

function initAnimations() {
  // Animate counters on landing page
  const counters = document.querySelectorAll("[data-count-up]");
  if (counters.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    counters.forEach((el) => observer.observe(el));
  }

  // Animate fade-up elements
  const fadeElements = document.querySelectorAll(".reveal-on-scroll");
  if (fadeElements.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-fade-up");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    fadeElements.forEach((el) => observer.observe(el));
  }
}

function animateCounter(el) {
  const target = parseFloat(el.getAttribute("data-count-up")) || 0;
  const duration = parseInt(el.getAttribute("data-duration")) || 1500;
  const suffix = el.getAttribute("data-suffix") || "";
  const decimals = (target % 1 !== 0) ? 1 : 0;

  let start = 0;
  const step = target / (duration / 16);
  const startTime = performance.now();

  const update = (timestamp) => {
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = target * eased;

    el.textContent = current.toFixed(decimals) + suffix;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = target.toFixed(decimals) + suffix;
    }
  };

  requestAnimationFrame(update);
}

/* ─────────────────────────────────────────────────────────────
   BOOTSTRAP TOOLTIPS
   ───────────────────────────────────────────────────────────── */

function initTooltips() {
  if (typeof bootstrap !== "undefined" && bootstrap.Tooltip) {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipTriggerList.forEach((el) => {
      new bootstrap.Tooltip(el, {
        placement: "top",
        trigger: "hover"
      });
    });
  }
}

/* ─────────────────────────────────────────────────────────────
   NUMERIC INPUT CONSTRAINTS
   ───────────────────────────────────────────────────────────── */

document.addEventListener("DOMContentLoaded", function () {
  // Prevent values outside 0-100 range on blur
  const percentageInputs = document.querySelectorAll(
    'input[name="ssc_p"], input[name="hsc_p"], input[name="degree_p"], ' +
    'input[name="etest_p"], input[name="mba_p"]'
  );

  percentageInputs.forEach((input) => {
    input.addEventListener("blur", function () {
      const val = parseFloat(this.value);
      if (!isNaN(val)) {
        if (val < 0) this.value = "0";
        if (val > 100) this.value = "100";
      }
    });

    // Allow only numeric and decimal input
    input.addEventListener("keypress", function (e) {
      const char = String.fromCharCode(e.which);
      if (!/[\d.]/.test(char) && !e.ctrlKey) {
        e.preventDefault();
      }
      // Prevent multiple decimal points
      if (char === "." && this.value.includes(".")) {
        e.preventDefault();
      }
    });
  });
});

/* ─────────────────────────────────────────────────────────────
   COPY RESULT (RESULT PAGE)
   ───────────────────────────────────────────────────────────── */

function copyResultToClipboard() {
  const resultCard = document.querySelector(".result-text-copy");
  if (!resultCard) return;

  const text = resultCard.innerText;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById("copyBtn");
    if (btn) {
      const originalContent = btn.innerHTML;
      btn.innerHTML = '<i class="bi bi-check-lg"></i> Copied!';
      btn.style.color = "var(--accent-green)";
      setTimeout(() => {
        btn.innerHTML = originalContent;
        btn.style.color = "";
      }, 2000);
    }
  });
}

/* ─────────────────────────────────────────────────────────────
   CSS KEYFRAME (added dynamically for fadeOut)
   ───────────────────────────────────────────────────────────── */

(function injectKeyframes() {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes fadeOut {
      from { opacity: 1; transform: translateY(0); }
      to   { opacity: 0; transform: translateY(-8px); }
    }
  `;
  document.head.appendChild(style);
})();

/* ─────────────────────────────────────────────────────────────
   PREDICT FORM AUTO-FILL (Demo Mode)
   ───────────────────────────────────────────────────────────── */

function fillDemoData() {
  const demoData = {
    gender: "M",
    ssc_p: "75.5",
    ssc_b: "Others",
    hsc_p: "68.0",
    hsc_b: "Others",
    hsc_s: "Science",
    degree_p: "72.0",
    degree_t: "Sci&Tech",
    workex: "No",
    etest_p: "65.0",
    mba_p: "62.5",
    specialisation: "Mkt&HR"
  };

  const form = document.getElementById("predictionForm");
  if (!form) return;

  Object.entries(demoData).forEach(([key, value]) => {
    const field = form.querySelector(`[name="${key}"]`);
    if (!field) return;
    field.value = value;

    // Trigger validation feedback
    if (VALIDATION_CONFIG[key]) {
      validateNumericField(field, key);
    } else if (REQUIRED_SELECTS.includes(key)) {
      validateSelectField(field, key);
    }
  });

  // Show all steps for demo
  for (let i = 1; i <= totalSteps; i++) {
    const panel = document.getElementById(`formStep${i}`);
    if (panel) panel.style.display = "block";
  }

  // Pulse the submit button
  const submitBtn = document.querySelector("[data-step-submit]");
  if (submitBtn) {
    submitBtn.style.animation = "pulse 0.5s ease 2";
  }
}

// Expose globally for onclick handlers
window.copyResultToClipboard = copyResultToClipboard;
window.fillDemoData = fillDemoData;
window.showLoadingOverlay = showLoadingOverlay;
window.hideLoadingOverlay = hideLoadingOverlay;
