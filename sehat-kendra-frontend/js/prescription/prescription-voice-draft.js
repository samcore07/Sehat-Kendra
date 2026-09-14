// ============================================================
// CREATE DIGITAL PRESCRIPTION FROM VOICE
// ============================================================
// Drafts a prescription from spoken/typed symptoms, saves it, gets
// an AI (Grok) summary + flashcards, then opens the same
// prescription view screen used by the upload/scan flow — so voice
// and upload both end on the same AI summarization feature.
//
// The patient can speak in any of the supported languages (picked
// from the "Speak in" dropdown), but the backend's diagnosis
// matching and AI summarizer both reason in English — so whatever
// was transcribed is translated to English first, and THAT English
// text is what actually gets drafted, saved, and summarized. The
// patient can still read everything back in their own language
// afterwards using the translate dropdown on the prescription view.
// ============================================================

async function draftPrescriptionFromVoice(event) {

    const transcript = document.getElementById("rxTranscript");

    // If the mic is still listening, stop it and wait for the last
    // words to be finalized before we read the textarea.
    if (typeof prescriptionRecording !== "undefined" && prescriptionRecording) {
        await stopVoiceCaptureAndWait();
    }

    const spokenText = transcript ? transcript.value.trim() : "";

    if (!spokenText) {
        alert("Please speak or type your symptoms first.");
        return;
    }

    const draftBtn = event && event.target ? event.target : null;
    const originalLabel = draftBtn ? draftBtn.textContent : null;

    if (draftBtn) {
        draftBtn.disabled = true;
        draftBtn.textContent = "Drafting…";
    }

    try {

        // =====================================================
        // STEP 1 — TRANSLATE WHATEVER WAS SPOKEN INTO ENGLISH
        // =====================================================

        let symptoms = spokenText;

        try {

            const translateResponse = await fetch(
                `${PRESCRIPTION_API}/prescriptions/translate-transcript`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: spokenText })
                }
            );

            const translateData = await translateResponse.json();

            if (translateResponse.ok && translateData.text) {
                symptoms = translateData.text;
            }

        } catch (translateError) {
            // If translation itself fails, fall back to the raw
            // transcript rather than blocking the whole flow — the
            // keyword matching below just won't be as accurate.
            console.error("Transcript translation failed:", translateError);
        }

        // =====================================================
        // STEP 2 — DRAFT FROM THE ENGLISH TEXT (also returns AI
        // summary, generated in English)
        // =====================================================

        const response = await fetch(
            `${PRESCRIPTION_API}/prescriptions/voice-draft`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    patient_id: String(PRESCRIPTION_PATIENT_ID),
                    symptoms: symptoms,
                    language: "en-IN"
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                typeof data.detail === "string"
                    ? data.detail
                    : JSON.stringify(data.detail) || "Voice prescription failed."
            );
        }

        const draft = data.draft;

        // =====================================================
        // STEP 3 — SAVE THE DRAFT
        // =====================================================
        // The backend's draft.patient_id comes back as a number, but
        // the /prescriptions save endpoint expects patient_id as a
        // string (same as the upload/scan flow) — rebuild the body
        // explicitly so the type always matches, instead of passing
        // the draft object straight through.

        const saveResponse = await fetch(
            `${PRESCRIPTION_API}/prescriptions`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    patient_id: String(draft.patient_id || PRESCRIPTION_PATIENT_ID),
                    diagnosis: draft.diagnosis || "",
                    symptoms: draft.symptoms || "",
                    medicines: Array.isArray(draft.medicines) ? draft.medicines : [],
                    source: draft.source || "Voice",
                    notes: draft.notes || "",
                    draft: draft.draft === true
                })
            }
        );

        const saveData = await saveResponse.json();

        if (!saveResponse.ok) {
            throw new Error(
                (saveData.detail && (typeof saveData.detail === "string"
                    ? saveData.detail
                    : JSON.stringify(saveData.detail))) ||
                "Prescription could not be saved."
            );
        }

        const savedPrescription = saveData.prescription || draft;

        // =====================================================
        // STEP 4 — SHOW THE PRESCRIPTION + AI SUMMARY
        // =====================================================

        openPrescriptionView(
            savedPrescription,
            data.ai_summary,
            data.flashcards,
            data.ai_generated
        );

        // Clear the transcript so the box is ready for the next visit.
        if (transcript) {
            transcript.value = "";
        }

        if (typeof loadPrescriptionsFromBackend === "function") {
            loadPrescriptionsFromBackend();
        }

    } catch (error) {

        console.error("Voice prescription error:", error);

        alert(
            "❌ Could not create prescription.\n\n" +
            (error && error.message ? error.message : JSON.stringify(error))
        );

    } finally {

        if (draftBtn) {
            draftBtn.disabled = false;
            draftBtn.textContent = originalLabel || "Draft Digital Prescription →";
        }
    }
}
