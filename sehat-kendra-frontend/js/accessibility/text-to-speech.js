// ============================================================
// LISTEN / TEXT-TO-SPEECH
// ============================================================
// Every "🔊 Listen" button across the app (auth screens, booking
// steps, registration, the dashboard, etc.) calls speak('some short
// phrase'), but that function never existed — only the unused
// listenPage() (reads the whole active screen) was defined. This adds
// speak(text), which is what's actually wired up throughout the app.

let sehatKendraSpeech = null;
let sehatKendraSpeakingText = null;

const SEHAT_KENDRA_SPEECH_LANGUAGES = {
    en: "en-IN",
    hi: "hi-IN",
    bn: "bn-IN",
    ta: "ta-IN",
    mr: "mr-IN",
    or: "en-IN"
};


// ============ SPEAK A SPECIFIC PHRASE ============
// Used by every per-screen "🔊 Listen" button.
function speak(text) {

    if (!("speechSynthesis" in window)) {
        alert("Voice reading is not supported in this browser.");
        return;
    }

    if (!text || !text.trim()) {
        return;
    }

    // Clicking the same Listen button again while it's still reading
    // acts as a stop toggle. Clicking a different Listen button
    // interrupts whatever was playing and starts reading the new text.
    if (speechSynthesis.speaking && sehatKendraSpeakingText === text) {
        speechSynthesis.cancel();
        sehatKendraSpeakingText = null;
        return;
    }

    speechSynthesis.cancel();

    sehatKendraSpeech = new SpeechSynthesisUtterance(text);

    const language = document.documentElement.lang || "en";

    sehatKendraSpeech.lang =
        SEHAT_KENDRA_SPEECH_LANGUAGES[language] || "en-IN";

    sehatKendraSpeech.rate = 0.9;
    sehatKendraSpeech.pitch = 1;
    sehatKendraSpeech.volume = 1;

    sehatKendraSpeakingText = text;

    sehatKendraSpeech.onend = () => {
        sehatKendraSpeakingText = null;
    };

    sehatKendraSpeech.onerror = () => {
        sehatKendraSpeakingText = null;
    };

    speechSynthesis.speak(sehatKendraSpeech);
}


// ============ READ THE WHOLE ACTIVE SCREEN ============
// Not currently wired to any button in the app, but kept working and
// available in case a "read this whole page" control is added later.
function listenPage() {

    if (
        !("speechSynthesis" in window)
    ) {
        alert(
            "Voice reading is not supported in this browser."
        );
        return;
    }

    // Stop if already speaking
    if (speechSynthesis.speaking) {

        speechSynthesis.cancel();

        console.log("Speech stopped.");

        return;
    }

    // Get currently visible screen
    const activeScreen =
        document.querySelector(".screen.active");

    if (!activeScreen) {
        return;
    }

    // Get readable text
    const text =
        activeScreen.innerText
            .replace(/\s+/g, " ")
            .trim();

    if (!text) {
        alert("There is no text to read.");
        return;
    }

    sehatKendraSpeech =
        new SpeechSynthesisUtterance(text);

    const language =
        document.documentElement.lang || "en";

    sehatKendraSpeech.lang =
        SEHAT_KENDRA_SPEECH_LANGUAGES[language] || "en-IN";

    sehatKendraSpeech.rate = 0.9;
    sehatKendraSpeech.pitch = 1;
    sehatKendraSpeech.volume = 1;

    sehatKendraSpeakingText = text;

    sehatKendraSpeech.onend = () => {
        sehatKendraSpeakingText = null;
    };

    speechSynthesis.speak(
        sehatKendraSpeech
    );
}
