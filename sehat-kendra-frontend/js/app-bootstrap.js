// ============================================================
// SEHAT KENDRA — APP BOOTSTRAP / LOADER
// ============================================================
// This file exists because the app used to be one big index.html and
// one big script.js. Both have now been split into many small,
// feature-named files (see /partials and /js). Browsers can't
// navigate between dozens of real, separate pages and keep this kind
// of single-page app working, so this loader:
//
//   1. Fetches every HTML partial (utility bar, header, and every
//      screen) and stitches them back into the page, in the same
//      order they originally appeared in index.html.
//   2. Loads every split JS file, IN THE SAME ORDER as the original
//      script.js, so behaviour (including which duplicate function
//      definition "wins") stays identical to before the split.
//   3. Re-runs the two init routines that used to fire on
//      DOMContentLoaded (default language selection + saved theme),
//      since that event has already fired on this mostly-empty shell
//      document by the time the real screens exist.
//
// NOTE: because this loader uses fetch() to read local files, the app
// must be served over HTTP (e.g. `python3 -m http.server`), not opened
// directly as a file:// URL — browsers block fetch() of local files
// for security reasons. See README.md.
// ============================================================

(function () {

  // ---- 1. Screen / shell partials, in original document order ----
  const PARTIALS = [
    "partials/shell/utility-bar.html",
    "partials/shell/app-header.html",
    "partials/landing/landing.html",
    "partials/onboarding/language-select.html",
    "partials/onboarding/role-select.html",
    "partials/auth/auth-method-select.html",
    "partials/auth/abha-login.html",
    "partials/auth/abha-otp.html",
    "partials/auth/aadhaar-login.html",
    "partials/auth/aadhaar-otp.html",
    "partials/auth/mobile-login.html",
    "partials/auth/mobile-otp.html",
    "partials/registration/patient-registration.html",
    "partials/questionnaire/health-questionnaire.html",
    "partials/dashboard/patient-dashboard.html",
    "partials/booking/booking-1-pathway.html",
    "partials/booking/booking-2-doctor-general.html",
    "partials/booking/booking-2-doctor-ayurveda.html",
    "partials/booking/booking-3-mode-slot.html",
    "partials/booking/booking-4-consent.html",
    "partials/booking/booking-5-confirmation.html",
    "partials/ayush/ayush-wellness.html",
    "partials/profile/health-profile.html",
    "partials/prescription/prescription-center.html",
    "partials/prescription/prescription-view.html",
    "partials/doctor-portal/doctor-entry.html",
    "partials/doctor-portal/doctor-modules.html",
    "partials/doctor-portal/doctor-placeholder.html"
  ];

  // ---- 2. Feature JS files, in the exact original script.js order ----
  const SCRIPTS = [
    "js/core/state.js",
    "js/core/navigation.js",
    "js/shell/utility-bar-controls.js",
    "js/auth/quick-login.js",
    "js/registration/patient-registration.js",
    "js/auth/otp-shared-utils.js",
    "js/booking/select-pathway-doctor-slot.js",
    "js/booking/consent-confirm.js",
    "js/auth/aadhaar-otp-legacy.js",
    "js/auth/abha-login.js",
    "js/auth/aadhaar-login.js",
    "js/auth/mobile-otp.js",
    "js/ayush/ayush-wellness.js",
    "js/language/language-select.js",
    "js/prescription/prescription-center-core.js",
    "js/prescription/prescription-load.js",
    "js/prescription/prescription-view.js",
    "js/prescription/prescription-voice-recognition.js",
    "js/prescription/prescription-voice-draft.js",
    "js/prescription/prescription-upload-final.js",
    "js/theme/theme-toggle.js",
    "js/accessibility/text-to-speech.js"
  ];

  async function fetchText(path) {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load ${path} (HTTP ${response.status})`);
    }
    return response.text();
  }

  async function loadPartials() {
    const shellMount = document.getElementById("shellMount");
    const appMount = document.getElementById("app");

    // The first two partials (utility bar + app header) go above <main>.
    const shellPaths = PARTIALS.slice(0, 2);
    const screenPaths = PARTIALS.slice(2);

    const shellHtml = await Promise.all(shellPaths.map(fetchText));
    shellMount.innerHTML = shellHtml.join("\n");

    const screenHtml = await Promise.all(screenPaths.map(fetchText));
    appMount.innerHTML = screenHtml.join("\n");
  }

  function loadScript(path) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = path;
      script.async = false; // preserve execution order
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load ${path}`));
      document.body.appendChild(script);
    });
  }

  async function loadScriptsInOrder() {
    for (const path of SCRIPTS) {
      await loadScript(path);
    }
  }

  async function init() {
    try {
      await loadPartials();
      await loadScriptsInOrder();

      // Re-run the routines that originally lived behind
      // DOMContentLoaded listeners inside the monolithic script.js.
      if (typeof initFontSizeFromStorage === "function") {
        initFontSizeFromStorage();
      }
      if (typeof initContrastFromStorage === "function") {
        initContrastFromStorage();
      }
      if (typeof initDefaultLanguageSelection === "function") {
        initDefaultLanguageSelection();
      }
      if (typeof initThemeFromStorage === "function") {
        initThemeFromStorage();
      }

    } catch (error) {
      console.error("SEHAT KENDRA failed to load:", error);
      document.body.innerHTML =
        '<div style="padding:40px;font-family:sans-serif;">' +
        "<h2>Unable to load SEHAT KENDRA</h2>" +
        "<p>" + error.message + "</p>" +
        "<p>This app loads its screens and scripts with <code>fetch()</code>, " +
        "which requires running it through a local web server rather than " +
        "opening index.html directly. Try:</p>" +
        "<pre>python3 -m http.server 8080</pre>" +
        "<p>...then open <code>http://localhost:8080</code>.</p>" +
        "</div>";
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
