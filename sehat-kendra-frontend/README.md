# SEHAT KENDRA — Frontend (split build)

This is the same SEHAT KENDRA frontend, reorganized so that every screen
lives in its own HTML file and every feature lives in its own JS file,
instead of one giant `index.html` and one giant `script.js`.

## Running it

Because the page now assembles itself at runtime with `fetch()`, it must
be served over HTTP — opening `index.html` directly (`file://...`) will
not work, since browsers block `fetch()` of local files for security
reasons.

From this folder, run any local static server, for example:

```bash
python3 -m http.server 8080
```

Then open **http://localhost:8080** in your browser.

If you also want the backend (prescriptions, appointment booking, OTP
verification) to work, run `appNLP.py` as before — it's unchanged.

### AI prescription summaries (Grok)

Uploading a prescription photo or drafting one from voice now also
shows an AI-generated, plain-language summary and a set of flashcards
on the prescription view screen. That's powered by xAI's Grok API on
the backend. To enable it, set `GROK_API_KEY` (and optionally
`GROK_MODEL`) in `sehat-kendra-backend/.env` — see
`.env.examples`. Without a key, the app still works and shows a
plain (non-AI) summary instead of erroring out.

## How it fits together

- **`index.html`** — a thin shell. It only contains `<head>`, an empty
  `#shellMount`, and an empty `<main id="app">`.
- **`js/app-bootstrap.js`** — loads every partial in `partials/` into
  the page, then loads every feature file in `js/` in the exact same
  order they used to appear in the original `script.js` (this matters:
  a couple of functions are intentionally redefined later in the file,
  and the load order preserves which definition wins, exactly as
  before).
- **`partials/`** — one `.html` file per screen (or shell piece),
  grouped into folders by feature area.
- **`js/`** — one `.js` file per feature/section of the old
  `script.js`, grouped into folders by feature area.
- **`style.css`, `logo.png`, `appNLP.py`** — unchanged.

## File map

### Partials (`partials/`)

| Folder | File | Screen |
|---|---|---|
| shell | utility-bar.html | Top utility bar (phone, contrast, font size, quick language) |
| shell | app-header.html | Persistent app header / nav |
| landing | landing.html | Landing page + footer |
| onboarding | language-select.html | Language selection |
| onboarding | role-select.html | Patient vs. Doctor role select |
| auth | auth-method-select.html | Choose ABHA / Aadhaar / Mobile / Sample / New patient |
| auth | abha-login.html, abha-otp.html | ABHA login + OTP |
| auth | aadhaar-login.html, aadhaar-otp.html | Aadhaar login + OTP |
| auth | mobile-login.html, mobile-otp.html | Mobile OTP login |
| registration | patient-registration.html | New patient 3-step registration |
| questionnaire | health-questionnaire.html | Health history questionnaire |
| dashboard | patient-dashboard.html | Patient dashboard |
| booking | booking-1-pathway.html … booking-5-confirmation.html | 5-step appointment booking |
| ayush | ayush-wellness.html | AYUSH / traditional wellness |
| profile | health-profile.html | Health profile |
| prescription | prescription-center.html, prescription-view.html | Digital prescription center + viewer |
| doctor-portal | doctor-entry.html, doctor-modules.html, doctor-placeholder.html | Doctor/clinician portal |

### Scripts (`js/`)

| Folder | File | Responsibility |
|---|---|---|
| core | state.js | Backend URL, global `state` object |
| core | navigation.js | `showScreen`, `enterApp`, `logout`, `goHome` |
| shell | utility-bar-controls.js | `setFontSize`, `toggleContrast`, `quickSelectLanguage` / `applyLanguage` (top utility bar) |
| auth | quick-login.js | Sample patient / guest login |
| auth | otp-shared-utils.js | Shared OTP box helpers used by every OTP screen |
| auth | abha-login.js | ABHA login + OTP verification |
| auth | aadhaar-login.js | Aadhaar login + OTP verification |
| auth | aadhaar-otp-legacy.js | Older unused Aadhaar/OTP functions kept from the original file |
| auth | mobile-otp.js | Mobile number OTP demo login |
| registration | patient-registration.js | New patient registration steps |
| booking | select-pathway-doctor-slot.js | Pathway, doctor, and slot selection |
| booking | consent-confirm.js | Consent screen + backend appointment booking |
| ayush | ayush-wellness.js | `openAyush`, wellness tab content + daily routine tracker |
| language | language-select.js | Language picker + default language init |
| prescription | prescription-center-core.js | Prescription-center open/close logic + backend config |
| prescription | prescription-load.js | Loading saved prescriptions from the backend |
| prescription | prescription-view.js | Prescription view screen: doc card, AI (Grok) summary, flashcards, translation |
| prescription | prescription-voice-recognition.js | Speech-to-text capture (continuous listening) |
| prescription | prescription-voice-draft.js | Drafting a prescription from spoken symptoms + AI summary |
| prescription | prescription-upload-final.js | Scan/upload logic + AI summary |
| theme | theme-toggle.js | Light/dark theme toggle + saved theme init |
| accessibility | text-to-speech.js | `speak(text)` — per-screen "Listen" buttons |
| (root) | app-bootstrap.js | Loader described above |

## A couple of things carried over as-is

- The Care AI feature (chat screen, `js/care-ai/care-ai-chat.js`,
  and the backend `POST /care-ai` endpoint) has been removed.

- A few buttons still call JavaScript functions that were never
  defined in the original `script.js`: the Doctor Portal module
  stubs and the health questionnaire's back/next controls, among
  others. These are still missing, same as before.

- Four previously-missing pieces have since been implemented:
  - **Ayush wellness tabs** — `openAyush`, `selectWellnessTab`, and a
    daily routine tracker, in `js/ayush/ayush-wellness.js`.
  - **Utility bar controls** — `setFontSize`, `toggleContrast`, and
    `quickSelectLanguage` (plus a small site-wide `applyLanguage`
    translator for every `[data-i18n]` element), in
    `js/shell/utility-bar-controls.js`.
  - **"🔊 Listen" buttons** — `speak(text)` in
    `js/accessibility/text-to-speech.js` now actually reads the given
    phrase aloud via the Web Speech API, in the current UI language,
    and stops automatically when you navigate to another screen.
