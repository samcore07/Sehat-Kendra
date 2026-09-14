// ============================================================
// PRESCRIPTION VIEW — AI SUMMARY + FLASHCARDS
// ============================================================
// Drives screen-prescription-view: the printable prescription card,
// the AI (Grok) plain-language summary box, and the flip-card
// flashcard reviewer. Both the upload/scan flow and the voice-draft
// flow call openPrescriptionView() so they land on this exact same
// screen with the exact same AI summarization feature.
// ============================================================

let currentRxFlashcards = [];
let currentRxFlashIndex = 0;
let currentRxViewData = null; // { record, displayRecord, aiSummary, flashcards, aiGenerated, lang }

// Maps the short UI language code (used in the dropdown + labels
// below) to the BCP-47 code the backend/AI expects.
const RX_VIEW_API_LANGUAGE = {
    en: "en-IN",
    hi: "hi-IN",
    bn: "bn-IN",
    mr: "mr-IN",
    ta: "ta-IN",
    or: "or-IN"
};

const RX_VIEW_LANG_LABELS = {
    en: {
        pageTitle: "Digital Prescription",
        backToCenter: "← Back to Prescription Center",
        listenBtn: "🔊 Listen",
        printBtn: "🖨 Print / Save PDF",
        docFallbackTitle: "Digital Prescription",
        sourceFallback: "Digital",
        symptoms: "Symptoms",
        medicines: "Medicines",
        notes: "Doctor's Notes",
        medTable: { medicine: "Medicine", dosage: "Dosage", frequency: "Frequency", duration: "Duration" },
        aiSummaryTitle: "AI Summary (Grok)",
        offlineTag: " — offline mode",
        draftBanner: "⚠ This is an unreviewed draft. A doctor must confirm it before any medicine is taken.",
        flashcardsTitle: "Flashcards",
        prevBtn: "← Prev",
        nextBtn: "Next →",
        tapHint: "Tap the card to flip it.",
        cardCount: (i, n) => `Card ${i} of ${n}`,
        noSummary: "No summary available."
    },
    hi: {
        pageTitle: "डिजिटल पर्ची",
        backToCenter: "← प्रिस्क्रिप्शन सेंटर पर वापस जाएं",
        listenBtn: "🔊 सुनें",
        printBtn: "🖨 प्रिंट / पीडीएफ सहेजें",
        docFallbackTitle: "डिजिटल पर्ची",
        sourceFallback: "डिजिटल",
        symptoms: "लक्षण",
        medicines: "दवाइयाँ",
        notes: "डॉक्टर के नोट्स",
        medTable: { medicine: "दवा", dosage: "खुराक", frequency: "आवृत्ति", duration: "अवधि" },
        aiSummaryTitle: "एआई सारांश (Grok)",
        offlineTag: " — ऑफ़लाइन मोड",
        draftBanner: "⚠ यह एक असमीक्षित मसौदा है। कोई भी दवा लेने से पहले डॉक्टर की पुष्टि आवश्यक है।",
        flashcardsTitle: "फ्लैशकार्ड",
        prevBtn: "← पिछला",
        nextBtn: "अगला →",
        tapHint: "कार्ड पलटने के लिए टैप करें।",
        cardCount: (i, n) => `कार्ड ${i} में से ${n}`,
        noSummary: "कोई सारांश उपलब्ध नहीं है।"
    },
    bn: {
        pageTitle: "ডিজিটাল প্রেসক্রিপশন",
        backToCenter: "← প্রেসক্রিপশন সেন্টারে ফিরে যান",
        listenBtn: "🔊 শুনুন",
        printBtn: "🖨 প্রিন্ট / পিডিএফ সংরক্ষণ করুন",
        docFallbackTitle: "ডিজিটাল প্রেসক্রিপশন",
        sourceFallback: "ডিজিটাল",
        symptoms: "লক্ষণ",
        medicines: "ওষুধ",
        notes: "ডাক্তারের নোট",
        medTable: { medicine: "ওষুধ", dosage: "মাত্রা", frequency: "কতবার", duration: "মেয়াদ" },
        aiSummaryTitle: "এআই সারাংশ (Grok)",
        offlineTag: " — অফলাইন মোড",
        draftBanner: "⚠ এটি একটি অপর্যালোচিত খসড়া। কোনো ওষুধ খাওয়ার আগে ডাক্তারের নিশ্চিতকরণ প্রয়োজন।",
        flashcardsTitle: "ফ্ল্যাশকার্ড",
        prevBtn: "← আগে",
        nextBtn: "পরে →",
        tapHint: "কার্ড উল্টাতে ট্যাপ করুন।",
        cardCount: (i, n) => `কার্ড ${i} এর ${n}`,
        noSummary: "কোনো সারাংশ উপলব্ধ নেই।"
    },
    mr: {
        pageTitle: "डिजिटल प्रिस्क्रिप्शन",
        backToCenter: "← प्रिस्क्रिप्शन सेंटरवर परत जा",
        listenBtn: "🔊 ऐका",
        printBtn: "🖨 प्रिंट / पीडीएफ जतन करा",
        docFallbackTitle: "डिजिटल प्रिस्क्रिप्शन",
        sourceFallback: "डिजिटल",
        symptoms: "लक्षणे",
        medicines: "औषधे",
        notes: "डॉक्टरांच्या नोंदी",
        medTable: { medicine: "औषध", dosage: "मात्रा", frequency: "वारंवारता", duration: "कालावधी" },
        aiSummaryTitle: "एआय सारांश (Grok)",
        offlineTag: " — ऑफलाइन मोड",
        draftBanner: "⚠ हा एक अपुनरावलोकित मसुदा आहे. कोणतेही औषध घेण्यापूर्वी डॉक्टरांची पुष्टी आवश्यक आहे.",
        flashcardsTitle: "फ्लॅशकार्ड",
        prevBtn: "← मागील",
        nextBtn: "पुढील →",
        tapHint: "कार्ड पलटण्यासाठी टॅप करा.",
        cardCount: (i, n) => `कार्ड ${i} पैकी ${n}`,
        noSummary: "सारांश उपलब्ध नाही."
    },
    ta: {
        pageTitle: "டிஜிட்டல் மருந்துச்சீட்டு",
        backToCenter: "← மருந்துச்சீட்டு மையத்திற்குத் திரும்பு",
        listenBtn: "🔊 கேட்க",
        printBtn: "🖨 அச்சிடு / PDF ஆக சேமி",
        docFallbackTitle: "டிஜிட்டல் மருந்துச்சீட்டு",
        sourceFallback: "டிஜிட்டல்",
        symptoms: "அறிகுறிகள்",
        medicines: "மருந்துகள்",
        notes: "மருத்துவரின் குறிப்புகள்",
        medTable: { medicine: "மருந்து", dosage: "அளவு", frequency: "அடுக்கு", duration: "காலஅளவு" },
        aiSummaryTitle: "AI சுருக்கம் (Grok)",
        offlineTag: " — ஆஃப்லைன் பயன்முறை",
        draftBanner: "⚠ இது சரிபார்க்கப்படாத வரைவு. எந்த மருந்தையும் எடுப்பதற்கு முன் மருத்துவர் உறுதிப்படுத்த வேண்டும்.",
        flashcardsTitle: "ஃபிளாஷ்கார்டுகள்",
        prevBtn: "← முந்தையது",
        nextBtn: "அடுத்தது →",
        tapHint: "அட்டையை புரட்ட தட்டவும்.",
        cardCount: (i, n) => `அட்டை ${i} / ${n}`,
        noSummary: "சுருக்கம் இல்லை."
    },
    or: {
        pageTitle: "ଡିଜିଟାଲ ପ୍ରେସକ୍ରିପସନ",
        backToCenter: "← ପ୍ରେସକ୍ରିପସନ ସେଣ୍ଟରକୁ ଫେରନ୍ତୁ",
        listenBtn: "🔊 ଶୁଣନ୍ତୁ",
        printBtn: "🖨 ପ୍ରିଣ୍ଟ / PDF ସେଭ୍ କରନ୍ତୁ",
        docFallbackTitle: "ଡିଜିଟାଲ ପ୍ରେସକ୍ରିପସନ",
        sourceFallback: "ଡିଜିଟାଲ",
        symptoms: "ଲକ୍ଷଣ",
        medicines: "ଔଷଧ",
        notes: "ଡାକ୍ତରଙ୍କ ଟିପ୍ପଣୀ",
        medTable: { medicine: "ଔଷଧ", dosage: "ମାତ୍ରା", frequency: "ବାରମ୍ବାରତା", duration: "ଅବଧି" },
        aiSummaryTitle: "AI ସାରାଂଶ (Grok)",
        offlineTag: " — ଅଫଲାଇନ ମୋଡ୍",
        draftBanner: "⚠ ଏହା ଏକ ଅସମୀକ୍ଷିତ ଡ୍ରାଫ୍ଟ। କୌଣସି ଔଷଧ ନେବା ପୂର୍ବରୁ ଡାକ୍ତରଙ୍କ ନିଶ୍ଚିତକରଣ ଆବଶ୍ୟକ।",
        flashcardsTitle: "ଫ୍ଲାସକାର୍ଡ",
        prevBtn: "← ପୂର୍ବ",
        nextBtn: "ପରବର୍ତ୍ତୀ →",
        tapHint: "କାର୍ଡ ବଦଳାଇବାକୁ ଟାପ୍ କରନ୍ତୁ।",
        cardCount: (i, n) => `କାର୍ଡ ${i} ର ${n}`,
        noSummary: "କୌଣସି ସାରାଂଶ ଉପଲବ୍ଧ ନାହିଁ।"
    }
};

// The current view's labels, refreshed by renderPrescriptionView()
// each time it runs — renderFlashcard() reads from here so flashcard
// nav strings stay in the selected language without needing the
// current language threaded through every call.
let currentRxLabels = RX_VIEW_LANG_LABELS.en;


// ============ OPEN THE VIEW (called after upload / voice draft) ============
function openPrescriptionView(record, aiSummary, flashcards, aiGenerated) {

    // `record` is always kept in English — it's what actually got
    // saved. `displayRecord` is what's shown on screen, and starts
    // out as the same thing; switching languages only ever swaps
    // out displayRecord, so re-opening the language dropdown back to
    // English (or reloading) always shows the true saved English
    // record with nothing lost in translation.
    currentRxViewData = {
        record: record || {},
        displayRecord: record || {},
        aiSummary: aiSummary || "",
        flashcards: Array.isArray(flashcards) ? flashcards : [],
        aiGenerated: !!aiGenerated,
        lang: "en"
    };

    try {
        sessionStorage.setItem(
            "sehatKendraLastRx",
            JSON.stringify(currentRxViewData)
        );
    } catch (e) {
        // sessionStorage unavailable — the view still works for this session
    }

    renderPrescriptionView();
    showScreen("screen-prescription-view");
}


// ============ RENDER THE DOC CARD + SUMMARY ============
function renderPrescriptionView() {

    if (!currentRxViewData) {
        try {
            const saved = sessionStorage.getItem("sehatKendraLastRx");
            if (saved) {
                currentRxViewData = JSON.parse(saved);
            }
        } catch (e) {
            // ignore — nothing to restore
        }
    }

    if (!currentRxViewData) return;

    // Fall back to the English record for anything not yet in
    // displayRecord (older saved sessionStorage entries, etc.).
    const record = currentRxViewData.displayRecord || currentRxViewData.record || {};
    const aiSummary = currentRxViewData.aiSummary || "";
    const aiGenerated = currentRxViewData.aiGenerated;
    const lang = currentRxViewData.lang || "en";
    const labels = RX_VIEW_LANG_LABELS[lang] || RX_VIEW_LANG_LABELS.en;
    currentRxLabels = labels;

    // Static, page-level chrome that isn't part of the record itself.
    const pageTitle = document.getElementById("rxViewPageTitle");
    if (pageTitle) pageTitle.textContent = labels.pageTitle;

    const backBtn = document.getElementById("rxViewBackBtn");
    if (backBtn) backBtn.textContent = labels.backToCenter;

    const flashcardsTitle = document.getElementById("rxFlashcardsTitle");
    if (flashcardsTitle) flashcardsTitle.textContent = labels.flashcardsTitle;

    const prevBtn = document.getElementById("rxFlashPrevBtn");
    if (prevBtn) prevBtn.textContent = labels.prevBtn;

    const nextBtn = document.getElementById("rxFlashNextBtn");
    if (nextBtn) nextBtn.textContent = labels.nextBtn;

    const tapHint = document.getElementById("rxFlashTapHint");
    if (tapHint) tapHint.textContent = labels.tapHint;

    const docCard = document.getElementById("rxDocCard");

    if (docCard) {

        const medicines = Array.isArray(record.medicines) ? record.medicines : [];

        const medicineRows = medicines.map(m => `
            <tr>
                <td>${escapeHtml(m.name)}</td>
                <td>${escapeHtml(m.dosage)}</td>
                <td>${escapeHtml(m.frequency)}</td>
                <td>${escapeHtml(m.duration)}</td>
            </tr>
        `).join("");

        docCard.innerHTML = `
            ${record.draft ? `<div class="rx-draft-banner">${labels.draftBanner}</div>` : ""}
            <div class="rx-doc-head">
                <div>
                    <h3>${escapeHtml(record.diagnosis) || labels.docFallbackTitle}</h3>
                    <span class="rx-source-tag">${escapeHtml(record.source) || labels.sourceFallback}</span>
                </div>
                <button class="icon-btn" id="rxDocListenBtn" type="button">${labels.listenBtn}</button>
            </div>
            <div class="rx-doc-field">
                <div class="summary-label">${labels.symptoms.toUpperCase()}</div>
                <div class="value">${escapeHtml(record.symptoms) || "—"}</div>
            </div>
            ${medicines.length ? `
                <div class="rx-doc-field">
                    <div class="summary-label">${labels.medicines.toUpperCase()}</div>
                    <table class="rx-med-table">
                        <thead>
                            <tr><th>${labels.medTable.medicine}</th><th>${labels.medTable.dosage}</th><th>${labels.medTable.frequency}</th><th>${labels.medTable.duration}</th></tr>
                        </thead>
                        <tbody>${medicineRows}</tbody>
                    </table>
                </div>
            ` : ""}
            ${record.notes ? `
                <div class="rx-doc-field">
                    <div class="summary-label">${labels.notes.toUpperCase()}</div>
                    <div class="value">${escapeHtml(record.notes)}</div>
                </div>
            ` : ""}
            <div class="rx-doc-actions">
                <button class="btn btn-outline" type="button" onclick="window.print()">${labels.printBtn}</button>
                <button class="btn btn-outline" type="button" onclick="showScreen('screen-prescription')">${labels.backToCenter}</button>
            </div>
        `;

        const listenBtn = document.getElementById("rxDocListenBtn");
        if (listenBtn) {
            listenBtn.onclick = function () {
                speak(aiSummary || record.diagnosis || labels.noSummary);
            };
        }
    }

    const summaryBox = document.getElementById("rxSummaryBox");

    if (summaryBox) {
        if (aiSummary) {
            summaryBox.classList.remove("hidden");
            summaryBox.innerHTML = `
                <strong>🤖 ${labels.aiSummaryTitle}${aiGenerated ? "" : labels.offlineTag}</strong>
                <p style="margin:8px 0 0;">${escapeHtml(aiSummary)}</p>
            `;
        } else {
            summaryBox.classList.add("hidden");
        }
    }

    currentRxFlashcards = currentRxViewData.flashcards || [];
    currentRxFlashIndex = 0;
    renderFlashcard();
}


// ============ FLASHCARDS ============
function renderFlashcard() {

    const box = document.getElementById("rxFlashcardBox");
    if (!box) return;

    if (!currentRxFlashcards.length) {
        box.classList.add("hidden");
        return;
    }

    box.classList.remove("hidden");

    const card = currentRxFlashcards[currentRxFlashIndex];

    const flip = document.getElementById("rxFlipCard");
    const front = document.getElementById("rxFlipFront");
    const back = document.getElementById("rxFlipBack");
    const count = document.getElementById("rxFlashCount");

    if (flip) flip.classList.remove("flipped");
    if (front) front.textContent = card.question || "";
    if (back) back.textContent = card.answer || "";
    if (count) {
        count.textContent =
            currentRxLabels.cardCount(currentRxFlashIndex + 1, currentRxFlashcards.length);
    }
}

function flashcardNav(direction) {

    if (!currentRxFlashcards.length) return;

    currentRxFlashIndex =
        (currentRxFlashIndex + direction + currentRxFlashcards.length) %
        currentRxFlashcards.length;

    renderFlashcard();
}


// ============ TRANSLATE (labels, doc card fields, and a freshly ============
// ============ localized AI summary — the whole page)             ============
async function translatePrescriptionView(lang) {

    if (!currentRxViewData) return;

    currentRxViewData.lang =
        RX_VIEW_LANG_LABELS[lang] ? lang : "en";

    // Always translate FROM the true, original English record —
    // never from whatever happens to already be on screen — so
    // switching languages back and forth never compounds translation
    // drift or loses the original English text.
    const record = currentRxViewData.record || {};
    const apiLanguage = RX_VIEW_API_LANGUAGE[currentRxViewData.lang] || "en-IN";

    if (currentRxViewData.lang === "en") {
        // Nothing to translate — just show the original record and
        // (if we don't already have one) an English AI summary.
        currentRxViewData.displayRecord = record;
    }

    try {

        const response = await fetch(
            `${PRESCRIPTION_API}/prescriptions/summarize`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    diagnosis: record.diagnosis || "",
                    symptoms: record.symptoms || "",
                    medicines: record.medicines || [],
                    notes: record.notes || "",
                    language: apiLanguage
                })
            }
        );

        const data = await response.json();

        if (response.ok && data.success) {
            currentRxViewData.aiSummary = data.ai_summary;
            currentRxViewData.flashcards = data.flashcards;
            currentRxViewData.aiGenerated = data.ai_generated;

            // The backend also translates the prescription's own
            // fields (diagnosis, symptoms, notes, medicines) so the
            // whole page reads in the selected language, not just
            // the AI summary box.
            if (data.translated) {
                currentRxViewData.displayRecord = {
                    ...record,
                    diagnosis: data.translated.diagnosis || record.diagnosis,
                    symptoms: data.translated.symptoms || record.symptoms,
                    notes: data.translated.notes || record.notes,
                    medicines: Array.isArray(data.translated.medicines) &&
                        data.translated.medicines.length
                        ? data.translated.medicines
                        : record.medicines
                };
            }
        }

    } catch (error) {
        console.error("Translation summary refresh failed:", error);
    }

    try {
        sessionStorage.setItem(
            "sehatKendraLastRx",
            JSON.stringify(currentRxViewData)
        );
    } catch (e) {
        // ignore
    }

    renderPrescriptionView();
}


// ============ VIEW A PREVIOUSLY SAVED PRESCRIPTION FROM THE LIST ============
// Saved records don't carry a stored AI summary (the demo backend
// doesn't persist one), so this re-requests one on demand — the same
// AI summarization feature used right after upload/voice-draft.
async function viewSavedPrescription(record) {

    openPrescriptionView(record, "", [], false);

    const summaryBox = document.getElementById("rxSummaryBox");
    if (summaryBox) {
        summaryBox.classList.remove("hidden");
        summaryBox.innerHTML = `
            <span class="rx-spinner"></span> Generating AI summary…
        `;
    }

    try {

        const response = await fetch(
            `${PRESCRIPTION_API}/prescriptions/summarize`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    diagnosis: record.diagnosis || "",
                    symptoms: record.symptoms || "",
                    medicines: record.medicines || [],
                    notes: record.notes || "",
                    language: "en-IN"
                })
            }
        );

        const data = await response.json();

        if (response.ok && data.success && currentRxViewData) {
            currentRxViewData.aiSummary = data.ai_summary;
            currentRxViewData.flashcards = data.flashcards;
            currentRxViewData.aiGenerated = data.ai_generated;
            renderPrescriptionView();
        }

    } catch (error) {
        console.error("Could not generate AI summary:", error);
        if (summaryBox) {
            summaryBox.innerHTML =
                "Could not generate an AI summary right now. Showing the plain record instead.";
        }
    }
}


// ============ SMALL SHARED HELPER ============
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text === undefined || text === null ? "" : String(text);
    return div.innerHTML;
}
