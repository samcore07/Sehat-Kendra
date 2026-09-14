// ============================================================
// UTILITY BAR CONTROLS — font size, high contrast, quick language
// ============================================================
// The top utility bar (partials/shell/utility-bar.html) has always
// called setFontSize(), toggleContrast(), and quickSelectLanguage(),
// and style.css already has full support for the resulting
// html[data-fontsize], html[data-contrast="high"], and .active states
// — but none of these functions were ever implemented, so the
// controls did nothing. This file wires them up.
//
// It also implements applyLanguage(), a small site-wide translator
// for every element marked with [data-i18n]. That hook was already
// being called from js/language/language-select.js
// (`if (typeof applyLanguage === "function") applyLanguage(...)`)
// but likewise never existed, so picking a language only ever updated
// the language-preview screen itself, not the rest of the app.

// ============ FONT SIZE (A- / A / A+) ============

function setFontSize(size) {

  if (!["sm", "md", "lg"].includes(size)) return;

  document.documentElement.setAttribute("data-fontsize", size);

  document.querySelectorAll(".font-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.size === size);
  });

  try {
    localStorage.setItem("sehatkendra-fontsize", size);
  } catch (e) {}
}


function initFontSizeFromStorage() {

  let savedSize = "md";

  try {
    savedSize = localStorage.getItem("sehatkendra-fontsize") || "md";
  } catch (e) {}

  setFontSize(savedSize);
}

document.addEventListener("DOMContentLoaded", initFontSizeFromStorage);


// ============ HIGH CONTRAST ============

function toggleContrast() {

  const isHigh =
    document.documentElement.getAttribute("data-contrast") === "high";

  const next = isHigh ? "normal" : "high";

  applyContrastMode(next);

  try {
    localStorage.setItem("sehatkendra-contrast", next);
  } catch (e) {}
}


function applyContrastMode(mode) {

  if (mode === "high") {
    document.documentElement.setAttribute("data-contrast", "high");
  } else {
    document.documentElement.removeAttribute("data-contrast");
  }

  const button = document.getElementById("contrastToggleBtn");
  const icon = document.getElementById("contrastIcon");

  if (button) {
    button.classList.toggle("active", mode === "high");
    button.setAttribute("aria-pressed", mode === "high" ? "true" : "false");
  }

  if (icon) {
    icon.textContent = mode === "high" ? "●" : "◐";
  }
}


function initContrastFromStorage() {

  let savedMode = "normal";

  try {
    savedMode = localStorage.getItem("sehatkendra-contrast") || "normal";
  } catch (e) {}

  applyContrastMode(savedMode);
}

document.addEventListener("DOMContentLoaded", initContrastFromStorage);


// ============ QUICK LANGUAGE SELECT ============
// Only the three languages exposed in the utility bar itself have full
// site-wide translations here. Languages picked from the full "Select
// Language" screen (Tamil, Marathi, Odia) still translate that screen's
// own preview text (handled in language-select.js) but fall back to
// English for the header/landing strings below, since the quick bar
// never offers those languages directly.
const UI_STRINGS = {
  en: {
    phone: "📞 1800-11-4477 (Toll Free)",
    govLine: "Government of India · National Health Authority",
    govPill: "Government of India · National Health Authority",
    brandSub: "National Digital Health Gateway",
    signInBtn: "👤 Citizen Sign-in",
    navHome: "▦ Patient Home",
    navLogout: "Logout",
    heroTitle: "Welcome to SEHAT KENDRA",
    heroSubtitle: "Universal Digital Health Records & Citizen Gateway",
    heroDesc: "A secure, citizen-friendly portal designed to connect your health journey with doctors, hospitals, and wellness services under Ayushman Bharat Digital Mission (ABDM).",
    selectLangBtn: "🌐 Select Preferred Language",
    trust1: "✓ 100% Free Public Health Service",
    trust2: "🔒 ABDM & DISHA Compliant Consent Protection",
    trust3: "🗣 Voice Assisted in 6 Regional Languages"
  },
  bn: {
    phone: "📞 ১৮০০-১১-৪৪৭৭ (টোল ফ্রি)",
    govLine: "ভারত সরকার · জাতীয় স্বাস্থ্য কর্তৃপক্ষ",
    govPill: "ভারত সরকার · জাতীয় স্বাস্থ্য কর্তৃপক্ষ",
    brandSub: "জাতীয় ডিজিটাল স্বাস্থ্য গেটওয়ে",
    signInBtn: "👤 নাগরিক সাইন-ইন",
    navHome: "▦ রোগীর হোম",
    navLogout: "লগ আউট",
    heroTitle: "সেহাত কেন্দ্রে স্বাগতম",
    heroSubtitle: "সর্বজনীন ডিজিটাল স্বাস্থ্য রেকর্ড ও নাগরিক গেটওয়ে",
    heroDesc: "আয়ুষ্মান ভারত ডিজিটাল মিশনের (ABDM) অধীনে ডাক্তার, হাসপাতাল ও সুস্থতা পরিষেবার সঙ্গে আপনার স্বাস্থ্যযাত্রাকে সংযুক্ত করার জন্য একটি নিরাপদ, নাগরিক-বান্ধব পোর্টাল।",
    selectLangBtn: "🌐 পছন্দের ভাষা নির্বাচন করুন",
    trust1: "✓ ১০০% বিনামূল্যে সরকারি স্বাস্থ্য পরিষেবা",
    trust2: "🔒 ABDM ও DISHA সম্মত সম্মতি সুরক্ষা",
    trust3: "🗣 ৬টি আঞ্চলিক ভাষায় কণ্ঠ সহায়তা"
  },
  hi: {
    phone: "📞 1800-11-4477 (टोल फ्री)",
    govLine: "भारत सरकार · राष्ट्रीय स्वास्थ्य प्राधिकरण",
    govPill: "भारत सरकार · राष्ट्रीय स्वास्थ्य प्राधिकरण",
    brandSub: "राष्ट्रीय डिजिटल स्वास्थ्य गेटवे",
    signInBtn: "👤 नागरिक साइन-इन",
    navHome: "▦ मरीज़ होम",
    navLogout: "लॉग आउट",
    heroTitle: "सेहत केंद्र में आपका स्वागत है",
    heroSubtitle: "सार्वभौमिक डिजिटल स्वास्थ्य रिकॉर्ड और नागरिक गेटवे",
    heroDesc: "आयुष्मान भारत डिजिटल मिशन (ABDM) के तहत डॉक्टरों, अस्पतालों और वेलनेस सेवाओं के साथ आपकी स्वास्थ्य यात्रा को जोड़ने के लिए एक सुरक्षित, नागरिक-अनुकूल पोर्टल।",
    selectLangBtn: "🌐 पसंदीदा भाषा चुनें",
    trust1: "✓ 100% निःशुल्क सार्वजनिक स्वास्थ्य सेवा",
    trust2: "🔒 ABDM और DISHA अनुरूप सहमति सुरक्षा",
    trust3: "🗣 6 क्षेत्रीय भाषाओं में आवाज़ सहायता"
  }
};

let utilityBarLanguage = "en";


function quickSelectLanguage(lang, el) {

  const bar = document.querySelector(".lang-quick");

  if (bar) {
    bar.querySelectorAll(".lang-link").forEach(link => {
      link.classList.remove("active");
    });
  }

  if (el) {
    el.classList.add("active");
  }

  applyLanguage(lang);
}


function applyLanguage(lang) {

  utilityBarLanguage = lang;

  document.documentElement.lang = lang;

  const strings = UI_STRINGS[lang] || UI_STRINGS.en;

  document.querySelectorAll("[data-i18n]").forEach(el => {

    const key = el.dataset.i18n;
    const text = strings[key];

    if (text) {
      el.textContent = text;
    }
  });

  // Keep the utility bar's own quick-language links in sync, even when
  // applyLanguage() is triggered from the full "Select Language" screen
  // rather than from the bar itself.
  document.querySelectorAll(".lang-quick .lang-link").forEach(link => {
    link.classList.toggle("active", link.dataset.lang === lang);
  });

  try {
    localStorage.setItem("sehatkendra-lang", lang);
  } catch (e) {}
}

// No separate "restore saved language on load" step here: the existing
// initDefaultLanguageSelection() (js/language/language-select.js) already
// runs on every load and always selects English, which now calls this
// file's applyLanguage('en') via its existing applyLanguage(...) hook —
// so the utility bar's language links stay in sync with that behaviour
// without changing it.
