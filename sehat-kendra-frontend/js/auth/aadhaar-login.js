// ================= AADHAAR LOGIN =================

let aadhaarLoginTransactionId = null;

async function requestAadhaarLoginOtp() {

  const input = document.getElementById("aadhaarLoginId");

  if (!input) {
    alert("Aadhaar input not found.");
    return;
  }

  const aadhaar = input.value.replace(/\D/g, "");

  if (!/^\d{12}$/.test(aadhaar)) {
    alert("Please enter a valid 12-digit Aadhaar number.");
    return;
  }

  try {

    const response = await fetch(
      `${BACKEND_URL}/auth/aadhaar/request-otp`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          aadhaar: aadhaar,
          consent: true
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Aadhaar OTP failed.");
    }

    aadhaarLoginTransactionId = data.transaction_id;

    showScreen("screen-aadhaar-otp");

    alert(
      "Demo Aadhaar OTP:\n\n" +
      data.demo_otp
    );

  } catch (error) {

    console.error("Aadhaar Login Error:", error);

    alert(
      "Aadhaar login failed:\n\n" +
      error.message
    );
  }
}


async function verifyAadhaarLogin() {

  const input =
    document.getElementById("aadhaarLoginId");

  const otpInput =
    document.getElementById("aadhaarOtpInput");

  if (!input || !otpInput) {
    alert("Aadhaar or OTP field not found.");
    return;
  }

  const aadhaar =
    input.value.replace(/\D/g, "");

  const otp =
    otpInput.value.trim();

  if (!/^\d{12}$/.test(aadhaar)) {
    alert("Invalid Aadhaar number.");
    return;
  }

  if (!/^\d{6}$/.test(otp)) {
    alert("Enter the 6-digit OTP.");
    return;
  }

  if (!aadhaarLoginTransactionId) {
    alert("Please request OTP first.");
    return;
  }

  try {

    const response = await fetch(
      `${BACKEND_URL}/auth/aadhaar/verify-otp`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          aadhaar: aadhaar,
          transaction_id: aadhaarLoginTransactionId,
          otp: otp
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || "Aadhaar verification failed."
      );
    }

    state.loggedIn = true;
    state.patientId = data.patient_id || 1;
    state.patientName =
      data.patient_name || "Aadhaar Citizen";
    state.abhaId =
      data.abha_id || "DEMO-ABHA";

    aadhaarLoginTransactionId = null;

    alert("Aadhaar authentication successful! ✅");

    enterApp("screen-dashboard");

  } catch (error) {

    console.error(
      "Aadhaar Verification Error:",
      error
    );

    alert(
      "Aadhaar verification failed:\n\n" +
      error.message
    );
  }
}
