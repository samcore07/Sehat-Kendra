// ============================================================
// VOICE RECOGNITION (speech-to-text for symptoms)
// ============================================================
// Fixes over the original version:
//  - continuous = true, so the mic doesn't cut off after the first
//    pause in speech (the old `continuous = false` meant most
//    patients got cut off mid-sentence).
//  - Finalized speech is accumulated properly across the whole
//    session (previously only the results from the latest
//    resultIndex onward were kept, so earlier finalized text could
//    be dropped on some browsers).
//  - Interim (not-yet-final) text is shown live but never
//    permanently committed until the browser finalizes it.
//  - Starting the mic again appends to whatever is already in the
//    box (typed or previously spoken) instead of wiping it.
//  - A silent "no speech detected" doesn't interrupt the patient
//    with an alert — it just stops listening quietly.
//  - NEW: even with continuous = true, Chrome (and some other
//    browsers) silently end the recognition session after a few
//    seconds of silence — while the patient is still mid-sentence,
//    just pausing to think. Without handling this, the mic looks
//    like it "glitches" and stops on its own. We now tell apart a
//    real stop (the patient tapped Stop, or a genuine error like
//    a denied mic permission) from this silent auto-timeout, and
//    transparently restart listening for the latter so the session
//    keeps going until the patient actually taps Stop.
// ============================================================

let prescriptionRecognition = null;
let prescriptionRecording = false;
let prescriptionFinalTranscript = "";
let prescriptionManualStop = false;
let prescriptionLastError = null;

// ============================================================
// LANGUAGE CHANGE
// ============================================================
// Switching "Speak in" mid-session would otherwise leave stale text
// from the old language sitting in the box (and, if the mic was
// still listening, keep transcribing in a language that no longer
// matches the dropdown). So: stop any active recording, clear the
// transcript (typed or spoken) and reset state, ready for a clean
// start in the newly selected language.
function handleVoiceLanguageChange() {

    const transcript = document.getElementById("rxTranscript");
    const button = document.getElementById("rxVoiceBtn");

    if (prescriptionRecording && prescriptionRecognition) {
        prescriptionManualStop = true;
        prescriptionRecognition.stop();
    }

    prescriptionFinalTranscript = "";
    prescriptionRecording = false;

    if (transcript) {
        transcript.value = "";
        // Keep the keyboard usable right away for manual typing in
        // the newly selected language, without needing to tap the
        // mic first.
        transcript.focus();
    }

    if (button) {
        button.textContent = "🎙 Tap to Start Speaking";
    }
}

function toggleVoiceCapture() {

    const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        alert("Voice recognition is not supported in this browser.");
        return;
    }

    const transcript = document.getElementById("rxTranscript");
    const language = document.getElementById("rxVoiceLang");

    // Stop recording
    if (prescriptionRecording) {
        prescriptionManualStop = true;
        if (prescriptionRecognition) {
            prescriptionRecognition.stop();
        }
        return;
    }

    // Start fresh from whatever text is already there (typed or
    // spoken earlier), so re-tapping the mic appends instead of
    // erasing.
    prescriptionFinalTranscript =
        transcript && transcript.value.trim()
            ? transcript.value.trim() + " "
            : "";

    startPrescriptionRecognition(
        SpeechRecognition,
        language ? language.value : "en-IN"
    );
}

function startPrescriptionRecognition(SpeechRecognition, lang) {

    const button = document.getElementById("rxVoiceBtn");
    const transcript = document.getElementById("rxTranscript");

    prescriptionManualStop = false;
    prescriptionLastError = null;

    prescriptionRecognition = new SpeechRecognition();

    prescriptionRecognition.lang = lang;
    prescriptionRecognition.continuous = true;
    prescriptionRecognition.interimResults = true;
    prescriptionRecognition.maxAlternatives = 1;

    prescriptionRecognition.onstart = function () {
        prescriptionRecording = true;
        if (button) {
            button.textContent = "🛑 Stop Speaking";
        }
    };

    prescriptionRecognition.onresult = function (event) {

        let interimText = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {

            const piece = event.results[i][0].transcript;

            if (event.results[i].isFinal) {
                prescriptionFinalTranscript += piece + " ";
            } else {
                interimText += piece;
            }
        }

        if (transcript) {
            transcript.value =
                (prescriptionFinalTranscript + interimText).trim();
        }
    };

    prescriptionRecognition.onerror = function (event) {

        console.error("Speech recognition error:", event.error);
        prescriptionLastError = event.error;

        // "no-speech" and "aborted" happen routinely (silence, or the
        // user tapping stop) — don't interrupt with an alert for
        // those. Anything else is worth telling the patient about.
        if (event.error !== "no-speech" && event.error !== "aborted") {
            alert("Voice recognition error: " + event.error);
        }
    };

    prescriptionRecognition.onend = function () {

        // Distinguish a real stop (patient tapped Stop, or a genuine
        // error like a denied mic) from the browser's silent
        // no-speech timeout. Only the latter should auto-restart.
        const fatalError =
            prescriptionLastError &&
            prescriptionLastError !== "no-speech" &&
            prescriptionLastError !== "aborted";

        if (!prescriptionManualStop && !fatalError) {
            try {
                prescriptionLastError = null;
                prescriptionRecognition.start();
                return;
            } catch (e) {
                // If restarting itself fails, fall through and reset
                // the UI below instead of leaving it stuck mid-state.
            }
        }

        prescriptionRecording = false;

        if (button) {
            button.textContent = "🎙 Tap to Start Speaking";
        }

        // Make sure whatever was finalized is reflected even if the
        // very last result never fired a final onresult event.
        if (transcript && prescriptionFinalTranscript.trim()) {
            transcript.value = prescriptionFinalTranscript.trim();
        }
    };

    prescriptionRecognition.start();
}


// ============ STOP AND WAIT FOR THE FINAL TRANSCRIPT ============
// Used before drafting a prescription from voice, so the very last
// words spoken are captured instead of racing the stop() call.
function stopVoiceCaptureAndWait() {

    return new Promise(function (resolve) {

        if (!prescriptionRecording || !prescriptionRecognition) {
            resolve();
            return;
        }

        // Make sure this counts as a manual stop so onend doesn't
        // auto-restart it out from under us.
        prescriptionManualStop = true;

        const previousOnEnd = prescriptionRecognition.onend;

        prescriptionRecognition.onend = function (event) {
            if (previousOnEnd) previousOnEnd(event);
            resolve();
        };

        prescriptionRecognition.stop();
    });
}
