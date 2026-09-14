// ============ NEW PATIENT REGISTRATION ============
function goToRegStep(step) {

  document
    .querySelectorAll("#regForm .reg-step")
    .forEach(el => el.classList.remove("active"));

  const target = document.getElementById("regStep" + step);

  if (target) {
    target.classList.add("active");
  }

  const label = document.getElementById("regStepLabel");

  const titles = {
    1: "Identity Setup",
    2: "ABHA & Emergency Contact",
    3: "Review & Consent"
  };

  if (label) {
    label.textContent =
      `Step ${step} of 3: ${titles[step] || ""}`;
  }

  if (step === 3) {
    renderRegistrationReview();
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


function regNext(fromStep) {

  if (fromStep === 1) {

    const name = document.getElementById("regName").value.trim();
    const dob = document.getElementById("regDob").value;
    const mobile =
      document.getElementById("regMobile").value.replace(/\D/g, "");
    const city = document.getElementById("regCity").value.trim();

    if (!name) {
      alert("Please enter your full name.");
      return;
    }

    if (!dob) {
      alert("Please enter your date of birth.");
      return;
    }

    if (!/^\d{10}$/.test(mobile)) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!city) {
      alert("Please enter your city / town.");
      return;
    }
  }

  goToRegStep(fromStep + 1);
}


function regBack(fromStep) {
  goToRegStep(fromStep - 1);
}


function renderRegistrationReview() {

  const box = document.getElementById("regReviewBox");

  if (!box) return;

  const val = id => {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
  };

  const rows = [
    ["Full Name", val("regName")],
    ["Date of Birth", val("regDob")],
    ["Gender", val("regGender")],
    ["Mobile Number", val("regMobile")],
    ["Email", val("regEmail") || "—"],
    ["City / Town", val("regCity")],
    ["State / UT", val("regState")],
    ["ABHA Number", val("regAbha") || "Will be created on registration"],
    ["Emergency Contact", val("regEmergencyName") || "—"],
    ["Relationship", val("regEmergencyRelation") || "—"],
    ["Emergency Phone", val("regEmergencyPhone") || "—"]
  ];

  box.innerHTML = rows
    .map(([label, value]) => `<p><strong>${label}:</strong> ${value}</p>`)
    .join("");
}


function submitRegistration() {

  const consent = document.getElementById("regConsent");

  if (!consent || !consent.checked) {
    alert("Please consent to storing your details to continue.");
    return;
  }

  state.patientId = state.patientId || 1;

  state.patientName =
    document.getElementById("regName").value.trim() || "New Citizen";

  state.abhaId =
    document.getElementById("regAbha").value.trim() || "NEW-ABHA-PENDING";

  state.registration = {
    dob: document.getElementById("regDob").value,
    gender: document.getElementById("regGender").value,
    mobile: document.getElementById("regMobile").value.trim(),
    email: document.getElementById("regEmail").value.trim(),
    city: document.getElementById("regCity").value.trim(),
    state: document.getElementById("regState").value,
    emergencyName: document.getElementById("regEmergencyName").value.trim(),
    emergencyRelation:
      document.getElementById("regEmergencyRelation").value.trim(),
    emergencyPhone:
      document.getElementById("regEmergencyPhone").value.trim()
  };

  alert("Registration successful! Your digital health profile has been created. ✅");

  enterApp("screen-dashboard");
}
