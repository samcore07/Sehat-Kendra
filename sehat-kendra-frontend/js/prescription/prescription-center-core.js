// ============================================================
// SEHAT KENDRA - PRESCRIPTION CENTER BACKEND CONNECTION
// ============================================================

const PRESCRIPTION_API = "http://127.0.0.1:8000";
const PRESCRIPTION_PATIENT_ID = 1;


// ============================================================
// OPEN PRESCRIPTION CENTER
// ============================================================

async function openPrescriptionCenter() {

    console.log("Opening Prescription Center");

    // Hide all screens
    document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.remove("active");
    });

    // Show prescription screen
    const screen = document.getElementById("screen-prescription");

    if (!screen) {
        alert("Prescription Center screen not found.");
        return;
    }

    screen.classList.add("active");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

    // Load saved prescriptions
    await loadPrescriptionsFromBackend();
}


// ============================================================
// CLOSE PRESCRIPTION CENTER (back to dashboard)
// ============================================================

function closePrescriptionCenter() {

    document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.remove("active");
    });

    const dashboard = document.getElementById("screen-dashboard");

    if (dashboard) {
        dashboard.classList.add("active");
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}
