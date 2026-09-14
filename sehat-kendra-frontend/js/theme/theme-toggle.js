// ============================================================
// THEME BUTTON FIX
// ============================================================

function toggleTheme() {
    const current =
        document.documentElement.getAttribute("data-theme") || "light";

    const newTheme =
        current === "dark" ? "light" : "dark";

    document.documentElement.setAttribute(
        "data-theme",
        newTheme
    );

    const button =
        document.getElementById("themeToggleBtn");

    if (button) {
        button.textContent =
            newTheme === "dark" ? "☀️" : "🌙";
    }

    try {
        localStorage.setItem(
            "sehatkendra-theme",
            newTheme
        );
    } catch (e) {}

    console.log("Theme changed:", newTheme);
}



// ============================================================
// INITIALIZE THEME
// ============================================================

// Extracted into a named function (rather than only a DOMContentLoaded
// listener) so that app-bootstrap.js can call it explicitly once the
// screen partials have finished loading. The listener below still runs
// too, as a harmless no-op safety net when this file is loaded in the
// traditional way (all markup already present at parse time).
function initThemeFromStorage() {

    let savedTheme = "light";

    try {
        savedTheme =
            localStorage.getItem(
                "sehatkendra-theme"
            ) || "light";
    } catch (e) {}

    document.documentElement.setAttribute(
        "data-theme",
        savedTheme
    );

    const button =
        document.getElementById(
            "themeToggleBtn"
        );

    if (button) {
        button.textContent =
            savedTheme === "dark"
                ? "☀️"
                : "🌙";
    }
}

document.addEventListener("DOMContentLoaded", initThemeFromStorage);
