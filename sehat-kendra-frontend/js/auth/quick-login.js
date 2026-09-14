// ============ SAMPLE LOGIN ============
function loginAsSamplePatient() {

  state.patientId = 1;

  state.patientName = "Smt. Ananya Sen";

  state.abhaId = "91-4421-8890-1204";

  state.conditions = [
    "Hypertension",
    "Diabetes"
  ];

  state.medicines = [
    "Tab. Metformin 500mg",
    "Tab. Amlodipine 5mg"
  ];

  state.allergies = [
    "Penicillin (mild rash)"
  ];

  enterApp("screen-dashboard");
}


// ============ GUEST LOGIN ============
function loginAsGuest() {

  state.patientId = null;

  state.patientName = "Guest Citizen";

  state.abhaId = "GUEST-0000-0000-0000";

  state.conditions = [];

  state.medicines = [];

  state.allergies = [];

  enterApp("screen-dashboard");
}
