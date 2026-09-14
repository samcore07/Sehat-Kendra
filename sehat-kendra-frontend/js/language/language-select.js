// LANGUAGE PREVIEW FIX
// ======================================================

let selectedPortalLanguage = "en";

const languagePreview = {
  en: {
    title: "Select Your Language",
    subtitle: "Please choose the language in which you would like to use the SEHAT KENDRA portal.",
    back: "← Back",
    continue: "Continue →",
    listen: "🔊 Listen",
    selected: "Selected"
  },

  hi: {
    title: "अपनी भाषा चुनें",
    subtitle: "कृपया वह भाषा चुनें जिसमें आप SEHAT KENDRA पोर्टल का उपयोग करना चाहते हैं।",
    back: "← वापस",
    continue: "जारी रखें →",
    listen: "🔊 सुनें",
    selected: "चयनित"
  },

  bn: {
    title: "আপনার ভাষা নির্বাচন করুন",
    subtitle: "আপনি যে ভাষায় SEHAT KENDRA পোর্টাল ব্যবহার করতে চান সেটি নির্বাচন করুন।",
    back: "← ফিরে যান",
    continue: "চালিয়ে যান →",
    listen: "🔊 শুনুন",
    selected: "নির্বাচিত"
  },

  ta: {
    title: "உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்",
    subtitle: "SEHAT KENDRA போர்ட்டலைப் பயன்படுத்த விரும்பும் மொழியைத் தேர்ந்தெடுக்கவும்.",
    back: "← பின்செல்",
    continue: "தொடரவும் →",
    listen: "🔊 கேளுங்கள்",
    selected: "தேர்ந்தெடுக்கப்பட்டது"
  },

  mr: {
    title: "तुमची भाषा निवडा",
    subtitle: "कृपया SEHAT KENDRA पोर्टल वापरण्यासाठी भाषा निवडा.",
    back: "← मागे",
    continue: "पुढे जा →",
    listen: "🔊 ऐका",
    selected: "निवडलेले"
  },

  or: {
    title: "ଆପଣଙ୍କ ଭାଷା ଚୟନ କରନ୍ତୁ",
    subtitle: "SEHAT KENDRA ପୋର୍ଟାଲ୍ ବ୍ୟବହାର କରିବାକୁ ଆପଣ ଚାହୁଁଥିବା ଭାଷା ଚୟନ କରନ୍ତୁ।",
    back: "← ପଛକୁ",
    continue: "ଜାରି ରଖନ୍ତୁ →",
    listen: "🔊 ଶୁଣନ୍ତୁ",
    selected: "ଚୟନ କରାଯାଇଛି"
  }
};


// ======================================================
// LANGUAGE SELECT
// ======================================================

function selectLanguage(card) {

  if (!card) return;

  // Remove selected from every card
  document.querySelectorAll(".lang-card").forEach(c => {

    c.classList.remove("selected");

    const oldPill = c.querySelector(".selected-pill");

    if (oldPill) {
      oldPill.remove();
    }

  });

  // Select clicked card
  card.classList.add("selected");

  // Get language
  const languageName = card.dataset.lang;

  const languageCodes = {
    English: "en",
    Hindi: "hi",
    Bengali: "bn",
    Tamil: "ta",
    Marathi: "mr",
    Odia: "or"
  };

  selectedPortalLanguage =
    languageCodes[languageName] || "en";

  const preview = languagePreview[selectedPortalLanguage];

  // Add selected badge
  const badge = document.createElement("span");

  badge.className = "selected-pill";

  badge.textContent = preview.selected;

  card.appendChild(badge);


  // ====================================================
  // CHANGE LANGUAGE PREVIEW SCREEN
  // ====================================================

  const languageScreen =
    document.getElementById("screen-language");

  if (languageScreen) {

    // Main heading
    const heading =
      languageScreen.querySelector("h2");

    if (heading) {
      heading.textContent = preview.title;
    }

    // Description
    const description =
      languageScreen.querySelector(".panel-desc");

    if (description) {
      description.textContent = preview.subtitle;
    }

    // Listen button
    const listenButton =
      languageScreen.querySelector(".icon-btn");

    if (listenButton) {
      listenButton.textContent = preview.listen;
    }

    // Panel buttons
    const buttons =
      languageScreen.querySelectorAll(".panel-actions button");

    if (buttons.length >= 2) {

      buttons[0].textContent = preview.back;
      buttons[1].textContent = preview.continue;

    }
  }


  // ====================================================
  // APPLY LANGUAGE TO REST OF WEBSITE
  // ====================================================

  if (typeof applyLanguage === "function") {
    applyLanguage(selectedPortalLanguage);
  }

  // Save selected language
  try {
    localStorage.setItem(
      "sehatkendra-lang",
      selectedPortalLanguage
    );
  } catch (error) {}

}


// ======================================================
// INITIAL LANGUAGE
// ======================================================

// Extracted into a named function (rather than only a DOMContentLoaded
// listener) so that app-bootstrap.js can call it explicitly once the
// screen partials have finished loading. The listener below still runs
// too, as a harmless no-op safety net when this file is loaded in the
// traditional way (all markup already present at parse time).
function initDefaultLanguageSelection() {

  const englishCard =
    document.querySelector(
      '.lang-card[data-lang="English"]'
    );

  if (englishCard) {
    selectLanguage(englishCard);
  }
}

document.addEventListener("DOMContentLoaded", initDefaultLanguageSelection);
