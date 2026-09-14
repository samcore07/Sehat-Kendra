// ================= ABHA LOGIN =================

let abhaTransactionId = null;

async function requestAbhaOtp() {

  const input = document.getElementById("abhaLoginId");

  if (!input) return;

  const abhaId = input.value.replace(/\D/g, "");

  if (!/^\d{14}$/.test(abhaId)) {
    alert("Please enter a valid 14-digit ABHA number.");
    return;
  }

  try {

    const response = await fetch(
      `${BACKEND_URL}/auth/abha/request-otp`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          abha_id: abhaId
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "ABHA OTP failed.");
    }

    abhaTransactionId = data.transaction_id;

    showScreen("screen-abha-otp");

    alert(
      "Demo ABHA OTP:\n\n" + data.demo_otp
    );

  } catch (error) {

    console.error("ABHA Login Error:", error);

    alert(
      "ABHA login failed:\n\n" + error.message
    );
  }
}


async function verifyAbhaLogin() {

  const abhaInput =
    document.getElementById("abhaLoginId");

  const otpInput =
    document.getElementById("abhaOtpInput");

  const abhaId =
    abhaInput.value.replace(/\D/g, "");

  const otp =
    otpInput.value.trim();

  if (!/^\d{14}$/.test(abhaId)) {
    alert("Invalid ABHA number.");
    return;
  }

  if (!/^\d{6}$/.test(otp)) {
    alert("Enter the 6-digit OTP.");
    return;
  }

  if (!abhaTransactionId) {
    alert("Please request OTP first.");
    return;
  }

  try {

    const response = await fetch(
      `${BACKEND_URL}/auth/abha/verify-otp`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          abha_id: abhaId,
          transaction_id: abhaTransactionId,
          otp: otp
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || "ABHA verification failed."
      );
    }

    state.loggedIn = true;
    state.patientName =
      data.patient_name || "ABHA Citizen";
    state.abhaId =
      data.abha_id || abhaId;

    abhaTransactionId = null;

    alert("ABHA authentication successful! ✅");

    enterApp("screen-dashboard");

  } catch (error) {

    console.error("ABHA Verification Error:", error);

    alert(
      "ABHA verification failed:\n\n" +
      error.message
    );
  }
}
