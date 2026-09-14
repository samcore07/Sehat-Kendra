// ============================================================
// PRESCRIPTION UPLOAD / SCAN
// ============================================================
// Single, consolidated handler (earlier versions of this file and
// prescription-upload-scan.js defined this function twice — merged
// here). Scans the uploaded file (simulated for this prototype),
// saves the resulting prescription, generates an AI (Grok) summary
// + flashcards, and opens the prescription view screen so the
// patient sees the same AI summarization feature every time.
// ============================================================

async function handlePrescriptionUpload(event) {

    const file = event.target.files && event.target.files[0];

    if (!file) return;

    const thumb = document.getElementById("rxPreviewThumb");
    const status = document.getElementById("rxScanStatus");

    // Image preview
    if (file.type && file.type.startsWith("image/")) {

        const reader = new FileReader();

        reader.onload = function (e) {
            if (thumb) {
                thumb.src = e.target.result;
                thumb.classList.remove("hidden");
            }
        };

        reader.readAsDataURL(file);

    } else if (thumb) {
        thumb.classList.add("hidden");
    }

    if (status) {
        status.classList.remove("hidden");
    }

    try {

        // =====================================================
        // STEP 1 — SCAN (also returns an AI summary + flashcards)
        // =====================================================

        const scanResponse = await fetch(
            `${PRESCRIPTION_API}/prescriptions/scan`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    patient_id: String(PRESCRIPTION_PATIENT_ID),
                    filename: file.name,
                    language: "en-IN"
                })
            }
        );

        const scanData = await scanResponse.json();

        if (!scanResponse.ok) {
            throw new Error(
                typeof scanData.detail === "string"
                    ? scanData.detail
                    : JSON.stringify(scanData.detail) || "Prescription scan failed."
            );
        }

        if (!scanData.prescription) {
            throw new Error("Backend did not return a prescription.");
        }

        const prescription = scanData.prescription;

        // =====================================================
        // STEP 2 — SAVE TO SUPABASE
        // =====================================================

        const saveResponse = await fetch(
            `${PRESCRIPTION_API}/prescriptions`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    patient_id: String(prescription.patient_id || PRESCRIPTION_PATIENT_ID),
                    diagnosis: prescription.diagnosis || "",
                    symptoms: prescription.symptoms || "",
                    medicines: Array.isArray(prescription.medicines) ? prescription.medicines : [],
                    source: prescription.source || "Scanned",
                    notes: prescription.notes || "",
                    draft: prescription.draft === true
                })
            }
        );

        const saveData = await saveResponse.json();

        if (!saveResponse.ok) {
            throw new Error(
                (saveData.detail && (typeof saveData.detail === "string"
                    ? saveData.detail
                    : JSON.stringify(saveData.detail))) ||
                "Could not save prescription."
            );
        }

        const savedPrescription = saveData.prescription || prescription;

        if (status) {
            status.classList.add("hidden");
        }

        // =====================================================
        // STEP 3 — SHOW THE PRESCRIPTION + AI SUMMARY
        // =====================================================

        openPrescriptionView(
            savedPrescription,
            scanData.ai_summary,
            scanData.flashcards,
            scanData.ai_generated
        );

        // Refresh the saved list in the background for when the
        // patient comes back to the Prescription Center.
        if (typeof loadPrescriptionsFromBackend === "function") {
            loadPrescriptionsFromBackend();
        }

    } catch (error) {

        console.error("Prescription upload error:", error);

        if (status) {
            status.classList.add("hidden");
        }

        alert(
            "❌ Prescription processing failed.\n\n" +
            (error && error.message ? error.message : JSON.stringify(error))
        );

    } finally {
        // Let the same file be re-selected later without a page reload.
        event.target.value = "";
    }
}
