// ============ REQUEST DEMO OTP ============
async function requestAadhaarOtp() {
  const input = document.getElementById("abhaId");

  if (!input) {
    alert("Aadhaar number field not found.");
    return;
  }

  const aadhaar = input.value.replace(/\D/g, "");

  if (!/^\d{12}$/.test(aadhaar)) {
    alert("Please enter a valid 12-digit DEMO Aadhaar number.");
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
      throw new Error(data.detail || "OTP request failed.");
    }

    aadhaarTransactionId = data.transaction_id;

    alert(
      "Demo Aadhaar OTP:\n\n" +
      (data.demo_otp || "123456")
    );

    showScreen("screen-abha-otp");

    const otpScreen = document.getElementById("screen-abha-otp");

    if (otpScreen) {
      const firstOtp = otpScreen.querySelector(".otp-boxes input");

      if (firstOtp) {
        setTimeout(() => firstOtp.focus(), 100);
      }
    }

  } catch (error) {
    console.error("OTP request error:", error);

    alert(
      "OTP Error:\n\n" +
      error.message
    );
  }
}


// ============ VERIFY DEMO OTP ============
async function verifyAbhaOtp() {

  const input = getAadhaarInput();
  const otp = getOtpValue();

  if (!input) {
    alert("Aadhaar / Health Number field not found.");
    return;
  }

  const aadhaar = input.value.replace(/\D/g, "");

  if (!/^\d{12}$/.test(aadhaar)) {
    alert(
      "Please enter the same 12-digit DEMO Aadhaar number."
    );
    return;
  }

  if (!/^\d{6}$/.test(otp)) {
    alert("Please enter the complete 6-digit OTP.");
    return;
  }

  if (!aadhaarTransactionId) {
    alert("Please request OTP first.");
    showScreen("screen-abha-id");
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
          transaction_id: aadhaarTransactionId,
          otp: otp
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || "OTP verification failed."
      );
    }

    console.log(
      "OTP verification successful:",
      data
    );

    state.loggedIn = true;

    state.patientName =
      data.patient_name ||
      "Smt. Ananya Sen";

    state.abhaId =
      data.abha_id ||
      "DEMO-AADHAAR-VERIFIED";

    state.conditions =
      data.conditions || [];

    state.medicines =
      data.medicines || [];

    state.allergies =
      data.allergies || [];

    aadhaarTransactionId = null;

    document
      .querySelectorAll(".otp-boxes input")
      .forEach(box => {
        box.value = "";
      });

    alert(
      "Authentication successful! ✅"
    );

    enterApp("screen-dashboard");

  } catch (error) {

    console.error(
      "OTP verification error:",
      error
    );

    alert(
      "Verification failed:\n\n" +
      error.message
    );
  }
}
